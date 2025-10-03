import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { mergeFromEditedHtml } from '@/lib/mergeFromEditedHtml'
import { composeFullPreview } from '@/lib/preview/compose'
import sanitizePreviewHtml from '@/lib/preview/sanitize'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

export async function POST(req: Request) {
  const { agency_account_id, edited_html } = await req.json()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const existing = await supabase
    .from('agency_sales_pages')
    .select('id, content_model')
    .eq('agency_account_id', agency_account_id)
    .or('page_type.eq.home,page_slug.eq.home,page_slug.eq.index')
    .limit(1)
    .maybeSingle()

  const { html_static, content_model } = mergeFromEditedHtml(edited_html, existing.data?.content_model || {})

  const def = await supabase
    .from('agency_sales_pages')
    .select('html_full_preview')
    .eq('is_default', true)
    .limit(1)
    .maybeSingle()

  const html_full_preview_raw = composeFullPreview({
    defaultFullHtml: def.data?.html_full_preview || '<!doctype html><html><head></head><body></body></html>',
    htmlStatic: html_static,
    contentModel: content_model
  })

  const url = new URL(req.url)
  const sanitized = sanitizePreviewHtml(html_full_preview_raw, url.origin)

  await supabase.from('agency_sales_pages').upsert({
    agency_account_id,
    page_name: 'Home',
    page_type: 'home',
    page_slug: 'home',
    page_title: 'WalletPush',
    headline: 'Loyalty that actually converts',
    call_to_action: 'Get Started',
    html_static,
    content_model,
    html_full_preview: sanitized,
    is_active: true
  }, { onConflict: 'agency_account_id,page_slug' as any })

  return NextResponse.json({ ok: true })
}


