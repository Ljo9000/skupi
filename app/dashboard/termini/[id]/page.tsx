import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import QRCodeCard from '@/components/QRCodeCard'
import CopyButton from '@/components/CopyButton'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

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
    active: { label: 'Aktivan', color: '#1d4ed8', bg: '#dbeafe', dot: '#3b82f6' },
    confirmed: { label: 'Potvrđen ✓', color: '#065f46', bg: '#d1fae5', dot: '#10b981' },
    cancelled: { label: 'Otkazan', color: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
  } as const
  const cfg = statusConfig[event.status as keyof typeof statusConfig] ?? statusConfig.active

  const psc = {
    confirmed: { label: 'Potvrđeno', cls: 'bg-emerald-100 text-emerald-700' },
    paid:       { label: 'Plaćeno',   cls: 'bg-emerald-100 text-emerald-700' },
    pending:    { label: 'Na čekanju',cls: 'bg-amber-100 text-amber-700' },
    capturing:  { label: 'Procesira se', cls: 'bg-blue-100 text-blue-700' },
    cancelled:  { label: 'Otkazano', cls: 'bg-red-100 text-red-600' },
    failed:     { label: 'Neuspješno',cls: 'bg-red-100 text-red-600' },
    refunded:   { label: 'Refundirano',cls:'bg-gray-100 text-gray-500' },
  } as const

  const waText = encodeURIComponent(`Platite za *${event.naziv}*: ${paymentUrl}`)
  const vbText = encodeURIComponent(`🎉 Platite za "${event.naziv}"!\n${paymentUrl}`)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        Dashboard
      </Link>

      {isCreated && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-xl">🎉</span>
          <div>
            <p className="font-semibold text-emerald-900 text-sm">Termin kreiran!</p>
            <p className="text-emerald-700 text-xs mt-0.5">Kopiraj link ili skeniraj QR kod i pošalji u Viber/WhatsApp grupu.</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{event.naziv}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {datumDate.toLocaleDateString('hr-HR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            {' · '}{datumDate.toLocaleTimeString('hr-HR', { hour:'2-digit', minute:'2-digit' })}
            {daysLeft > 0 && <span className={`ml-2 font-medium ${daysLeft <= 3 ? 'text-orange-500':'text-gray-400'}`}>({daysLeft === 1 ? 'sutra' : `za ${daysLeft} dana`})</span>}
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ color: cfg.color, background: cfg.bg }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
          {cfg.label}
        </span>
      </div>

      {/* Link box */}
      <div className="mt-5 bg-gray-900 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Payment link</p>
        <div className="flex items-center gap-2 mb-3">
          <a href={paymentUrl} target="_blank" rel="noreferrer" className="flex-1 min-w-0 text-blue-400 hover:text-blue-300 text-sm font-mono truncate transition">{paymentUrl}</a>
          <a href={paymentUrl} target="_blank" rel="noreferrer" className="shrink-0 text-gray-400 hover:text-white transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={paymentUrl} />
          <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          <a href={`viber://forward?text=${vbText}`} className="flex items-center gap-1.5 bg-[#7360F2] hover:bg-[#5f4ed4] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.398.002C5.5.002 1 4.3 1 9.6c0 3 1.5 5.8 4 7.6v3.8l3.6-2c.9.2 1.8.4 2.8.4 5.9 0 10.4-4.3 10.4-9.6-.1-5.3-4.6-9.6-10.402-9.598zM8.5 6.5c.2 0 .5.1.6.2.2.2.5.7.5.8.1.1.1.3 0 .4-.1.2-.3.4-.4.5-.1.1-.2.3-.1.4.3.6.7 1.1 1.2 1.5.5.4 1 .7 1.6.8.1 0 .3 0 .4-.1.2-.2.4-.4.5-.6.1-.1.3-.2.5-.1l1.2.6c.2.1.3.3.2.5-.1.5-.6 1-.9 1.1-.4.1-.8.1-1.1 0-1-.3-2-.9-2.7-1.7-.7-.8-1.2-1.7-1.3-2.7-.1-.4 0-.7.2-1 .2-.4.5-.6.6-.6z"/></svg>
            Viber
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { val: paidCount, label: 'Platilo', color: 'text-blue-600' },
          { val: pendingCount, label: 'Na čekanju', color: 'text-amber-500' },
          { val: `${event.min_sudionika}–${event.max_sudionika}`, label: 'Min–Max', color: 'text-gray-700' },
          { val: `${(totalCollected/100).toFixed(0)} €`, label: 'Prikupljeno', color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="mt-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">Napredak</span>
          <span className="text-sm font-bold" style={{ color: paidCount >= event.min_sudionika ? '#059669':'#3b82f6' }}>
            {paidCount} / {event.max_sudionika}
            {paidCount >= event.min_sudionika && <span className="ml-1 text-xs text-emerald-500">✓ min ok</span>}
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 w-0.5 bg-orange-400 z-10" style={{ left:`${minPct}%` }} />
          <div className="h-full rounded-full transition-all duration-500" style={{ width:`${pct}%`, background: paidCount >= event.min_sudionika ? 'linear-gradient(90deg,#10b981,#059669)':'linear-gradient(90deg,#3b82f6,#6366f1)' }} />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-400">
          <span>0</span><span className="text-orange-500 font-medium">min {event.min_sudionika}</span><span>max {event.max_sudionika}</span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Vlasnik prima</p><p className="font-bold text-gray-800 text-lg">{(event.cijena_vlasnika/100).toFixed(2)} €</p></div>
        <div><p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Gost plaća</p><p className="font-bold text-gray-800 text-lg">{((event.cijena_vlasnika+event.service_fee)/100).toFixed(2)} €</p></div>
        <div><p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Rok uplate</p><p className="font-semibold text-gray-800 text-sm">{rokDate.toLocaleDateString('hr-HR')} · {rokDate.toLocaleTimeString('hr-HR',{hour:'2-digit',minute:'2-digit'})}</p></div>
        <div><p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Link slug</p><p className="font-mono text-sm text-gray-500">/t/{event.slug}</p></div>
      </div>

      {/* QR */}
      <div className="mt-3"><QRCodeCard url={paymentUrl} eventName={event.naziv} /></div>

      {/* Payments */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Uplate ({payments?.length ?? 0})</h2>
        {!payments || payments.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500 font-medium text-sm">Još nema uplata</p>
            <p className="text-gray-400 text-xs mt-1">Podijeli link ili QR kod</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ime</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Iznos</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => {
                    const s = psc[p.status as keyof typeof psc] ?? { label: p.status, cls:'bg-gray-100 text-gray-500' }
                    return (
                      <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.ime}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.email}</td>
                        <td className="px-4 py-3 text-right font-semibold">{(p.iznos_total/100).toFixed(2)} €</td>
                        <td className="px-4 py-3 text-center"><span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${s.cls}`}>{s.label}</span></td>
                        <td className="px-4 py-3 text-right text-gray-400 text-xs hidden sm:table-cell">{new Date(p.created_at).toLocaleDateString('hr-HR')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
