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
      console.log('📥 No custom homepage found, serving default')
      // Serve default homepage
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
              <h1 class="text-4xl font-bold text-gray-900 mb-4">Welcome to our agency</h1>
              <p class="text-xl text-gray-600">Custom homepage coming soon...</p>
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
    
    // Return the HTML content with proper headers
    return new NextResponse(salesPage.html_content, {
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
