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

export async function GET(_: Request, { params }: { params: { programId: string } }) {
  const supabase = getSupabase()
  const programId = params.programId

  // Prefer programs.current_version_id if set
  const { data: program } = await supabase
    .from('programs')
    .select('id, current_version_id')
    .eq('id', programId)
    .single()

  if (program?.current_version_id) {
    const { data: current } = await supabase
      .from('program_versions')
      .select('id, version, spec_json')
      .eq('id', program.current_version_id)
      .single()
    if (current) return NextResponse.json({ data: current })
  }

  // Fallback: highest version
  const { data: latest, error } = await supabase
    .from('program_versions')
    .select('id, version, spec_json')
    .eq('program_id', programId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !latest) return NextResponse.json({ data: null })
  return NextResponse.json({ data: latest })
}


