import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { agency_id?: string | null }
    const agencyId = body?.agency_id ?? null

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let html_full_preview: string | null = null

    if (agencyId) {
      const { data } = await supabase
        .from('agency_sales_pages')
        .select('html_full_preview')
        .eq('agency_account_id', agencyId)
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      html_full_preview = (data as any)?.html_full_preview ?? null
    }

    if (!html_full_preview) {
      const { data } = await supabase
        .from('agency_sales_pages')
        .select('html_full_preview')
        .eq('is_default', true)
        .single()
      html_full_preview = (data as any)?.html_full_preview ?? null
    }

    if (!html_full_preview) {
      return new Response('No preview available', { status: 404 })
    }

    // Sanitize: strip scripts and script preloads to avoid CSP violations/hangs
    const withoutScripts = html_full_preview.replace(/<script[\s\S]*?<\/script>/gi, '')
    const withoutModulePreload = withoutScripts
      .replace(/<link[^>]+rel=["']?modulepreload["']?[^>]*>/gi, '')
      .replace(/<link[^>]+rel=["']?preload["']?[^>]+as=["']?script["']?[^>]*>/gi, '')
    const sanitized = withoutModulePreload

    return new Response(sanitized, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (e) {
    return new Response('Preview error', { status: 500 })
  }
}

