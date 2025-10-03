// src/lib/mergeFromEditedHtml.ts
import { load as loadHtml } from 'cheerio'

function setDeep(obj: any, path: string, value: any) {
  const parts = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)

  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (cur[p] == null || typeof cur[p] !== 'object') {
      // decide array vs object based on next token
      const next = parts[i + 1]
      cur[p] = /^\d+$/.test(next) ? [] : {}
    }
    cur = cur[p]
  }
  cur[parts[parts.length - 1]] = value
}

export type ContentModel = {
  header?: {
    logoUrl?: string
    nav?: Array<{ label: string; href?: string }>
    cta?: { label: string; href?: string }
  }
  pricing?: {
    title?: string
    plans?: Array<{
      name?: string
      priceText?: string
      features?: string[]
      cta?: { label?: string; href?: string }
    }>
  }
  footer?: {
    company?: { name?: string; description?: string }
    links?: Array<{ label: string; href?: string }>
  }
  [k: string]: any
}

export function getDefaultContentModel(): ContentModel {
  return {
    header: {
      logoUrl: '',
      nav: [{ label: 'Home' }, { label: 'Pricing' }],
      cta: { label: 'Get Started', href: '#' },
    },
    pricing: {
      title: 'Simple pricing',
      plans: [
        { name: 'Starter', priceText: '$9/mo', features: ['Feature A'] },
        { name: 'Growth', priceText: '$29/mo', features: ['Feature B'] },
      ],
    },
    footer: {
      company: { name: 'WalletPush', description: '' },
      links: [],
    },
  }
}

/**
 * Parse Claude-edited HTML, harvest all data-wp-bind values into JSON,
 * and replace dynamic blocks with <div data-wp-slot="..."></div>.
 */
export function mergeFromEditedHtml(editedHtml: string, baselineModel?: ContentModel) {
  const $ = loadHtml(editedHtml, { decodeEntities: false })
  const updates: Record<string, string> = {}

  // 1) collect copy from data-wp-bind
  $('[data-wp-bind]').each((_, el) => {
    const path = $(el).attr('data-wp-bind')
    if (!path) return
    const txt = $(el).text().trim()
    updates[path] = txt
  })

  // 2) apply onto a clone
  const model: ContentModel = JSON.parse(
    JSON.stringify(baselineModel ?? getDefaultContentModel())
  )
  for (const [path, value] of Object.entries(updates)) setDeep(model, path, value)

  // 3) turn dynamic regions into slot placeholders
  $('[data-wp-slot]').each((_, el) => {
    const slot = $(el).attr('data-wp-slot') || ''
    $(el).replaceWith(`<div data-wp-slot="${slot}"></div>`)
  })

  // 4) optional clean-up
  $('[data-wp-bind]').removeAttr('data-wp-bind')
  $('[data-wp-component]').removeAttr('data-wp-component')

  const html_static = $.html()
  return { html_static, content_model: model }
}