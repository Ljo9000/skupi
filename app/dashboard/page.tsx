import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

const STATUS_CONFIG: Record<EventStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Aktivan', color: '#1d4ed8', bg: '#dbeafe' },
  confirmed: { label: 'Potvrđen', color: '#065f46', bg: '#d1fae5' },
  cancelled: { label: 'Otkazan', color: '#991b1b', bg: '#fee2e2' },
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

  const activeEvents = (events ?? []).filter((e: Event) => e.status === 'active')
  const pastEvents = (events ?? []).filter((e: Event) => e.status !== 'active')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Dobrodošao, {owner?.ime ?? authedUser.email} 👋</p>
        </div>
        <Link
          href="/dashboard/novi"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition shadow-sm"
        >
          + Novi termin
        </Link>
      </div>

      {/* Stripe status banner */}
      {owner?.stripe_onboarding_complete ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-lg">✅</span>
          <div>
            <p className="font-semibold text-emerald-900 text-sm">Stripe aktivan</p>
            <p className="text-emerald-700 text-xs mt-0.5">Primaš uplate i isplate su aktivne</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold text-amber-900 text-sm">Postavi plaćanje</p>
              <p className="text-amber-700 text-xs mt-0.5">Poveži Stripe račun da možeš primati uplate od gostiju</p>
            </div>
          </div>
          <Link
            href="/dashboard/stripe-onboarding"
            className="bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm px-4 py-2 rounded-lg transition whitespace-nowrap"
          >
            Postavi →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Aktivni termini', value: activeEvents.length, color: '#2563eb' },
          { label: 'Ukupno termina', value: events?.length ?? 0, color: '#374151' },
          { label: 'Potvrđeni', value: (events ?? []).filter((e: Event) => e.status === 'confirmed').length, color: '#10b981' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{stat.label}</div>
            <div className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Active events */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Aktivni termini</h2>
        {activeEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm mb-4">Nemaš aktivnih termina</p>
            <Link
              href="/dashboard/novi"
              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-500 transition"
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
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Prošli termini</h2>
          <div className="space-y-3">
            {pastEvents.map((event: Event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function EventCard({ event }: { event: Event }) {
  const cfg = STATUS_CONFIG[event.status]
  const date = new Date(event.datum)
  const daysLeft = Math.ceil((date.getTime() - Date.now()) / 86400000)
  const rok = new Date(event.rok_uplate)
  const rokPassed = rok < new Date()

  return (
    <Link
      href={`/dashboard/termini/${event.id}`}
      className="group bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-blue-300 hover:shadow-sm transition"
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="text-2xl shrink-0 mt-0.5">🗓️</div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">{event.naziv}</div>
          <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>{date.toLocaleDateString('hr-HR', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}</span>
            {daysLeft > 0 && <span className={daysLeft <= 3 ? 'text-orange-500 font-medium' : ''}>za {daysLeft}d</span>}
            {rokPassed && event.status === 'active' && <span className="text-red-400 font-medium">rok istekao</span>}
            <span className="text-gray-300">·</span>
            <span className="font-mono text-gray-300">skupi.app/t/{event.slug}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 sm:ml-4">
        <div className="text-sm font-bold text-gray-700">
          {(event.cijena_vlasnika / 100).toFixed(2)} €
        </div>
        <div className="text-xs text-gray-400">
          {event.min_sudionika}–{event.max_sudionika} os.
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ color: cfg.color, background: cfg.bg }}
        >
          {cfg.label}
        </span>
        <span className="text-xs text-blue-600 font-semibold group-hover:underline whitespace-nowrap hidden sm:inline">
          Detalji →
        </span>
      </div>
    </Link>
  )
}
