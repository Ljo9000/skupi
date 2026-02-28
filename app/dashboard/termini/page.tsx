import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TerminiPageClient, { type TerminiEvent } from '@/components/TerminiPageClient'

export default async function TerminiPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: owner } = await supabase
    .from('owners')
    .select('id, ime')
    .eq('user_id', user.id)
    .single()

  if (!owner) redirect('/dashboard')

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('owner_id', owner.id)
    .order('datum', { ascending: false })

  return <TerminiPageClient events={(events ?? []) as TerminiEvent[]} />
}
