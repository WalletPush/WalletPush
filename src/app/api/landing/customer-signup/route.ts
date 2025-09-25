import { NextResponse } from 'next/server'
import { createClient as createSrv } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ROOT_DOMAIN  = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'walletpush.io'
const srv = createSrv(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

function findEmail(payload: Record<string, any>) {
  for (const k of Object.keys(payload)) if (k.toLowerCase() === 'email') return String(payload[k]).trim().toLowerCase()
  return null
}

async function resolveBizFromLP(landing_page_id: string) {
  const { data, error } = await srv
    .from('landing_pages')
    .select('business_id, businesses!inner(slug)')
    .eq('id', landing_page_id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const slug = Array.isArray((data as any).businesses)
    ? (data as any).businesses[0]?.slug
    : (data as any).businesses?.slug
  return { business_id: (data as any).business_id as string, slug: slug as string | undefined }
}

async function activeCustomDomain(business_id: string) {
  const { data } = await srv
    .from('custom_domains')
    .select('domain,status')
    .eq('business_id', business_id)
    .eq('status', 'active')
    .maybeSingle()
  return data?.domain as string | undefined
}

// TODO: plug in your real pass issuing
async function issuePass(_: { business_id: string; template_id?: string; form: Record<string, any> }) {
  return { download_url: `https://${ROOT_DOMAIN}/api/passes/download?t=dummy-token` }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    let business_id = req.headers.get('x-business-id') || ''
    let slug: string | undefined

    if (!business_id && body.landing_page_id) {
      const ctx = await resolveBizFromLP(String(body.landing_page_id))
      if (ctx) { business_id = ctx.business_id; slug = ctx.slug }
    }
    if (!business_id) return NextResponse.json({ error: 'Missing business context' }, { status: 400 })

    const email = findEmail(body)
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    // Upsert SoT (no Auth user here)
    const { error: upErr } = await srv.from('customers').upsert({
      business_id, email,
      first_name: body.first_name ?? body.firstname ?? null,
      last_name:  body.last_name  ?? body.lastname  ?? null,
      form_data: body
    }, { onConflict: 'business_id,email' })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

    const { download_url } = await issuePass({ business_id, template_id: body.template_id, form: body })

    // Cookie hints for slugless login on root
    if (!slug) {
      const { data: biz } = await srv.from('businesses').select('slug').eq('id', business_id).maybeSingle()
      slug = (biz as any)?.slug
    }
    const res = NextResponse.json({ download_url })
    res.cookies.set('wp_bid', business_id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 })
    if (slug) res.cookies.set('wp_bslug', slug, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 })
    return res
  } catch (e: any) {
    console.error('LP signup error', e)
    return NextResponse.json({ error: e.message ?? 'Unknown error' }, { status: 500 })
  }
}
