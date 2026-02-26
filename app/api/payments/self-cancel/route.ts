// app/api/payments/self-cancel/route.ts
// Allows a guest to cancel their own reservation via a secure token link.
// Cancels the Stripe PaymentIntent (or refunds if already captured),
// then notifies the next person on the waiting list.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'
import { resend } from '@/lib/resend'
import { selfCancelConfirmedEmail } from '@/lib/email-templates'
import { notifySpotAvailable } from '@/lib/notify'

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Nedostaje token' }, { status: 400 })
    }

    const supabase = adminClient()
    const stripe = getStripe()

    // Find payment by cancel token
    const { data: payment, error: payError } = await supabase
      .from('payments')
      .select(`
        *,
        events (
          id, naziv, datum, slug,
          cijena_vlasnika, service_fee,
          owners ( stripe_account_id )
        )
      `)
      .eq('cancel_token', token)
      .single()

    if (payError || !payment) {
      return NextResponse.json({ error: 'Nevažeći token za otkazivanje' }, { status: 404 })
    }

    // Only allow cancellation of active (non-cancelled/refunded) payments
    const cancellableStatuses = ['pending', 'paid', 'confirmed', 'capturing']
    if (!cancellableStatuses.includes(payment.status)) {
      return NextResponse.json(
        { error: 'Rezervacija je već otkazana ili vraćen novac' },
        { status: 409 }
      )
    }

    const event = payment.events as {
      id: string
      naziv: string
      datum: string
      slug: string
      cijena_vlasnika: number
      service_fee: number
      owners: { stripe_account_id: string } | { stripe_account_id: string }[]
    }

    const stripeAccountId = Array.isArray(event.owners)
      ? event.owners[0].stripe_account_id
      : event.owners.stripe_account_id

    // Mark as cancelling first to prevent double-cancel
    await supabase
      .from('payments')
      .update({ status: 'cancelling' })
      .eq('id', payment.id)

    // Cancel or refund via Stripe
    if (payment.stripe_payment_intent_id) {
      try {
        const pi = await stripe.paymentIntents.retrieve(
          payment.stripe_payment_intent_id,
          {},
          { stripeAccount: stripeAccountId }
        )

        if (pi.status === 'requires_capture' || pi.status === 'requires_payment_method' || pi.status === 'requires_confirmation') {
          // Not yet captured — cancel the intent (releases hold)
          await stripe.paymentIntents.cancel(
            payment.stripe_payment_intent_id,
            { cancellation_reason: 'requested_by_customer' },
            { stripeAccount: stripeAccountId }
          )
        } else if (pi.status === 'succeeded' && pi.latest_charge) {
          // Already captured — issue a refund
          await stripe.refunds.create(
            {
              charge: pi.latest_charge as string,
              reason: 'requested_by_customer',
            },
            { stripeAccount: stripeAccountId }
          )
        }
        // If already cancelled, just proceed
      } catch (stripeErr) {
        console.error('[self-cancel] Stripe operation failed:', stripeErr)
        // Revert status and return error
        await supabase
          .from('payments')
          .update({ status: payment.status })
          .eq('id', payment.id)
        return NextResponse.json({ error: 'Greška pri otkazivanju u Stripeu' }, { status: 500 })
      }
    }

    // Mark payment as cancelled in DB
    await supabase
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('id', payment.id)

    // Send cancellation confirmation email to the guest
    const eventDate = new Date(event.datum).toLocaleDateString('hr-HR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const amount = (payment.iznos_total / 100).toLocaleString('hr-HR', {
      style: 'currency',
      currency: 'EUR',
    })

    resend.emails
      .send({
        from: 'skupi. <noreply@skupi.app>',
        to: payment.email,
        subject: `Odjava potvrđena — ${event.naziv}`,
        html: selfCancelConfirmedEmail({
          guestName: payment.ime,
          eventName: event.naziv,
          eventDate,
          amount,
        }),
      })
      .catch(e => console.error('[self-cancel] Confirmation email failed:', e))

    // Notify next person on the waiting list
    const { data: nextInLine } = await supabase
      .from('waiting_list')
      .select('*')
      .eq('event_id', event.id)
      .is('notified_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (nextInLine) {
      // Mark as notified before sending to prevent duplicate notifications
      await supabase
        .from('waiting_list')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', nextInLine.id)

      notifySpotAvailable(
        {
          ime: nextInLine.ime,
          email: nextInLine.email,
          mobitel: nextInLine.mobitel,
          notify_whatsapp: nextInLine.notify_whatsapp,
          notify_viber: nextInLine.notify_viber,
        },
        {
          naziv: event.naziv,
          datum: event.datum,
          slug: event.slug,
          cijena_vlasnika: event.cijena_vlasnika,
          service_fee: event.service_fee,
        }
      ).catch(e => console.error('[self-cancel] Waiting list notify failed:', e))
    }

    return NextResponse.json({ success: true, eventName: event.naziv, eventSlug: event.slug })
  } catch (error) {
    console.error('[self-cancel] error:', error)
    return NextResponse.json({ error: 'Server greška' }, { status: 500 })
  }
}
