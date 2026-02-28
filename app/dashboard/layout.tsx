import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const authedUser = user!

  const { data: owner } = await supabase
    .from('owners')
    .select('ime, stripe_onboarding_complete')
    .eq('user_id', authedUser.id)
    .single()

  return (
    <div className="min-h-screen" style={{ background: '#0D0F1A' }}>
      <DashboardNav
        ownerName={owner?.ime ?? authedUser.email ?? 'Vlasnik'}
        stripeActive={owner?.stripe_onboarding_complete ?? false}
      />
      <main>{children}</main>
    </div>
  )
}
