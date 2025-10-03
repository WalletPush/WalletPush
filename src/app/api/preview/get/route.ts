// src/app/api/preview/get/route.ts
import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // don't prerender this

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !key) throw new Error('Missing Supabase envs')
  return createClient(url, key, { auth: { persistSession: false } })
}

function sanitizePreview(html: string, assetsBase?: string) {
  const $ = cheerio.load(html, { decodeEntities: false })

  // Nuke all scripts + script preloads
  $('script').remove()
  $('link[rel="modulepreload"]').remove()
  $('link[rel="preload"][as="script"]').remove()

  // Remove inline handlers (onclick, onload, etc.)
  $('*').each((_, el) => {
    const attribs = (el as any).attribs || {}
    for (const name of Object.keys(attribs)) {
      if (name.toLowerCase().startsWith('on')) {
        $(el).removeAttr(name)
      }
    }
  })

  // Remove <base> (avoids CSP base-uri errors)
  $('base').remove()

  // Absolutize relative asset URLs if we have a base
  if (assetsBase) {
    $('*[src], *[href], *[poster]').each((_, el) => {
      const $el = $(el)
      const attr = $el.attr('src') !== undefined ? 'src'
        : $el.attr('href') !== undefined ? 'href'
        : 'poster'
      const val = $el.attr(attr)
      if (!val) return
      if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:') || val.startsWith('blob:') || val.startsWith('#')) return
      if (val.startsWith('/')) $el.attr(attr, assetsBase + val)
    })
  }

  return $.html()
}

export async function GET(req: NextRequest) {
  try {
    const supabase = admin()
    const { searchParams } = new URL(req.url)
    const agencyId = searchParams.get('agency_account_id') || null

    let row: any = null

    if (agencyId) {
      // Try agency row first
      const { data, error } = await supabase
        .from('agency_sales_pages')
        .select('id, html_full_preview, html_static, content_model, assets_base, updated_at')
        .eq('agency_account_id', agencyId)
        .or('page_type.eq.home,page_slug.eq.home,page_slug.eq.index')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      row = data
    }

    if (!row) {
      // Fallback to default row for owner / new agencies
      const { data, error } = await supabase
        .from('agency_sales_pages')
        .select('id, html_full_preview, html_static, content_model, assets_base, updated_at')
        .eq('is_default', true)
        .maybeSingle()
      if (error) throw error
      row = data
    }

    if (!row) {
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>No preview</title>
      <style>body{font-family:system-ui,Arial;padding:24px;color:#0f172a}</style></head>
      <body><h1>No preview available</h1><p>Add a default row in <code>agency_sales_pages</code> with <code>is_default=true</code>.</p></body></html>`
      return new NextResponse(html, {
        status: 404,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'x-preview': 'missing'
        }
      })
    }

    // Prefer full preview; fallback to static if needed
    const rawHtml: string =
      row.html_full_preview || row.html_static || '<!doctype html><html><body>Empty</body></html>'

    const sanitized = sanitizePreview(rawHtml, row.assets_base || undefined)

    // Lock the iframe: allow CSS/images, block scripts/connect
    const csp =
      "default-src 'self'; img-src * data: blob:; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com data:; " +
      "font-src * data:; script-src 'none'; connect-src 'none'; frame-ancestors 'self'; base-uri 'self'"

    return new NextResponse(sanitized, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-security-policy': csp,
        'x-preview': row.id
      }
    })
  } catch (e: any) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Preview error</title></head>
    <body><pre>${(e?.message || 'Preview error').toString()}</pre></body></html>`
    return new NextResponse(html, {
      status: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' }
    })
  }
}