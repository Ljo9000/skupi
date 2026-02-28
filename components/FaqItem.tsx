'use client'

import { useState, useId } from 'react'
import { ChevronDown } from 'lucide-react'

export default function FaqItem({
  q,
  a,
  defaultOpen,
}: {
  q: string
  a: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  const answerId = useId()

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={answerId}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-base font-semibold text-white group-hover:text-white/90 transition">
          {q}
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`text-text-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p id={answerId} className="text-sm text-text-secondary leading-relaxed pb-5 animate-fade-in">
          {a}
        </p>
      )}
    </div>
  )
}
