// app/api/payments/cancel/route.ts
// Called by pg_cron when an event has passed → void/cancel pending payments

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifyCronSecret(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  return secret === process.env.CRON_SECRET
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { payment_id } = await req.json()

  if (!payment_id) {
    return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 })
  }

  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('id', payment_id)
    .single()

  if (error || !payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  if (!payment.stripe_payment_intent_id) {
    // No PI → just mark as cancelled
    await supabaseAdmin
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('id', payment_id)
    return NextResponse.json({ success: true, note: 'No PI, marked cancelled' })
  }

  try {
    // Cancel the PaymentIntent (releases uncaptured funds / voids the hold)
    await stripe.paymentIntents.cancel(
      payment.stripe_payment_intent_id,
      { cancellation_reason: 'abandoned' }
    )

    await supabaseAdmin
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('id', payment_id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cancel failed'
    console.error('Cancel failed:', message)

    await supabaseAdmin
      .from('payments')
      .update({ status: 'pending' })
      .eq('id', payment_id)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
