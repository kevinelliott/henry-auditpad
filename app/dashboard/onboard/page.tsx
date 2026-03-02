'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Building2 } from 'lucide-react'

export default function OnboardPage() {
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleCreate() {
    if (!orgName.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_name: orgName }),
    })

    const data = await res.json()
    if (data.org_id) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError(data.error || 'Failed to create organization')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-sky-400" />
            <span className="text-2xl font-bold text-white">AuditPad</span>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Set up your organization</h1>
          <p className="text-slate-400 text-sm">This is where your audit logs will be stored</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
          <div className="mb-5">
            <label className="text-sm font-medium text-slate-300 block mb-2">
              <Building2 className="w-4 h-4 inline mr-1.5 text-slate-400" />
              Organization name
            </label>
            <input
              type="text"
              placeholder="Acme Corp"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-400 placeholder:text-slate-500"
              autoFocus
            />
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={loading || !orgName.trim()}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create organization →'}
          </button>
        </div>
      </div>
    </div>
  )
}
