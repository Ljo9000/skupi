'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  token: string
  slug: string
  guestName: string
  eventName: string
  eventDate: string
  amount: string
  canCancel: boolean
  alreadyCancelled: boolean
}

export default function CancelClient({
  token,
  slug,
  guestName,
  eventName,
  eventDate,
  amount,
  canCancel,
  alreadyCancelled,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleCancel() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payments/self-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Greška pri otkazivanju')
        setLoading(false)
        return
      }

      setDone(true)
    } catch {
      setError('Mrežna greška. Pokušaj ponovo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f9fafb' }}>
      {/* Header */}
      <header style={{ background: '#1a2b4a' }} className="px-6 py-4">
        <span className="text-white text-xl font-black">skupi<span className="text-blue-400">.</span></span>
      </header>

      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">

          {done ? (
            /* ── Success state ─────────────────────── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                   style={{ background: '#d1fae5' }}>
                ✅
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Odjava uspješna</h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Tvoja rezervacija za <strong>{eventName}</strong> je otkazana.
                Iznos od <strong>{amount}</strong> neće biti naplaćen.
                Dobit ćeš potvrdu na email.
              </p>
              <button
                onClick={() => router.push(`/t/${slug}`)}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium transition"
              >
                ← Vrati se na termin
              </button>
            </div>

          ) : alreadyCancelled ? (
            /* ── Already cancelled ────────────────── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                   style={{ background: '#f3f4f6' }}>
                ℹ️
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Već otkazano</h1>
              <p className="text-gray-500 text-sm mb-6">
                Ova rezervacija je već prethodno otkazana.
              </p>
              <button
                onClick={() => router.push(`/t/${slug}`)}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium transition"
              >
                ← Vrati se na termin
              </button>
            </div>

          ) : canCancel ? (
            /* ── Confirm cancellation ─────────────── */
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                     style={{ background: '#fef2f2' }}>
                  ⚠️
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Odustati od rezervacije?</h1>
                <p className="text-gray-500 text-sm">Ova akcija se ne može poništiti.</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ime</span>
                  <span className="font-semibold text-gray-800">{guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Termin</span>
                  <span className="font-semibold text-gray-800">{eventName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Datum</span>
                  <span className="font-semibold text-gray-800">{eventDate}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                  <span className="text-gray-500">Iznos</span>
                  <span className="font-bold text-gray-800">{amount}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handleCancel}
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: loading ? '#9ca3af' : '#ef4444' }}
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Otkazujem...
                  </>
                ) : (
                  'Potvrdi odustajanje'
                )}
              </button>

              <button
                onClick={() => router.push(`/t/${slug}`)}
                className="w-full mt-3 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 transition"
              >
                Odustani — zadrži rezervaciju
              </button>
            </>

          ) : (
            /* ── Cannot cancel ────────────────────── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                   style={{ background: '#fef3c7' }}>
                🔒
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Otkazivanje nije moguće</h1>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Ova rezervacija se ne može otkazati u trenutnom statusu.
                Kontaktiraj nas na{' '}
                <a href="mailto:podrska@skupi.app" className="text-indigo-600">
                  podrska@skupi.app
                </a>
              </p>
              <button
                onClick={() => router.push(`/t/${slug}`)}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium transition"
              >
                ← Vrati se na termin
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
