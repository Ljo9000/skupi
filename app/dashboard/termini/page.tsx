import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TerminiPageClient, { type TerminiEvent } from '@/components/TerminiPageClient'

export default async function TerminiPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: owner } = await supabase
    .from('owners')
    .select('id, ime')
    .eq('user_id', user.id)
    .single()

  if (!owner) redirect('/dashboard')

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('owner_id', owner.id)
    .order('datum', { ascending: false })

  const eventIds = (events ?? []).map((e: TerminiEvent) => e.id)

  const { data: payments } = eventIds.length > 0
    ? await supabase
        .from('payments')
        .select('event_id')
        .in('event_id', eventIds)
        .in('status', ['confirmed', 'paid'])
    : { data: [] }

  const confirmedCountMap: Record<string, number> = {}
  for (const p of (payments ?? []) as { event_id: string }[]) {
    confirmedCountMap[p.event_id] = (confirmedCountMap[p.event_id] ?? 0) + 1
  }

  const enrichedEvents: TerminiEvent[] = (events ?? []).map((e: TerminiEvent) => ({
    ...e,
    confirmedCount: confirmedCountMap[e.id] ?? 0,
  }))

  return <TerminiPageClient events={enrichedEvents} />
}
