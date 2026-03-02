import { createClient } from '@/lib/supabase-server'
import { getStripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_id } = await request.json()
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', org_id)
    .single()

  if (!org?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
  }

  const stripe = getStripe()
  const origin = request.headers.get('origin') || 'https://henry-auditpad.vercel.app'
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${origin}/dashboard/settings`,
  })

  return NextResponse.json({ url: session.url })
}
