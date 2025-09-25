import { NextResponse } from 'next/server'
import { createClient as sb } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'walletpush.io'
const admin = sb(URL, SRK, { auth: { persistSession: false } })

async function activeCustomDomain(business_id: string) {
  const { data } = await admin.from('custom_domains').select('domain,status')
    .eq('business_id', business_id).eq('status','active').maybeSingle()
  return data?.domain as string | undefined
}
async function slugOf(business_id: string) {
  const { data } = await admin.from('businesses').select('slug').eq('id', business_id).maybeSingle()
  return (data as any)?.slug as string | undefined
}

export async function POST(req: Request) {
  try {
    const h = req.headers
    const { email, password, first_name, last_name } = await req.json()

    if (!email || !password) return NextResponse.json({ error: 'Missing email/password' }, { status: 400 })

    const business_id = h.get('x-business-id') || ''
    if (!business_id) return NextResponse.json({ error: 'Missing business context' }, { status: 400 })

    const { error: cErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { role: 'customer', business_id }
    })
    if (cErr && !String(cErr.message || '').includes('already registered')) {
      return NextResponse.json({ error: cErr.message }, { status: 400 })
    }

    const { error: upErr } = await admin.from('customers').upsert({
      business_id, email, first_name, last_name
    }, { onConflict: 'business_id,email' })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

    const domain = await activeCustomDomain(business_id)
    const slug = await slugOf(business_id)
    const loginUrl = domain
      ? `https://${domain}/customer/auth/login?email=${encodeURIComponent(email)}`
      : `https://${ROOT}${slug ? `/customer/${slug}` : ''}/customer/auth/login?email=${encodeURIComponent(email)}`

    const res = NextResponse.json({ ok: true, next: loginUrl }, { status: 201 })
    res.cookies.set('wp_bid', business_id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 })
    if (slug) res.cookies.set('wp_bslug', slug, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 })
    return res
  } catch (e: any) {
    console.error('customer create error', e)
    return NextResponse.json({ error: e.message ?? 'Unknown error' }, { status: 500 })
  }
}
