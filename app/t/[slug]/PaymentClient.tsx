'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CheckoutForm from './CheckoutForm'
import WaitingListForm from './WaitingListForm'

interface Participant {
  id: string
  ime: string
  created_at: string
}

interface EventData {
  id: string
  slug: string
  naziv: string
  opis: string | null
  datum: string
  rok_uplate: string
  cijena_vlasnika: number
  service_fee: number
  min_sudionika: number
  max_sudionika: number
  status: string
}

interface Props {
  event: EventData
  ownerName: string
  initialPaidCount: number
  initialParticipants: Participant[]
}

const AVATAR_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#14b8a6']

export default function PaymentClient({ event, ownerName, initialPaidCount, initialParticipants }: Props) {
  const [paidCount, setPaidCount] = useState(initialPaidCount)
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants)
  const [justPaid, setJustPaid] = useState(false)
  const [joinedWaitingList, setJoinedWaitingList] = useState(false)
  const supabase = createClient()
  const searchParams = useSearchParams()

  const cijenaTotal = (event.cijena_vlasnika + event.service_fee) / 100
  const cijenaVlasnika = event.cijena_vlasnika / 100
  const serviceFee = event.service_fee / 100

  const datumDate = new Date(event.datum)
  const rokDate = new Date(event.rok_uplate)
  const now = new Date()
  const isExpired = rokDate < now
  const isFull = paidCount >= event.max_sudionika
  const isActive = event.status === 'active' && !isExpired && !isFull

  const pct = Math.min(100, Math.round((paidCount / event.max_sudionika) * 100))

  // Handle redirect back from Stripe (3D Secure / bank redirect)
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      const guestName = searchParams.get('name') ?? undefined
      // Increment counter for the redirect case too
      setPaidCount(c => c + 1)
      if (guestName) {
        setParticipants(prev => [
          ...prev,
          { id: `local-${Date.now()}`, ime: decodeURIComponent(guestName), created_at: new Date().toISOString() },
        ])
      }
      setJustPaid(true)
      // Clean URL
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      url.searchParams.delete('name')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  // Real-time subscription for live counter
  useEffect(() => {
    const channel = supabase
      .channel(`event-payments-${event.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          const p = payload.new as { id: string; ime: string; status: string; created_at: string }
          if (p.status === 'paid' || p.status === 'confirmed') {
            // Only count if not already in list
            setParticipants((prev) => {
              if (prev.some((x) => x.id === p.id)) return prev
              setPaidCount((c) => c + 1)
              return [...prev, { id: p.id, ime: p.ime, created_at: p.created_at }]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [event.id, supabase])

  function handlePaymentSuccess(guestName?: string) {
    // Immediately increment the local counter — don't wait for realtime or refresh
    setPaidCount(c => c + 1)
    if (guestName) {
      setParticipants(prev => [
        ...prev,
        { id: `local-${Date.now()}`, ime: guestName, created_at: new Date().toISOString() },
      ])
    }
    setJustPaid(true)
  }

  return (
    <div className="min-h-screen" style={{ background: '#f9fafb' }}>
      {/* Header */}
      <header style={{ background: '#1a2b4a' }} className="px-6 py-4">
        <span className="text-white text-xl font-black">skupi<span className="text-blue-400">.</span></span>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 grid gap-6 md:grid-cols-[1fr_380px] items-start">

        {/* Left: Event info */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Event header */}
          <div style={{ background: '#1a2b4a' }} className="p-7">
            <p className="text-xs text-white/50 uppercase tracking-widest mb-2 font-medium">
              {datumDate.toLocaleDateString('hr-HR', { weekday: 'long' })},{' '}
              {datumDate.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}
              {datumDate.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <h1 className="text-2xl font-black text-white leading-tight">{event.naziv}</h1>
            {ownerName && <p className="text-white/50 text-sm mt-1">{ownerName}</p>}
            {event.opis && <p className="text-white/60 text-sm mt-3 leading-relaxed">{event.opis}</p>}
          </div>

          {/* Info grid */}
          <div className="p-5 grid grid-cols-2 gap-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Rok uplate</p>
              <p className="font-semibold text-gray-800 text-sm">
                {rokDate.toLocaleDateString('hr-HR')} · {rokDate.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Potvrda rezervacije</p>
              <p className="font-semibold text-gray-800 text-sm">min. {event.min_sudionika} · max. {event.max_sudionika}</p>
            </div>
          </div>

          {/* Live counter */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-semibold text-gray-700">Live status</span>
              </div>
              <span className="text-2xl font-black text-blue-600">{paidCount} / {event.max_sudionika}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: paidCount >= event.min_sudionika ? '#10b981' : '#3b82f6',
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-gray-400">
              <span>0 mjesta</span>
              <span className="text-orange-500 font-semibold">min: {event.min_sudionika}</span>
              <span>max: {event.max_sudionika}</span>
            </div>

            {paidCount >= event.min_sudionika && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-700 font-medium">
                ✅ Minimum dostignut — rezervacija će biti potvrđena!
              </div>
            )}
          </div>

          {/* Participants */}
          {participants.length > 0 && (
            <div className="px-5 pb-5">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Već platili</p>
              <div className="space-y-2">
                {participants.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                    >
                      {p.ime.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{p.ime.split(' ')[0]}</span>
                    <span className="text-xs text-emerald-500 font-medium ml-auto">✓ plaćeno</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Checkout card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-6">
          {justPaid ? (
            /* ── Success state ───────────────────────────────── */
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
                style={{ background: '#d1fae5' }}
              >
                ✅
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Uplata primljena!</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Novac je zamrznut na kartici. Dobiti ćeš email potvrdu čim se skupi minimalni broj sudionika.
              </p>
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2 text-blue-600 text-sm">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="font-medium">{paidCount} / {event.max_sudionika} platilo</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-400">
                Planovi su se promijenili?{' '}
                <span className="text-gray-400">
                  Link za odjavu je poslan na tvoj email.
                </span>
              </p>
            </div>

          ) : joinedWaitingList ? (
            /* ── Joined waiting list ─────────────────────────── */
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
                style={{ background: '#ede9fe' }}
              >
                🔔
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Na listi čekanja!</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Obavijestit ćemo te emailom (i po mogućnosti WhatsApp/Viber) čim se oslobodi mjesto.
              </p>
            </div>

          ) : (
            /* ── Checkout / Waiting list ─────────────────────── */
            <>
              {isFull && !isExpired ? (
                /* ── Event full: show waiting list form ────────── */
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                         style={{ background: '#fef3c7' }}>
                      🔒
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Termin je popunjen</h2>
                      <p className="text-xs text-gray-400">Stavi se na listu čekanja</p>
                    </div>
                  </div>
                  <WaitingListForm
                    eventId={event.id}
                    onSuccess={() => setJoinedWaitingList(true)}
                  />
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Rezerviraj mjesto</h2>
                  <p className="text-xs text-gray-400 mb-5">
                    {isActive
                      ? 'Uplata se zamrzava dok se ne skupi minimum.'
                      : isExpired
                      ? 'Rok uplate je prošao.'
                      : 'Rezervacija nije dostupna.'}
                  </p>

                  {/* Price breakdown */}
                  <div className="bg-gray-50 rounded-xl p-3.5 mb-5 space-y-1.5">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{event.naziv}</span>
                      <span>{cijenaVlasnika.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Service fee</span>
                      <span>{serviceFee.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-1">
                      <span>Ukupno</span>
                      <span>{cijenaTotal.toFixed(2)} €</span>
                    </div>
                  </div>

                  {isActive ? (
                    <CheckoutForm
                      eventId={event.id}
                      naziv={event.naziv}
                      cijenaTotal={cijenaTotal}
                      onSuccess={(name) => handlePaymentSuccess(name)}
                      onFull={() => setPaidCount(event.max_sudionika)}
                    />
                  ) : (
                    <div className="w-full py-3 rounded-xl text-center text-sm font-semibold bg-gray-100 text-gray-400">
                      {isExpired ? '⏰ Rok uplate je prošao' : 'Nije dostupno'}
                    </div>
                  )}

                  <p className="text-center text-xs text-gray-400 mt-3">🛡️ Stripe sigurno plaćanje</p>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      💡 Ako se do roka ne skupi <strong>{event.min_sudionika}</strong> sudionika,
                      automatski se vraća sav novac. Bez naknada.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
