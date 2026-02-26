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
    .select('ime')
    .eq('user_id', authedUser.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav ownerName={owner?.ime ?? authedUser.email ?? 'Vlasnik'} />
      <main>{children}</main>
    </div>
  )
}
