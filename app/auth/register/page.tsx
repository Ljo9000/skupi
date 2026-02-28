'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'

function passwordStrength(p: string) {
  let score = 0
  if (p.length >= 8)  score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
}

const strengthLabel = ['', 'Slaba', 'Solidna', 'Jaka', 'Vrlo jaka']
const strengthColor  = ['', '#EF4444', '#F59E0B', '#22C55E', '#22C55E']

export default function RegisterPage() {
  const [ime, setIme] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const strength = password.length > 0 ? passwordStrength(password) : 0

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
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-dark-900">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl"
               style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
            ✉️
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Provjeri email!</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            Poslali smo link za potvrdu na <strong className="text-white">{email}</strong>.
            Klikni link u emailu da aktiviraš račun.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col"
         style={{ background: 'radial-gradient(ellipse 70% 50% at 30% 10%, rgba(108,71,255,0.1) 0%, transparent 60%), #0D0F1A' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full opacity-20"
             style={{ background: '#6C47FF', filter: 'blur(120px)' }} />
        <div className="absolute bottom-[-80px] right-[-80px] w-72 h-72 rounded-full opacity-10"
             style={{ background: '#22C55E', filter: 'blur(100px)' }} />
      </div>

      <header className="px-6 pt-6 relative z-10">
        <Link href="/" className="text-xl font-black text-white tracking-tight">skupi.</Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-dark-700 p-8 bg-dark-800 shadow-dark-lg">
            <h1 className="text-2xl font-black text-white mb-1">Kreiraj besplatan račun</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-6 mt-3">
              {['Besplatno', 'Bez kreditne kartice', '30s postavljanje'].map((b) => (
                <span key={b} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#22C55E' }}>
                  <Check size={11} /> {b}
                </span>
              ))}
            </div>

            {error && (
              <div className="rounded-lg px-3.5 py-3 mb-5 text-sm border"
                   style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {[
                { id: 'ime',   label: 'Ime i prezime', value: ime, setter: setIme, type: 'text', placeholder: 'Tvoje ime i prezime' },
                { id: 'email', label: 'Email adresa',  value: email, setter: setEmail, type: 'email', placeholder: 'email@primjer.hr' },
              ].map(({ id, label, value, setter, type, placeholder }) => (
                <div key={label}>
                  <label htmlFor={id} className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">{label}</label>
                  <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    required
                    className="w-full px-3.5 py-2.5 rounded-md text-sm text-white placeholder-text-muted focus:outline-none transition"
                    style={{ background: '#2A2F55', border: '1.5px solid #1C2040' }}
                    onFocus={(e) => { e.target.style.borderColor = '#6C47FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,71,255,0.15)' }}
                    onBlur={(e)  => { e.target.style.borderColor = '#1C2040'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              ))}

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Lozinka</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Najmanje 8 znakova"
                    minLength={8}
                    required
                    aria-describedby="password-strength"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-md text-sm text-white placeholder-text-muted focus:outline-none transition"
                    style={{ background: '#2A2F55', border: '1.5px solid #1C2040' }}
                    onFocus={(e) => { e.target.style.borderColor = '#6C47FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,71,255,0.15)' }}
                    onBlur={(e)  => { e.target.style.borderColor = '#1C2040'; e.target.style.boxShadow = 'none' }}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div id="password-strength" className="mt-2" aria-live="polite">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-200"
                             style={{ background: strength >= i ? strengthColor[strength] : '#1C2040' }} />
                      ))}
                    </div>
                    <span className="text-xs font-medium" style={{ color: strengthColor[strength] }}>{strengthLabel[strength]}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 mt-1 font-semibold text-sm text-white rounded-md transition disabled:opacity-60"
                style={{ background: '#6C47FF' }}
                onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#8B6FFF' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6C47FF' }}
              >
                {loading ? (
                  <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Kreiranje...</>
                ) : (
                  <>Kreiraj račun <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            <p className="text-center text-[11px] text-text-muted mt-5 leading-relaxed">
              Kreiranjem računa prihvaćaš naše{' '}
              <a href="#" className="underline hover:text-text-secondary">Uvjete korištenja</a>{' '}i{' '}
              <a href="#" className="underline hover:text-text-secondary">Politiku privatnosti</a>.
            </p>
            <p className="text-center text-sm text-text-muted mt-3">
              Već imaš račun?{' '}
              <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: '#6C47FF' }}>
                Prijavi se →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
