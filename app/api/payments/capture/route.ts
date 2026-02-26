// app/api/payments/capture/route.ts
// Called by pg_cron (via pg_net) when a payment needs to be captured
// Also callable manually for testing

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

  // Fetch payment + event data
  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .select(`
      *,
      events (
        naziv,
        datum,
        owners ( email, ime, stripe_account_id )
      )
    `)
    .eq('id', payment_id)
    .single()

  if (error || !payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  if (!payment.stripe_payment_intent_id) {
    return NextResponse.json({ error: 'No stripe PI' }, { status: 400 })
  }

  try {
    const event = payment.events as unknown as {
      naziv: string
      datum: string
      owners: { email: string; ime: string; stripe_account_id: string }
    }

    await stripe.paymentIntents.capture(
      payment.stripe_payment_intent_id,
      {},
      { stripeAccount: event.owners.stripe_account_id }
    )

    // Status will be updated to 'confirmed' by webhook (payment_intent.succeeded)
    // But we optimistically mark it here too as a fallback
    await supabaseAdmin
      .from('payments')
      .update({ status: 'confirmed' })
      .eq('id', payment_id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Capture failed'
    console.error('Capture failed:', message)

    // Revert status back to pending so cron can retry
    await supabaseAdmin
      .from('payments')
      .update({ status: 'pending' })
      .eq('id', payment_id)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
