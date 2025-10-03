// src/lib/mergeFromEditedHtml.ts
import * as cheerio from 'cheerio'

export type ContentModel = Record<string, any>

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

export function mergeFromEditedHtml(
  editedHtml: string,
  baselineModel: ContentModel | null | undefined
): { html_static: string; content_model: ContentModel; updates: Record<string, string> } {
  const $ = cheerio.load(editedHtml, { decodeEntities: false })

  const updates: Record<string, string> = {}

  // 1) Extract copy from data-wp-bind
  $('[data-wp-bind]').each((_, el) => {
    const path = $(el).attr('data-wp-bind')
    if (!path) return
    // Prefer text content; if element is input/textarea, read value/placeholder
    const tag = (el as any).tagName?.toLowerCase()
    let text = ''
    if (tag === 'input' || tag === 'textarea') {
      text = ($(el).val() as string) ?? ''
      if (!text) text = $(el).attr('placeholder') ?? ''
    } else {
      text = $(el).text()
    }
    text = text.replace(/\s+/g, ' ').trim()
    updates[path] = text
  })

  // 2) Apply updates to a clone of baseline content model
  const content_model: ContentModel = baselineModel
    ? JSON.parse(JSON.stringify(baselineModel))
    : {}

  for (const [path, value] of Object.entries(updates)) {
    setDeep(content_model, path, value)
  }

  // 3) Replace dynamic blocks with slot placeholders
  // We support either explicit <div data-wp-slot="..."> in the edited HTML
  // or wrappers annotated by comments (WP:DYNAMIC-START/END).
  // If dynamic wrappers still exist, reduce them to plain slot placeholders.
  $('[data-wp-slot]').each((_, el) => {
    const slot = $(el).attr('data-wp-slot') || ''
    $(el).replaceWith(`<div data-wp-slot="${slot}"></div>`)
  })

  // Also strip comment-wrapped regions down to a slot if found.
  // Example:
  // <!-- WP:DYNAMIC-START header --> ... <!-- WP:DYNAMIC-END header -->
  const htmlStr = $.html()
  const slotRe = /<!--\s*WP:DYNAMIC-START\s+([a-zA-Z0-9_-]+)\s*-->[\s\S]*?<!--\s*WP:DYNAMIC-END\s+\1\s*-->/g
  const html_after_comment_simplify = htmlStr.replace(slotRe, (_m, slotName) => {
    return `<div data-wp-slot="${slotName}"></div>`
  })
  const _$ = cheerio.load(html_after_comment_simplify, { decodeEntities: false })

  // 4) Cleanup markers in the remaining static content
  _$('[data-wp-bind]').removeAttr('data-wp-bind')
  _$('[data-wp-component]').removeAttr('data-wp-component')

  const html_static = _$.html()

  return { html_static, content_model, updates }
}

export function getDefaultContentModel(): ContentModel {
  return {
    header: {
      logoUrl: '/placeholder-logo.png',
      nav: [
        { label: 'Home', href: '#' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Features', href: '#features' }
      ],
      cta: { label: 'Get Started', href: '#get-started' }
    },
    pricing: {
      title: 'Simple pricing',
      plans: [
        {
          name: 'Starter',
          priceText: '$9/mo',
          features: ['1 team member', 'Basic analytics', 'Email support'],
          ctaLabel: 'Choose Starter',
          ctaHref: '#'
        },
        {
          name: 'Growth',
          priceText: '$29/mo',
          features: ['5 team members', 'Advanced analytics', 'Priority support'],
          ctaLabel: 'Choose Growth',
          ctaHref: '#'
        },
        {
          name: 'Scale',
          priceText: '$99/mo',
          features: ['Unlimited team', 'Custom reports', 'SLAs'],
          ctaLabel: 'Choose Scale',
          ctaHref: '#'
        }
      ]
    },
    footer: {
      company: { name: 'WalletPush' },
      year: new Date().getFullYear(),
      links: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
        { label: 'Contact', href: '/contact' }
      ]
    }
  }
}