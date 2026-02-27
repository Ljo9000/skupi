// app/api/waiting-list/join/route.ts
// Adds a guest to the waiting list for a full event.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_id, ime, email, mobitel, notify_whatsapp, notify_viber } = body

    if (!event_id || !ime || !email) {
      return NextResponse.json({ error: 'Nedostaju podaci' }, { status: 400 })
    }

    const supabase = adminClient()

    // Verify event exists and is active
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, naziv, status, rok_uplate')
      .eq('id', event_id)
      .eq('status', 'active')
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Termin nije pronađen ili nije aktivan' }, { status: 404 })
    }

    // Check deadline
    if (new Date(event.rok_uplate) < new Date()) {
      return NextResponse.json({ error: 'Rok uplate je prošao' }, { status: 400 })
    }

    // Check if this email is already on the waiting list for this event
    const { count: existing } = await supabase
      .from('waiting_list')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id)
      .eq('email', email)
      .is('notified_at', null)

    if ((existing ?? 0) > 0) {
      return NextResponse.json({ error: 'Već si na listi čekanja za ovaj termin' }, { status: 409 })
    }

    // Insert into waiting list
    const { error: insertError } = await supabase
      .from('waiting_list')
      .insert({
        event_id,
        ime,
        email,
        mobitel: mobitel || null,
        notify_whatsapp: notify_whatsapp ?? false,
        notify_viber: notify_viber ?? false,
      })

    if (insertError) {
      console.error('[waiting-list/join] Insert failed:', insertError)
      return NextResponse.json({ error: 'Greška pri upisu na listu čekanja' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[waiting-list/join] error:', error)
    return NextResponse.json({ error: 'Server greška' }, { status: 500 })
  }
}
