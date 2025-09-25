import { NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { createClient as createSrv } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const WALLET_PUSH_AGENCY_ACCOUNT_ID = process.env.WALLET_PUSH_AGENCY_ACCOUNT_ID || process.env.WP_AGENCY_ACCOUNT_ID!
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'walletpush.io'

const srv = createSrv(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

function baseUrl(req: Request) {
  const u = new URL(req.url)
  const isProd = process.env.NODE_ENV === 'production'
  const proto = isProd ? 'https' : (u.protocol.replace(':','') || 'http')
  return `${proto}://${u.host}`
}

function validateSlug(slug: string) {
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])$/.test(slug)) {
    throw new Error('Invalid slug. Use lowercase letters, numbers, hyphens; 1–63 chars; no leading/trailing hyphen.')
  }
  const reserved = new Set(['www','api','admin','app','dashboard','agency','business','customer'])
  if (reserved.has(slug)) throw new Error(`Slug "${slug}" is reserved`)
}

async function slugTaken(slug: string) {
  const { data, error } = await srv.from('businesses').select('id').eq('slug', slug).limit(1)
  if (error) throw error
  return !!data?.length
}

async function createBusinessAccount(name: string) {
  const { data, error } = await srv
    .from('accounts')
    .insert({ type: 'business', name, status: 'active' })
    .select('id')
    .single()
  if (error) throw error
  return data!.id as string
}

async function createBusinessRow(args: { agency_account_id?: string; name: string; slug: string; contact_email: string }) {
  const { data, error } = await srv
    .from('businesses')
    .insert({
      agency_id: args.agency_account_id ?? null,
      name: args.name,
      slug: args.slug,
      contact_email: args.contact_email,
      status: 'active',
    })
    .select('id, slug')
    .single()
  if (error) throw error
  return data as { id: string; slug: string }
}

async function attachUserToAccount(user_id: string, account_id: string) {
  await srv.from('account_members').insert({ account_id, user_id }).throwOnError()
  await srv.from('user_active_account').upsert({ user_id, active_account_id: account_id }).throwOnError()
}

async function activeCustomDomain(business_id: string) {
  const { data, error } = await srv
    .from('custom_domains')
    .select('domain,status')
    .eq('business_id', business_id)
    .eq('status', 'active')
    .limit(1)
  if (error) throw error
  return data?.[0]?.domain as string | undefined
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, business_name, slug, agency_account_id } = body as {
      email: string; password: string; business_name: string; slug: string; agency_account_id?: string
    }

    if (!email || !password || !business_name || !slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    validateSlug(slug)
    if (await slugTaken(slug)) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }

    // 1) Auth user
    const supabaseAuth = await createAuthClient()
    const { data: authRes, error: authErr } = await supabaseAuth.auth.signUp({
      email, password, options: { data: { role: 'business_owner' } }
    })
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })
    const user_id = authRes.user?.id
    if (!user_id) return NextResponse.json({ error: 'Auth user creation failed' }, { status: 500 })

    // 2) Decide owner agency (self-serve → WalletPush). If agency flow, you can add a gate here.
    // 3) accounts row (flat; no parent link used for ownership)
    const account_id = await createBusinessAccount(business_name)

    // 4) Resolve owning agency by request host (custom domain) or default to WalletPush
    const host = new URL(req.url).host.split(':')[0].toLowerCase()
    let owning_agency_id: string | undefined
    try {
      const { data: agencyMatch } = await srv
        .from('agency_accounts')
        .select('id')
        .eq('custom_domain', host)
        .eq('custom_domain_status', 'active')
        .limit(1)
      owning_agency_id = agencyMatch && agencyMatch[0]?.id
    } catch {}
    if (!owning_agency_id) owning_agency_id = WALLET_PUSH_AGENCY_ACCOUNT_ID

    // 5) businesses row (SoT)
    const biz = await createBusinessRow({
      agency_account_id: owning_agency_id,
      name: business_name,
      slug,
      contact_email: email,
    })

    // 6) membership + active account
    await attachUserToAccount(user_id, account_id)

    // 7) redirect target
    const domain = await activeCustomDomain(biz.id)
    const u = new URL(req.url)
    const next = domain
      ? `${baseUrl(req).replace(u.host, domain)}/business/auth/login`
      : `${baseUrl(req)}/business/${biz.slug}/auth/login`

    return NextResponse.json({ ok: true, user_id, account_id, business_id: biz.id, slug: biz.slug, next }, { status: 201 })
  } catch (e: any) {
    console.error('business sign-up error', e)
    return NextResponse.json({ error: e.message ?? 'Unknown error' }, { status: 500 })
  }
}
