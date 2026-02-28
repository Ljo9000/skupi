'use client'

import { useState, useRef, useEffect } from 'react'
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
}

const HR_MONTHS = [
  'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
  'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac',
]

const HR_MONTHS_GENITIVE = [
  'siječnja', 'veljače', 'ožujka', 'travnja', 'svibnja', 'lipnja',
  'srpnja', 'kolovoza', 'rujna', 'listopada', 'studenog', 'prosinca',
]

// Week starts Monday in Croatia — Mon=0 … Sun=6
const HR_DAYS_SHORT = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned']

// JS getDay(): 0=Sun,1=Mon…6=Sat → convert to Mon-first index
function jsDayToHrIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

const HR_WEEKDAY_FULL = [
  'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota', 'nedjelja',
]

const STATUS_DOT_COLOR: Record<EventStatus, string> = {
  active: '#22C55E',
  confirmed: '#8B6FFF',
  cancelled: '#EF4444',
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

export default function DateStripCalendar({ events }: { events: Event[] }) {
  const todayRaw = new Date()
  const today = stripTime(todayRaw)

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [selectedDate, setSelectedDate] = useState(today)

  const stripRef = useRef<HTMLDivElement>(null)

  // All days in the viewed month
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const days: Date[] = Array.from({ length: daysInMonth }, (_, i) =>
    new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1)
  )

  // Helpers
  const getEventsForDay = (day: Date) =>
    events.filter(e => isSameDay(stripTime(new Date(e.datum)), day))

  const getDeadlinesForDay = (day: Date) =>
    events.filter(e => isSameDay(stripTime(new Date(e.rok_uplate)), day))

  const selectedDayEvents = getEventsForDay(selectedDate)

  // Scroll selected cell into view whenever date or month changes
  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const selected = strip.querySelector<HTMLElement>('[data-selected="true"]')
    if (selected) {
      selected.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [selectedDate, currentMonth])

  // Human-readable day heading
  const selectedDayLabel = () => {
    const hrIdx = jsDayToHrIndex(selectedDate.getDay())
    const weekday = HR_WEEKDAY_FULL[hrIdx]
    const day = selectedDate.getDate()
    const month = HR_MONTHS_GENITIVE[selectedDate.getMonth()]
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day}. ${month}`
  }

  const prevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))

  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  return (
    <div className="space-y-4">
      {/* ── Month navigation ── */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={prevMonth}
          aria-label="Prethodni mjesec"
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
          style={{ color: '#6B7299' }}
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-sm font-semibold text-white">
          {HR_MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>

        <button
          onClick={nextMonth}
          aria-label="Sljedeći mjesec"
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
          style={{ color: '#6B7299' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Horizontal date strip ── */}
      <div
        ref={stripRef}
        className="flex gap-2 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: '4px' }}
      >
        {days.map(day => {
          const dayEvents = getEventsForDay(day)
          const dayDeadlines = getDeadlinesForDay(day)
          const isToday = isSameDay(day, today)
          const isSelected = isSameDay(day, selectedDate)

          // Build up to 3 unique dot colours
          const dots: string[] = []
          const seenStatus = new Set<EventStatus>()
          for (const e of dayEvents) {
            if (!seenStatus.has(e.status)) {
              dots.push(STATUS_DOT_COLOR[e.status])
              seenStatus.add(e.status)
            }
          }
          // Amber deadline dot — only if not already maxed out
          if (dayDeadlines.length > 0 && dots.length < 3) {
            dots.push('#F59E0B')
          }

          const hrIdx = jsDayToHrIndex(day.getDay())

          return (
            <button
              key={day.toISOString()}
              data-selected={isSelected}
              onClick={() => setSelectedDate(day)}
              className="flex-shrink-0 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-150"
              style={{
                minWidth: '52px',
                paddingLeft: '10px',
                paddingRight: '10px',
                backgroundColor: isToday
                  ? '#6C47FF'
                  : isSelected
                  ? 'rgba(108,71,255,0.1)'
                  : 'rgba(255,255,255,0.03)',
                border: isSelected && !isToday
                  ? '1px solid #6C47FF'
                  : '1px solid transparent',
              }}
            >
              <span
                className="text-[10px] font-medium"
                style={{ color: isToday ? 'rgba(255,255,255,0.75)' : '#6B7299' }}
              >
                {HR_DAYS_SHORT[hrIdx]}
              </span>
              <span
                className="text-sm font-bold leading-none"
                style={{ color: isToday ? '#fff' : '#E4E8F7' }}
              >
                {day.getDate()}
              </span>
              {/* Dots row — always reserve 6px height so cells stay same size */}
              <div className="flex gap-0.5 items-center" style={{ height: '6px' }}>
                {dots.map((color, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{ width: '4px', height: '4px', backgroundColor: color, flexShrink: 0 }}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', backgroundColor: '#1C2040' }} />

      {/* ── Day panel ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">{selectedDayLabel()}</h2>
          {selectedDayEvents.length > 0 && (
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(108,71,255,0.13)', color: '#6C47FF' }}
            >
              {selectedDayEvents.length}{' '}
              {selectedDayEvents.length === 1 ? 'termin' : 'termina'}
            </span>
          )}
        </div>

        {selectedDayEvents.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ backgroundColor: '#13162A', border: '1px dashed #1C2040' }}
          >
            <p className="text-[#6B7299] text-sm">Nema termina za ovaj dan 📭</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                isPast={event.status === 'cancelled'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
