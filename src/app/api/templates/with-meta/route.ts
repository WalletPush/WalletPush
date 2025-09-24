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

export async function GET() {
  const supabase = getSupabase()

  const { data: templates, error: tplErr } = await supabase
    .from('templates')
    .select('id, program_id, template_json, previews, passkit_json, pass_type_identifier, capabilities, created_at, programs(name)')

  if (tplErr) return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 })

  const programIds = Array.from(new Set((templates || []).map((t: any) => t.program_id)))
  let versionsByProgram: Record<string, { has_versions: boolean; latest_version: number | null }> = {}

  if (programIds.length) {
    const { data: versions } = await supabase
      .from('program_versions')
      .select('program_id, version')

    for (const pid of programIds) {
      const rows = (versions || []).filter((v: any) => v.program_id === pid)
      const maxV = rows.length ? Math.max(...rows.map((r: any) => r.version)) : null
      versionsByProgram[pid] = { has_versions: !!rows.length, latest_version: maxV }
    }
  }

  const withMeta = (templates || []).map((t: any) => ({
    ...t,
    meta: versionsByProgram[t.program_id] ?? { has_versions: false, latest_version: null }
  }))

  return NextResponse.json({ data: withMeta })
}


