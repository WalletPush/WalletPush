import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value }
      }
    }
  )
}

type DraftSpec = Record<string, any>

export async function POST(req: Request) {
  const supabase = getSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { templateId, programId, draftSpec }: { templateId: string; programId: string; draftSpec: DraftSpec } = body

  if (!templateId || !programId || !draftSpec) {
    return NextResponse.json({ error: 'Missing templateId, programId, or draftSpec' }, { status: 400 })
  }

  // 1) Load program & template; verify they belong together
  const { data: program, error: progErr } = await supabase
    .from('programs')
    .select('id, account_id')
    .eq('id', programId)
    .single()
  if (progErr || !program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

  const { data: template, error: tplErr } = await supabase
    .from('templates')
    .select('id, program_id, account_id')
    .eq('id', templateId)
    .single()
  if (tplErr || !template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  if (template.program_id !== program.id) {
    return NextResponse.json({ error: 'Template does not belong to program' }, { status: 400 })
  }

  const accountId = program.account_id ?? template.account_id
  if (!accountId) {
    return NextResponse.json({ error: 'Program has no owning account' }, { status: 409 })
  }

  // 2) RBAC: user must be owner/admin on account
  const { data: membership } = await supabase
    .from('account_members')
    .select('role')
    .eq('account_id', accountId)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  const role = membership?.role ?? 'viewer'
  if (!['owner','admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden (owner/admin only)' }, { status: 403 })
  }

  // 3) Next version number
  const { data: maxRow, error: maxErr } = await supabase
    .from('program_versions')
    .select('version')
    .eq('program_id', programId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (maxErr) return NextResponse.json({ error: 'Failed to compute next version' }, { status: 500 })

  const nextVersion = (maxRow?.version ?? 0) + 1

  // 4) Insert program_versions
  const { data: inserted, error: insErr } = await supabase
    .from('program_versions')
    .insert({
      program_id: programId,
      version: nextVersion,
      spec_json: draftSpec,
      created_by: auth.user.id,
    })
    .select('id, version')
    .single()

  if (insErr || !inserted) {
    return NextResponse.json({ error: 'Failed to publish program version' }, { status: 500 })
  }

  // 5) Update programs.current_version_id
  const { error: updErr } = await supabase
    .from('programs')
    .update({ current_version_id: inserted.id })
    .eq('id', programId)

  if (updErr) {
    return NextResponse.json({ error: 'Version created but failed to set current_version_id' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, version_id: inserted.id, version: inserted.version })
}


