// src/app/api/agency/sales-pages/save/route.ts
import 'server-only'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { mergeFromEditedHtml } from '@/lib/mergeFromEditedHtml'
import { composeFullPreview } from '@/lib/preview/compose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('Missing Supabase envs: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
})

type SaveBody = {
  agency_account_id?: string | null
  page_slug?: string
  page_name?: string
  // Full HTML edited by Claude (contains data-wp-bind, data-wp-slot)
  edited_html: string
  // Optional: if not provided, we will load from existing row or default row
  baseline_content_model?: Record<string, any> | null
  // Optional: used for non-null columns on insert
  page_title?: string | null
  headline?: string | null
  call_to_action?: string | null
  // Optional: used to rewrite image/link URLs in preview
  assets_base?: string | null
}

function extractInlineCssFromHtml(html?: string | null): string {
  if (!html) return ''
  const m = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  return m ? m[1] : ''
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SaveBody

    const agency_account_id = body.agency_account_id ?? null
    const page_slug = body.page_slug || 'home'
    const page_name = body.page_name || 'Home'
    const edited_html = body.edited_html
    const assets_base = body.assets_base ?? null

    if (!edited_html || typeof edited_html !== 'string') {
      return NextResponse.json({ error: 'edited_html required' }, { status: 400 })
    }

    // 1) Load current row (if exists) and default row for CSS fallback
    const { data: existingRows, error: exErr } = await supabase
      .from('agency_sales_pages')
      .select('*')
      .eq('page_slug', page_slug)
      .eq('agency_account_id', agency_account_id)
      .limit(1)

    if (exErr) throw exErr
    const existing = existingRows?.[0] || null

    const { data: defaultRows, error: defErr } = await supabase
      .from('agency_sales_pages')
      .select('html_full_preview, assets_base, content_model')
      .eq('is_default', true)
      .limit(1)

    if (defErr) throw defErr
    const defaultRow = defaultRows?.[0] || null
    const defaultInlineCss = extractInlineCssFromHtml(defaultRow?.html_full_preview)

    // Determine baseline content model
    const baseline_model =
      body.baseline_content_model ??
      existing?.content_model ??
      defaultRow?.content_model ??
      {}

    // 🚀 STEP 1: STOP SHREDDING HTML! Store Claude's edited HTML directly
    console.log('🎯 Preserving Tailwind markup - storing edited HTML as-is')
    
    // Store Claude's edited HTML directly (preserves beautiful Tailwind styling)
    const html_static = edited_html
    const html_full_preview = edited_html
    
    // 🚀 EXTRACT AGENCY BRANDING: Update content_model with agency-specific data
    let content_model = baseline_model
    
    if (agency_account_id) {
      try {
        // Get agency data to update content_model
        const { data: agencyAccount } = await supabase
          .from('agency_accounts')
          .select('logo_url, name')
          .eq('id', agency_account_id)
          .single()
        
        const { data: packages } = await supabase
          .from('agency_packages')
          .select('*')
          .eq('agency_account_id', agency_account_id)
          .eq('is_active', true)
          .order('display_order')
        
        if (agencyAccount) {
          // Update content_model with agency branding
          content_model = {
            ...baseline_model,
            header: {
              ...baseline_model.header,
              company: {
                name: agencyAccount.name || 'Agency',
                logo_url: agencyAccount.logo_url
              }
            },
            footer: {
              ...baseline_model.footer,
              company: {
                name: agencyAccount.name || 'Agency',
                description: `Professional digital wallet solutions by ${agencyAccount.name || 'Agency'}`
              },
              copyright: `© ${agencyAccount.name || 'Agency'}`
            },
            pricing: {
              ...baseline_model.pricing,
              packages: packages || []
            }
          }
          
          console.log('✅ Updated content_model with agency branding:', {
            agencyName: agencyAccount.name,
            logoUrl: agencyAccount.logo_url,
            packagesCount: packages?.length || 0
          })
        }
      } catch (brandingError) {
        console.error('⚠️ Failed to update content_model with agency branding:', brandingError)
      }
    }

    // 4) Upsert into agency_sales_pages (respect not-null columns)
    const page_title = body.page_title ?? existing?.page_title ?? 'WalletPush'
    const headline = body.headline ?? existing?.headline ?? 'Grow with WalletPush'
    const call_to_action = body.call_to_action ?? existing?.call_to_action ?? 'Get Started'

    const payload = {
      agency_account_id,
      page_name,
      page_type: existing?.page_type ?? 'home',
      page_slug,
      page_title,
      headline,
      call_to_action,
      html_static,
      html_content: edited_html, // 🚀 STEP 2: Store for serve-homepage
      content_model,
      html_full_preview,
      assets_base: assets_base ?? existing?.assets_base ?? defaultRow?.assets_base ?? 'https://walletpush.io',
      is_active: existing?.is_active ?? true,
      is_published: true, // 🚀 Auto-publish saved pages
      updated_at: new Date().toISOString()
    }

    const { data: upserted, error: upErr } = await supabase
      .from('agency_sales_pages')
      .upsert(payload, { onConflict: 'agency_account_id,page_slug' })
      .select('*')
      .limit(1)

    if (upErr) throw upErr
    const row = upserted?.[0]

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: row?.id,
          page_slug: row?.page_slug,
          html_static,
          html_full_preview,
          content_model
        }
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('SAVE SALES-PAGE ERROR:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}