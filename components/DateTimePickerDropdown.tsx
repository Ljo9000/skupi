'use client'

import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { hr } from 'react-day-picker/locale'
import { format, parse } from 'date-fns'
import { CalendarClock } from 'lucide-react'
import 'react-day-picker/style.css'

const TIME_SLOTS = (() => {
  const slots: string[] = []
  for (let h = 0; h <= 23; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`)
    slots.push(`${h.toString().padStart(2, '0')}:30`)
  }
  return slots
})()

export interface DateTimePickerDropdownProps {
  name: string
  value?: Date
  defaultValue?: string // YYYY-MM-DDTHH:mm
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  minDate?: Date
  error?: boolean
}

export default function DateTimePickerDropdown({
  name,
  value,
  defaultValue,
  onChange,
  placeholder = 'Odaberi datum i vrijeme',
  minDate,
  error,
}: DateTimePickerDropdownProps) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (value) return value
    if (defaultValue) {
      try {
        const parsed = parse(defaultValue, "yyyy-MM-dd'T'HH:mm", new Date())
        return isNaN(parsed.getTime()) ? undefined : parsed
      } catch {
        return undefined
      }
    }
    return undefined
  })
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    if (value) return format(value, 'HH:mm')
    if (defaultValue) {
      try {
        const parsed = parse(defaultValue, "yyyy-MM-dd'T'HH:mm", new Date())
        return format(parsed, 'HH:mm')
      } catch {
        return '18:00'
      }
    }
    return '18:00'
  })
  const containerRef = useRef<HTMLDivElement>(null)

  const displayValue =
    selectedDate
      ? `${format(selectedDate, 'd. M. yyyy')} · ${selectedTime}`
      : ''

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (!date) setSelectedTime('18:00')
    else {
      const [h, m] = selectedTime.split(':').map(Number)
      const combined = new Date(date)
      combined.setHours(h, m, 0, 0)
      setSelectedDate(combined)
      onChange?.(combined)
    }
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    const baseDate = selectedDate || new Date()
    const [h, m] = time.split(':').map(Number)
    const combined = new Date(baseDate)
    combined.setHours(h, m, 0, 0)
    setSelectedDate(combined)
    onChange?.(combined)
    setOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  useEffect(() => {
    if (value !== undefined) {
      setSelectedDate(value)
      setSelectedTime(format(value, 'HH:mm'))
    }
  }, [value])

  const isoValue =
    selectedDate
      ? `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`
      : ''

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={isoValue} />
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          backgroundColor: '#2A2F55',
          borderColor: error ? '#EF4444' : '#1C2040',
          color: displayValue ? 'white' : '#8A93BC',
        }}
        className={`w-full border-1.5 rounded-md px-3.5 py-2.5 text-sm text-left focus:outline-none transition flex items-center justify-between gap-2 ${error ? 'focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : 'focus:shadow-[0_0_0_3px_rgba(108,71,255,0.15)]'}`}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? '#EF4444' : '#6C47FF'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#EF4444' : '#1C2040'
        }}
      >
        <span>{displayValue || placeholder}</span>
        <CalendarClock className="w-4 h-4 flex-shrink-0 text-[#8A93BC]" />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden shadow-lg"
          style={{
            backgroundColor: '#13162A',
            border: '1px solid #1C2040',
          }}
        >
          <div className="p-3 border-b border-[#1C2040]">
            <div
              className="rdp-root"
              style={{
                ['--rdp-accent-color' as string]: '#6C47FF',
                ['--rdp-accent-background-color' as string]: 'rgba(108, 71, 255, 0.2)',
                ['--rdp-today-color' as string]: '#6C47FF',
              }}
            >
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={hr}
                defaultMonth={selectedDate ?? new Date()}
                disabled={minDate ? { before: minDate } : undefined}
                ISOWeek
                classNames={{
                  root: '!bg-transparent',
                  months: '!bg-transparent',
                  month: '!bg-transparent',
                  month_caption: '!text-white !font-semibold',
                  nav: '!text-white',
                  button_previous: '!bg-transparent !text-[#A0A8C8] hover:!text-white hover:!bg-white/5',
                  button_next: '!bg-transparent !text-[#A0A8C8] hover:!text-white hover:!bg-white/5',
                  weekdays: '!text-[#8A93BC]',
                  weekday: '!text-[#8A93BC]',
                  week: '!bg-transparent',
                  day: '!bg-transparent',
                  day_button: '!text-[#E4E8F7] hover:!bg-[rgba(108,71,255,0.15)]',
                  selected: '!bg-[#6C47FF] !text-white',
                  today: '!text-[#6C47FF] !font-bold',
                  outside: '!text-[#8A93BC] !opacity-50',
                  hidden: '!invisible',
                }}
              />
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto py-2">
            <p className="px-3.5 text-[10px] uppercase tracking-wider text-[#8A93BC] mb-2">
              Vrijeme
            </p>
            {TIME_SLOTS.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => handleTimeSelect(time)}
                className={`w-full px-3.5 py-2 text-sm text-left transition ${
                  selectedTime === time
                    ? 'bg-[#6C47FF] text-white'
                    : 'text-[#E4E8F7] hover:bg-[rgba(108,71,255,0.15)]'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
