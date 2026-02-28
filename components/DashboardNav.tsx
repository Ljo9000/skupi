'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Calendar, Plus, ChevronDown } from 'lucide-react'

interface DashboardNavProps {
  ownerName: string
  stripeActive?: boolean
}

export default function DashboardNav({ ownerName, stripeActive = true }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/dashboard',         label: 'Pregled',  icon: <LayoutDashboard size={15} /> },
    { href: '/dashboard/termini', label: 'Kalendar', icon: <Calendar size={15} /> },
  ]

  return (
    <nav
      className="sticky top-0 z-50 h-[56px] flex items-center border-b"
      style={{ background: 'rgba(13,15,26,0.95)', backdropFilter: 'blur(12px)', borderColor: '#1C2040' }}
    >
      <div className="max-w-6xl mx-auto w-full px-6 flex items-center justify-between gap-4">

        {/* Left: logo + nav */}
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="text-lg font-black text-white tracking-tight shrink-0">skupi.</Link>
          <div className="flex items-center gap-0.5">
            {navLinks.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    active ? 'text-white bg-white/10' : 'text-[#A0A8C8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Center: new termin */}
        <Link
          href="/dashboard/novi"
          className="flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition"
          style={{ background: '#6C47FF' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#8B6FFF' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#6C47FF' }}
        >
          <Plus size={13} /><span className="hidden sm:inline">Novi termin</span>
        </Link>

        {/* Right: status + user + logout */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className="w-2 h-2 rounded-full animate-pulse shrink-0"
            title={stripeActive ? 'Stripe aktivan' : 'Stripe neaktivan'}
            style={{ background: stripeActive ? '#22C55E' : '#F59E0B', boxShadow: stripeActive ? '0 0 6px rgba(34,197,94,0.5)' : '0 0 6px rgba(245,158,11,0.5)' }}
          />
          <span className="text-sm text-white font-medium hidden sm:inline">{ownerName}</span>
          <ChevronDown size={12} className="text-[#6B7299] hidden sm:block" />
          <div className="w-px h-4 bg-[#1C2040] hidden sm:block" />
          <button
            onClick={handleSignOut}
            className="text-xs text-[#6B7299] hover:text-[#EF4444] transition"
          >
            Odjava
          </button>
        </div>

      </div>
    </nav>
  )
}
