'use client'

import { useState } from 'react'
import Link from 'next/link'
import EventCard from './EventCard'

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

const INITIAL_COUNT = 3

interface ActiveEventsSectionProps {
  events: Event[]
  confirmedCountMap: Record<string, number>
  totalCollectedMap: Record<string, number>
}

export default function ActiveEventsSection({
  events,
  confirmedCountMap,
  totalCollectedMap,
}: ActiveEventsSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = events.length > INITIAL_COUNT
  const visibleEvents = expanded ? events : events.slice(0, INITIAL_COUNT)

  if (events.length === 0) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-semibold text-[#8A93BC] uppercase tracking-[0.08em]">Aktivni termini</h2>
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(108,71,255,0.13)', color: '#6C47FF' }}
          >
            0
          </span>
        </div>
        <div
          className="rounded-2xl p-12 text-center"
          style={{ backgroundColor: '#13162A', border: '1px dashed #1C2040' }}
        >
          <p className="text-[#8A93BC] text-sm mb-4">📅 Nemaš aktivnih termina</p>
          <Link
            href="/dashboard/novi"
            className="inline-block text-white text-sm font-semibold px-4 py-2.5 rounded-md transition bg-brand-purple hover:bg-brand-purple-light"
          >
            + Kreiraj prvi termin
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-semibold text-[#8A93BC] uppercase tracking-[0.08em]">Aktivni termini</h2>
        <span
          className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(108,71,255,0.13)', color: '#6C47FF' }}
        >
          {events.length}
        </span>
      </div>
      <div className="space-y-3">
        {visibleEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            confirmedCount={confirmedCountMap[event.id] ?? 0}
            totalCollectedCents={totalCollectedMap[event.id] ?? 0}
          />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: '#8A93BC',
            border: '1px solid #1C2040',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color = '#A0A8C8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = '#8A93BC'
          }}
        >
          {expanded ? 'Pogledaj manje' : `Pogledaj više (${events.length - INITIAL_COUNT})`}
        </button>
      )}
    </section>
  )
}
