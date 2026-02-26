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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">QR Kod</h3>
      <div className="flex gap-6 items-start">
        {/* QR */}
        <div className="shrink-0 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 8 }} />
        </div>

        {/* Info + actions */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 leading-relaxed">
            Ispiši i zalijepi na ulaz, ili pošalji sudionicima — skeniranjem dolaze direktno na stranicu za plaćanje.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Download QR */}
            <button
              onClick={handleDownload}
              disabled={!dataUrl}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg border border-gray-200 transition disabled:opacity-40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Preuzmi QR (.png)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
