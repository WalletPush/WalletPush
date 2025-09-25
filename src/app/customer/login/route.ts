import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient as authClient } from '@/lib/supabase/server'
import { createClient as admin } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'walletpush.io'
const srv = admin(URL, SRK, { auth: { persistSession: false } })

async function businessIdBySlug(slug: string) {
  const { data } = await srv.from('businesses').select('id').eq('slug', slug).maybeSingle()
  return (data as any)?.id as string | undefined
}
async function activeCustomDomain(business_id: string) {
  const { data } = await srv.from('custom_domains').select('domain,status')
    .eq('business_id', business_id).eq('status','active').maybeSingle()
  return (data as any)?.domain as string | undefined
}
async function slugOf(business_id: string) {
  const { data } = await srv.from('businesses').select('slug').eq('id', business_id).maybeSingle()
  return (data as any)?.slug as string | undefined
}

export async function POST(req: Request) {
  try {
    const h = headers()
    const { email, password, slug, next } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })

    let bid = h.get('x-business-id') || null
    let effectiveSlug = slug || null
    if (!bid && effectiveSlug) bid = await businessIdBySlug(effectiveSlug) || null
    if (!bid) return NextResponse.json({ error: 'Missing business context' }, { status: 400 })

    const supabase = await authClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })

    const domain = await activeCustomDomain(bid)
    const slugNow = effectiveSlug || await slugOf(bid) || ''
    const nextPath = typeof next === 'string' && next.startsWith('/') ? next : '/customer/dashboard'
    const target = domain
      ? `https://${domain}${nextPath}`
      : `https://${ROOT}${slugNow ? `/customer/${slugNow}` : ''}${nextPath}`
    return NextResponse.json({ ok: true, next: target })
  } catch (e: any) {
    console.error('customer login error', e)
    return NextResponse.json({ error: e.message ?? 'Unknown error' }, { status: 500 })
  }
}
