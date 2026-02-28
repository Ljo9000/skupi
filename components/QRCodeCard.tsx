'use client'

import { useEffect, useRef, useState } from 'react'

interface QRCodeCardProps {
  url: string
  eventName: string
}

export default function QRCodeCard({ url, eventName }: QRCodeCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataUrl, setDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Dynamic import — only on client
    import('qrcode').then((QRCode) => {
      if (!canvasRef.current) return
      QRCode.toCanvas(canvasRef.current, url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#111827',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      }, (err) => {
        if (err) return
        setDataUrl(canvasRef.current!.toDataURL('image/png'))
      })
    })
  }, [url])

  function handleCopyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `skupi-qr-${eventName.toLowerCase().replace(/\s+/g, '-')}.png`
    a.click()
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: '#13162A', border: '1px solid #1C2040' }}
    >
      <h3 className="text-[11px] font-semibold text-[#6B7299] uppercase tracking-[0.08em]">QR Kod</h3>

      {/* QR canvas — white background so it scans correctly */}
      <div className="flex justify-center">
        <div className="bg-white p-3 rounded-xl">
          <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 6 }} />
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-[#6B7299] leading-relaxed text-center">
        Ispiši i zalijepi na ulaz, ili pošalji sudionicima — skeniranjem dolaze direktno na stranicu za plaćanje.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-[10px] transition"
          style={{ backgroundColor: '#6C47FF', color: 'white' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#8B6FFF' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6C47FF' }}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Kopirano!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Kopiraj link
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          disabled={!dataUrl}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-[10px] border transition disabled:opacity-40"
          style={{ color: '#A0A8C8', borderColor: '#2A2F55', backgroundColor: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#363B6B' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A2F55' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Preuzmi QR (.png)
        </button>
      </div>
    </div>
  )
}
