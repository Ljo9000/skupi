'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 'loading' | 'needed' | 'redirecting' | 'success' | 'refresh' | 'already'

export default function StripeOnboardingPage() {
  const [step, setStep] = useState<Step>('loading')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const success = params.get('success')
    const refresh = params.get('refresh')

    if (success === 'true') {
      verifyWithStripe()
      return
    }

    if (refresh === 'true') {
      setStep('refresh')
      return
    }

    checkOnboardingStatus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function verifyWithStripe() {
    setStep('loading')
    try {
      const res = await fetch('/api/stripe/verify-onboarding', { method: 'POST' })
      const data = await res.json()
      if (data.complete) {
        setStep('already')
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        setStep('needed')
      }
    } catch {
      setStep('needed')
    }
  }

  async function checkOnboardingStatus() {
    setStep('loading')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: owner } = await supabase
      .from('owners')
      .select('stripe_onboarding_complete')
      .eq('user_id', user.id)
      .single()

    if (owner?.stripe_onboarding_complete) {
      setStep('already')
      setTimeout(() => router.push('/dashboard'), 2000)
    } else {
      setStep('needed')
    }
  }

  async function startOnboarding() {
    setStep('redirecting')
    setError(null)

    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'API error')
      }

      if (data.alreadyOnboarded) {
        setStep('already')
        setTimeout(() => router.push('/dashboard'), 2000)
        return
      }

      // Redirect to Stripe
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška')
      setStep('needed')
    }
  }

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">

        {/* LOADING */}
        {step === 'loading' && (
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Provjera statusa...</p>
          </div>
        )}

        {/* ONBOARDING NEEDED */}
        {(step === 'needed' || step === 'redirecting' || step === 'refresh') && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">💳</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Poveži Stripe račun</h1>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Da bi primao uplate od gostiju, trebaš povezati Stripe Express račun.
              Proces traje ~3 minute.
            </p>

            <div className="space-y-3 text-left mb-8">
              {[
                { icon: '🆓', text: 'Besplatno kreiranje računa' },
                { icon: '⚡', text: 'Isplate u roku 2 radna dana' },
                { icon: '🔒', text: 'Stripe upravlja KYC-om umjesto tebe' },
                { icon: '💰', text: 'Skupi automatski odbija 5% komisiju' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            {step === 'refresh' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-left">
                <p className="text-amber-800 text-sm font-medium">Link je istekao</p>
                <p className="text-amber-600 text-xs mt-0.5">Klikni gumb za novi link.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-left">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={startOnboarding}
              disabled={step === 'redirecting'}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              {step === 'redirecting' ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Preusmjeravanje na Stripe...
                </>
              ) : (
                <>Nastavi na Stripe →</>
              )}
            </button>

            <p className="text-xs text-gray-400 mt-3">
              Bit ćeš preusmjeren na stripe.com
            </p>
          </div>
        )}

        {/* ALREADY DONE */}
        {step === 'already' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ background: '#d1fae5' }}
            >
              ✅
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Stripe je aktivan!</h2>
            <p className="text-gray-500 text-sm">Preusmjeravanje na dashboard...</p>
          </div>
        )}

        {/* SUCCESS — returned from Stripe, still checking */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="inline-block w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600 text-sm">Potvrđujemo Stripe status...</p>
          </div>
        )}

      </div>
    </div>
  )
}
