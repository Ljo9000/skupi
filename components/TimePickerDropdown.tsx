'use client'

import { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'

// Generate time slots in 30-min steps; fullDay includes 00:00-07:30
function getTimeSlots(fullDay = false): string[] {
  const slots: string[] = []
  const startH = fullDay ? 0 : 8
  for (let h = startH; h <= 23; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`)
    if (h < 23) slots.push(`${h.toString().padStart(2, '0')}:30`)
  }
  return slots
}

export interface TimePickerDropdownProps {
  id?: string
  name: string
  value?: string // HH:mm
  defaultValue?: string
  onChange?: (time: string) => void
  placeholder?: string
  error?: boolean
  /** When true, includes 00:00-07:30 for deadlines (e.g. rok uplate) */
  includeNightSlots?: boolean
}

export default function TimePickerDropdown({
  id,
  name,
  value,
  defaultValue,
  onChange,
  placeholder = 'Odaberi vrijeme',
  error,
  includeNightSlots,
}: TimePickerDropdownProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | undefined>(value ?? defaultValue ?? '20:00')
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const closeDropdown = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleSelect = (time: string) => {
    setSelected(time)
    onChange?.(time)
    closeDropdown()
  }

  // Scroll selected item into view and focus it when dropdown opens
  useEffect(() => {
    if (open && selectedRef.current && listRef.current) {
      const list = listRef.current
      const item = selectedRef.current
      const itemTop = item.offsetTop
      const itemHeight = item.offsetHeight
      const listHeight = list.clientHeight
      list.scrollTop = itemTop - listHeight / 2 + itemHeight / 2
      item.focus()
    }
  }, [open])

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

  const displayValue = selected || ''
  const timeSlots = getTimeSlots(includeNightSlots)

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={displayValue} />
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
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
        <Clock className="w-4 h-4 flex-shrink-0 text-[#8A93BC]" aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label="Odabir vremena"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              closeDropdown()
            }
          }}
          className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden shadow-lg max-h-48 overflow-y-auto"
          style={{
            backgroundColor: '#13162A',
            border: '1px solid #1C2040',
          }}
        >
          {timeSlots.map((time) => (
            <button
              key={time}
              ref={selected === time ? selectedRef : undefined}
              role="option"
              aria-selected={selected === time}
              type="button"
              onClick={() => handleSelect(time)}
              className={`w-full px-3.5 py-2.5 text-sm text-left transition ${
                selected === time
                  ? 'bg-[#6C47FF] text-white'
                  : 'text-[#E4E8F7] hover:bg-[rgba(108,71,255,0.15)]'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
