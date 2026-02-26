import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get owner record
    const { data: owner, error: ownerError } = await supabase
      .from('owners')
      .select('id, stripe_account_id, stripe_onboarding_complete')
      .eq('user_id', user.id)
      .single()

    if (ownerError || !owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    }

    // Already fully onboarded
    if (owner.stripe_onboarding_complete) {
      return NextResponse.json({ alreadyOnboarded: true })
    }

    let stripeAccountId = owner.stripe_account_id

    // Create Stripe Connect Express account if not yet created
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          owner_id: owner.id,
          user_id: user.id,
        },
      })

      stripeAccountId = account.id

      // Save account ID to DB
      const { error: updateError } = await supabase
        .from('owners')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', owner.id)

      if (updateError) {
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
      }
    }

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stripe-onboarding?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stripe-onboarding?success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('[stripe/connect] error:', error)
    return NextResponse.json(
      { error: 'Stripe Connect error' },
      { status: 500 }
    )
  }
}
