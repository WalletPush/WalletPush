import { NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { createClient as srvClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'walletpush.io'
const srv = srvClient(URL, SRK, { auth: { persistSession: false } })

async function activeAgencyDomain(agency_account_id: string) {
  const { data } = await srv
    .from('agency_sales_pages')
    .select('custom_domain,is_active,is_published')
    .eq('agency_account_id', agency_account_id)
    .eq('is_active', true)
    .eq('is_published', true)
    .not('custom_domain', 'is', null)
    .limit(1).maybeSingle()
  return (data as any)?.custom_domain as string | undefined
}

export async function POST(req: Request) {
  try {
    const { email, password, company_name, name, website } = await req.json()

    if (!email || !password || !company_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1) Auth user (owner)
    const supabaseAuth = await createAuthClient()
    const { data: authRes, error: authErr } = await supabaseAuth.auth.signUp({
      email, password, options: { data: { role: 'agency_owner' } }
    })
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })
    const owner_id = authRes.user?.id
    if (!owner_id) return NextResponse.json({ error: 'Auth user creation failed' }, { status: 500 })

    // 2) Agency row
    const { data: agency, error: aErr } = await srv
      .from('agency_accounts')
      .insert({
        user_id: owner_id,
        name: name || company_name,
        company_name,
        email,
        website: website || null,
      })
      .select('id')
      .single()
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 400 })

    // 3) Compute next (login on correct host)
    const domain = await activeAgencyDomain((agency as any).id)
    const next = domain
      ? `https://${domain}/agency/auth/login`
      : `https://${ROOT}/agency/auth/login`

    const res = NextResponse.json({ ok: true, agency_account_id: (agency as any).id, next }, { status: 201 })
    res.cookies.set('wp_agency_id', (agency as any).id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 })
    return res
  } catch (e: any) {
    console.error('agency sign-up error', e)
    return NextResponse.json({ error: e.message ?? 'Unknown error' }, { status: 500 })
  }
}
