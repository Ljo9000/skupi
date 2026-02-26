import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const alt = 'skupi. — termin za plaćanje'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Props {
  params: { slug: string }
}

export default async function Image({ params }: Props) {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('naziv, cijena_vlasnika, service_fee, datum, min_sudionika, max_sudionika')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single()

  if (!event) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <span style={{ color: '#ffffff', fontSize: 48, fontWeight: 700 }}>skupi.</span>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  const cijenaTotal = ((event.cijena_vlasnika + event.service_fee) / 100).toFixed(2)
  const datum = new Date(event.datum).toLocaleDateString('hr-HR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(167, 139, 250, 0.15)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.2)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 80px',
            height: '100%',
            position: 'relative',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                color: '#c4b5fd',
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '-0.5px',
              }}
            >
              skupi.
            </span>
          </div>

          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Event name */}
            <div
              style={{
                color: '#ffffff',
                fontSize: event.naziv.length > 30 ? 52 : 64,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-1px',
              }}
            >
              {event.naziv}
            </div>

            {/* Details row */}
            <div
              style={{
                display: 'flex',
                gap: 40,
                alignItems: 'center',
              }}
            >
              {/* Date */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span style={{ color: '#a78bfa', fontSize: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Datum
                </span>
                <span style={{ color: '#e9d5ff', fontSize: 24, fontWeight: 600 }}>
                  {datum}
                </span>
              </div>

              {/* Divider */}
              <div
                style={{
                  width: 1,
                  height: 60,
                  background: 'rgba(167, 139, 250, 0.4)',
                  display: 'flex',
                }}
              />

              {/* Price */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span style={{ color: '#a78bfa', fontSize: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Cijena
                </span>
                <span style={{ color: '#e9d5ff', fontSize: 24, fontWeight: 600 }}>
                  {cijenaTotal} € po osobi
                </span>
              </div>

              {/* Divider */}
              <div
                style={{
                  width: 1,
                  height: 60,
                  background: 'rgba(167, 139, 250, 0.4)',
                  display: 'flex',
                }}
              />

              {/* Participants */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span style={{ color: '#a78bfa', fontSize: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Sudionici
                </span>
                <span style={{ color: '#e9d5ff', fontSize: 24, fontWeight: 600 }}>
                  min. {event.min_sudionika}{event.max_sudionika ? ` — maks. ${event.max_sudionika}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* CTA bottom */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                background: 'rgba(167, 139, 250, 0.2)',
                border: '1px solid rgba(167, 139, 250, 0.4)',
                borderRadius: 12,
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ color: '#c4b5fd', fontSize: 18, fontWeight: 600 }}>
                Otvori i plati →
              </span>
            </div>

            <span style={{ color: 'rgba(167, 139, 250, 0.6)', fontSize: 16 }}>
              skupi.app
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
