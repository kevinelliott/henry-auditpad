'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Building2, CreditCard, Check } from 'lucide-react'
import { PLANS } from '@/lib/stripe'

interface Org {
  id: string
  name: string
  plan: string
  stripe_subscription_id: string | null
}

export default function SettingsPage() {
  const [org, setOrg] = useState<Org | null>(null)
  const [user, setUser] = useState<any>(null)
  const [orgName, setOrgName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) return

      const { data: member } = await supabase
        .from('org_members')
        .select('org_id, organizations(*)')
        .eq('user_id', user.id)
        .single()

      if (member) {
        const o = member.organizations as any
        setOrg(o)
        setOrgName(o.name)
      }
    }
    load()
  }, [])

  async function saveOrgName() {
    if (!org) return
    setSaving(true)
    await supabase.from('organizations').update({ name: orgName }).eq('id', org.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleUpgrade(plan: 'starter' | 'pro') {
    setUpgrading(plan)
    const res = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, org_id: org?.id }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setUpgrading(null)
  }

  async function handleManageBilling() {
    const res = await fetch('/api/stripe/billing-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: org?.id }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your organization and billing</p>
      </div>

      {/* Organization */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Organization</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Organization name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Account email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400 bg-slate-50"
            />
          </div>

          <button
            onClick={saveOrgName}
            disabled={saving || orgName === org?.name}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Billing */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Plan &amp; Billing</h2>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${org?.plan === 'pro' ? 'bg-purple-100 text-purple-700' : org?.plan === 'starter' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
            {org?.plan ? org.plan.charAt(0).toUpperCase() + org.plan.slice(1) : 'Free'}
          </span>
        </div>

        {org?.stripe_subscription_id ? (
          <button
            onClick={handleManageBilling}
            className="text-sm text-sky-600 hover:text-sky-700 font-medium"
          >
            Manage billing &amp; invoices →
          </button>
        ) : (
          <div>
            <p className="text-slate-600 text-sm mb-5">Upgrade to increase your event limits and retention.</p>
            <div className="grid grid-cols-2 gap-4">
              {(Object.entries(PLANS) as [string, typeof PLANS.starter][]).map(([key, plan]) => (
                <div key={key} className="border border-slate-200 rounded-xl p-4">
                  <div className="font-semibold text-slate-900 mb-1">{plan.name}</div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">${plan.price}<span className="text-sm font-normal text-slate-400">/mo</span></div>
                  <div className="text-slate-500 text-xs mb-4">{plan.events} · {plan.retention}</div>
                  <button
                    onClick={() => handleUpgrade(key as 'starter' | 'pro')}
                    disabled={org?.plan === key || !!upgrading}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {org?.plan === key ? 'Current plan' : upgrading === key ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
