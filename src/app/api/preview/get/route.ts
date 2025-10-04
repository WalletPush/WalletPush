// src/app/api/preview/get/route.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { load as loadHtml } from 'cheerio'

export const dynamic = 'force-dynamic'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

function cspHeader() {
  // allow Tailwind CDN + Google Fonts so preview matches live exactly
  const csp =
    "default-src 'self'; " +
    "img-src * data: blob:; " +
    "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com data:; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "script-src 'none'; connect-src 'none'; frame-ancestors 'self'; base-uri 'self'"
  return csp
}

function sanitizePreview(html: string) {
  const $ = loadHtml(html, { decodeEntities: false })

  // strip all scripts so iframe never hangs or spams console
  $('script').remove()
  $('link[rel="modulepreload"]').remove()
  $('link[rel="preload"][as="script"]').remove()

  // base tags sometimes trip base-uri; remove to be safe
  $('base').remove()

  // keep Google Fonts; CSP allows them above
  // (if you want to hard-remove external fonts, nuke lines below instead)
  // $('link[rel="stylesheet"][href*="fonts.googleapis.com"]').remove()
  // $('link[href*="fonts.gstatic.com"]').remove()

  // kill inline handlers
  $('[onclick],[onload],[onerror],[onmouseover],[onfocus],[onblur]').each((_, el) => {
    const attribs = Object.keys((el as any).attribs || {})
    for (const a of attribs) if (a.startsWith('on')) $(el).removeAttr(a)
  })

  return $.html()
}

async function getPreviewHtml(agency_account_id?: string | null) {
  const sb = supabaseAdmin()

  // choose row:
  // 1) agency's latest home/index (if agency provided and not empty)
  // 2) else default row (is_default=true)
  if (agency_account_id && agency_account_id.trim() !== '') {
    const { data, error } = await sb
      .from('agency_sales_pages')
      .select(
        'id, html_full_preview, html_static, content_model, page_slug, page_title'
      )
      .eq('agency_account_id', agency_account_id)
      .or('page_type.eq.home,page_slug.eq.home,page_slug.eq.index')
      .order('updated_at', { ascending: false })
      .limit(1)
    if (error) throw error
    if (data && data[0]?.html_full_preview) return data[0].html_full_preview as string
  }

  // fallback: default row
  const { data: d2, error: e2 } = await sb
    .from('agency_sales_pages')
    .select('id, html_full_preview')
    .eq('is_default', true)
    .limit(1)
  if (e2) throw e2
  const html = d2?.[0]?.html_full_preview
  if (html) return html as string

  // last resort: minimal banner so iframe never "hangs"
  return `<!doctype html><html><head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://cdn.tailwindcss.com">
<title>WalletPush Preview</title>
</head><body class="p-8">
<div class="rounded-md border border-amber-200 bg-amber-50 p-4">
  <div class="font-semibold text-amber-900">No preview found</div>
  <div class="text-amber-800 text-sm">Save once in the designer to generate a styled preview.</div>
</div>
</body></html>`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const agency_account_id = searchParams.get('agency_account_id')

    let raw = await getPreviewHtml(agency_account_id)
    
    // 🚀 STEP 2: Apply agency branding to preview HTML
    if (agency_account_id) {
      try {
        const { processAgencySpecificHTML } = await import('@/app/api/agency/get-main-homepage/processAgencySpecificHTML')
        raw = await processAgencySpecificHTML(raw, agency_account_id)
        console.log('✅ Applied agency branding to preview HTML')
      } catch (brandingError) {
        console.error('⚠️ Failed to apply branding to preview, using original HTML:', brandingError)
      }
    }
    
    const html = sanitizePreview(raw)

    const res = new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': cspHeader(),
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
    return res
  } catch (e: any) {
    return new NextResponse(
      `<!doctype html><html><body><pre>${e?.message || 'Preview error'}</pre></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }
}

// kill 405: treat POST like GET
export async function POST(req: NextRequest) {
  return GET(req)
}