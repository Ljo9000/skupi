import { NextResponse } from 'next/server'

interface Check {
  ok: boolean
  error?: string
}

interface HealthReport {
  status: 'ok' | 'partial' | 'error'
  checks: {
    supabase: Check
    stripe: Check
    resend: Check
    cron_secret: Check
  }
  timestamp: string
}

async function checkSupabase(): Promise<Check> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || url.includes('your-project')) {
    return { ok: false, error: 'Missing NEXT_PUBLIC_SUPABASE_URL' }
  }
  if (!key || key === 'your-service-role-key') {
    return { ok: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }
  }

  try {
    const res = await fetch(`${url}/rest/v1/owners?limit=0`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok || res.status === 406) {
      // 406 = no rows, but connection works
      return { ok: true }
    }
    return { ok: false, error: `HTTP ${res.status}` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Connection failed' }
  }
}

function checkStripe(): Check {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith('sk_test_...') || key === '') {
    return { ok: false, error: 'Missing STRIPE_SECRET_KEY' }
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret || webhookSecret.startsWith('whsec_...') || webhookSecret === '') {
    return { ok: false, error: 'Missing STRIPE_WEBHOOK_SECRET' }
  }
  return { ok: true }
}

function checkResend(): Check {
  const key = process.env.RESEND_API_KEY
  if (!key || key.startsWith('re_...') || key === '') {
    return { ok: false, error: 'Missing RESEND_API_KEY' }
  }
  return { ok: true }
}

function checkCronSecret(): Check {
  const secret = process.env.CRON_SECRET
  if (!secret || secret === 'your-random-secret-here' || secret === '') {
    return { ok: false, error: 'Missing CRON_SECRET' }
  }
  return { ok: true }
}

export async function GET() {
  const [supabase, stripe, resend, cron_secret] = await Promise.all([
    checkSupabase(),
    Promise.resolve(checkStripe()),
    Promise.resolve(checkResend()),
    Promise.resolve(checkCronSecret()),
  ])

  const checks = { supabase, stripe, resend, cron_secret }
  const allOk = Object.values(checks).every((c) => c.ok)
  const anyOk = Object.values(checks).some((c) => c.ok)

  const report: HealthReport = {
    status: allOk ? 'ok' : anyOk ? 'partial' : 'error',
    checks,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(report, { status: allOk ? 200 : 503 })
}
