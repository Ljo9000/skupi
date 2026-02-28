import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'skupi. — Grupne uplate bez kaosa',
  description: 'Jedan link. Svi plate. Rezervacija potvrđena.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hr" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
