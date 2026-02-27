// lib/notify.ts
// Notification service: email (Resend) + WhatsApp/Viber (Infobip, optional)
// Infobip channels only activate when INFOBIP_API_KEY + INFOBIP_BASE_URL are set.

import { resend, EMAIL_FROM } from '@/lib/resend'
import { spotAvailableEmail } from '@/lib/email-templates'

export interface WaitingListEntry {
  ime: string
  email: string
  mobitel?: string | null
  notify_whatsapp: boolean
  notify_viber: boolean
}

export interface EventInfo {
  naziv: string
  datum: string
  slug: string
  cijena_vlasnika: number
  service_fee: number
}

// Normalize Croatian phone numbers to international format (385...)
function normalizePhone(phone: string): string {
  return phone
    .replace(/[\s\-().]/g, '')
    .replace(/^\+/, '')
    .replace(/^00/, '')
    .replace(/^0/, '385')
}

async function sendViaInfobip(
  phone: string,
  channel: 'WHATSAPP' | 'VIBER',
  text: string
) {
  const apiKey = process.env.INFOBIP_API_KEY
  const baseUrl = process.env.INFOBIP_BASE_URL

  if (!apiKey || !baseUrl) return

  const normalized = normalizePhone(phone)

  if (channel === 'VIBER') {
    // Viber Business Messages via Infobip
    await fetch(`${baseUrl}/viber/2/message`, {
      method: 'POST',
      headers: {
        Authorization: `App ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            sender: process.env.INFOBIP_VIBER_SENDER || 'skupi.',
            destinations: [{ to: normalized }],
            viber: {
              text,
              validityPeriod: 86400,
            },
          },
        ],
      }),
    }).catch(e => console.error('[notify] Viber send failed:', e))
  } else {
    // WhatsApp via Infobip — uses a pre-approved template
    // Template must be approved via Infobip dashboard: "spot_available" with params:
    // {{1}} = guest name, {{2}} = event name, {{3}} = date, {{4}} = URL
    const templateName = process.env.INFOBIP_WA_TEMPLATE || 'spot_available'
    const templateData = text.split('|||') // passed as pipe-separated params

    await fetch(`${baseUrl}/whatsapp/1/message/template`, {
      method: 'POST',
      headers: {
        Authorization: `App ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            from: process.env.INFOBIP_WA_SENDER,
            to: normalized,
            content: {
              templateName,
              templateData: {
                body: { placeholders: templateData },
              },
              language: 'hr',
            },
          },
        ],
      }),
    }).catch(e => console.error('[notify] WhatsApp send failed:', e))
  }
}

export async function notifySpotAvailable(
  entry: WaitingListEntry,
  event: EventInfo
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skupi.app'
  const paymentUrl = `${baseUrl}/t/${event.slug}`

  const eventDate = new Date(event.datum).toLocaleDateString('hr-HR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const cijenaTotalna = ((event.cijena_vlasnika + event.service_fee) / 100).toFixed(2)
  const amount = `${cijenaTotalna} €`

  // 1. Email (always)
  const emailPromise = resend.emails
    .send({
      from: EMAIL_FROM,
      to: entry.email,
      subject: `🎉 Oslobodilo se mjesto — ${event.naziv}`,
      html: spotAvailableEmail({
        guestName: entry.ime,
        eventName: event.naziv,
        eventDate,
        amount,
        paymentUrl,
      }),
    })
    .catch(e => console.error('[notify] Email failed:', e))

  // 2. WhatsApp / Viber via Infobip (only if phone provided + preference set)
  if (entry.mobitel) {
    const messageText = `Zdravo ${entry.ime}! 🎉 Oslobodilo se mjesto na "${event.naziv}" (${eventDate}).\n\nCijena: ${amount}\n\nKlikni za rezervaciju: ${paymentUrl}`

    // WhatsApp template params (pipe-separated for our sendViaInfobip helper)
    const whatsappParams = [entry.ime, event.naziv, eventDate, paymentUrl].join('|||')

    if (entry.notify_viber) {
      await sendViaInfobip(entry.mobitel, 'VIBER', messageText)
    }
    if (entry.notify_whatsapp) {
      await sendViaInfobip(entry.mobitel, 'WHATSAPP', whatsappParams)
    }
  }

  await emailPromise
}
