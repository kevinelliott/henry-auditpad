'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDate, formatRelative, getActionColor } from '@/lib/utils'
import { Search, RefreshCw, Filter, ChevronDown, ChevronUp } from 'lucide-react'

interface AuditEvent {
  id: string
  action: string
  actor: string
  actor_type: string
  resource_type: string | null
  resource_id: string | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  occurred_at: string
  created_at: string
}

interface OrgData {
  id: string
  name: string
  plan: string
  event_count: number
}

export default function DashboardPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [org, setOrg] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const supabase = createClient()

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: member } = await supabase
      .from('org_members')
      .select('org_id, organizations(id, name, plan)')
      .eq('user_id', user.id)
      .single()

    if (!member) { setLoading(false); return }

    const orgId = member.org_id
    const orgInfo = member.organizations as any

    let query = supabase
      .from('audit_events')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('occurred_at', { ascending: false })
      .limit(50)

    if (search) query = query.ilike('actor', `%${search}%`)
    if (actionFilter) query = query.ilike('action', `%${actionFilter}%`)

    const { data, count } = await query

    // Get event count for this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const { count: monthCount } = await supabase
      .from('audit_events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('occurred_at', startOfMonth.toISOString())

    setOrg({ ...orgInfo, event_count: monthCount || 0 })
    setEvents(data || [])
    setTotalCount(count || 0)
    setLoading(false)
  }, [search, actionFilter])

  useEffect(() => { loadData() }, [loadData])

  const planLimit = org?.plan === 'pro' ? 1000000 : org?.plan === 'starter' ? 100000 : 10000

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Events</h1>
          <p className="text-slate-500 text-sm mt-1">
            {org ? `${org.name} — ${org.plan || 'free'} plan` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Events this month',
            value: org?.event_count?.toLocaleString() ?? '—',
            sub: `of ${planLimit.toLocaleString()} limit`,
          },
          {
            label: 'Total events',
            value: totalCount.toLocaleString(),
            sub: 'in your audit log',
          },
          {
            label: 'Plan',
            value: org?.plan ? org.plan.charAt(0).toUpperCase() + org.plan.slice(1) : 'Free',
            sub: 'current tier',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-2">{stat.label}</div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-slate-400 text-xs mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl mb-4">
        <div className="flex items-center gap-3 p-4">
          <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by actor (email, user ID, service name)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by action..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-40 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Events table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wide">
          <div className="col-span-3">Action</div>
          <div className="col-span-3">Actor</div>
          <div className="col-span-2">Resource</div>
          <div className="col-span-2">IP Address</div>
          <div className="col-span-2">Time</div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-500 text-sm font-medium">No events yet</p>
            <p className="text-slate-400 text-xs mt-1">Events will appear here once you send them via the API</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="border-b border-slate-100 last:border-0">
              <div
                className="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => setExpanded(expanded === event.id ? null : event.id)}
              >
                <div className="col-span-3 flex items-center">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getActionColor(event.action)}`}>
                    {event.action}
                  </span>
                </div>
                <div className="col-span-3 flex items-center gap-2 min-w-0">
                  <span className="text-sm text-slate-700 truncate">{event.actor}</span>
                  {event.actor_type && event.actor_type !== 'user' && (
                    <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                      {event.actor_type}
                    </span>
                  )}
                </div>
                <div className="col-span-2 flex items-center text-sm text-slate-500">
                  {event.resource_type ? (
                    <span className="truncate">{event.resource_type}{event.resource_id ? ` #${event.resource_id}` : ''}</span>
                  ) : <span className="text-slate-300">—</span>}
                </div>
                <div className="col-span-2 flex items-center text-sm text-slate-400 font-mono text-xs">
                  {event.ip_address || '—'}
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400" title={formatDate(event.occurred_at)}>
                    {formatRelative(event.occurred_at)}
                  </span>
                  {expanded === event.id
                    ? <ChevronUp className="w-4 h-4 text-slate-400" />
                    : <ChevronDown className="w-4 h-4 text-slate-400" />
                  }
                </div>
              </div>

              {expanded === event.id && (
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Event Details</div>
                      <dl className="space-y-1.5">
                        {[
                          ['Event ID', event.id],
                          ['Occurred At', formatDate(event.occurred_at)],
                          ['Actor', event.actor],
                          ['Actor Type', event.actor_type || 'user'],
                          ['Resource Type', event.resource_type || '—'],
                          ['Resource ID', event.resource_id || '—'],
                          ['IP Address', event.ip_address || '—'],
                        ].map(([k, v]) => (
                          <div key={k} className="flex gap-3 text-sm">
                            <dt className="text-slate-400 w-28 flex-shrink-0">{k}</dt>
                            <dd className="text-slate-700 font-mono text-xs break-all">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Metadata</div>
                        <pre className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-3 overflow-auto max-h-40">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {totalCount > 50 && (
        <p className="text-center text-slate-400 text-sm mt-4">
          Showing 50 of {totalCount.toLocaleString()} events. Use exports for full data.
        </p>
      )}
    </div>
  )
}
