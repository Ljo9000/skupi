import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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

  const activeEvents = (events ?? []).filter((e: Event) => e.status === 'active')
  const confirmedEvents = (events ?? []).filter((e: Event) => e.status === 'confirmed')
  const cancelledEvents = (events ?? []).filter((e: Event) => e.status === 'cancelled')

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-[#6B7299] hover:text-white transition mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <h1 className="text-4xl font-black text-white tracking-tight">Termini</h1>
          <p className="text-[#A0A8C8] text-sm mt-1">Svi tvoji termini</p>
        </div>
        <Link
          href="/dashboard/novi"
          className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2.5 rounded-md transition bg-brand-purple hover:bg-brand-purple-light"
        >
          <span>+</span> Novi termin
        </Link>
      </div>

      {(events ?? []).length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ backgroundColor: '#13162A', border: '1px dashed #1C2040' }}
        >
          <p className="text-[#6B7299] text-sm mb-4">📅 Nemaš još termina</p>
          <Link
            href="/dashboard/novi"
            className="inline-block text-white text-sm font-semibold px-4 py-2.5 rounded-md transition bg-brand-purple hover:bg-brand-purple-light"
          >
            + Kreiraj prvi termin
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active */}
          {activeEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-semibold text-[#6B7299] uppercase tracking-[0.08em]">Aktivni</h2>
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(108,71,255,0.13)', color: '#6C47FF' }}
                >
                  {activeEvents.length}
                </span>
              </div>
              <div className="space-y-3">
                {activeEvents.map((event: Event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Confirmed */}
          {confirmedEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-semibold text-[#6B7299] uppercase tracking-[0.08em]">Potvrđeni</h2>
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
                >
                  {confirmedEvents.length}
                </span>
              </div>
              <div className="space-y-3">
                {confirmedEvents.map((event: Event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Cancelled */}
          {cancelledEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-semibold text-[#6B7299] uppercase tracking-[0.08em]">Otkazani</h2>
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7299' }}
                >
                  {cancelledEvents.length}
                </span>
              </div>
              <div className="space-y-3">
                {cancelledEvents.map((event: Event) => (
                  <EventCard key={event.id} event={event} isPast={true} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
