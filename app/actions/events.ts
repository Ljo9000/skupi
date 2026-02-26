'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateServiceFee } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6)

export type CreateEventState = {
  error?: string
  fieldErrors?: Record<string, string>
}

export async function createEventAction(
  _prevState: CreateEventState,
  formData: FormData
): Promise<CreateEventState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niste prijavljeni' }

  const { data: owner } = await supabase
    .from('owners')
    .select('id, stripe_onboarding_complete')
    .eq('user_id', user.id)
    .single()

  if (!owner) return { error: 'Vlasnik nije pronađen' }

  if (!owner.stripe_onboarding_complete) {
    return { error: 'Morate prvo postaviti Stripe račun prije kreiranja termina.' }
  }

  // Parse form fields
  const naziv = (formData.get('naziv') as string)?.trim()
  const opis = (formData.get('opis') as string)?.trim() || null
  const datum = formData.get('datum') as string
  const vrijemeStr = formData.get('vrijemeUnosa') as string
  const cijenaStr = formData.get('cijena') as string
  const minStr = formData.get('min_sudionika') as string
  const maxStr = formData.get('max_sudionika') as string
  const rokStr = formData.get('rok_uplate') as string

  // Validate
  const fieldErrors: Record<string, string> = {}
  if (!naziv || naziv.length < 3) fieldErrors.naziv = 'Naziv mora imati min. 3 znaka'
  if (!datum) fieldErrors.datum = 'Datum je obavezan'

  const cijena = parseFloat(cijenaStr)
  if (isNaN(cijena) || cijena < 1) fieldErrors.cijena = 'Cijena mora biti min. 1 €'

  const min = parseInt(minStr)
  const max = parseInt(maxStr)
  if (isNaN(min) || min < 2) fieldErrors.min_sudionika = 'Minimum mora biti min. 2'
  if (isNaN(max) || max < min) fieldErrors.max_sudionika = 'Maksimum mora biti ≥ minimum'

  if (!rokStr) fieldErrors.rok_uplate = 'Rok uplate je obavezan'

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  // Combine date + time
  const datumVrijeme = vrijemeStr ? `${datum}T${vrijemeStr}:00` : `${datum}T20:00:00`
  const datumDate = new Date(datumVrijeme)
  const rokDate = new Date(rokStr)

  if (rokDate >= datumDate) {
    return { fieldErrors: { rok_uplate: 'Rok uplate mora biti prije datuma termina' } }
  }

  // Calculate fees (store in cents)
  const fees = calculateServiceFee(cijena)
  const cijenaVlasnikaCents = Math.round(fees.vlasnik * 100)
  const serviceFeeCents = Math.round((fees.skupiKomisija + fees.stripeFee) * 100)

  // Generate unique slug
  let slug = nanoid()
  // Ensure uniqueness (retry once)
  const { data: existing } = await supabase
    .from('events')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) slug = nanoid()

  const { data: event, error: insertError } = await supabase
    .from('events')
    .insert({
      owner_id: owner.id,
      slug,
      naziv,
      opis,
      datum: datumDate.toISOString(),
      cijena_vlasnika: cijenaVlasnikaCents,
      service_fee: serviceFeeCents,
      min_sudionika: min,
      max_sudionika: max,
      rok_uplate: rokDate.toISOString(),
      status: 'active',
    })
    .select('id, slug')
    .single()

  if (insertError || !event) {
    console.error('[createEvent]', insertError)
    return { error: 'Greška pri kreiranju termina. Pokušajte ponovo.' }
  }

  redirect(`/dashboard/termini/${event.id}?created=true`)
}
