'use client'

import Link from 'next/link'
import { CalendarDays } from 'lucide-react'

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

const STATUS_CONFIG: Record<EventStatus, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: 'Aktivan',     color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)'   },
  confirmed: { label: 'Potvrđen ✓', color: '#8B6FFF', bg: 'rgba(108,71,255,0.1)',  border: 'rgba(108,71,255,0.2)'  },
  cancelled: { label: 'Otkazan',    color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)'   },
}

const EXPIRED_CONFIG = {
  label: 'Rok istekao',
  color: '#F59E0B',
  bg:    'rgba(245,158,11,0.1)',
  border:'rgba(245,158,11,0.2)',
}

interface EventCardProps {
  event: Event
  isPast?: boolean
  /** Actual number of confirmed/paid participants fetched from payments table */
  confirmedCount?: number
}

export default function EventCard({ event, isPast = false, confirmedCount }: EventCardProps) {
  const date = new Date(event.datum)
  const daysLeft = Math.ceil((date.getTime() - Date.now()) / 86400000)
  const rokPassed = new Date(event.rok_uplate) < new Date()

  // Events that are still status='active' but deadline passed get amber badge
  const isExpired = event.status === 'active' && rokPassed
  const cfg = isExpired ? EXPIRED_CONFIG : (STATUS_CONFIG[event.status] ?? STATUS_CONFIG.cancelled)

  // Use real confirmed count when available, otherwise fall back to min threshold
  const filled = confirmedCount ?? event.min_sudionika
  const progressPercent = Math.min((filled / event.max_sudionika) * 100, 100)

  return (
    <Link
      href={`/dashboard/termini/${event.id}`}
      style={{ display: 'block', opacity: isPast ? 0.6 : 1 }}
    >
      <div
        className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-150"
        style={{ backgroundColor: '#13162A', border: '1px solid #1C2040' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(108,71,255,0.3)'
          e.currentTarget.style.backgroundColor = 'rgba(19,22,42,0.97)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#1C2040'
          e.currentTarget.style.backgroundColor = '#13162A'
        }}
      >
        {/* Left: icon + name + meta */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <CalendarDays size={16} className="shrink-0 mt-0.5" style={{ color: '#6B7299' }} />
          <div className="min-w-0">
            <div className="font-semibold text-white text-sm truncate">{event.naziv}</div>
            <div className="text-xs text-[#6B7299] mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>{date.toLocaleDateString('hr-HR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              {daysLeft > 0 && (
                <span style={{ color: daysLeft <= 3 ? '#EF4444' : 'inherit' }}>za {daysLeft}d</span>
              )}
              <span style={{ color: '#3C4154' }}>·</span>
              <span className="font-mono" style={{ color: '#3C4154' }}>skupi.app/t/{event.slug}</span>
            </div>
          </div>
        </div>

        {/* Right: price + progress + slots + badge + arrow */}
        <div className="flex items-center gap-3 shrink-0 sm:ml-4">
          <div className="text-sm font-bold text-white">
            {(event.cijena_vlasnika / 100).toFixed(2)} €
          </div>
          <div
            className="shrink-0"
            style={{ width: '72px', height: '5px', backgroundColor: '#1C2040', borderRadius: '9999px', overflow: 'hidden' }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6C47FF, #22C55E)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div className="text-xs text-[#A0A8C8]">
            {filled}/{event.max_sudionika}
          </div>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            {cfg.label}
          </span>
          <span className="text-xs font-semibold hidden sm:inline shrink-0" style={{ color: '#6C47FF' }}>
            Detalji →
          </span>
        </div>
      </div>
    </Link>
  )
}
