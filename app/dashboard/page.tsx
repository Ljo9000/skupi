import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EventCard from '@/components/EventCard'

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
    .order('datum', { ascending: false })

  // Get total collected across all events (confirmed/paid payments only)
  const eventIds = (events ?? []).map((e: Event) => e.id)
  const { data: allPayments } = eventIds.length > 0
    ? await supabase
        .from('payments')
        .select('iznos_vlasnika, status')
        .in('event_id', eventIds)
        .in('status', ['confirmed', 'paid'])
    : { data: [] }

  const totalCollectedCents = (allPayments ?? []).reduce((s: number, p: { iznos_vlasnika: number }) => s + (p.iznos_vlasnika ?? 0), 0)
  const totalCollectedEur = (totalCollectedCents / 100).toFixed(2)

  const activeEvents = (events ?? []).filter((e: Event) => e.status === 'active')
  const pastEvents = (events ?? []).filter((e: Event) => e.status !== 'active')

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
            <div className="text-[11px] text-[#6B7299] font-semibold uppercase tracking-[0.08em] mb-2">{stat.label}</div>
            <div className="text-3xl font-black leading-none" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Active events */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-semibold text-[#6B7299] uppercase tracking-[0.08em]">Aktivni termini</h2>
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: 'rgba(108,71,255,0.13)',
              color: '#6C47FF',
            }}
          >
            {activeEvents.length}
          </span>
        </div>
        {activeEvents.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              backgroundColor: '#13162A',
              border: '1px dashed #1C2040',
            }}
          >
            <p className="text-[#6B7299] text-sm mb-4">📅 Nemaš aktivnih termina</p>
            <Link
              href="/dashboard/novi"
              className="inline-block text-white text-sm font-semibold px-4 py-2.5 rounded-md transition bg-brand-purple hover:bg-brand-purple-light"
            >
              + Kreiraj prvi termin
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeEvents.map((event: Event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Past events */}
      {pastEvents.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-semibold text-[#6B7299] uppercase tracking-[0.08em]">Termini s isteklim rokom</h2>
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#6B7299',
              }}
            >
              {pastEvents.length}
            </span>
          </div>
          <div className="space-y-3">
            {pastEvents.map((event: Event) => (
              <EventCard key={event.id} event={event} isPast={true} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

