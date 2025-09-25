import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { businessIdBySlug, activeCustomDomain } from '@/lib/business/context'

export async function POST(req: Request) {
  try {
    const h = headers()
    const body = await req.text()
    const { email, password, slug } = JSON.parse(body || '{}') as { email: string; password: string; slug?: string }

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    // Resolve business context
    let businessId = h.get('x-business-id') || null
    let effectiveSlug = slug || null

    if (!businessId && effectiveSlug) {
      businessId = await businessIdBySlug(effectiveSlug) || null
    }
    if (!businessId) {
      return NextResponse.json({ error: 'Missing business context' }, { status: 400 })
    }

    const supabase = await createAuthClient()
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 401 })

    const domain = await activeCustomDomain(businessId)
    const next = domain
      ? `https://${domain}/business/dashboard`
      : `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'walletpush.io'}/business/${effectiveSlug}/dashboard`

    return NextResponse.json({ ok: true, next })
  } catch (e: any) {
    console.error('business login error', e)
    return NextResponse.json({ error: e.message ?? 'Unknown error' }, { status: 500 })
  }
}
