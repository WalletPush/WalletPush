import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // List templates visible to the user per RLS
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ templates: data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get first accessible business id for this user
  const { data: bizIds, error: bizErr } = await supabase.rpc('user_business_ids')
  if (bizErr || !bizIds || bizIds.length === 0) {
    return NextResponse.json({ error: 'No accessible business found for user' }, { status: 400 })
  }
  const businessId: string = bizIds[0]

  // Ensure a default program exists for this business
  const defaultProgramName = 'Default Program'
  let programId: string | undefined
  {
    const { data: programs, error: progErr } = await supabase
      .from('programs')
      .select('id')
      .eq('business_id', businessId)
      .eq('name', defaultProgramName)
      .limit(1)
    if (progErr) return NextResponse.json({ error: progErr.message }, { status: 400 })
    if (programs && programs.length > 0) {
      programId = programs[0].id
    } else {
      const { data: created, error: createErr } = await supabase
        .from('programs')
        .insert({ business_id: businessId, name: defaultProgramName })
        .select('id')
        .single()
      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 })
      programId = created.id
    }
  }

  // Create a new template version (simple v1 for now)
  const templateJson = body?.template ?? body
  const version = 1
  const { data: tpl, error: tplErr } = await supabase
    .from('templates')
    .insert({ program_id: programId, version, template_json: templateJson })
    .select('*')
    .single()

  if (tplErr) return NextResponse.json({ error: tplErr.message }, { status: 400 })
  return NextResponse.json({ template: tpl })
}


