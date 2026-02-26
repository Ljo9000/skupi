import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: owner } = await supabase
      .from('owners')
      .select('id, stripe_account_id, stripe_onboarding_complete')
      .eq('user_id', user.id)
      .single()

    if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    if (owner.stripe_onboarding_complete) return NextResponse.json({ complete: true })
    if (!owner.stripe_account_id) return NextResponse.json({ complete: false })

    // Check directly with Stripe
    const stripe = getStripe()
    const account = await stripe.accounts.retrieve(owner.stripe_account_id)

    const complete = !!(account.charges_enabled && account.payouts_enabled && account.details_submitted)

    if (complete) {
      const admin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await admin
        .from('owners')
        .update({ stripe_onboarding_complete: true })
        .eq('id', owner.id)
    }

    return NextResponse.json({ complete })
  } catch (error) {
    console.error('[verify-onboarding]', error)
    return NextResponse.json({ error: 'Failed to verify' }, { status: 500 })
  }
}
