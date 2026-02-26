import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PaymentClient from './PaymentClient'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('naziv, cijena_vlasnika, service_fee, datum, min_sudionika, max_sudionika')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single()

  if (!event) {
    return { title: 'skupi. — Termin nije pronađen' }
  }

  const cijenaTotalna = ((event.cijena_vlasnika + event.service_fee) / 100).toFixed(2)
  const datum = new Date(event.datum).toLocaleDateString('hr-HR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const description = `${datum} · ${cijenaTotalna} € po osobi · min. ${event.min_sudionika} sudionika`

  return {
    title: `${event.naziv} — skupi.`,
    description,
    openGraph: {
      title: event.naziv,
      description,
      type: 'website',
      images: [],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.naziv,
      description,
    },
  }
}

export default async function PaymentPage({ params }: Props) {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select(`
      id, slug, naziv, opis, datum, rok_uplate,
      cijena_vlasnika, service_fee,
      min_sudionika, max_sudionika, status,
      owners ( ime )
    `)
    .eq('slug', params.slug)
    .single()

  if (!event) notFound()

  // Get paid count
  const { count: paidCount } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .eq('status', 'paid')

  // Get paid participants (names only for privacy)
  const { data: participants } = await supabase
    .from('payments')
    .select('id, ime, created_at')
    .eq('event_id', event.id)
    .eq('status', 'paid')
    .order('created_at', { ascending: true })

  const ownerName = Array.isArray(event.owners)
    ? (event.owners[0] as { ime: string })?.ime
    : (event.owners as { ime: string } | null)?.ime ?? 'Vlasnik'

  return (
    <PaymentClient
      event={{
        id: event.id,
        slug: event.slug,
        naziv: event.naziv,
        opis: event.opis,
        datum: event.datum,
        rok_uplate: event.rok_uplate,
        cijena_vlasnika: event.cijena_vlasnika,
        service_fee: event.service_fee,
        min_sudionika: event.min_sudionika,
        max_sudionika: event.max_sudionika,
        status: event.status,
      }}
      ownerName={ownerName}
      initialPaidCount={paidCount ?? 0}
      initialParticipants={participants ?? []}
    />
  )
}
