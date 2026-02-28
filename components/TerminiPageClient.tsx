'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, List, CalendarDays } from 'lucide-react'
import EventCard from './EventCard'
import DateStripCalendar from './DateStripCalendar'

type EventStatus = 'active' | 'confirmed' | 'cancelled'

export interface TerminiEvent {
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

type ViewMode = 'list' | 'calendar'

const LS_KEY = 'termini-view-mode'

export default function TerminiPageClient({ events }: { events: TerminiEvent[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  // Track hydration so the toggle doesn't flash on SSR
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY)
    if (saved === 'calendar' || saved === 'list') {
      setViewMode(saved as ViewMode)
    }
    setHydrated(true)
  }, [])

  const setView = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem(LS_KEY, mode)
  }

  const activeEvents    = events.filter(e => e.status === 'active')
  const confirmedEvents = events.filter(e => e.status === 'confirmed')
  const cancelledEvents = events.filter(e => e.status === 'cancelled')

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      {/* ── Header ── */}
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

        <div className="flex items-center gap-2">
          {/* View toggle — only shown when there are events and JS is hydrated */}
          {events.length > 0 && hydrated && (
            <div
              className="flex items-center rounded-lg overflow-hidden"
              style={{ border: '1px solid #1C2040', backgroundColor: '#13162A' }}
            >
              <button
                onClick={() => setView('list')}
                aria-label="Prikaz popisa"
                title="Popis"
                className="px-3 py-2 flex items-center transition-colors"
                style={{
                  backgroundColor: viewMode === 'list' ? 'rgba(108,71,255,0.15)' : 'transparent',
                  color: viewMode === 'list' ? '#6C47FF' : '#6B7299',
                }}
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setView('calendar')}
                aria-label="Prikaz kalendara"
                title="Kalendar"
                className="px-3 py-2 flex items-center transition-colors"
                style={{
                  backgroundColor: viewMode === 'calendar' ? 'rgba(108,71,255,0.15)' : 'transparent',
                  color: viewMode === 'calendar' ? '#6C47FF' : '#6B7299',
                }}
              >
                <CalendarDays size={15} />
              </button>
            </div>
          )}

          <Link
            href="/dashboard/novi"
            className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2.5 rounded-md transition bg-brand-purple hover:bg-brand-purple-light"
          >
            <span>+</span> Novi termin
          </Link>
        </div>
      </div>

      {/* ── Body ── */}
      {events.length === 0 ? (
        /* Empty state */
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
      ) : viewMode === 'calendar' ? (
        /* ── Calendar view ── */
        <DateStripCalendar events={events} />
      ) : (
        /* ── List view ── */
        <div className="space-y-8">

          {activeEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-semibold text-[#6B7299] uppercase tracking-[0.08em]">
                  Aktivni
                </h2>
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(108,71,255,0.13)', color: '#6C47FF' }}
                >
                  {activeEvents.length}
                </span>
              </div>
              <div className="space-y-3">
                {activeEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {confirmedEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-semibold text-[#6B7299] uppercase tracking-[0.08em]">
                  Potvrđeni
                </h2>
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
                >
                  {confirmedEvents.length}
                </span>
              </div>
              <div className="space-y-3">
                {confirmedEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {cancelledEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-semibold text-[#6B7299] uppercase tracking-[0.08em]">
                  Otkazani
                </h2>
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7299' }}
                >
                  {cancelledEvents.length}
                </span>
              </div>
              <div className="space-y-3">
                {cancelledEvents.map(event => (
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
