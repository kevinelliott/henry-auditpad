import { getStripe } from '@/lib/stripe'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: any
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { org_id, plan } = session.metadata || {}
    if (org_id && plan) {
      await supabase.from('organizations').update({
        plan,
        stripe_subscription_id: session.subscription,
      }).eq('id', org_id)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    await supabase.from('organizations')
      .update({ plan: 'free', stripe_subscription_id: null })
      .eq('stripe_subscription_id', subscription.id)
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object
    const priceId = subscription.items.data[0]?.price?.id
    const PLANS_MAP: Record<string, string> = {
      [process.env.STRIPE_STARTER_PRICE_ID || '']: 'starter',
      [process.env.STRIPE_PRO_PRICE_ID || '']: 'pro',
    }
    const newPlan = PLANS_MAP[priceId] || 'free'
    await supabase.from('organizations')
      .update({ plan: newPlan })
      .eq('stripe_subscription_id', subscription.id)
  }

  return NextResponse.json({ received: true })
}
