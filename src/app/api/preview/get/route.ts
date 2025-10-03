import { NextRequest, NextResponse } from 'next/server'
import sanitizePreviewHtml from '@/lib/preview/sanitize'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const agencyId = searchParams.get('agency_account_id')

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
      return new NextResponse('<!doctype html><html><body>No preview available</body></html>', { status: 200, headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
      }})
    }

    const safe = sanitizePreviewHtml(html_full_preview)

    return new NextResponse(safe, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Security-Policy': [
          "default-src 'none'",
          "img-src https: data:",
          "style-src https: data: 'unsafe-inline'",
          "font-src https: data:",
          "frame-ancestors 'self'",
          "base-uri 'self'",
          "form-action 'none'",
          "connect-src 'none'"
        ].join('; ')
      }
    })
  } catch (e) {
    return new NextResponse('Preview error', { status: 500 })
  }
}

