import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ActiveEventsSection from '@/components/ActiveEventsSection'
import PastEventsSection from '@/components/PastEventsSection'

type EventStatus = 'active' | 'confirmed' | 'cancelled'

interface Event {
  id: string
  slug: string
  naziv: string
  datum: string
  min_sudionika: number
  max_sudionika: number
  cijena_vlasnika: number
  status: EventStatus
  rok_uplate: string
}


export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const authedUser = user!

  // Get owner
  const { data: owner } = await supabase
    .from('owners')
    .select('*')
    .eq('user_id', authedUser.id)
    .single()

  // Get events with payment counts
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('owner_id', owner?.id)
    .order('datum', { ascending: true })

  // Get total collected across all events (confirmed/paid payments only)
  const eventIds = (events ?? []).map((e: Event) => e.id)
  const { data: allPayments } = eventIds.length > 0
    ? await supabase
        .from('payments')
        .select('event_id, iznos_vlasnika, status')
        .in('event_id', eventIds)
        .in('status', ['confirmed', 'paid'])
    : { data: [] }

  const totalCollectedCents = (allPayments ?? []).reduce((s: number, p: { iznos_vlasnika: number }) => s + (p.iznos_vlasnika ?? 0), 0)
  const totalCollectedEur = (totalCollectedCents / 100).toFixed(2)

  // Build confirmed-participant count and total collected per event
  const confirmedCountMap: Record<string, number> = {}
  const totalCollectedMap: Record<string, number> = {}
  for (const p of (allPayments ?? []) as { event_id: string; iznos_vlasnika?: number }[]) {
    confirmedCountMap[p.event_id] = (confirmedCountMap[p.event_id] ?? 0) + 1
    totalCollectedMap[p.event_id] = (totalCollectedMap[p.event_id] ?? 0) + (p.iznos_vlasnika ?? 0)
  }

  const now = new Date()

  // Truly active: status=active AND deadline not yet passed
  const activeEvents = (events ?? []).filter(
    (e: Event) => e.status === 'active' && new Date(e.rok_uplate) >= now
  )
  // Bottom section: confirmed/cancelled + active-but-expired — most recent first
  const pastEvents = (events ?? [])
    .filter((e: Event) => e.status !== 'active' || new Date(e.rok_uplate) < now)
    .sort((a: Event, b: Event) => new Date(b.datum).getTime() - new Date(a.datum).getTime())

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Pregled</h1>
          <p className="text-[#A0A8C8] text-sm mt-1">Dobrodošao, {owner?.ime ?? authedUser.email} 👋</p>
        </div>
        <Link
          href="/dashboard/novi"
          className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2.5 rounded-md transition bg-brand-purple hover:bg-brand-purple-light"
        >
          <span>+</span> Novi termin
        </Link>
      </div>

      {/* Stripe status banner */}
      {!owner?.stripe_onboarding_complete && (
        <div
          className="rounded-xl p-4 mb-6 flex items-center justify-between"
          style={{
            backgroundColor: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold text-[#F59E0B] text-sm">Postavi plaćanje</p>
              <p className="text-[#D97706] text-xs mt-0.5">Poveži Stripe račun da možeš primati uplate od gostiju</p>
            </div>
          </div>
          <Link
            href="/dashboard/stripe-onboarding"
            className="font-semibold text-sm px-4 py-2 rounded-lg transition whitespace-nowrap text-white hover:opacity-90"
            style={{ backgroundColor: '#F59E0B' }}
          >
            Postavi →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Aktivni termini', value: activeEvents.length.toString(), color: '#6C47FF' },
          // ^ counts only truly-active (deadline not passed)
          { label: 'Ukupno termina', value: (events?.length ?? 0).toString(), color: '#22C55E' },
          { label: 'Potvrđeni', value: ((events ?? []).filter((e: Event) => e.status === 'confirmed').length).toString(), color: '#8B6FFF' },
          { label: 'Prikupljeno', value: `${totalCollectedEur} €`, color: '#22C55E' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5"
            style={{
              backgroundColor: '#13162A',
              border: '1px solid #1C2040',
            }}
          >
            <div className="text-[11px] text-[#8A93BC] font-semibold uppercase tracking-[0.08em] mb-2">{stat.label}</div>
            <div className="text-3xl font-black leading-none" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Active events */}
      <ActiveEventsSection
        events={activeEvents}
        confirmedCountMap={confirmedCountMap}
        totalCollectedMap={totalCollectedMap}
      />

      {/* Past events */}
      {pastEvents.length > 0 && (
        <PastEventsSection
          events={pastEvents}
          confirmedCountMap={confirmedCountMap}
          totalCollectedMap={totalCollectedMap}
        />
      )}
    </div>
  )
}

