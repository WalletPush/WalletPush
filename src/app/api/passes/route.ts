import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('passes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ passes: data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Body should contain program_id and member_id
  const { member_id, program_id, platform = 'apple', serial, object_id, auth_token } = body
  if (!member_id || !program_id) return NextResponse.json({ error: 'member_id and program_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('passes')
    .insert({ member_id, program_id, platform, serial, object_id, auth_token })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ pass: data })
}


