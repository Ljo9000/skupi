'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DashboardNavProps {
  ownerName: string
}

export default function DashboardNav({ ownerName }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = [
    { href: '/dashboard', label: 'Pregled', icon: '📊' },
    { href: '/dashboard/termini', label: 'Termini', icon: '📅' },
    { href: '/dashboard/novi', label: '+ Novi termin', icon: null },
  ]

  return (
    <nav
      className="flex items-center justify-between px-6 py-3.5 sticky top-0 z-50"
      style={{ background: '#1a2b4a' }}
    >
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-xl font-black text-white">
          skupi<span className="text-blue-400">.</span>
        </Link>
        <div className="flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                pathname === item.href
                  ? 'bg-white/15 text-white'
                  : item.label.startsWith('+')
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.icon && item.icon + ' '}{item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-white/60">
          👤 <span className="text-white font-medium">{ownerName}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-white/40 hover:text-white/70 transition px-2 py-1"
        >
          Odjava
        </button>
      </div>
    </nav>
  )
}
