// app/api/emails/payment-confirmed/route.ts
// Sends confirmation email to guest after payment is confirmed

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend, EMAIL_FROM } from '@/lib/resend'
import { paymentConfirmedEmail } from '@/lib/email-templates'

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

  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .select(`
      id, ime, email, iznos_total, cancel_token,
      events (
        naziv,
        datum,
        slug
      )
    `)
    .eq('id', payment_id)
    .single()

  if (error || !payment || !payment.email) {
    return NextResponse.json({ error: 'Payment not found or no email' }, { status: 404 })
  }

  const event = payment.events as unknown as {
    naziv: string
    datum: string
    slug: string
  }

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

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: payment.email,
      subject: `✅ Potvrda plaćanja — ${event.naziv}`,
      html: paymentConfirmedEmail({
        guestName: payment.ime,
        eventName: event.naziv,
        eventDate,
        amount,
        slug: event.slug,
        cancelToken: payment.cancel_token,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Email send failed'
    console.error('Email send failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
