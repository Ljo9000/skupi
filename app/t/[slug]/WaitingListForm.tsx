'use client'

import { useState } from 'react'

interface Props {
  eventId: string
  onSuccess: () => void
}

export default function WaitingListForm({ eventId, onSuccess }: Props) {
  const [ime, setIme] = useState('')
  const [email, setEmail] = useState('')
  const [mobitel, setMobitel] = useState('')
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false)
  const [notifyViber, setNotifyViber] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showMsgApps = mobitel.trim().length >= 6

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/waiting-list/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          ime,
          email,
          mobitel: mobitel || null,
          notify_whatsapp: notifyWhatsapp,
          notify_viber: notifyViber,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Greška pri upisu na listu čekanja')
        setLoading(false)
        return
      }

      onSuccess()
    } catch {
      setError('Mrežna greška. Pokušaj ponovo.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs text-gray-500 leading-relaxed mb-1">
        Ako netko odustane, odmah ćeš biti obaviješten/a emailom.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Ime i prezime</label>
        <input
          type="text"
          value={ime}
          onChange={e => setIme(e.target.value)}
          placeholder="Tvoje ime"
          required
          autoComplete="name"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Email adresa</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email@primjer.hr"
          required
          autoComplete="email"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Broj mobitela{' '}
          <span className="font-normal text-gray-400">(opcionalno, za WhatsApp/Viber obavijest)</span>
        </label>
        <input
          type="tel"
          value={mobitel}
          onChange={e => setMobitel(e.target.value)}
          placeholder="+385 91 234 5678"
          autoComplete="tel"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {showMsgApps && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-gray-600">Obavijesti me i na:</p>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyWhatsapp}
              onChange={e => setNotifyWhatsapp(e.target.checked)}
              className="w-4 h-4 rounded accent-green-500"
            />
            <span className="text-sm text-gray-700">WhatsApp</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyViber}
              onChange={e => setNotifyViber(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-500"
            />
            <span className="text-sm text-gray-700">Viber</span>
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ background: '#6366f1' }}
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Upisujem...
          </>
        ) : (
          '🔔 Stavi me na listu čekanja'
        )}
      </button>
    </form>
  )
}
