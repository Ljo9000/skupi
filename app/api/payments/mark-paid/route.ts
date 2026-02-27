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

    // Mark as 'paid' — only from 'pending' to prevent double-updates
    // Returns the updated row so we can send the email
    const { data: payment, error } = await supabase
      .from('payments')
      .update({ status: 'paid' })
      .eq('stripe_payment_intent_id', payment_intent_id)
      .eq('status', 'pending')
      .select(`
        id, ime, email, iznos_total, cancel_token,
        events ( naziv, datum, slug )
      `)
      .single()

    if (error || !payment) {
      // If no row updated, payment was already processed (idempotent — OK)
      console.log(`[mark-paid] No update needed for PI=${payment_intent_id} (already processed)`)
      return NextResponse.json({ success: true })
    }

    console.log(`[mark-paid] Payment marked as paid: PI=${payment_intent_id}`)

    // Send confirmation email immediately — don't wait for webhook
    if (payment.email) {
      const event = payment.events as unknown as { naziv: string; datum: string; slug: string }

      const eventDate = new Date(event.datum).toLocaleDateString('hr-HR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
      const amount = (payment.iznos_total / 100).toLocaleString('hr-HR', {
        style: 'currency', currency: 'EUR',
      })

      resend.emails.send({
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
      }).catch(e => console.error('[mark-paid] Email failed:', e))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[mark-paid] error:', error)
    return NextResponse.json({ error: 'Server greška' }, { status: 500 })
  }
}
