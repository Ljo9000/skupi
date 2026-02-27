// app/api/payments/mark-paid/route.ts
// Called by the client immediately after stripe.confirmPayment succeeds.
// Verifies the PaymentIntent status with Stripe, then marks the DB record as 'paid'.
// This gives the tracker an instant update without waiting for the async webhook.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

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
    const { error } = await supabase
      .from('payments')
      .update({ status: 'paid' })
      .eq('stripe_payment_intent_id', payment_intent_id)
      .eq('status', 'pending')

    if (error) {
      console.error('[mark-paid] DB update failed:', error)
      return NextResponse.json({ error: 'DB greška' }, { status: 500 })
    }

    console.log(`[mark-paid] Payment marked as paid: PI=${payment_intent_id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[mark-paid] error:', error)
    return NextResponse.json({ error: 'Server greška' }, { status: 500 })
  }
}
