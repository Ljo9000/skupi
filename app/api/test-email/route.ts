// TEMP: debug endpoint — delete after testing
import { NextRequest, NextResponse } from 'next/server'
import { resend, EMAIL_FROM } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { to } = await req.json()
  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'skupi. test mail iz produkcije',
      html: '<p>Ako vidis ovo, Resend radi na produkciji! ✅</p>',
    })
    return NextResponse.json({ ok: true, id: result.data?.id, from: EMAIL_FROM })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg, from: EMAIL_FROM }, { status: 500 })
  }
}
