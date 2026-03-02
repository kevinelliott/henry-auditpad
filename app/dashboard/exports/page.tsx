'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Download, FileText, Calendar } from 'lucide-react'

export default function ExportsPage() {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [exporting, setExporting] = useState(false)
  const [plan, setPlan] = useState('free')

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: member } = await supabase
        .from('org_members')
        .select('org_id, organizations(plan)')
        .eq('user_id', user.id)
        .single()
      if (member) {
        setOrgId(member.org_id)
        setPlan((member.organizations as any)?.plan || 'free')
      }
    }
    load()
  }, [])

  async function handleExport() {
    if (!orgId) return
    setExporting(true)

    const supabaseClient = createClient()
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) return

    let query = supabaseClient
      .from('audit_events')
      .select('id,action,actor,actor_type,resource_type,resource_id,ip_address,metadata,occurred_at')
      .eq('org_id', orgId)
      .order('occurred_at', { ascending: false })
      .limit(50000)

    if (dateFrom) query = query.gte('occurred_at', new Date(dateFrom).toISOString())
    if (dateTo) query = query.lte('occurred_at', new Date(dateTo + 'T23:59:59').toISOString())
    if (actionFilter) query = query.ilike('action', `%${actionFilter}%`)

    const { data } = await query

    if (!data || data.length === 0) {
      alert('No events match your filters.')
      setExporting(false)
      return
    }

    let content: string
    let filename: string
    let mimeType: string

    if (format === 'json') {
      content = JSON.stringify(data, null, 2)
      filename = `audit-export-${Date.now()}.json`
      mimeType = 'application/json'
    } else {
      const headers = ['id', 'action', 'actor', 'actor_type', 'resource_type', 'resource_id', 'ip_address', 'metadata', 'occurred_at']
      const rows = data.map((e: any) => headers.map(h => {
        const val = e[h]
        if (val === null || val === undefined) return ''
        if (typeof val === 'object') return JSON.stringify(val)
        return String(val).includes(',') ? `"${val}"` : val
      }).join(','))
      content = [headers.join(','), ...rows].join('\n')
      filename = `audit-export-${Date.now()}.csv`
      mimeType = 'text/csv'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Export Events</h1>
        <p className="text-slate-500 text-sm mt-1">Download your audit log for compliance reviews, legal requests, or analysis</p>
      </div>

      {plan === 'free' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 text-sm font-medium">Free plan exports are limited to the last 30 days</p>
            <p className="text-amber-600 text-xs mt-0.5">Upgrade to Starter or Pro for longer retention exports</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-lg">
        <h2 className="font-semibold text-slate-900 mb-5">Configure export</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">From date</label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 text-sm outline-none text-slate-700"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">To date</label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 text-sm outline-none text-slate-700"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Filter by action (optional)</label>
            <input
              type="text"
              placeholder="e.g., user.login, billing.*"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Format</label>
            <div className="flex gap-3">
              {(['csv', 'json'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${format === f ? 'bg-sky-50 border-sky-400 text-sky-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || !orgId}
            className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 mt-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Preparing export...' : `Export as ${format.toUpperCase()}`}
          </button>
        </div>
      </div>

      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="font-medium text-slate-900 text-sm mb-2">Export notes</h3>
        <ul className="text-slate-500 text-sm space-y-1.5">
          <li>• Exports are generated client-side from your filtered events</li>
          <li>• Up to 50,000 events per export (contact us for bulk exports)</li>
          <li>• Files include all event metadata in the selected format</li>
          <li>• For chain of custody documentation, use JSON with event IDs</li>
        </ul>
      </div>
    </div>
  )
}
