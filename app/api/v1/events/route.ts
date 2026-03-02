import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Service client — bypasses RLS for API key ingestion
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
  )
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 })
  }

  const apiKey = authHeader.replace('Bearer ', '').trim()
  if (!apiKey.startsWith('ap_')) {
    return NextResponse.json({ error: 'Invalid API key format' }, { status: 401 })
  }

  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
  const supabase = getServiceClient()

  // Validate API key
  const { data: keyRecord } = await supabase
    .from('api_keys')
    .select('id, org_id, is_active')
    .eq('key_hash', keyHash)
    .single()

  if (!keyRecord || !keyRecord.is_active) {
    return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { action, actor, actor_type, resource_type, resource_id, metadata, ip_address, occurred_at } = body

  if (!action || typeof action !== 'string') {
    return NextResponse.json({ error: '`action` is required and must be a string' }, { status: 400 })
  }
  if (!actor || typeof actor !== 'string') {
    return NextResponse.json({ error: '`actor` is required and must be a string' }, { status: 400 })
  }

  // Check monthly event limit
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('audit_events')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', keyRecord.org_id)
    .gte('occurred_at', startOfMonth.toISOString())

  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', keyRecord.org_id)
    .single()

  const limits: Record<string, number> = { free: 10000, starter: 100000, pro: 1000000 }
  const planLimit = limits[org?.plan || 'free'] || 10000

  if ((count || 0) >= planLimit) {
    return NextResponse.json(
      { error: `Monthly event limit (${planLimit.toLocaleString()}) reached. Upgrade your plan.` },
      { status: 429 }
    )
  }

  // Insert event
  const ipAddress = ip_address ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null

  const { data: event, error } = await supabase
    .from('audit_events')
    .insert({
      org_id: keyRecord.org_id,
      api_key_id: keyRecord.id,
      action: action.toLowerCase().trim(),
      actor: actor.trim(),
      actor_type: actor_type || 'user',
      resource_type: resource_type || null,
      resource_id: resource_id ? String(resource_id) : null,
      metadata: metadata || null,
      ip_address: ipAddress,
      occurred_at: occurred_at || new Date().toISOString(),
    })
    .select('id, action, occurred_at')
    .single()

  if (error) {
    console.error('Event insert error:', error)
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
  }

  // Update key usage stats
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString(), event_count: (keyRecord as any).event_count + 1 })
    .eq('id', keyRecord.id)

  return NextResponse.json({ id: event.id, action: event.action, occurred_at: event.occurred_at }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
  }

  const apiKey = authHeader.replace('Bearer ', '').trim()
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
  const supabase = getServiceClient()

  const { data: keyRecord } = await supabase
    .from('api_keys')
    .select('org_id, is_active')
    .eq('key_hash', keyHash)
    .single()

  if (!keyRecord?.is_active) {
    return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)
  const offset = parseInt(searchParams.get('offset') || '0')
  const action = searchParams.get('action')
  const actor = searchParams.get('actor')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('audit_events')
    .select('*', { count: 'exact' })
    .eq('org_id', keyRecord.org_id)
    .order('occurred_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (action) query = query.ilike('action', `%${action}%`)
  if (actor) query = query.ilike('actor', `%${actor}%`)
  if (from) query = query.gte('occurred_at', from)
  if (to) query = query.lte('occurred_at', to)

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 })

  return NextResponse.json({ events: data, total: count, limit, offset })
}
