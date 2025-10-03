// src/lib/preview/compose.ts
// No React, no react-dom/server. Pure string/cheerio.
// Safe to import from API routes & server code.
import 'server-only'

import * as cheerio from 'cheerio'

type ComposeOpts = {
  html_static: string
  content_model: Record<string, any>
  assets_base?: string | null
  inlineCss?: string | null // pass default inlined CSS (from your default row) here
}

function absolutizeUrls($: cheerio.CheerioAPI, base?: string | null) {
  if (!base) return
  const toAbs = (url?: string | null) => {
    if (!url) return url
    if (/^https?:\/\//i.test(url)) return url
    if (url.startsWith('//')) return `https:${url}`
    if (url.startsWith('/')) return base.replace(/\/+$/, '') + url
    return url // leave relative for now
  }
  $('img[src]').each((_, el) => {
    const v = $(el).attr('src')
    $(el).attr('src', toAbs(v) || v!)
  })
  $('a[href]').each((_, el) => {
    const v = $(el).attr('href')
    $(el).attr('href', toAbs(v) || v!)
  })
  $('link[href]').each((_, el) => {
    const v = $(el).attr('href')
    $(el).attr('href', toAbs(v) || v!)
  })
  $('[poster]').each((_, el) => {
    const v = $(el).attr('poster')
    $(el).attr('poster', toAbs(v) || v!)
  })
  $('source[src], video[src]').each((_, el) => {
    const v = $(el).attr('src')
    $(el).attr('src', toAbs(v) || v!)
  })
}

function sanitizeDangerous($: cheerio.CheerioAPI) {
  // Kill scripts and script-like preloads
  $('script').remove()
  $('link[rel="preload"][as="script"]').remove()
  $('link[rel="modulepreload"]').remove()
  $('iframe').remove()

  // Remove inline on* handlers
  $('[onload],[onclick],[onmouseover],[onerror],[onfocus],[onchange],[onsubmit],[oninput],[onunload],[onmouseenter],[onmouseleave]').each(
    (_i, el) => {
      const attrs = Object.keys(el.attribs || {}).filter((a) => a.toLowerCase().startsWith('on'))
      for (const a of attrs) $(el).removeAttr(a)
    }
  )

  // Drop any base tag (prevents CSP base-uri issues in iframes)
  $('base').remove()
}

function renderHeader(m: any): string {
  const logo = m?.header?.logoUrl || '/placeholder-logo.png'
  const nav = (m?.header?.nav as Array<any>) || []
  const cta = m?.header?.cta || { label: 'Get Started', href: '#' }

  return `
<header class="wp-header">
  <div class="wp-header-inner">
    <img class="wp-logo" src="${logo}" alt="Logo" />
    <nav class="wp-nav">
      ${nav
        .map(
          (n) =>
            `<a class="wp-nav-link" href="${n?.href ?? '#'}">${(n?.label ?? '').toString()}</a>`
        )
        .join('')}
    </nav>
    <a class="wp-cta" href="${cta.href}">${cta.label}</a>
  </div>
</header>`
}

function renderPricing(m: any): string {
  const title = m?.pricing?.title || 'Pricing'
  const plans = (m?.pricing?.plans as Array<any>) || []
  return `
<section class="wp-pricing">
  <h2 class="wp-pricing-title">${title}</h2>
  <div class="wp-plans">
    ${plans
      .map(
        (p) => `
      <div class="wp-plan">
        <h3 class="wp-plan-name">${p?.name ?? ''}</h3>
        <div class="wp-plan-price">${p?.priceText ?? ''}</div>
        <ul class="wp-plan-features">
          ${(p?.features ?? [])
            .map((f: string) => `<li class="wp-feature">${(f ?? '').toString()}</li>`)
            .join('')}
        </ul>
        ${
          p?.ctaHref
            ? `<a class="wp-plan-cta" href="${p.ctaHref}">${p?.ctaLabel ?? 'Choose'}</a>`
            : ''
        }
      </div>`
      )
      .join('')}
  </div>
</section>`
}

function renderFooter(m: any): string {
  const year = m?.footer?.year ?? new Date().getFullYear()
  const company = m?.footer?.company?.name ?? 'WalletPush'
  const links = (m?.footer?.links as Array<any>) || []
  return `
<footer class="wp-footer">
  <div class="wp-footer-top">
    ${links
      .map(
        (l) =>
          `<a class="wp-footer-link" href="${l?.href ?? '#'}">${(l?.label ?? '').toString()}</a>`
      )
      .join('')}
  </div>
  <div class="wp-footer-bottom">&copy; ${year} ${company}</div>
</footer>`
}

// Small default CSS that looks sane. You can pass a full inlined Tailwind build via inlineCss.
const BASE_CSS = `
/* minimal preview styles (safe, no external loads) */
:root { --wp-primary:#2563eb; --wp-muted:#64748b; --wp-accent:#10b981; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
*{box-sizing:border-box} body{margin:0;color:#0f172a;background:#fff}
.wp-header{border-bottom:1px solid #e2e8f0;background:#fff}
.wp-header-inner{display:flex;align-items:center;justify-content:space-between;max-width:1100px;margin:0 auto;padding:16px}
.wp-logo{height:36px;object-fit:contain}
.wp-nav{display:flex;gap:16px}
.wp-nav-link{color:#334155;text-decoration:none;font-weight:500}
.wp-nav-link:hover{color:#0f172a}
.wp-cta{padding:10px 16px;background:var(--wp-primary);color:#fff;border-radius:8px;text-decoration:none;font-weight:600}
.wp-cta:hover{opacity:.9}
main{max-width:1100px;margin:0 auto;padding:24px}
.wp-pricing{padding:24px;margin-top:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}
.wp-pricing-title{margin:0 0 16px 0;font-size:24px}
.wp-plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
.wp-plan{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px}
.wp-plan-name{margin:0 0 8px 0;font-size:18px}
.wp-plan-price{font-size:20px;font-weight:700;margin-bottom:8px}
.wp-plan-features{margin:0;padding-left:18px;color:#334155}
.wp-plan-cta{display:inline-block;margin-top:10px;padding:10px 14px;background:var(--wp-accent);color:#fff;border-radius:8px;text-decoration:none}
.wp-footer{margin-top:48px;border-top:1px solid #e2e8f0;background:#fff}
.wp-footer-top{max-width:1100px;margin:0 auto;padding:12px 16px;display:flex;gap:16px;flex-wrap:wrap}
.wp-footer-link{color:#334155;text-decoration:none}
.wp-footer-link:hover{color:#0f172a}
.wp-footer-bottom{max-width:1100px;margin:0 auto;padding:12px 16px;color:#475569}
`

export function composeFullPreview(opts: ComposeOpts): string {
  const { html_static, content_model, assets_base, inlineCss } = opts
  const $ = cheerio.load(html_static || '<!doctype html><html><head></head><body></body></html>', {
    decodeEntities: false
  })

  // Replace slots with static markup from content_model
  $('[data-wp-slot]').each((_i, el) => {
    const slot = $(el).attr('data-wp-slot')
    let replacement = ''
    if (slot === 'header') replacement = renderHeader(content_model)
    else if (slot === 'pricing') replacement = renderPricing(content_model)
    else if (slot === 'footer') replacement = renderFooter(content_model)
    // Unknown slots: remove placeholder quietly
    $(el).replaceWith(replacement)
  })

  // Strip any data-wp-* remnants
  $('[data-wp-bind]').removeAttr('data-wp-bind')
  $('[data-wp-component]').removeAttr('data-wp-component')
  $('[data-wp-slot]').removeAttr('data-wp-slot')

  absolutizeUrls($, assets_base)
  sanitizeDangerous($)

  // Ensure <head> exists, inject CSS
  if ($('head').length === 0) $('html').prepend('<head></head>')
  const css = (inlineCss || '') + '\n' + BASE_CSS
  $('head').append(`<style>${css}</style>`)

  return $.html()
}