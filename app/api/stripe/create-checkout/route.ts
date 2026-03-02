import { createClient } from '@/lib/supabase-server'
import { getStripe, PLANS } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan, org_id } = await request.json()
  const planConfig = PLANS[plan as keyof typeof PLANS]
  if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const stripe = getStripe()
  const origin = request.headers.get('origin') || 'https://henry-auditpad.vercel.app'

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id, name')
    .eq('id', org_id)
    .single()

  let customerId = org?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: org?.name || user.email,
      metadata: { org_id, user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('organizations').update({ stripe_customer_id: customerId }).eq('id', org_id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${origin}/dashboard/settings?success=1`,
    cancel_url: `${origin}/dashboard/settings`,
    metadata: { org_id, plan },
  })

  return NextResponse.json({ url: session.url })
}
