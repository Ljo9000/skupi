// app/api/emails/event-full/route.ts
// Notifies the event owner when their event is fully booked

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend } from '@/lib/resend'
import { eventFullEmail } from '@/lib/email-templates'

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

  const { event_id, owner_email, owner_ime, event_naziv } = await req.json()

  // Get full event data to calculate totals
  const { data: event, error } = await supabaseAdmin
    .from('events')
    .select(`
      *,
      payments!inner (
        id,
        iznos_vlasnika,
        status
      )
    `)
    .eq('id', event_id)
    .eq('payments.status', 'confirmed')
    .single()

  if (error || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const confirmedPayments = (event.payments || []) as { iznos_vlasnika: number }[]
  const participantCount = confirmedPayments.length
  const totalCents = confirmedPayments.reduce((sum, p) => sum + p.iznos_vlasnika, 0)

  const totalAmount = (totalCents / 100).toLocaleString('hr-HR', {
    style: 'currency',
    currency: 'EUR',
  })

  const eventDate = new Date(event.datum).toLocaleDateString('hr-HR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  try {
    await resend.emails.send({
      from: 'skupi. <noreply@skupi.app>',
      to: owner_email,
      subject: `🎉 "${event_naziv}" je pun!`,
      html: eventFullEmail({
        ownerName: owner_ime,
        eventName: event_naziv,
        eventDate,
        totalAmount,
        participantCount,
        slug: event.slug,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Email send failed'
    console.error('Event full email failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
