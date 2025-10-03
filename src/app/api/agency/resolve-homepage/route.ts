import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Universal Agency Homepage Resolver
 * 
 * This API determines what homepage HTML to show for any agency:
 * 1. If agency has a custom homepage -> return that
 * 2. If no custom homepage -> return main website homepage with agency branding
 * 
 * Usage: GET /api/agency/resolve-homepage?agency_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agencyAccountId = searchParams.get('agency_id')
    
    if (!agencyAccountId) {
      return NextResponse.json(
        { error: 'agency_id parameter is required' },
        { status: 400 }
      )
    }

    console.log('🏠 Resolving homepage for agency:', agencyAccountId)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Step 1: Check if agency has a custom homepage
    const { data: customHomePage, error: fetchError } = await supabase
      .from('agency_sales_pages')
      .select('*')
      .eq('agency_account_id', agencyAccountId)
      .or('page_type.eq.home,page_slug.eq.home,page_slug.eq.index')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (customHomePage && !fetchError) {
      console.log('✅ Found custom agency homepage:', customHomePage.page_name)
      return NextResponse.json({
        success: true,
        type: 'custom',
        html: customHomePage.html_content,
        content_model: customHomePage.content_model,
        agency_account_id: customHomePage.agency_account_id,
        pageData: customHomePage
      })
    }

    // Step 2: No custom homepage - return main website with agency branding
    console.log('📥 No custom homepage found, loading main website with agency branding...')
    
    // Get the main homepage HTML with agency-specific processing
    // Use walletpush.io to avoid infinite loops with custom domains
    const baseUrl = 'https://walletpush.io'
    
    const homepageResponse = await fetch(`${baseUrl}/api/agency/get-main-homepage?agency_account_id=${agencyAccountId}`, {
      headers: {
        'User-Agent': 'WalletPush-Homepage-Resolver'
      }
    })
    
    if (!homepageResponse.ok) {
      throw new Error(`Failed to fetch main homepage: ${homepageResponse.status}`)
    }
    
    const homepageResult = await homepageResponse.json()
    
    if (!homepageResult.success) {
      throw new Error(homepageResult.error || 'Failed to load main homepage')
    }
    
    console.log('✅ Loaded main website homepage with agency branding')
    
    return NextResponse.json({
      success: true,
      type: 'global_template',
      html: homepageResult.html,
      originalHtml: homepageResult.originalHtml,
      pageData: {
        id: 'global-template',
        page_name: 'Main Website (Global Template)',
        page_type: 'home',
        is_published: true,
        agency_account_id: agencyAccountId
      }
    })
    
  } catch (error) {
    console.error('❌ Error resolving agency homepage:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'error'
      },
      { status: 500 }
    )
  }
}
