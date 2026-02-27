'use client'

import { useState } from 'react'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutFormProps {
  eventId: string
  naziv: string
  cijenaTotal: number
  onSuccess: (guestName: string) => void
  onFull?: () => void
}

// Extract payment_intent ID from client_secret (format: pi_xxx_secret_yyy)
function piIdFromSecret(secret: string): string | null {
  const match = secret.match(/^(pi_[^_]+)_secret_/)
  return match ? match[1] : null
}

// ── Step 1: Collect name + email, create PaymentIntent ─────────────────────
export default function CheckoutForm({ eventId, naziv, cijenaTotal, onSuccess, onFull }: CheckoutFormProps) {
  const [ime, setIme] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, ime, email }),
      })

      const data = await res.json()

      // Event became full between page load and submission
      if (res.ok && data.full) {
        onFull?.()
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError(data.error ?? 'Greška pri pripremi uplate')
        setLoading(false)
        return
      }

      setClientSecret(data.clientSecret)
    } catch {
      setError('Mrežna greška. Pokušajte ponovo.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Show Stripe Elements
  if (clientSecret) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#2563eb',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              borderRadius: '8px',
            },
          },
          locale: 'hr',
        }}
      >
        <StripePaymentForm
          naziv={naziv}
          cijenaTotal={cijenaTotal}
          ime={ime}
          clientSecret={clientSecret}
          onSuccess={onSuccess}
          onBack={() => setClientSecret(null)}
        />
      </Elements>
    )
  }

  // Step 1: Name + email form
  return (
    <form onSubmit={handleContinue} className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Ime i prezime</label>
        <input
          type="text"
          value={ime}
          onChange={(e) => setIme(e.target.value)}
          placeholder="Tvoje ime"
          required
          autoComplete="name"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Email adresa</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@primjer.hr"
          required
          autoComplete="email"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Priprema...
          </>
        ) : (
          <>Nastavi na plaćanje →</>
        )}
      </button>
    </form>
  )
}

// ── Step 2: Stripe PaymentElement ──────────────────────────────────────────
interface StripePaymentFormProps {
  naziv: string
  cijenaTotal: number
  ime: string
  clientSecret: string
  onSuccess: (guestName: string) => void
  onBack: () => void
}

function StripePaymentForm({ naziv, cijenaTotal, ime, clientSecret, onSuccess, onBack }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Greška')
      setLoading(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?payment=success&name=${encodeURIComponent(ime)}`,
        payment_method_data: {
          billing_details: { name: ime },
        },
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Plaćanje nije uspjelo')
      setLoading(false)
      return
    }

    // Payment confirmed — immediately mark as paid in DB so tracker updates
    // without waiting for the async Stripe webhook.
    const piId = piIdFromSecret(clientSecret)
    if (piId) {
      fetch('/api/payments/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_intent_id: piId }),
      }).catch(err => console.error('[CheckoutForm] mark-paid failed:', err))
    }

    onSuccess(ime)
    setLoading(false)
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
          ← Natrag
        </button>
        <span className="text-xs text-gray-400">Unos kartice</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <PaymentElement
        options={{
          layout: 'tabs',
          fields: { billingDetails: { name: 'never' } },
        }}
      />

      <button
        type="submit"
        disabled={loading || !stripe || !elements}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Obrada...
          </>
        ) : (
          <>🔒 Plati {cijenaTotal.toFixed(2)} €</>
        )}
      </button>
    </form>
  )
}
