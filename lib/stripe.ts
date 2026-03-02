import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder', {
      apiVersion: '2026-02-25.clover' as any,
    })
  }
  return stripeInstance
}

export const PLANS = {
  starter: {
    name: 'Starter',
    price: 49,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_placeholder_starter',
    events: '100K events/mo',
    retention: '90 days',
  },
  pro: {
    name: 'Pro',
    price: 149,
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_placeholder_pro',
    events: '1M events/mo',
    retention: '1 year',
  },
}
