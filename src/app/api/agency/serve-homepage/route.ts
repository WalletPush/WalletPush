import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const agencyId = request.headers.get('x-agency-id')
    
    if (!agencyId) {
      return new NextResponse('Agency not found', { status: 404 })
    }

    console.log('🏠 Serving agency homepage for agency:', agencyId)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get the agency's sales page
    const { data: salesPage, error } = await supabase
      .from('agency_sales_pages')
      .select('*')
      .eq('agency_account_id', agencyId)
      .or('page_type.eq.home,page_slug.eq.home,page_slug.eq.index')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !salesPage) {
      console.log('📥 No custom homepage found, serving branded fallback template')
      
      // 🚀 RESTORE WORKING SYSTEM: Get main homepage with agency branding
      try {
        // Use walletpush.io to avoid infinite loops with custom domains
        const baseUrl = 'https://walletpush.io'
        
        console.log('🌐 Fetching branded homepage from get-main-homepage API...')
        const homepageResponse = await fetch(`${baseUrl}/api/agency/get-main-homepage?agency_account_id=${agencyId}`, {
          headers: {
            'User-Agent': 'WalletPush-Agency-Serve'
          }
        })
        
        if (homepageResponse.ok) {
          const homepageData = await homepageResponse.json()
          if (homepageData.success && homepageData.html) {
            console.log('✅ Serving branded fallback homepage')
            return new NextResponse(homepageData.html, {
              headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
              },
            })
          }
        }
        
        console.log('⚠️ Fallback API failed, using basic template')
      } catch (fallbackError) {
        console.error('❌ Error fetching branded fallback:', fallbackError)
      }
      
      // Final fallback - basic template
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Welcome</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-50">
          <div class="min-h-screen flex items-center justify-center">
            <div class="text-center">
              <h1 class="text-4xl font-bold text-gray-900 mb-4">Welcome</h1>
              <p class="text-xl text-gray-600">Loading your branded homepage...</p>
            </div>
          </div>
        </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    }

    console.log('✅ Found custom agency homepage:', salesPage.page_name)
    
    // 🚀 STEP 2: Apply agency branding to saved HTML before serving
    let html = salesPage.html_content || salesPage.html_full_preview || ''
    
    // 🚀 FORCE REGENERATION: If HTML contains old URL format, regenerate it
    const hasOldUrlFormat = html.includes('package_id=') || html.includes('plan=') || html.includes('&agency=')
    
    if (hasOldUrlFormat) {
      console.log('🔄 Detected old URL format in saved HTML, regenerating with new format...')
      
      try {
        // Get fresh HTML from main homepage and apply branding
        const { processAgencySpecificHTML } = await import('@/app/api/agency/get-main-homepage/processAgencySpecificHTML')
        
        // Fetch fresh HTML from WalletPush
        const walletpushResponse = await fetch('https://walletpush.io', {
          headers: { 'User-Agent': 'WalletPush-Agency-Homepage' }
        })
        
        if (walletpushResponse.ok) {
          const freshHtml = await walletpushResponse.text()
          html = await processAgencySpecificHTML(freshHtml, agencyId)
          console.log('✅ Regenerated homepage with fresh HTML and new URL format')
        } else {
          throw new Error('Failed to fetch fresh HTML')
        }
      } catch (regenerationError) {
        console.error('⚠️ Failed to regenerate HTML, falling back to processing saved HTML:', regenerationError)
        // Fallback: still try to process the saved HTML
        try {
          const { processAgencySpecificHTML } = await import('@/app/api/agency/get-main-homepage/processAgencySpecificHTML')
          html = await processAgencySpecificHTML(html, agencyId)
        } catch (fallbackError) {
          console.error('⚠️ Fallback processing also failed:', fallbackError)
        }
      }
    } else {
      // Normal processing for HTML that already has correct format
      try {
        const { processAgencySpecificHTML } = await import('@/app/api/agency/get-main-homepage/processAgencySpecificHTML')
        html = await processAgencySpecificHTML(html, agencyId)
        console.log('✅ Applied agency branding to saved homepage')
      } catch (brandingError) {
        console.error('⚠️ Failed to apply branding, serving original HTML:', brandingError)
      }
    }
    
    // Return the branded HTML content
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    })

  } catch (error) {
    console.error('❌ Error serving agency homepage:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
