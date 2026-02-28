import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import QRCodeCard from '@/components/QRCodeCard'
import CopyButton from '@/components/CopyButton'
import EventActionButtons from '@/components/EventActionButtons'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

export default async function TerminDetaljPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { created?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: owner } = await supabase.from('owners').select('id').eq('user_id', user.id).single()
  if (!owner) redirect('/dashboard')

  const { data: event } = await supabase
    .from('events').select('*').eq('id', params.id).eq('owner_id', owner.id).single()
  if (!event) notFound()

  const { data: payments } = await supabase
    .from('payments')
    .select('id, ime, email, iznos_total, iznos_vlasnika, status, created_at')
    .eq('event_id', event.id).order('created_at', { ascending: false })

  const confirmedPayments = (payments ?? []).filter(p => ['confirmed','paid'].includes(p.status))
  const paidCount = confirmedPayments.length
  const totalCollected = confirmedPayments.reduce((s, p) => s + p.iznos_vlasnika, 0)
  const pendingCount = (payments ?? []).filter(p => p.status === 'pending').length

  const paymentUrl = `${APP_URL}/t/${event.slug}`
  const pct = Math.min(100, Math.round((paidCount / event.max_sudionika) * 100))
  const minPct = Math.min(100, Math.round((event.min_sudionika / event.max_sudionika) * 100))
  const datumDate = new Date(event.datum)
  const rokDate = new Date(event.rok_uplate)
  const isCreated = searchParams.created === 'true'
  const daysLeft = Math.ceil((datumDate.getTime() - Date.now()) / 86400000)

  const statusConfig = {
    active: { label: 'Aktivan', color: '#8B6FFF', bg: 'rgba(108,71,255,0.1)', dot: '#6C47FF' },
    confirmed: { label: 'Potvrđen ✓', color: '#22C55E', bg: 'rgba(34,197,94,0.1)', dot: '#22C55E' },
    cancelled: { label: 'Otkazan', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', dot: '#EF4444' },
  } as const
  const cfg = statusConfig[event.status as keyof typeof statusConfig] ?? statusConfig.active

  const psc = {
    confirmed: { label: 'Potvrđeno', cls: 'bg-[rgba(34,197,94,0.1)] text-[#22C55E]' },
    paid:       { label: 'Plaćeno',   cls: 'bg-[rgba(34,197,94,0.1)] text-[#22C55E]' },
    pending:    { label: 'Na čekanju',cls: 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B]' },
    capturing:  { label: 'Procesira se', cls: 'bg-[rgba(108,71,255,0.1)] text-[#8B6FFF]' },
    cancelled:  { label: 'Otkazano', cls: 'bg-[rgba(239,68,68,0.1)] text-[#EF4444]' },
    failed:     { label: 'Neuspješno',cls: 'bg-[rgba(239,68,68,0.1)] text-[#EF4444]' },
    refunded:   { label: 'Refundirano',cls:'bg-[rgba(255,255,255,0.05)] text-[#6B7299]' },
  } as const

  const avatarColors = ['#6C47FF','#22C55E','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#EC4899','#14B8A6']

  const waText = encodeURIComponent(`Platite za *${event.naziv}*: ${paymentUrl}`)
  const vbText = encodeURIComponent(`🎉 Platite za "${event.naziv}"!\n${paymentUrl}`)

  return (
    <div className="transparent min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-[#6B7299] hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>

        {/* Created banner */}
        {isCreated && (
          <div className="mt-6 bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] rounded-[12px] p-4 flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <div>
              <p className="font-semibold text-[#22C55E] text-sm">Termin kreiran!</p>
              <p className="text-[#22C55E] text-xs mt-0.5 opacity-80">Kopiraj link ili skeniraj QR kod i pošalji u Viber/WhatsApp grupu.</p>
            </div>
          </div>
        )}

        {/* Event header */}
        <div className="mt-6 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black text-white tracking-tight">{event.naziv}</h1>
            <p className="text-[#A0A8C8] text-sm mt-1">
              {datumDate.toLocaleDateString('hr-HR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
              {' · '}{datumDate.toLocaleTimeString('hr-HR', { hour:'2-digit', minute:'2-digit' })}
              {daysLeft > 0 && <span className={`ml-2 font-medium ${daysLeft <= 3 ? 'text-[#F59E0B]':'text-[#6B7299]'}`}>({daysLeft === 1 ? 'sutra' : `za ${daysLeft} dana`})</span>}
            </p>
          </div>
          <span className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ color: cfg.color, background: cfg.bg }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
            {cfg.label}
          </span>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start mt-6">
          {/* Left column */}
          <div className="space-y-4">
            {/* Link card */}
            <div className="bg-[#13162A] border border-[#1C2040] rounded-[16px] p-5">
              <p className="text-xs uppercase tracking-wide text-[#6B7299] font-semibold mb-3">Link za plaćanje</p>
              <div className="bg-[#0D0F1A] rounded-md px-3 py-2 flex items-center justify-between gap-2 mb-3">
                <a href={paymentUrl} target="_blank" rel="noreferrer" className="flex-1 min-w-0 text-[#8B6FFF] hover:text-[#A78BFF] text-sm font-mono truncate transition">
                  {paymentUrl}
                </a>
                <a href={paymentUrl} target="_blank" rel="noreferrer" className="shrink-0 text-[#6B7299] hover:text-white transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={paymentUrl} />
                <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-semibold px-3 py-1.5 rounded-md transition">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <a href={`viber://forward?text=${vbText}`} className="flex items-center gap-1.5 bg-[#7360F2] hover:bg-[#5f4ed4] text-white text-xs font-semibold px-3 py-1.5 rounded-md transition">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.398.002C5.5.002 1 4.3 1 9.6c0 3 1.5 5.8 4 7.6v3.8l3.6-2c.9.2 1.8.4 2.8.4 5.9 0 10.4-4.3 10.4-9.6-.1-5.3-4.6-9.6-10.402-9.598zM8.5 6.5c.2 0 .5.1.6.2.2.2.5.7.5.8.1.1.1.3 0 .4-.1.2-.3.4-.4.5-.1.1-.2.3-.1.4.3.6.7 1.1 1.2 1.5.5.4 1 .7 1.6.8.1 0 .3 0 .4-.1.2-.2.4-.4.5-.6.1-.1.3-.2.5-.1l1.2.6c.2.1.3.3.2.5-.1.5-.6 1-.9 1.1-.4.1-.8.1-1.1 0-1-.3-2-.9-2.7-1.7-.7-.8-1.2-1.7-1.3-2.7-.1-.4 0-.7.2-1 .2-.4.5-.6.6-.6z"/></svg>
                  Viber
                </a>
              </div>
            </div>

            {/* Progress card */}
            <div className="bg-[#13162A] border border-[#1C2040] rounded-[16px] p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs uppercase tracking-wide text-[#6B7299] font-semibold">Napredak</span>
                <span className="text-sm font-bold text-white">
                  {paidCount} / {event.max_sudionika}
                  {paidCount >= event.min_sudionika && <span className="ml-1 text-xs text-[#22C55E]">✓</span>}
                </span>
              </div>
              <div className="h-[10px] bg-[#1C2040] rounded-full overflow-hidden relative mb-[10px]">
                <div className="absolute top-0 bottom-0 w-0.5 bg-[#F59E0B] z-10" style={{ left:`${minPct}%` }} />
                <div className="h-full rounded-full transition-all duration-500" style={{ width:`${pct}%`, background: paidCount >= event.min_sudionika ? 'linear-gradient(90deg, #6C47FF, #22C55E)':'linear-gradient(90deg, #6C47FF, #8B6FFF)' }} />
              </div>
              <div className="flex justify-between text-xs text-[#6B7299] mb-3">
                <span>0</span><span className="text-[#F59E0B] font-medium">min {event.min_sudionika}</span><span>max {event.max_sudionika}</span>
              </div>
              {paidCount >= event.min_sudionika && (
                <div className="bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-[#22C55E] text-sm rounded-md px-3 py-2">
                  Minimalan broj sudionika je dostignut
                </div>
              )}
            </div>

            {/* Info card */}
            <div className="bg-[#13162A] border border-[#1C2040] rounded-[16px] p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#6B7299] font-semibold mb-1">Vlasnik prima</p>
                <p className="font-bold text-white text-lg">{(event.cijena_vlasnika/100).toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#6B7299] font-semibold mb-1">Gost plaća</p>
                <p className="font-bold text-white text-lg">{((event.cijena_vlasnika+event.service_fee)/100).toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#6B7299] font-semibold mb-1">Rok uplate</p>
                <p className="font-semibold text-white text-sm">{rokDate.toLocaleDateString('hr-HR')} · {rokDate.toLocaleTimeString('hr-HR',{hour:'2-digit',minute:'2-digit'})}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#6B7299] font-semibold mb-1">Link slug</p>
                <p className="font-mono text-sm text-[#6B7299]">/t/{event.slug}</p>
              </div>
            </div>

            {/* Payments table */}
            <div className="mt-6">
              <h2 className="text-xs uppercase tracking-wide text-[#6B7299] font-semibold mb-3">Uplate ({payments?.length ?? 0})</h2>
              {!payments || payments.length === 0 ? (
                <div className="bg-[#13162A] border border-dashed border-[#1C2040] rounded-[16px] p-10 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-[#A0A8C8] font-medium text-sm">Još nema uplata</p>
                  <p className="text-[#6B7299] text-xs mt-1">Podijeli link ili QR kod</p>
                </div>
              ) : (
                <div className="bg-[#13162A] border border-[#1C2040] rounded-[16px] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#1C2040] bg-[#0D0F1A]">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7299] uppercase tracking-wide">Ime</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7299] uppercase tracking-wide hidden sm:table-cell">Email</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7299] uppercase tracking-wide">Iznos</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7299] uppercase tracking-wide">Status</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7299] uppercase tracking-wide hidden sm:table-cell">Datum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p, idx) => {
                          const s = psc[p.status as keyof typeof psc] ?? { label: p.status, cls:'bg-[rgba(255,255,255,0.05)] text-[#6B7299]' }
                          const initials = p.ime.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                          const avatarColor = avatarColors[idx % 8]
                          return (
                            <tr key={p.id} className="border-b border-[#1C2040] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition">
                              <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: avatarColor }}>
                                  {initials}
                                </div>
                                {p.ime}
                              </td>
                              <td className="px-4 py-3 text-[#6B7299] hidden sm:table-cell">{p.email}</td>
                              <td className="px-4 py-3 text-right font-semibold text-white">{(p.iznos_total/100).toFixed(2)} €</td>
                              <td className="px-4 py-3 text-center"><span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${s.cls}`}>{s.label}</span></td>
                              <td className="px-4 py-3 text-right text-[#6B7299] text-xs hidden sm:table-cell">{new Date(p.created_at).toLocaleDateString('hr-HR')}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <EventActionButtons
              eventId={event.id}
              eventStatus={event.status}
              pendingCount={pendingCount}
            />
          </div>

          {/* Right column - QR Card */}
          <div className="sticky top-20">
            <QRCodeCard url={paymentUrl} eventName={event.naziv} />
          </div>
        </div>
      </div>
    </div>
  )
}
