'use client'

import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { hr } from 'react-day-picker/locale'
import { format, parse } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import 'react-day-picker/style.css'

export interface DatePickerDropdownProps {
  id?: string
  name: string
  value?: Date
  defaultValue?: string // YYYY-MM-DD
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  minDate?: Date
  error?: boolean
}

export default function DatePickerDropdown({
  id,
  name,
  value,
  defaultValue,
  onChange,
  placeholder = 'Odaberi datum',
  minDate,
  error,
}: DatePickerDropdownProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Date | undefined>(() => {
    if (value) return value
    if (defaultValue) {
      try {
        const parsed = parse(defaultValue, 'yyyy-MM-dd', new Date())
        return isNaN(parsed.getTime()) ? undefined : parsed
      } catch {
        return undefined
      }
    }
    return undefined
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const displayValue = selected ? format(selected, 'd. M. yyyy') : ''

  const closeDropdown = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleSelect = (date: Date | undefined) => {
    setSelected(date)
    onChange?.(date)
    closeDropdown()
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
    if (value !== undefined) setSelected(value)
  }, [value])

  const isoValue = selected ? format(selected, 'yyyy-MM-dd') : ''

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={isoValue} />
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && open) {
            e.preventDefault()
            closeDropdown()
          }
        }}
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
        <CalendarDays className="w-4 h-4 flex-shrink-0 text-[#8A93BC]" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Odabir datuma"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              closeDropdown()
            }
          }}
          className="absolute top-full left-0 mt-1 z-50 rounded-xl overflow-hidden shadow-lg min-w-[280px]"
          style={{
            backgroundColor: '#13162A',
            border: '1px solid #1C2040',
          }}
        >
          <div
            className="rdp-root p-3"
            style={{
              // Dark theme CSS variables for react-day-picker
              ['--rdp-accent-color' as string]: '#6C47FF',
              ['--rdp-accent-background-color' as string]: 'rgba(108, 71, 255, 0.2)',
              ['--rdp-today-color' as string]: '#6C47FF',
            }}
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              locale={hr}
              defaultMonth={selected ?? new Date()}
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
                day_button: '!text-[#E4E8F7] hover:!bg-[rgba(108,71,255,0.15)] focus:!bg-[rgba(108,71,255,0.15)]',
                selected: '!bg-[#6C47FF] !text-white hover:!bg-[#6C47FF]',
                today: '!text-[#6C47FF] !font-bold',
                outside: '!text-[#8A93BC] !opacity-50',
                hidden: '!invisible',
              }}
              styles={{
                root: { color: '#E4E8F7' },
                month_caption: { color: '#FFFFFF' },
                day_button: { color: '#E4E8F7' },
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
