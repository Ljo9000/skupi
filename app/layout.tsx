import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'skupi. — Group Payment Links',
  description: 'Jedan link. Svi plate. Rezervacija potvrđena.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hr">
      <body>{children}</body>
    </html>
  )
}
