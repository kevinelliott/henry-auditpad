'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDate, maskApiKey } from '@/lib/utils'
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Check } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  key_hash: string
  full_key?: string
  last_used_at: string | null
  event_count: number
  is_active: boolean
  created_at: string
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [revealed, setRevealed] = useState<string | null>(null)

  const supabase = createClient()

  async function loadKeys() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: member } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!member) { setLoading(false); return }
    setOrgId(member.org_id)

    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('org_id', member.org_id)
      .order('created_at', { ascending: false })

    setApiKeys(data || [])
    setLoading(false)
  }

  useEffect(() => { loadKeys() }, [])

  async function createKey() {
    if (!orgId || !newKeyName.trim()) return
    setCreating(true)

    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName, org_id: orgId }),
    })

    const data = await res.json()
    if (data.key) {
      setNewKey(data.key)
      setNewKeyName('')
      setShowNew(false)
      loadKeys()
    }
    setCreating(false)
  }

  async function revokeKey(id: string) {
    if (!confirm('Revoke this API key? Any services using it will stop working immediately.')) return
    await supabase.from('api_keys').update({ is_active: false }).eq('id', id)
    loadKeys()
  }

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
          <p className="text-slate-500 text-sm mt-1">Manage keys for sending events to your audit log</p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New API Key
        </button>
      </div>

      {/* Newly created key banner */}
      {newKey && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
          <p className="text-green-800 font-medium text-sm mb-3">
            API key created! Copy it now — you won&apos;t see it again.
          </p>
          <div className="flex items-center gap-3 bg-white border border-green-200 rounded-lg px-4 py-3">
            <code className="flex-1 font-mono text-sm text-slate-700 break-all">{newKey}</code>
            <button
              onClick={() => copyKey(newKey)}
              className="flex items-center gap-1.5 text-green-700 hover:text-green-900 text-sm font-medium flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="text-green-600 text-xs mt-3 hover:underline">
            I&apos;ve saved it — dismiss
          </button>
        </div>
      )}

      {/* New key form */}
      {showNew && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <h3 className="font-medium text-slate-900 mb-4">Create new API key</h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Key name (e.g., production-backend, staging)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createKey()}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
            <button
              onClick={createKey}
              disabled={creating || !newKeyName.trim()}
              className="bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="text-slate-400 hover:text-slate-600 text-sm px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Keys list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wide">
          <div className="col-span-3">Name</div>
          <div className="col-span-4">Key</div>
          <div className="col-span-2">Events Logged</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-1"></div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading...</div>
        ) : apiKeys.length === 0 ? (
          <div className="py-16 text-center">
            <Key className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">No API keys yet</p>
            <p className="text-slate-400 text-xs mt-1">Create your first API key to start logging events</p>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div key={key.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-slate-100 last:border-0 items-center">
              <div className="col-span-3">
                <div className="font-medium text-slate-900 text-sm">{key.name}</div>
                <div className={`text-xs mt-0.5 ${key.is_active ? 'text-green-600' : 'text-red-500'}`}>
                  {key.is_active ? 'Active' : 'Revoked'}
                </div>
              </div>
              <div className="col-span-4 flex items-center gap-2">
                <code className="font-mono text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                  {revealed === key.id ? key.key_prefix + '••••••••••••••••' : maskApiKey(key.key_prefix + '••••••••••••••••')}
                </code>
                <button
                  onClick={() => setRevealed(revealed === key.id ? null : key.id)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {revealed === key.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="col-span-2 text-sm text-slate-600">{key.event_count?.toLocaleString() ?? 0}</div>
              <div className="col-span-2 text-sm text-slate-400">{formatDate(key.created_at).split(' ')[0]}</div>
              <div className="col-span-1 flex justify-end">
                {key.is_active && (
                  <button
                    onClick={() => revokeKey(key.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title="Revoke key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Usage example */}
      <div className="mt-8 bg-slate-900 rounded-xl p-6 text-white">
        <h3 className="font-medium text-sm mb-4 text-slate-300">Quick start</h3>
        <pre className="text-sm text-slate-300 overflow-x-auto"><code>{`curl -X POST https://henry-auditpad.vercel.app/api/v1/events \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "user.login",
    "actor": "user@example.com",
    "actor_type": "user",
    "resource_type": "session",
    "ip_address": "192.168.1.100",
    "metadata": { "browser": "Chrome", "os": "macOS" }
  }'`}</code></pre>
      </div>
    </div>
  )
}
