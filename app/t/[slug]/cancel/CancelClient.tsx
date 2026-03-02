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
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700 px-6 py-4">
        <span className="text-white text-xl font-black">skupi<span className="text-brand-purple">.</span></span>
      </header>

      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-dark-800 rounded-2xl border border-dark-700 p-8">

          {done ? (
            /* ── Success state ─────────────────────── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 bg-success/20">
                ✅
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Odjava uspješna</h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                Tvoja rezervacija za <strong className="text-white">{eventName}</strong> je otkazana.
                Iznos od <strong className="text-white">{amount}</strong> neće biti naplaćen.
                Dobit ćeš potvrdu na email.
              </p>
              <button
                onClick={() => router.push(`/t/${slug}`)}
                className="text-sm text-brand-purple hover:underline font-medium transition"
              >
                ← Vrati se na termin
              </button>
            </div>

          ) : alreadyCancelled ? (
            /* ── Already cancelled ────────────────── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 bg-dark-600">
                ℹ️
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Već otkazano</h1>
              <p className="text-text-secondary text-sm mb-6">
                Ova rezervacija je već prethodno otkazana.
              </p>
              <button
                onClick={() => router.push(`/t/${slug}`)}
                className="text-sm text-brand-purple hover:underline font-medium transition"
              >
                ← Vrati se na termin
              </button>
            </div>

          ) : canCancel ? (
            /* ── Confirm cancellation ─────────────── */
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 bg-error/10">
                  ⚠️
                </div>
                <h1 className="text-xl font-bold text-white mb-1">Odustati od rezervacije?</h1>
                <p className="text-text-secondary text-sm">Ova akcija se ne može poništiti.</p>
              </div>

              <div className="bg-dark-900 rounded-xl p-4 mb-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Ime</span>
                  <span className="font-semibold text-white">{guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Termin</span>
                  <span className="font-semibold text-white">{eventName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Datum</span>
                  <span className="font-semibold text-white">{eventDate}</span>
                </div>
                <div className="flex justify-between border-t border-dark-700 pt-2 mt-1">
                  <span className="text-text-secondary">Iznos</span>
                  <span className="font-bold text-white">{amount}</span>
                </div>
              </div>

              {error && (
                <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg px-3 py-2 mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handleCancel}
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-error transition flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90"
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
                type="button"
                onClick={() => router.push(`/t/${slug}`)}
                className="w-full mt-3 py-3 rounded-xl text-sm font-semibold text-text-secondary hover:text-white border border-dark-700 hover:border-dark-500 transition"
              >
                Odustani — zadrži rezervaciju
              </button>
            </>

          ) : (
            /* ── Cannot cancel ────────────────────── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 bg-warning/10">
                🔒
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Otkazivanje nije moguće</h1>
              <p className="text-text-secondary text-sm mb-6 leading-relaxed">
                Ova rezervacija se ne može otkazati u trenutnom statusu.
                Kontaktiraj nas na{' '}
                <a href="mailto:podrska@skupi.app" className="text-brand-purple hover:underline">
                  podrska@skupi.app
                </a>
              </p>
              <button
                onClick={() => router.push(`/t/${slug}`)}
                className="text-sm text-brand-purple hover:underline font-medium transition"
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
