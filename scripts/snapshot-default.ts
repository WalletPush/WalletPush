/*
  One-time snapshot script
  - Fetches https://walletpush.io
  - Inlines external CSS into <style> tags for preview stability
  - Generates a slotted html_static by replacing likely header/pricing/footer regions with <div data-wp-slot>
  - Inserts (or upserts) a default row into public.agency_sales_pages with is_default=true

  Usage:
    SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... pnpm tsx scripts/snapshot-default.ts
*/

import * as cheerio from 'cheerio'
import path from 'node:path'
import { URL } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const ORIGIN = 'https://walletpush.io'

function abs(base: string, href: string) {
  try { return new URL(href, base).toString() } catch { return href }
}

async function inlineCss(html: string, base: string) {
  const $ = cheerio.load(html, { decodeEntities: false })
  const links = $('link[rel="stylesheet"][href]')
  for (const el of links.toArray()) {
    const href = $(el).attr('href')!
    const cssUrl = abs(base, href)
    const res = await fetch(cssUrl)
    const css = await res.text()
    const cssBase = new URL(cssUrl).origin + path.dirname(new URL(cssUrl).pathname) + '/'
    const fixed = css.replace(/url\((['"]?)(\/??[^)'"]+)\1\)/g, (_m, q, p) => `url(${q}${abs(cssBase, p)}${q})`)
    $(el).replaceWith(`<style>${fixed}</style>`)
  }
  if ($('head base').length === 0) {
    $('head').prepend(`<base href="${ORIGIN}/">`)
  }
  return $.html()
}

function makeSlottedHtml(html: string) {
  const $ = cheerio.load(html, { decodeEntities: false })
  // Heuristics – non-destructive if not found
  $('[data-site-header], header, .site-header').first().replaceWith('<div data-wp-slot="header"></div>')
  $('[data-site-pricing], #pricing, section.pricing').first().replaceWith('<div data-wp-slot="pricing"></div>')
  $('[data-site-footer], footer, .site-footer').last().replaceWith('<div data-wp-slot="footer"></div>')
  return $.html()
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY envs')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const res = await fetch(ORIGIN, { headers: { 'user-agent': 'WP-Snapshot/1.0' } })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  let html = await res.text()
  let html_full_preview = await inlineCss(html, ORIGIN)
  // Remove all scripts to satisfy CSP and keep preview static
  {
    const $ = cheerio.load(html_full_preview, { decodeEntities: false })
    $('script').remove()
    html_full_preview = $.html()
  }
  const html_static = makeSlottedHtml(html_full_preview)

  const content_model = {
    header: { nav: [{ label: 'Home' }, { label: 'Pricing' }], cta: { label: 'Get Started' } },
    pricing: { title: 'Simple pricing', subtitle: '', footer: '' },
    footer: { company: { name: 'WalletPush', description: '' }, links: [], copyright: '© WalletPush' }
  }

  // Update existing default row if present; otherwise insert
  const { data: existingDefault, error: fetchErr } = await supabase
    .from('agency_sales_pages')
    .select('id')
    .eq('is_default', true)
    .single()

  if (fetchErr == null && existingDefault) {
    const { error: updErr } = await supabase
      .from('agency_sales_pages')
      .update({
        page_name: 'DEFAULT',
        page_type: 'home',
        page_slug: 'home',
        page_title: 'WalletPush — Loyalty & Wallet Passes',
        headline: 'Turn customers into loyal members',
        call_to_action: 'Get Started',
        is_published: true,
        html_full_preview,
        html_static,
        content_model,
        assets_base: ORIGIN
      })
      .eq('id', existingDefault.id)
    if (updErr) throw updErr
    console.log('✅ Updated default preview row successfully')
  } else {
    const { error: insErr } = await supabase.from('agency_sales_pages').insert({
      is_default: true,
      page_name: 'DEFAULT',
      page_type: 'home',
      page_slug: 'home',
      page_title: 'WalletPush — Loyalty & Wallet Passes',
      headline: 'Turn customers into loyal members',
      call_to_action: 'Get Started',
      is_published: true,
      html_full_preview,
      html_static,
      content_model,
      assets_base: ORIGIN
    })
    if (insErr) throw insErr
    console.log('✅ Inserted default preview row successfully')
  }
}

main().catch((e) => {
  console.error('❌ Snapshot failed:', e)
  process.exit(1)
})


