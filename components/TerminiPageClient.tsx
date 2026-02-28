'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
  confirmedCount?: number
}

export default function TerminiPageClient({ events }: { events: TerminiEvent[] }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      {/* ── Header ── */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-[#8A93BC] hover:text-white transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <h1 className="text-4xl font-black text-white tracking-tight">Kalendar</h1>
        <p className="text-[#A0A8C8] text-sm mt-1">Svi tvoji termini</p>
      </div>

      {/* ── Body ── */}
      {events.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ backgroundColor: '#13162A', border: '1px dashed #1C2040' }}
        >
          <p className="text-[#8A93BC] text-sm mb-4">📅 Nemaš još termina</p>
          <Link
            href="/dashboard/novi"
            className="inline-block text-white text-sm font-semibold px-4 py-2.5 rounded-md transition bg-brand-purple hover:bg-brand-purple-light"
          >
            + Kreiraj prvi termin
          </Link>
        </div>
      ) : (
        <DateStripCalendar events={events} />
      )}
    </div>
  )
}
