'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import CheckoutForm from './CheckoutForm'
import WaitingListForm from './WaitingListForm'
import { ShieldCheck, CheckCircle2, AlertCircle, Calendar, Clock, Users } from 'lucide-react'

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
    <div style={{ backgroundColor: '#0D0F1A' }} className="min-h-screen">
      {/* Header */}
      <header style={{ backgroundColor: 'rgba(13,15,26,0.95)', backdropFilter: 'blur(12px)', borderBottomColor: '#1C2040' }} className="h-14 border-b flex items-center px-6">
        <span className="text-white text-xl font-black">skupi<span className="text-[#6C47FF]">.</span></span>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 grid gap-5 md:grid-cols-[1fr_360px] items-start">

        {/* Left: Event info */}
        <div style={{ backgroundColor: '#13162A', borderColor: '#1C2040' }} className="border rounded-2xl overflow-hidden">
          {/* Event header */}
          <div style={{ backgroundColor: '#13162A' }} className="p-6 border-b border-[#1C2040]">
            <p className="text-[11px] uppercase tracking-widest text-[#6B7299] mb-2 font-medium">
              {datumDate.toLocaleDateString('hr-HR', { weekday: 'long' })},{' '}
              {datumDate.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}
              {datumDate.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <h1 className="text-2xl font-black text-white leading-tight tracking-tight">{event.naziv}</h1>
            {ownerName && <p className="text-[#6B7299] text-sm mt-1">{ownerName}</p>}
            {event.opis && <p className="text-[#A0A8C8] text-sm mt-2 leading-relaxed">{event.opis}</p>}
          </div>

          {/* Info grid */}
          <div className="p-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#A0A8C8] border-b border-[#1C2040]">
            <div className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="text-[#6B7299]" />
              {datumDate.toLocaleDateString('hr-HR')}
            </div>
            <div className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-[#6B7299]" />
              {datumDate.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="inline-flex items-center gap-1.5">
              <Users size={14} className="text-[#6B7299]" />
              {event.min_sudionika} · {event.max_sudionika}
            </div>
            <div className="inline-flex items-center gap-1.5">
              <AlertCircle size={14} className="text-[#6B7299]" />
              {rokDate.toLocaleDateString('hr-HR')} · {rokDate.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Progress section */}
          <div className="p-5 border-b border-[#1C2040]">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs uppercase tracking-widest text-[#6B7299] font-semibold">Mjesta</label>
              <p className="text-sm font-semibold text-white">{paidCount} / {event.max_sudionika} popunjeno</p>
            </div>
            <div style={{ backgroundColor: '#1C2040' }} className="h-2.5 rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: paidCount >= event.min_sudionika ? 'linear-gradient(90deg, #6C47FF 0%, #22C55E 100%)' : '#6C47FF',
                }}
              />
              <div className="absolute relative w-full">
                <div
                  className="absolute h-2.5 w-1 bg-[#F59E0B] rounded-full -top-2.5"
                  style={{
                    left: `calc(${(event.min_sudionika / event.max_sudionika) * 100}% - 2px)`,
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-[#6B7299] mt-1.5">
              <span>0</span>
              <span className="font-semibold text-[#F59E0B]">min: {event.min_sudionika}</span>
              <span>max: {event.max_sudionika}</span>
            </div>

            {paidCount >= event.min_sudionika && (
              <div style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' }} className="mt-3 border rounded-md px-3 py-2.5 flex items-center gap-2 text-sm font-medium text-[#22C55E]">
                <CheckCircle2 size={16} />
                Minimum dostignut — rezervacija će biti potvrđena!
              </div>
            )}
          </div>

          {/* Participants */}
          {participants.length > 0 && (
            <div style={{ backgroundColor: '#13162A' }} className="px-5 py-5">
              <p className="text-[11px] uppercase tracking-widest text-[#6B7299] font-semibold mb-3">Već platili</p>
              <div className="flex flex-wrap gap-2.5">
                {participants.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                    >
                      {p.ime.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-white">{p.ime.split(' ')[0]}</span>
                    <CheckCircle2 size={13} className="text-[#22C55E] ml-1" />
                    <span className="text-xs text-[#6B7299]">plaćeno</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Checkout card */}
        <div style={{ backgroundColor: '#13162A', borderColor: '#1C2040' }} className="border rounded-2xl p-6 sticky top-20">
          {justPaid ? (
            /* ── Success state ───────────────────────────────── */
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
                style={{ backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.2)', border: '1px solid' }}
              >
                ✅
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Uplata primljena!</h2>
              <p className="text-[#A0A8C8] text-sm leading-relaxed">
                Novac je zamrznut na kartici. Dobiti ćeš email potvrdu čim se skupi minimalni broj sudionika.
              </p>
              <div style={{ backgroundColor: 'rgba(108,71,255,0.1)', borderColor: 'rgba(108,71,255,0.2)' }} className="mt-4 border rounded-md px-3 py-2.5">
                <div className="flex items-center gap-2 text-[#8B6FFF] text-sm">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#8B6FFF] animate-pulse" />
                  <span className="font-medium">{paidCount} / {event.max_sudionika} platilo</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-[#6B7299]">
                Planovi su se promijenili?{' '}
                <span className="text-[#6B7299]">
                  Link za odjavu je poslan na tvoj email.
                </span>
              </p>
            </div>

          ) : joinedWaitingList ? (
            /* ── Joined waiting list ─────────────────────────── */
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
                style={{ backgroundColor: 'rgba(108,71,255,0.12)', borderColor: 'rgba(108,71,255,0.2)', border: '1px solid' }}
              >
                🔔
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Na listi čekanja!</h2>
              <p className="text-[#A0A8C8] text-sm leading-relaxed">
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
                         style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}>
                      🔒
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Termin je popunjen</h2>
                      <p className="text-xs text-[#6B7299]">Stavi se na listu čekanja</p>
                    </div>
                  </div>
                  <WaitingListForm
                    eventId={event.id}
                    onSuccess={() => setJoinedWaitingList(true)}
                  />
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-white mb-0.5">Rezerviraj mjesto</h2>
                  <p className="text-xs text-[#6B7299] mb-4">
                    {isActive
                      ? 'Uplata se zamrzava dok se ne skupi minimum.'
                      : isExpired
                      ? 'Rok uplate je prošao.'
                      : 'Rezervacija nije dostupna.'}
                  </p>

                  {/* Price breakdown */}
                  <div style={{ backgroundColor: '#0D0F1A', borderColor: '#1C2040' }} className="border rounded-md px-4 py-3.5 mb-5 space-y-2">
                    <div className="flex justify-between text-sm text-[#A0A8C8]">
                      <span>{event.naziv}</span>
                      <span>{cijenaVlasnika.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#6B7299]">
                      <span>Naknada za uslugu</span>
                      <span>{serviceFee.toFixed(2)} €</span>
                    </div>
                    <div style={{ borderTopColor: '#1C2040' }} className="flex justify-between font-bold text-white border-t pt-2.5 mt-1">
                      <span>Ukupno</span>
                      <span className="text-lg text-[#6C47FF]">{cijenaTotal.toFixed(2)} €</span>
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
                    <div style={{ backgroundColor: '#1C2040', color: '#6B7299' }} className="w-full py-3 rounded-md text-center text-sm font-medium">
                      {isExpired ? '⏰ Rok uplate je prošao' : 'Nije dostupno'}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-xs text-[#6B7299] mt-3">
                    <ShieldCheck size={13} />
                    Stripe sigurno plaćanje
                  </div>

                  <div style={{ borderTopColor: '#1C2040' }} className="mt-4 pt-5 border-t">
                    <p className="text-xs text-[#F59E0B] leading-relaxed flex items-start gap-2.5">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>Ako se do roka ne skupi <strong>{event.min_sudionika}</strong> sudionika, automatski se vraća sav novac. Bez naknada.</span>
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTopColor: '#1C2040' }} className="border-t mt-10 py-5">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <p className="text-[#6B7299] text-xs">
            Powered by <span className="font-bold text-white">skupi</span>.
          </p>
          <Link href="/" className="text-xs font-semibold text-[#6C47FF] hover:underline">
            Kreiraj vlastiti link besplatno →
          </Link>
        </div>
      </footer>
    </div>
  )
}
