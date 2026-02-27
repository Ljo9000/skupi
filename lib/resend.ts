// lib/resend.ts
// Resend email client (lazy init like Stripe)
//
// FROM address: set RESEND_FROM in Vercel env vars once your domain is verified.
// Until then, defaults to Resend's built-in test address (works without domain).
// Example: RESEND_FROM=skupi. <noreply@skupi.app>

import { Resend } from 'resend'

export const EMAIL_FROM = process.env.RESEND_FROM || 'skupi. <onboarding@resend.dev>'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return getResend()[prop as keyof Resend]
  },
})
