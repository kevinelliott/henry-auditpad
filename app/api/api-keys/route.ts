import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function generateApiKey(): string {
  const bytes = crypto.randomBytes(30)
  return 'ap_' + bytes.toString('base64url').slice(0, 40)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, org_id } = await request.json()
  if (!name || !org_id) return NextResponse.json({ error: 'name and org_id required' }, { status: 400 })

  // Verify user belongs to org
  const { data: member } = await supabase
    .from('org_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('org_id', org_id)
    .single()

  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const fullKey = generateApiKey()
  const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex')
  const keyPrefix = fullKey.slice(0, 12)

  const { data: keyRecord, error } = await supabase
    .from('api_keys')
    .insert({
      org_id,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      event_count: 0,
      is_active: true,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create key' }, { status: 500 })

  return NextResponse.json({ id: keyRecord.id, key: fullKey })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 })
  return NextResponse.json({ success: true })
}
