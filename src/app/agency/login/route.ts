import { NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { createClient as admin } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'walletpush.io'
const srv = admin(URL, SRK, { auth: { persistSession: false } })

async function agencyIdByOwnerEmail(email: string) {
  const { data } = await srv.from('agency_accounts').select('id').eq('email', email).limit(1).maybeSingle()
  return (data as any)?.id as string | undefined
}

async function activeAgencyDomain(agency_account_id: string) {
  const { data } = await srv
    .from('agency_sales_pages')
    .select('custom_domain,is_active,is_published')
    .eq('agency_account_id', agency_account_id)
    .eq('is_active', true)
    .eq('is_published', true)
    .not('custom_domain','is', null)
    .limit(1).maybeSingle()
  return (data as any)?.custom_domain as string | undefined
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })

    const supabase = await createAuthClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })

    const h = headers()
    let agency_id = h.get('x-agency-id') || null
    if (!agency_id) agency_id = await agencyIdByOwnerEmail(email) || null

    const domain = agency_id ? await activeAgencyDomain(agency_id) : undefined
    const next = domain ? `https://${domain}/agency/dashboard` : `https://${ROOT}/agency/dashboard`
    return NextResponse.json({ ok: true, next })
  } catch (e: any) {
    console.error('agency login error', e)
    return NextResponse.json({ error: e.message ?? 'Unknown error' }, { status: 500 })
  }
}
