import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { resend, EMAIL_FROM } from '@/lib/resend'
import { paymentConfirmedEmail, paymentCancelledEmail } from '@/lib/email-templates'

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  const stripe = getStripe()

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = adminClient()

  try {
    switch (event.type) {

      // ── Stripe Connect: account fully onboarded ───────────────────────────
      case 'account.updated': {
        const account = event.data.object as Stripe.Account

        if (account.charges_enabled && account.payouts_enabled && account.details_submitted) {
          const { error } = await supabase
            .from('owners')
            .update({ stripe_onboarding_complete: true })
            .eq('stripe_account_id', account.id)

          if (error) console.error('[webhook] account.updated DB error:', error)
          else console.log(`[webhook] Owner onboarded: ${account.id}`)
        }
        break
      }

      // ── Manual capture: card authorized, hold placed ──────────────────────
      // Fires when capture_method='manual' and guest completes payment.
      // We mark as 'paid' so the tracker counts it immediately.
      // The cron job will capture it later (→ payment_intent.succeeded).
      case 'payment_intent.amount_capturable_updated': {
        const pi = event.data.object as Stripe.PaymentIntent
        const eventId = pi.metadata?.event_id

        if (!eventId) {
          console.warn('[webhook] amount_capturable_updated: no event_id in metadata')
          break
        }

        const { error } = await supabase
          .from('payments')
          .update({ status: 'paid' })
          .eq('stripe_payment_intent_id', pi.id)
          .eq('status', 'pending')

        if (error) {
          console.error('[webhook] amount_capturable_updated DB error:', error)
        } else {
          console.log(`[webhook] Manual capture hold placed: PI=${pi.id} event=${eventId}`)
        }

        break
      }

      // ── Payment succeeded / captured ──────────────────────────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const eventId = pi.metadata?.event_id

        if (!eventId) {
          console.warn('[webhook] payment_intent.succeeded: no event_id in metadata')
          break
        }

        // Fetch payment BEFORE updating to check previous status
        // (mark-paid already sent email if status was 'paid')
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id, ime, email, iznos_total, cancel_token, status, events ( naziv, datum, slug )')
          .eq('stripe_payment_intent_id', pi.id)
          .in('status', ['pending', 'paid', 'capturing'])
          .single()

        // Mark payment as confirmed
        const { error: payError } = await supabase
          .from('payments')
          .update({
            status: 'confirmed',
            stripe_charge_id: pi.latest_charge as string | null,
          })
          .eq('stripe_payment_intent_id', pi.id)
          .in('status', ['pending', 'paid', 'capturing'])

        if (payError) {
          console.error('[webhook] Failed to mark payment as confirmed:', payError)
          break
        }

        console.log(`[webhook] Payment confirmed: PI=${pi.id} event=${eventId}`)

        // Send confirmation email inline — only if mark-paid hasn't sent it yet.
        // mark-paid sends when status goes pending→paid.
        // Here we send only if status was 'pending' or 'capturing' (3DS redirect path).
        if (existingPayment?.email && existingPayment.status !== 'paid') {
          const ev = existingPayment.events as unknown as { naziv: string; datum: string; slug: string }
          const eventDate = new Date(ev.datum).toLocaleDateString('hr-HR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })
          const amount = (existingPayment.iznos_total / 100).toLocaleString('hr-HR', {
            style: 'currency', currency: 'EUR',
          })
          resend.emails.send({
            from: EMAIL_FROM,
            to: existingPayment.email,
            subject: `✅ Potvrda rezervacije — ${ev.naziv}`,
            html: paymentConfirmedEmail({
              guestName: existingPayment.ime,
              eventName: ev.naziv,
              eventDate,
              amount,
              slug: ev.slug,
              cancelToken: existingPayment.cancel_token,
            }),
          }).then(result => {
            if (result.error) console.error('[webhook] Confirmation email error:', JSON.stringify(result.error))
            else console.log(`[webhook] Confirmation email sent: id=${result.data?.id}`)
          }).catch(e => console.error('[webhook] Confirmation email failed:', e))
        }

        const updatedPayment = existingPayment

        // Check if event is now full
        const { data: eventData } = await supabase
          .from('events')
          .select('min_sudionika, max_sudionika, status, owners(email, ime)')
          .eq('id', eventId)
          .single()

        if (!eventData || eventData.status !== 'active') break

        const { count: confirmedCount } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('status', 'confirmed')

        console.log(`[webhook] Event ${eventId}: ${confirmedCount} confirmed`)

        // Lock event if max reached → trigger owner notification
        if ((confirmedCount ?? 0) >= (eventData as { max_sudionika: number }).max_sudionika) {
          await supabase
            .from('events')
            .update({ status: 'confirmed' })
            .eq('id', eventId)

          console.log(`[webhook] Event ${eventId} locked (max reached)`)

          // Notify owner
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/emails/event-full`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-cron-secret': process.env.CRON_SECRET || '',
            },
            body: JSON.stringify({ event_id: eventId }),
          }).catch(e => console.error('[webhook] Event-full email failed:', e))
        }

        break
      }

      // ── Payment failed ─────────────────────────────────────────────────────
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent

        const { error } = await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', pi.id)
          .eq('status', 'pending')

        if (error) console.error('[webhook] payment_failed DB error:', error)
        else console.log(`[webhook] Payment failed: ${pi.id}`)
        break
      }

      // ── PaymentIntent cancelled → send cancellation email ─────────────────
      case 'payment_intent.canceled': {
        const pi = event.data.object as Stripe.PaymentIntent

        // Fetch payment + guest data before updating
        const { data: payment } = await supabase
          .from('payments')
          .select(`
            *,
            events ( naziv, datum )
          `)
          .eq('stripe_payment_intent_id', pi.id)
          .single()

        await supabase
          .from('payments')
          .update({ status: 'cancelled' })
          .eq('stripe_payment_intent_id', pi.id)

        console.log(`[webhook] PaymentIntent cancelled: ${pi.id}`)

        // Send cancellation email to guest
        if (payment && payment.email) {
          const eventRecord = payment.events as unknown as { naziv: string; datum: string }
          const eventDate = new Date(eventRecord.datum).toLocaleDateString('hr-HR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })
          const amount = (payment.iznos_total / 100).toLocaleString('hr-HR', {
            style: 'currency', currency: 'EUR',
          })

          resend.emails.send({
            from: EMAIL_FROM,
            to: payment.email,
            subject: `Plaćanje otkazano — ${eventRecord.naziv}`,
            html: paymentCancelledEmail({
              guestName: payment.ime,
              eventName: eventRecord.naziv,
              eventDate,
              amount,
            }),
          }).then(result => {
            if (result.error) console.error('[webhook] Cancel email error:', JSON.stringify(result.error))
            else console.log(`[webhook] Cancel email sent: id=${result.data?.id}`)
          }).catch(e => console.error('[webhook] Cancel email failed:', e))
        }

        break
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[webhook] Handler error:', error)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}
