// app/api/payments/mark-paid/route.ts
// Called by the client immediately after stripe.confirmPayment succeeds.
// Verifies the PaymentIntent status with Stripe, marks the DB record as 'paid',
// then sends the confirmation email with cancel link directly (no internal HTTP call).

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'
import { resend, EMAIL_FROM } from '@/lib/resend'
import { paymentConfirmedEmail } from '@/lib/email-templates'

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const { payment_intent_id } = await request.json()

    if (!payment_intent_id || !payment_intent_id.startsWith('pi_')) {
      return NextResponse.json({ error: 'Nevažeći payment_intent_id' }, { status: 400 })
    }

    const stripe = getStripe()
    const supabase = adminClient()

    // Verify with Stripe that the PI is actually authorized/succeeded
    const pi = await stripe.paymentIntents.retrieve(payment_intent_id)

    const okStatuses = ['requires_capture', 'succeeded', 'processing']
    if (!okStatuses.includes(pi.status)) {
      return NextResponse.json(
        { error: `PI nije u ispravnom statusu: ${pi.status}` },
        { status: 400 }
      )
    }

    // Try to mark as 'paid' — only transitions from 'pending' to avoid double-updates
    const { data: updatedPayment } = await supabase
      .from('payments')
      .update({ status: 'paid' })
      .eq('stripe_payment_intent_id', payment_intent_id)
      .eq('status', 'pending')
      .select(`
        id, ime, email, iznos_total, cancel_token,
        events ( naziv, datum, slug )
      `)
      .single()

    // If no row was updated (webhook already set status to 'paid' or 'confirmed'),
    // fetch the payment anyway — we still need to send the confirmation email.
    let payment = updatedPayment
    if (!payment) {
      const { data: existingPayment } = await supabase
        .from('payments')
        .select(`
          id, ime, email, iznos_total, cancel_token,
          events ( naziv, datum, slug )
        `)
        .eq('stripe_payment_intent_id', payment_intent_id)
        .in('status', ['paid', 'confirmed', 'capturing'])
        .single()
      payment = existingPayment
      if (payment) {
        console.log(`[mark-paid] Payment already processed, fetched for email: PI=${payment_intent_id}`)
      }
    } else {
      console.log(`[mark-paid] Payment marked as paid: PI=${payment_intent_id}`)
    }

    if (!payment) {
      console.warn(`[mark-paid] Payment not found for PI=${payment_intent_id}`)
      return NextResponse.json({ success: true })
    }

    // Send confirmation email — always, since this is the client-side fast path
    if (payment.email) {
      const event = payment.events as unknown as { naziv: string; datum: string; slug: string }

      const eventDate = new Date(event.datum).toLocaleDateString('hr-HR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
      const amount = (payment.iznos_total / 100).toLocaleString('hr-HR', {
        style: 'currency', currency: 'EUR',
      })

      // Resend SDK v4 returns {data, error} — must check result.error, not just .catch()
      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: payment.email,
        subject: `✅ Potvrda rezervacije — ${event.naziv}`,
        html: paymentConfirmedEmail({
          guestName: payment.ime,
          eventName: event.naziv,
          eventDate,
          amount,
          slug: event.slug,
          cancelToken: payment.cancel_token,
        }),
      })

      if (result.error) {
        console.error('[mark-paid] Email send error:', JSON.stringify(result.error))
      } else {
        console.log(`[mark-paid] Confirmation email sent: id=${result.data?.id} to=${payment.email}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[mark-paid] error:', error)
    return NextResponse.json({ error: 'Server greška' }, { status: 500 })
  }
}
