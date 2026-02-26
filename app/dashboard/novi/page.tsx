'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createEventAction, type CreateEventState } from '@/app/actions/events'
import Link from 'next/link'
import { useState } from 'react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2"
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

export default function NoviTerminPage() {
  const [state, formAction] = useFormState(createEventAction, initialState)
  const [cijena, setCijena] = useState(5)

  const skupiKomisija = cijena * 0.05
  const stripeFee = cijena * 0.015 + 0.25
  const ukupno = cijena + skupiKomisija + stripeFee

  const err = (field: string) => state.fieldErrors?.[field]

  // Default deadline: today + 1 day, at 18:00
  const defaultDeadline = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(18, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  }

  const defaultDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Novi termin</h1>
        <p className="text-gray-500 text-sm mt-1">Link se generira automatski.</p>
      </div>

      <form action={formAction}>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">

          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {state.error}
            </div>
          )}

          {/* Naziv */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              Naziv termina <span className="text-red-400">*</span>
            </label>
            <input
              name="naziv"
              type="text"
              placeholder="npr. Mali nogomet — Petak večer"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none transition ${err('naziv') ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
            />
            {err('naziv') && <p className="text-red-500 text-xs mt-1">{err('naziv')}</p>}
          </div>

          {/* Datum + Vrijeme */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Datum <span className="text-red-400">*</span>
              </label>
              <input
                name="datum"
                type="date"
                defaultValue={defaultDate()}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none transition ${err('datum') ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
              />
              {err('datum') && <p className="text-red-500 text-xs mt-1">{err('datum')}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Vrijeme</label>
              <input
                name="vrijemeUnosa"
                type="time"
                defaultValue="20:00"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Cijena */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              Cijena po osobi (€) <span className="text-red-400">*</span>
            </label>
            <div className={`flex items-center border rounded-lg overflow-hidden ${err('cijena') ? 'border-red-300' : 'border-gray-200 focus-within:border-blue-500'} transition`}>
              <span className="bg-gray-50 px-3 py-2.5 text-sm text-gray-400 border-r border-gray-200 font-medium">€</span>
              <input
                name="cijena"
                type="number"
                min="1"
                step="0.50"
                defaultValue="5"
                onChange={(e) => setCijena(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>
            {err('cijena') && <p className="text-red-500 text-xs mt-1">{err('cijena')}</p>}

            {/* Fee preview */}
            <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Tvoja cijena</span><span>{cijena.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Skupi komisija (5%)</span><span>{skupiKomisija.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Stripe fee (~1.5% + 0.25€)</span><span>{stripeFee.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-800 border-t border-blue-200 pt-1.5 mt-1">
                <span>Gost plaća ukupno</span><span>{ukupno.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Min / Max */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Min. sudionika <span className="text-red-400">*</span>
              </label>
              <input
                name="min_sudionika"
                type="number"
                min="2"
                defaultValue="6"
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none transition ${err('min_sudionika') ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
              />
              {err('min_sudionika') && <p className="text-red-500 text-xs mt-1">{err('min_sudionika')}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Max. sudionika <span className="text-red-400">*</span>
              </label>
              <input
                name="max_sudionika"
                type="number"
                min="2"
                defaultValue="10"
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none transition ${err('max_sudionika') ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
              />
              {err('max_sudionika') && <p className="text-red-500 text-xs mt-1">{err('max_sudionika')}</p>}
            </div>
          </div>

          {/* Rok uplate */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              Rok uplate <span className="text-red-400">*</span>
            </label>
            <input
              name="rok_uplate"
              type="datetime-local"
              defaultValue={defaultDeadline()}
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none transition ${err('rok_uplate') ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
            />
            {err('rok_uplate') && <p className="text-red-500 text-xs mt-1">{err('rok_uplate')}</p>}
            <p className="text-xs text-gray-400 mt-1">Mora biti prije datuma termina</p>
          </div>

          {/* Opis */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Opis (opcionalno)</label>
            <textarea
              name="opis"
              rows={2}
              placeholder="Kratki opis aktivnosti..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard"
              className="flex-1 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold rounded-lg text-sm text-center transition"
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
