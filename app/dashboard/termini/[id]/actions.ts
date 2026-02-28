'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function closeEventAction(formData: FormData) {
  const eventId = formData.get('event_id') as string
  const supabase = await createClient()
  await supabase.from('events').update({ status: 'cancelled' }).eq('id', eventId)
  redirect(`/dashboard/termini/${eventId}`)
}
