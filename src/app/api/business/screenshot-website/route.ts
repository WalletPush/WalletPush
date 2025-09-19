import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Taking website screenshot...')
    
    const { websiteUrl } = await request.json()
    
    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 })
    }

    console.log('📸 Capturing screenshot for:', websiteUrl)

    const firecrawlUrl = 'https://api.firecrawl.dev/v2/scrape'
    const options = {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fc-74855b7bfe6a47139f84c883bf5f0ea1',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: websiteUrl,
        formats: [
          {
            type: "screenshot",
            fullPage: true,
            quality: 85,
            viewport: { width: 1920, height: 1080 }
          }
        ],
        onlyMainContent: false, // We want the full page for screenshot
        maxAge: 300000 // 5 minutes cache for development
      })
    }

    console.log('📡 Sending screenshot request to Firecrawl...')
    const response = await fetch(firecrawlUrl, options)
    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Firecrawl screenshot error:', data)
      return NextResponse.json({ 
        error: 'Failed to capture screenshot',
        details: data,
        firecrawlStatus: response.status
      }, { status: response.status })
    }

    console.log('✅ Screenshot captured successfully!')
    
    // Extract screenshot URL from response
    const screenshotUrl = data.screenshot?.url || data.data?.screenshot || null
    
    if (!screenshotUrl) {
      console.warn('⚠️ No screenshot URL found in response')
      return NextResponse.json({ 
        error: 'Screenshot captured but URL not found',
        data: data
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      screenshotUrl: screenshotUrl,
      websiteUrl: websiteUrl,
      message: 'Screenshot captured successfully'
    })

  } catch (error: any) {
    console.error('💥 Screenshot API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

