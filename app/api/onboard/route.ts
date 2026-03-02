import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 50)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_name } = await request.json()
  if (!org_name?.trim()) return NextResponse.json({ error: 'org_name required' }, { status: 400 })

  // Check if already has org
  const { data: existing } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (existing) return NextResponse.json({ org_id: existing.org_id })

  const baseSlug = slugify(org_name)
  let slug = baseSlug
  let attempt = 0

  // Ensure unique slug
  while (attempt < 5) {
    const { data: exists } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()
    if (!exists) break
    attempt++
    slug = `${baseSlug}-${Math.floor(Math.random() * 9000 + 1000)}`
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: org_name.trim(), slug, owner_id: user.id, plan: 'free' })
    .select('id')
    .single()

  if (orgError) return NextResponse.json({ error: 'Failed to create org' }, { status: 500 })

  await supabase.from('org_members').insert({
    org_id: org.id,
    user_id: user.id,
    role: 'owner',
  })

  return NextResponse.json({ org_id: org.id })
}
