'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [ime, setIme] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { ime },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f9fafb' }}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Provjeri email!</h2>
          <p className="text-gray-500 text-sm">
            Poslali smo link za potvrdu na <strong>{email}</strong>.
            Klikni link u emailu da aktiviraš račun.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f9fafb' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black" style={{ color: '#1a2b4a' }}>
            skupi<span style={{ color: '#2563eb' }}>.</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Kreiranje vlasničkog računa</p>
        </div>

        <form
          onSubmit={handleRegister}
          className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
        >
          <h1 className="text-xl font-bold text-gray-900 mb-6">Registracija</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Tvoje ime
              </label>
              <input
                type="text"
                value={ime}
                onChange={(e) => setIme(e.target.value)}
                placeholder="npr. Davor"
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Email adresa
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.hr"
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Lozinka
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min. 8 znakova"
                minLength={8}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-lg transition text-sm"
          >
            {loading ? 'Kreiranje...' : 'Kreiraj račun →'}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Već imaš račun?{' '}
            <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
              Prijava
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-4">
            Nema pretplate · Nema setup feea · 5% komisija
          </p>
        </form>
      </div>
    </div>
  )
}
