'use client'

import { Bell, XCircle } from 'lucide-react'
import { closeEventAction } from '@/app/dashboard/termini/[id]/actions'

interface EventActionButtonsProps {
  eventId: string
  eventStatus: string
  pendingCount: number
}

export default function EventActionButtons({ eventId, eventStatus, pendingCount }: EventActionButtonsProps) {
  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-3">
      {/* Pošalji podsjetnik — disabled if no pending payments */}
      <button
        disabled={pendingCount === 0}
        title={pendingCount === 0 ? 'Svi sudionici su platili' : `Pošalji podsjetnik ${pendingCount} neplaćenim sudionicima`}
        className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          color: pendingCount > 0 ? '#A0A8C8' : '#6B7299',
          borderColor: '#2A2F55',
          backgroundColor: 'transparent',
        }}
      >
        <Bell size={15} />
        Pošalji podsjetnik
        {pendingCount > 0 && (
          <span
            className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}
          >
            {pendingCount}
          </span>
        )}
      </button>

      {/* Zatvori termin — only show if event is still active */}
      {eventStatus === 'active' && (
        <form action={closeEventAction}>
          <input type="hidden" name="event_id" value={eventId} />
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-semibold border transition"
            style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'transparent' }}
            onClick={(e) => {
              if (!confirm('Zatvori termin? Sve neuplaćene rezervacije bit će otkazane.')) e.preventDefault()
            }}
          >
            <XCircle size={15} />
            Zatvori termin
          </button>
        </form>
      )}
    </div>
  )
}
