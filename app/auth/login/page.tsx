'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Pogrešan email ili lozinka.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-900"
         style={{ background: 'radial-gradient(ellipse 70% 50% at 30% 10%, rgba(108,71,255,0.1) 0%, transparent 60%), #0D0F1A' }}>

      {/* Decorative orbs */}
      <div className="fixed pointer-events-none">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-20"
             style={{ background: '#6C47FF', filter: 'blur(120px)' }} />
        <div className="absolute bottom-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full opacity-10"
             style={{ background: '#22C55E', filter: 'blur(100px)' }} />
      </div>

      {/* Logo bar */}
      <header className="px-6 pt-6">
        <Link href="/" className="text-xl font-black text-white tracking-tight">skupi.</Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="rounded-2xl border border-dark-700 p-8 shadow-dark-lg"
               style={{ background: '#13162A' }}>

            <h1 className="text-2xl font-black text-white mb-1">Dobro došao nazad</h1>
            <p className="text-sm text-text-muted mb-7">Upiši podatke za prijavu.</p>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg px-3.5 py-3 mb-5 text-sm border"
                   style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                  Email adresa
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@primjer.hr"
                  required
                  className="w-full px-3.5 py-2.5 rounded-md text-sm text-white placeholder-text-muted focus:outline-none transition"
                  style={{
                    background: '#2A2F55',
                    border: '1.5px solid #1C2040',
                    boxShadow: 'none',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#6C47FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,71,255,0.15)' }}
                  onBlur={(e)  => { e.target.style.borderColor = '#1C2040'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Lozinka
                  </label>
                  <a href="#" className="text-xs text-brand-purple hover:underline">
                    Zaboravio lozinku?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-md text-sm text-white placeholder-text-muted focus:outline-none transition"
                    style={{
                      background: '#2A2F55',
                      border: '1.5px solid #1C2040',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#6C47FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,71,255,0.15)' }}
                    onBlur={(e)  => { e.target.style.borderColor = '#1C2040'; e.target.style.boxShadow = 'none' }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 mt-2 font-semibold text-sm rounded-md transition disabled:opacity-60"
                style={{ background: '#6C47FF', color: 'white' }}
                onMouseEnter={(e) => { if (!loading) (e.target as HTMLElement).style.background = '#8B6FFF' }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = '#6C47FF' }}
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Prijava...
                  </>
                ) : (
                  <>Prijavi se <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-text-muted mt-6">
              Nemaš račun?{' '}
              <Link href="/auth/register" className="text-brand-purple font-semibold hover:underline">
                Počni besplatno →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
