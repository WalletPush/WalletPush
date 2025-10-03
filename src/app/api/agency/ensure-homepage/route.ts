import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

export async function POST(req: Request) {
  const url = new URL(req.url)
  const agencyAccountId = url.searchParams.get('agency_account_id')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  if (!agencyAccountId) return NextResponse.json({ ok: true })

  const existing = await supabase
    .from('agency_sales_pages')
    .select('id')
    .eq('agency_account_id', agencyAccountId)
    .or('page_type.eq.home,page_slug.eq.home,page_slug.eq.index')
    .limit(1)
    .maybeSingle()

  if (existing.data) return NextResponse.json({ ok: true })

  const def = await supabase
    .from('agency_sales_pages')
    .select('html_static, html_full_preview, content_model, assets_base')
    .eq('is_default', true)
    .limit(1)
    .maybeSingle()

  if (!def.data) return NextResponse.json({ ok: false, error: 'No default page found' }, { status: 500 })

  await supabase.from('agency_sales_pages').insert({
    agency_account_id: agencyAccountId,
    page_name: 'Home',
    page_type: 'home',
    page_slug: 'home',
    page_title: 'WalletPush',
    headline: 'Loyalty that actually converts',
    call_to_action: 'Get Started',
    html_static: def.data.html_static,
    html_full_preview: def.data.html_full_preview,
    content_model: def.data.content_model || {},
    assets_base: def.data.assets_base || null,
    is_published: false,
    is_active: true
  })

  return NextResponse.json({ ok: true })
}


