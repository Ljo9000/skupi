'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  confirmedCount?: number
}

const HR_MONTHS_SHORT = [
  'sij', 'velj', 'ožu', 'tra', 'svi', 'lip',
  'srp', 'kol', 'ruj', 'lis', 'stu', 'pro',
]

const HR_MONTHS_GENITIVE = [
  'siječnja', 'veljače', 'ožujka', 'travnja', 'svibnja', 'lipnja',
  'srpnja', 'kolovoza', 'rujna', 'listopada', 'studenog', 'prosinca',
]

// Week starts Monday in Croatia — Mon=0 … Sun=6
const HR_DAYS_SHORT = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned']

function jsDayToHrIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

const HR_WEEKDAY_FULL = [
  'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota', 'nedjelja',
]

const STATUS_DOT_COLOR: Record<'active' | 'confirmed', string> = {
  active: '#22C55E',
  confirmed: '#8B6FFF',
}

const STATUS_SECTION_LABEL: Record<'active' | 'confirmed', string> = {
  active: 'Aktivni',
  confirmed: 'Potvrđeni',
}

const STATUS_SECTION_COLOR: Record<'active' | 'confirmed', { color: string; bg: string }> = {
  active:    { color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  confirmed: { color: '#8B6FFF', bg: 'rgba(139,111,255,0.1)' },
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export default function DateStripCalendar({ events }: { events: Event[] }) {
  // Exclude cancelled everywhere in the calendar
  const visibleEvents = events.filter(e => e.status !== 'cancelled')

  const todayRaw = new Date()
  const today = stripTime(todayRaw)

  const [startDate, setStartDate] = useState(today)
  const [selectedDate, setSelectedDate] = useState(today)

  // 7 days starting from startDate (today first on the left)
  const days: Date[] = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

  const weekEnd = days[6]

  // Week label: "28. velj. – 6. ožu." or "28–6. velj."
  const weekLabel = (() => {
    const startDay = startDate.getDate()
    const endDay = weekEnd.getDate()
    const startMonth = HR_MONTHS_SHORT[startDate.getMonth()]
    const endMonth = HR_MONTHS_SHORT[weekEnd.getMonth()]
    if (startDate.getMonth() === weekEnd.getMonth()) {
      return `${startDay}–${endDay}. ${startMonth}.`
    }
    return `${startDay}. ${startMonth}. – ${endDay}. ${endMonth}.`
  })()

  const getEventsForDay = (day: Date) =>
    visibleEvents.filter(e => isSameDay(stripTime(new Date(e.datum)), day))

  const getDeadlinesForDay = (day: Date) =>
    visibleEvents.filter(e => isSameDay(stripTime(new Date(e.rok_uplate)), day))

  const selectedDayEvents = getEventsForDay(selectedDate)
  const activeOnDay    = selectedDayEvents.filter(e => e.status === 'active')
  const confirmedOnDay = selectedDayEvents.filter(e => e.status === 'confirmed')
  const totalOnDay     = selectedDayEvents.length

  const prevWeek = () => setStartDate(addDays(startDate, -7))
  const nextWeek = () => setStartDate(addDays(startDate, 7))

  const handleDayClick = (day: Date, isPast: boolean) => {
    if (isPast) return
    setSelectedDate(day)
    // If the selected day is outside the visible range, navigate so it's in view
    const dayNorm = stripTime(day)
    const startNorm = stripTime(startDate)
    const endNorm = stripTime(weekEnd)
    if (dayNorm.getTime() < startNorm.getTime()) {
      setStartDate(dayNorm)
    } else if (dayNorm.getTime() > endNorm.getTime()) {
      setStartDate(addDays(dayNorm, -6))
    }
  }

  const selectedDayLabel = () => {
    const hrIdx = jsDayToHrIndex(selectedDate.getDay())
    const weekday = HR_WEEKDAY_FULL[hrIdx]
    const day = selectedDate.getDate()
    const month = HR_MONTHS_GENITIVE[selectedDate.getMonth()]
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day}. ${month}`
  }

  return (
    <div className="space-y-4">
      {/* ── Week navigation ── */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={prevWeek}
          aria-label="Prethodni tjedan"
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors bg-transparent hover:bg-white/5"
          style={{ color: '#8A93BC' }}
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-sm font-semibold" style={{ color: '#A0A8C8' }}>
          {weekLabel}
        </span>

        <button
          onClick={nextWeek}
          aria-label="Sljedeći tjedan"
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors bg-transparent hover:bg-white/5"
          style={{ color: '#8A93BC' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Week strip — 7 equal columns ── */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayEvents    = getEventsForDay(day)
          const dayDeadlines = getDeadlinesForDay(day)
          const isToday      = isSameDay(day, today)
          const isSelected   = isSameDay(day, selectedDate)
          const isPast       = stripTime(day).getTime() < today.getTime()
          const hasActive    = dayEvents.some(e => e.status === 'active')
          const hasConfirmed = dayEvents.some(e => e.status === 'confirmed')
          const hasDeadline  = dayDeadlines.length > 0

          const hrIdx = jsDayToHrIndex(day.getDay())

          // ── Compute styles with priority: today > selected > active > normal ──
          let bgColor    = 'rgba(255,255,255,0.03)'
          let border     = '1px solid transparent'
          let boxShadow: string | undefined
          let dayNumColor = '#E4E8F7'
          let dayLabelColor = '#8A93BC'

          if (isPast) {
            bgColor = 'rgba(255,255,255,0.02)'
          } else if (isToday) {
            bgColor = '#6C47FF'
            boxShadow = '0 0 0 2px rgba(108,71,255,0.35)'
            dayNumColor = '#fff'
            dayLabelColor = 'rgba(255,255,255,0.7)'
          } else if (isSelected) {
            // Selected day: green accent if it has active events, purple otherwise
            if (hasActive) {
              bgColor = 'rgba(34,197,94,0.15)'
              border = '1px solid #22C55E'
              boxShadow = '0 0 0 1px rgba(34,197,94,0.25)'
              dayNumColor = '#4ADE80'
            } else {
              bgColor = 'rgba(108,71,255,0.12)'
              border = '1px solid #6C47FF'
            }
          } else if (hasActive) {
            // Unselected day with active termini — visually elevated
            bgColor = 'rgba(34,197,94,0.08)'
            border = '1px solid rgba(34,197,94,0.25)'
            dayNumColor = '#86EFAC'
          }

          return (
            <button
              key={day.toISOString()}
              data-selected={isSelected}
              onClick={() => handleDayClick(day, isPast)}
              disabled={isPast}
              className={`
                flex flex-col items-center gap-1 py-2.5 rounded-xl
                transition-all duration-150
                ${!isPast && !isToday ? 'hover:bg-white/5' : ''}
                ${isPast ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{
                backgroundColor: bgColor,
                border,
                boxShadow,
                opacity: isPast ? 0.38 : 1,
              }}
            >
              {/* Day label */}
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: isPast ? '#8A93BC' : dayLabelColor }}
              >
                {HR_DAYS_SHORT[hrIdx]}
              </span>

              {/* Day number */}
              <span
                className="text-sm font-bold leading-none tabular-nums"
                style={{ color: isPast ? '#8A93BC' : dayNumColor }}
              >
                {day.getDate()}
              </span>

              {/* Indicator dots — active dot is slightly larger for visual priority */}
              <div className="flex gap-0.5 items-center" style={{ height: '6px' }}>
                {hasActive && (
                  <div
                    className="rounded-full"
                    style={{
                      width: '5px',
                      height: '5px',
                      backgroundColor: STATUS_DOT_COLOR.active,
                      flexShrink: 0,
                      boxShadow: '0 0 4px rgba(34,197,94,0.6)',
                    }}
                  />
                )}
                {hasConfirmed && (
                  <div
                    className="rounded-full"
                    style={{
                      width: '4px',
                      height: '4px',
                      backgroundColor: STATUS_DOT_COLOR.confirmed,
                      flexShrink: 0,
                    }}
                  />
                )}
                {hasDeadline && !hasActive && !hasConfirmed && (
                  <div
                    className="rounded-full"
                    style={{ width: '4px', height: '4px', backgroundColor: '#F59E0B', flexShrink: 0 }}
                  />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', backgroundColor: '#1C2040' }} />

      {/* ── Day panel ── */}
      <div>
        {/* Day heading + total count */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">{selectedDayLabel()}</h2>
          {totalOnDay > 0 && (
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(108,71,255,0.13)', color: '#6C47FF' }}
            >
              {totalOnDay} {totalOnDay === 1 ? 'termin' : 'termina'}
            </span>
          )}
        </div>

        {totalOnDay === 0 ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ backgroundColor: '#13162A', border: '1px dashed #1C2040' }}
          >
            <p className="text-[#8A93BC] text-sm">Nema termina za ovaj dan 📭</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active events first, then confirmed — active always has visual priority */}
            {(['active', 'confirmed'] as const).map(status => {
              const group = status === 'active' ? activeOnDay : confirmedOnDay
              if (group.length === 0) return null
              const cfg = STATUS_SECTION_COLOR[status]

              return (
                <div key={status}>
                  {/* Section label — only shown when both groups exist */}
                  {activeOnDay.length > 0 && confirmedOnDay.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                        style={{ color: cfg.color }}
                      >
                        {STATUS_SECTION_LABEL[status]}
                      </span>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        {group.length}
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {group.map(event => (
                      <EventCard key={event.id} event={event} confirmedCount={event.confirmedCount} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
