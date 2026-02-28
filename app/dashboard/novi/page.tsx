'use client'

import { format, parse } from 'date-fns'
import { useFormState, useFormStatus } from 'react-dom'
import { createEventAction, type CreateEventState } from '@/app/actions/events'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import DatePickerDropdown from '@/components/DatePickerDropdown'
import TimePickerDropdown from '@/components/TimePickerDropdown'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{ backgroundColor: '#6C47FF' }}
      onMouseEnter={(e) => !pending && (e.currentTarget.style.backgroundColor = '#8B6FFF')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6C47FF')}
      className="flex-[2] py-3 disabled:opacity-60 text-white font-bold rounded-md text-sm transition flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Kreiranje...
        </>
      ) : (
        'Generiraj link →'
      )}
    </button>
  )
}

const initialState: CreateEventState = {}

function getDefaultEventDate(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  d.setHours(20, 0, 0, 0)
  return d
}

function getDefaultRok(eventDate: Date): { date: Date; time: string } {
  const d = new Date(eventDate.getTime() - 5 * 60 * 60 * 1000)
  return { date: d, time: format(d, 'HH:mm') }
}

export default function NoviTerminPage() {
  const [state, formAction] = useFormState(createEventAction, initialState)
  const [cijena, setCijena] = useState(5)

  const defaultEvent = getDefaultEventDate()
  const defaultRok = getDefaultRok(defaultEvent)

  const [datum, setDatum] = useState(format(defaultEvent, 'yyyy-MM-dd'))
  const [vrijemeUnosa, setVrijemeUnosa] = useState('20:00')
  const [rokDatum, setRokDatum] = useState<Date | undefined>(defaultRok.date)
  const [rokVrijeme, setRokVrijeme] = useState(defaultRok.time)

  useEffect(() => {
    if (!datum || !vrijemeUnosa) return
    const eventDT = new Date(`${datum}T${vrijemeUnosa}:00`)
    if (isNaN(eventDT.getTime())) return
    const rok = getDefaultRok(eventDT)
    setRokDatum(rok.date)
    setRokVrijeme(rok.time)
  }, [datum, vrijemeUnosa])

  const skupiKomisija = cijena * 0.05
  const stripeFee = cijena * 0.015 + 0.25
  const ukupno = cijena + skupiKomisija + stripeFee

  const err = (field: string) => state.fieldErrors?.[field]
  const isoRok = rokDatum ? `${format(rokDatum, 'yyyy-MM-dd')}T${rokVrijeme}` : ''

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-[#8A93BC] hover:text-white transition inline-flex items-center gap-1">
          <ArrowLeft size={16} aria-hidden="true" />
          Dashboard
        </Link>
        <h1 className="text-2xl font-black text-white tracking-tight mt-3">Novi termin</h1>
        <p className="text-sm text-[#8A93BC] mt-1 mb-6">Link se generira automatski.</p>
      </div>

      <form action={formAction}>
        <div style={{ backgroundColor: '#13162A', borderColor: '#1C2040' }} className="border rounded-2xl p-7 space-y-5">

          {state.error && (
            <div role="alert" style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }} className="border rounded-lg px-3.5 py-3 text-sm text-[#FCA5A5]">
              {state.error}
            </div>
          )}

          {/* Naziv */}
          <div>
            <label htmlFor="naziv" className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[#A0A8C8] mb-1.5">
              Naziv termina <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <input
              id="naziv"
              name="naziv"
              type="text"
              required
              placeholder="npr. Mali nogomet — Petak večer"
              aria-describedby={err('naziv') ? 'naziv-error' : undefined}
              style={{
                backgroundColor: '#2A2F55',
                borderColor: err('naziv') ? '#EF4444' : '#1C2040',
                color: 'white'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = err('naziv') ? '#EF4444' : '#6C47FF')}
              onBlur={(e) => (e.currentTarget.style.borderColor = err('naziv') ? '#EF4444' : '#1C2040')}
              className={`w-full border-1.5 rounded-md px-3.5 py-2.5 text-sm focus:outline-none transition ${err('naziv') ? 'focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : 'focus:shadow-[0_0_0_3px_rgba(108,71,255,0.15)]'}`}
            />
            {err('naziv') && <p id="naziv-error" className="text-red-400 text-xs mt-1">{err('naziv')}</p>}
          </div>

          {/* Datum + Vrijeme */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="datum" className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[#A0A8C8] mb-1.5">
                Datum <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <DatePickerDropdown
                id="datum"
                name="datum"
                value={datum ? parse(datum, 'yyyy-MM-dd', new Date()) : undefined}
                onChange={(d) => setDatum(d ? format(d, 'yyyy-MM-dd') : '')}
                minDate={new Date()}
                error={!!err('datum')}
              />
              {err('datum') && <p id="datum-error" className="text-red-400 text-xs mt-1">{err('datum')}</p>}
            </div>
            <div>
              <label htmlFor="vrijemeUnosa" className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[#A0A8C8] mb-1.5">Vrijeme</label>
              <TimePickerDropdown
                id="vrijemeUnosa"
                name="vrijemeUnosa"
                value={vrijemeUnosa}
                onChange={setVrijemeUnosa}
              />
            </div>
          </div>

          {/* Cijena */}
          <div>
            <label htmlFor="cijena" className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[#A0A8C8] mb-1.5">
              Cijena po osobi (€) <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <div style={{ borderColor: err('cijena') ? '#EF4444' : '#1C2040' }} className="flex items-center border-1.5 rounded-md overflow-hidden transition focus-within:shadow-[0_0_0_3px_rgba(108,71,255,0.15)]"
              onFocus={() => {}}
            >
              <span style={{ backgroundColor: '#1C2040', borderRightColor: '#1C2040' }} className="px-3 py-2.5 text-sm text-[#8A93BC] border-r border-1.5 font-medium" aria-hidden="true">€</span>
              <input
                id="cijena"
                name="cijena"
                type="number"
                min="1"
                step="0.50"
                required
                defaultValue="5"
                aria-describedby={err('cijena') ? 'cijena-error' : undefined}
                onChange={(e) => setCijena(parseFloat(e.target.value) || 0)}
                style={{
                  backgroundColor: '#2A2F55',
                  color: 'white'
                }}
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>
            {err('cijena') && <p id="cijena-error" className="text-red-400 text-xs mt-1">{err('cijena')}</p>}

            {/* Fee preview */}
            <div style={{ backgroundColor: 'rgba(108,71,255,0.06)', borderColor: 'rgba(108,71,255,0.15)' }} className="mt-3 border rounded-[10px] px-4 py-3.5 space-y-2">
              <div className="flex justify-between text-sm text-[#A0A8C8]">
                <span>Tvoja cijena</span><span className="text-white">{cijena.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm text-[#A0A8C8]">
                <span>Skupi komisija (5%)</span><span className="text-white">{skupiKomisija.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm text-[#A0A8C8]">
                <span>Stripe fee (~1.5% + 0.25€)</span><span className="text-white">{stripeFee.toFixed(2)} €</span>
              </div>
              <div style={{ borderTopColor: 'rgba(108,71,255,0.2)' }} className="flex justify-between text-sm font-bold text-white border-t pt-2.5 mt-1">
                <span>Gost plaća ukupno</span><span className="text-[#8B6FFF]">{ukupno.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Min / Max */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="min_sudionika" className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[#A0A8C8] mb-1.5">
                Min. sudionika <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <input
                id="min_sudionika"
                name="min_sudionika"
                type="number"
                min="2"
                required
                defaultValue="6"
                aria-describedby={err('min_sudionika') ? 'min_sudionika-error' : undefined}
                style={{
                  backgroundColor: '#2A2F55',
                  borderColor: err('min_sudionika') ? '#EF4444' : '#1C2040',
                  color: 'white'
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = err('min_sudionika') ? '#EF4444' : '#6C47FF')}
                onBlur={(e) => (e.currentTarget.style.borderColor = err('min_sudionika') ? '#EF4444' : '#1C2040')}
                className={`w-full border-1.5 rounded-md px-3.5 py-2.5 text-sm focus:outline-none transition ${err('min_sudionika') ? 'focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : 'focus:shadow-[0_0_0_3px_rgba(108,71,255,0.15)]'}`}
              />
              {err('min_sudionika') && <p id="min_sudionika-error" className="text-red-400 text-xs mt-1">{err('min_sudionika')}</p>}
            </div>
            <div>
              <label htmlFor="max_sudionika" className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[#A0A8C8] mb-1.5">
                Max. sudionika <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <input
                id="max_sudionika"
                name="max_sudionika"
                type="number"
                min="2"
                required
                defaultValue="10"
                aria-describedby={err('max_sudionika') ? 'max_sudionika-error' : undefined}
                style={{
                  backgroundColor: '#2A2F55',
                  borderColor: err('max_sudionika') ? '#EF4444' : '#1C2040',
                  color: 'white'
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = err('max_sudionika') ? '#EF4444' : '#6C47FF')}
                onBlur={(e) => (e.currentTarget.style.borderColor = err('max_sudionika') ? '#EF4444' : '#1C2040')}
                className={`w-full border-1.5 rounded-md px-3.5 py-2.5 text-sm focus:outline-none transition ${err('max_sudionika') ? 'focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : 'focus:shadow-[0_0_0_3px_rgba(108,71,255,0.15)]'}`}
              />
              {err('max_sudionika') && <p id="max_sudionika-error" className="text-red-400 text-xs mt-1">{err('max_sudionika')}</p>}
            </div>
          </div>

          {/* Rok uplate */}
          <div>
            <label className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[#A0A8C8] mb-1.5">
              Rok uplate <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <input type="hidden" name="rok_uplate" value={isoRok} required />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="rok_d" className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[#A0A8C8] mb-1.5">Datum</label>
                <DatePickerDropdown
                  id="rok_d"
                  name="rok_d"
                  value={rokDatum}
                  onChange={(d) => setRokDatum(d ?? undefined)}
                  minDate={new Date()}
                  error={!!err('rok_uplate')}
                />
              </div>
              <div>
                <label htmlFor="rok_t" className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[#A0A8C8] mb-1.5">Vrijeme</label>
                <TimePickerDropdown
                  id="rok_t"
                  name="rok_t"
                  value={rokVrijeme}
                  onChange={setRokVrijeme}
                  includeNightSlots
                  error={!!err('rok_uplate')}
                />
              </div>
            </div>
            {err('rok_uplate') && <p id="rok_uplate-error" className="text-red-400 text-xs mt-1">{err('rok_uplate')}</p>}
            <p className="text-xs text-[#8A93BC] mt-1">Zadano: 5 sati prije termina. Mora biti prije datuma termina.</p>
          </div>

          {/* Opis */}
          <div>
            <label htmlFor="opis" className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[#A0A8C8] mb-1.5">Opis (opcionalno)</label>
            <textarea
              id="opis"
              name="opis"
              rows={3}
              placeholder="Kratki opis aktivnosti..."
              style={{
                backgroundColor: '#2A2F55',
                borderColor: '#1C2040',
                color: 'white'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#6C47FF')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#1C2040')}
              className="w-full border-1.5 rounded-md px-3.5 py-2.5 text-sm focus:outline-none transition resize-none focus:shadow-[0_0_0_3px_rgba(108,71,255,0.15)]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard"
              className="flex-1 py-3 border border-[#1C2040] hover:border-[#363B6B] text-[#8A93BC] hover:text-white font-medium rounded-md text-sm text-center transition"
            >
              Odustani
            </Link>
            <SubmitButton />
          </div>
        </div>
      </form>
    </div>
  )
}
