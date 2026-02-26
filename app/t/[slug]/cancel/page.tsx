import { notFound } from 'next/navigation'
import CancelClient from './CancelClient'

interface Props {
  params: { slug: string }
  searchParams: { token?: string }
}

export default async function CancelPage({ params, searchParams }: Props) {
  const token = searchParams.token

  if (!token) notFound()

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const adminSupabase = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: payment } = await adminSupabase
    .from('payments')
    .select(`
      id, ime, email, iznos_total, status, cancel_token,
      events ( id, naziv, datum, slug )
    `)
    .eq('cancel_token', token)
    .single()

  if (!payment) notFound()

  // Verify slug matches
  const event = payment.events as { id: string; naziv: string; datum: string; slug: string }
  if (event.slug !== params.slug) notFound()

  const cancellableStatuses = ['pending', 'paid', 'confirmed', 'capturing']
  const canCancel = cancellableStatuses.includes(payment.status)

  const eventDate = new Date(event.datum).toLocaleDateString('hr-HR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const amount = (payment.iznos_total / 100).toLocaleString('hr-HR', {
    style: 'currency',
    currency: 'EUR',
  })

  return (
    <CancelClient
      token={token}
      slug={event.slug}
      guestName={payment.ime}
      eventName={event.naziv}
      eventDate={eventDate}
      amount={amount}
      canCancel={canCancel}
      alreadyCancelled={payment.status === 'cancelled'}
    />
  )
}
