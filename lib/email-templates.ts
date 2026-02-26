// lib/email-templates.ts
// HTML email templates for skupi.

export function paymentConfirmedEmail({
  guestName,
  eventName,
  eventDate,
  amount,
  slug,
  cancelToken,
}: {
  guestName: string
  eventName: string
  eventDate: string
  amount: string
  slug: string
  cancelToken?: string
}): string {
  const cancelSection = cancelToken
    ? `
          <!-- Cancel link -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Planovi su se promijenili?
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/t/${slug}/cancel?token=${cancelToken}"
                   style="color:#ef4444;text-decoration:underline;">Odustani od rezervacije</a>
              </p>
            </td>
          </tr>`
    : ''
  return `
<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Potvrda plaćanja — skupi.</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">skupi.</div>
              <div style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:4px;">grupno plaćanje, jednostavno</div>
            </td>
          </tr>

          <!-- Checkmark -->
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <div style="width:64px;height:64px;background:#ecfdf5;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px;">✅</div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Plaćanje potvrđeno!</h1>
              <p style="margin:8px 0 0;color:#6b7280;font-size:15px;">Tvoje mjesto je rezervirano.</p>
            </td>
          </tr>

          <!-- Details card -->
          <tr>
            <td style="padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:0;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <div style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Ime</div>
                    <div style="font-size:15px;font-weight:600;color:#111827;">${guestName}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <div style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Event</div>
                    <div style="font-size:15px;font-weight:600;color:#111827;">${eventName}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <div style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Datum</div>
                    <div style="font-size:15px;font-weight:600;color:#111827;">${eventDate}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Iznos</div>
                    <div style="font-size:20px;font-weight:800;color:#6366f1;">${amount}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 24px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/t/${slug}"
                 style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:8px;">
                Pregledaj termin
              </a>
              <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
                Ako nisi ti napravio/la ovu uplatu, kontaktiraj nas na
                <a href="mailto:podrska@skupi.app" style="color:#6366f1;">podrska@skupi.app</a>
              </p>
            </td>
          </tr>
          ${cancelSection}

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#d1d5db;">skupi. · Zagreb, Hrvatska · © 2025</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export function eventFullEmail({
  ownerName,
  eventName,
  eventDate,
  totalAmount,
  participantCount,
  slug,
}: {
  ownerName: string
  eventName: string
  eventDate: string
  totalAmount: string
  participantCount: number
  slug: string
}): string {
  return `
<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event je pun! — skupi.</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">skupi.</div>
              <div style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:4px;">grupno plaćanje, jednostavno</div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">🎉</div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Event je pun, ${ownerName}!</h1>
              <p style="margin:8px 0 0;color:#6b7280;font-size:15px;">Svi sudionici su platili. Novac će biti prebačen na tvoj račun.</p>
            </td>
          </tr>

          <!-- Stats -->
          <tr>
            <td style="padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <div style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Event</div>
                    <div style="font-size:15px;font-weight:600;color:#111827;">${eventName}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <div style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Datum</div>
                    <div style="font-size:15px;font-weight:600;color:#111827;">${eventDate}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <div style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Sudionici</div>
                    <div style="font-size:15px;font-weight:600;color:#111827;">${participantCount} osoba</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Ukupno prikupljeno (tvoj dio)</div>
                    <div style="font-size:20px;font-weight:800;color:#059669;">${totalAmount}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <a href="https://skupi.app/dashboard/termini"
                 style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:8px;">
                Otvori dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#d1d5db;">skupi. · Zagreb, Hrvatska · © 2025</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export function spotAvailableEmail({
  guestName,
  eventName,
  eventDate,
  amount,
  paymentUrl,
}: {
  guestName: string
  eventName: string
  eventDate: string
  amount: string
  paymentUrl: string
}): string {
  return `
<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Oslobodilo se mjesto — skupi.</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">skupi.</div>
              <div style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:4px;">grupno plaćanje, jednostavno</div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <div style="width:64px;height:64px;background:#fef9c3;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px;">🎉</div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Oslobodilo se mjesto!</h1>
              <p style="margin:8px 0 0;color:#6b7280;font-size:15px;">Zdravo ${guestName}, netko je odustao — tvoje je na redu!</p>
            </td>
          </tr>

          <!-- Details card -->
          <tr>
            <td style="padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <div style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Event</div>
                    <div style="font-size:15px;font-weight:600;color:#111827;">${eventName}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <div style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Datum</div>
                    <div style="font-size:15px;font-weight:600;color:#111827;">${eventDate}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Cijena</div>
                    <div style="font-size:20px;font-weight:800;color:#6366f1;">${amount}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 16px;text-align:center;">
              <a href="${paymentUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:8px;">
                Rezerviraj mjesto →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#ef4444;font-weight:600;">
                ⏰ Mjesta su ograničena — nemoj čekati!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#d1d5db;">skupi. · Zagreb, Hrvatska · © 2025</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export function selfCancelConfirmedEmail({
  guestName,
  eventName,
  eventDate,
  amount,
}: {
  guestName: string
  eventName: string
  eventDate: string
  amount: string
}): string {
  return `
<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Odustao/la si — skupi.</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">skupi.</div>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">✅</div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Odjava potvrđena</h1>
              <p style="margin:12px 0 0;color:#6b7280;font-size:15px;">
                Zdravo ${guestName}, tvoja rezervacija za <strong>"${eventName}"</strong>
                (${eventDate}) je otkazana.
              </p>
              <p style="margin:16px 0 0;color:#6b7280;font-size:15px;">
                Iznos od <strong>${amount}</strong> neće biti naplaćen
                — autorizacija je poništena ili će biti vraćen povrat.
              </p>
              <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
                Imaš pitanja? Piši nam na
                <a href="mailto:podrska@skupi.app" style="color:#6366f1;">podrska@skupi.app</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#d1d5db;">skupi. · Zagreb, Hrvatska · © 2025</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export function paymentCancelledEmail({
  guestName,
  eventName,
  eventDate,
  amount,
}: {
  guestName: string
  eventName: string
  eventDate: string
  amount: string
}): string {
  return `
<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plaćanje otkazano — skupi.</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">skupi.</div>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">❌</div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Plaćanje je otkazano</h1>
              <p style="margin:12px 0 0;color:#6b7280;font-size:15px;">
                Nažalost, plaćanje od <strong>${amount}</strong> za event <strong>"${eventName}"</strong>
                (${eventDate}) je otkazano jer se event nije popunio.
              </p>
              <p style="margin:12px 0 0;color:#6b7280;font-size:15px;">
                Tvoja kartica <strong>nije terećena</strong> — autorizacija je poništena.
              </p>
              <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
                Imaš pitanja? Piši nam na
                <a href="mailto:podrska@skupi.app" style="color:#6366f1;">podrska@skupi.app</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#d1d5db;">skupi. · Zagreb, Hrvatska · © 2025</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
