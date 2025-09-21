import { NextRequest, NextResponse } from 'next/server'

// Helper function to extract visual assets from crawled data
function extractVisualAssets(crawledData: any[], imageSearchResults?: any) {
  const assets = {
    logos: [] as string[],
    heroImages: [] as string[],
    productImages: [] as string[],
    allImages: [] as string[],
    brandColors: [] as string[],
    businessInfo: {} as any
  }

  crawledData.forEach(page => {
    // Extract business info from page metadata
    if (page.metadata) {
      if (page.metadata.title && !assets.businessInfo.name) {
        // Try to extract business name from page title
        const titleLower = page.metadata.title.toLowerCase()
        if (titleLower.includes('home') || titleLower.includes('welcome') || page.metadata.url?.includes('index')) {
          assets.businessInfo.name = page.metadata.title.replace(/\s*[-|]\s*(home|welcome|index).*$/i, '').trim()
        }
      }
    }

    // Extract from HTML content
    if (page.html) {
      // Extract images
      const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi
      const logoRegex = /(logo|brand|header|nav|footer)/i
      const heroRegex = /(hero|banner|main|featured|slider)/i
      let match

      while ((match = imgRegex.exec(page.html)) !== null) {
        let imageUrl = match[1]
        
        // Convert relative URLs to absolute
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl
        } else if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
          const baseUrl = new URL(page.metadata?.url || crawledData[0]?.metadata?.url || '')
          imageUrl = baseUrl.origin + imageUrl
        } else if (!imageUrl.startsWith('http')) {
          continue // Skip relative paths we can't resolve
        }

        // Skip small images, icons, and data URLs
        if (imageUrl.includes('data:') || imageUrl.includes('base64') || 
            imageUrl.includes('icon') || imageUrl.includes('favicon') ||
            imageUrl.match(/\.(svg|ico)(\?|$)/i)) {
          continue
        }

        assets.allImages.push(imageUrl)
        
        // Try to categorize images
        const imgTag = match[0].toLowerCase()
        const imgClass = (imgTag.match(/class=["']([^"']+)["']/) || [])[1] || ''
        const imgAlt = (imgTag.match(/alt=["']([^"']+)["']/) || [])[1] || ''
        const imgId = (imgTag.match(/id=["']([^"']+)["']/) || [])[1] || ''
        
        const contextText = (imgClass + ' ' + imgAlt + ' ' + imgId).toLowerCase()
        
        if (logoRegex.test(contextText) || logoRegex.test(imageUrl)) {
          assets.logos.push(imageUrl)
        } else if (heroRegex.test(contextText) || heroRegex.test(imageUrl)) {
          assets.heroImages.push(imageUrl)
        } else {
          assets.productImages.push(imageUrl)
        }
      }

      // Extract potential brand colors from CSS
      const colorRegex = /#([0-9a-f]{3,6})\b/gi
      let colorMatch
      while ((colorMatch = colorRegex.exec(page.html)) !== null) {
        const color = '#' + colorMatch[1]
        if (color.length === 4 || color.length === 7) {
          assets.brandColors.push(color)
        }
      }

      // Extract contact info from HTML
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g
      
      // Extract location/address info
      const locationPatterns = [
        // Common address patterns
        /(\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Place|Pl|Court|Ct))/gi,
        // City, State patterns
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2}|\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\d{4,5}/g,
        // Just city names in common contexts
        /(located in|based in|visit us at|find us in|our|office|store)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
      ]
      
      // Look for location keywords
      const locationKeywords = ['address', 'location', 'visit', 'contact', 'office', 'store', 'branch']
      const locationContext = locationKeywords.some(keyword => 
        page.html.toLowerCase().includes(keyword)
      )
      
      const emails = page.html.match(emailRegex) || []
      const phones = page.html.match(phoneRegex) || []
      
      if (emails.length > 0 && !assets.businessInfo.email) {
        assets.businessInfo.email = emails[0]
      }
      if (phones.length > 0 && !assets.businessInfo.phone) {
        assets.businessInfo.phone = phones[0]
      }
      
      // Extract location information
      if (locationContext && !assets.businessInfo.location) {
        locationPatterns.forEach(pattern => {
          const matches = page.html.match(pattern)
          if (matches && matches.length > 0) {
            // Take the first reasonable location match
            const location = matches[0].replace(/^(located in|based in|visit us at|find us in|our|office|store)\s+/gi, '').trim()
            if (location.length > 5 && location.length < 100) {
              assets.businessInfo.location = location
            }
          }
        })
      }
    }

    // Extract from markdown content for image references
    if (page.markdown) {
      const markdownImgRegex = /!\[.*?\]\((.*?)\)/g
      let match
      while ((match = markdownImgRegex.exec(page.markdown)) !== null) {
        const imageUrl = match[1]
        if (imageUrl.startsWith('http') || imageUrl.startsWith('//')) {
          assets.allImages.push(imageUrl)
        }
      }
    }
  })

  // Add image search results if available
  if (imageSearchResults?.results) {
    imageSearchResults.results.forEach((result: any) => {
      if (result.url && result.url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
        assets.allImages.push(result.url)
        
        // Categorize search results as logos if they seem logo-related
        const title = (result.title || '').toLowerCase()
        const description = (result.description || '').toLowerCase()
        
        if (title.includes('logo') || description.includes('logo') || 
            title.includes('brand') || description.includes('brand')) {
          assets.logos.push(result.url)
        } else {
          assets.productImages.push(result.url)
        }
      }
    })
  }

  // Remove duplicates and clean up URLs
  assets.logos = Array.from(new Set(assets.logos)).filter(url => url && url.length > 0)
  assets.heroImages = Array.from(new Set(assets.heroImages)).filter(url => url && url.length > 0)
  assets.productImages = Array.from(new Set(assets.productImages)).filter(url => url && url.length > 0)
  assets.allImages = Array.from(new Set(assets.allImages)).filter(url => url && url.length > 0)
  assets.brandColors = Array.from(new Set(assets.brandColors)).filter(color => color && color.length > 0)

  return assets
}

// Helper function to extract business name from URL
function extractBusinessNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.replace('www.', '')
    const parts = domain.split('.')
    
    // Take the main domain part (before .com, .net, etc)
    const businessName = parts[0]
    
    // Convert to readable format
    return businessName.charAt(0).toUpperCase() + businessName.slice(1)
  } catch {
    return 'business'
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting website crawl...')
    
    const { websiteUrl } = await request.json()
    
    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 })
    }

    console.log('🌐 Crawling website:', websiteUrl)

    const firecrawlUrl = 'https://api.firecrawl.dev/v2/crawl'
    const options = {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fc-74855b7bfe6a47139f84c883bf5f0ea1',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: websiteUrl,
        limit: 10,
        scrapeOptions: {
          formats: ["markdown", "html"],
          onlyMainContent: true,
          maxAge: 300000 // 5 minutes cache
        }
      })
    }

    console.log('📡 Sending request to Firecrawl API...')
    const response = await fetch(firecrawlUrl, options)
    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Firecrawl API error:', data)
      console.error('❌ Response status:', response.status)
      console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()))
      return NextResponse.json({ 
        error: 'Failed to crawl website',
        details: data,
        firecrawlStatus: response.status,
        firecrawlResponse: data
      }, { status: response.status })
    }

    console.log('✅ Website crawling initiated successfully')
    console.log('📋 Crawl job data:', data)

    // Store the job for now - we'll do image search after crawling completes and we have location data

    // The V2 API returns a job ID that we need to poll for results
    return NextResponse.json({
      success: true,
      jobId: data.id,
      status: data.status,
      message: 'Website crawling initiated. Use the job ID to check status.'
    })

  } catch (error: any) {
    console.error('💥 Crawl API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    console.log('🔍 Checking crawl status for job:', jobId)

    const response = await fetch(`https://api.firecrawl.dev/v2/crawl/${jobId}`, {
      headers: {
        Authorization: 'Bearer fc-74855b7bfe6a47139f84c883bf5f0ea1'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Firecrawl status check error:', data)
      return NextResponse.json({ 
        error: 'Failed to check crawl status',
        details: data 
      }, { status: response.status })
    }

    console.log('📊 Crawl status:', data.status)

    // Extract visual assets from crawled data first
    const visualAssets = data.data ? extractVisualAssets(data.data) : null
    
    // Now do smart image search if we have business info
    let enhancedVisualAssets = visualAssets
    if (visualAssets && data.status === 'completed') {
      try {
        console.log('🖼️ Starting smart image search with business context...')
        // Extract business name from the jobId or use crawled data
        const firstPageUrl = data.data?.[0]?.metadata?.url || ''
        const businessName = firstPageUrl ? extractBusinessNameFromUrl(firstPageUrl) : 'business'
        const location = visualAssets.businessInfo?.location || ''
        
        // Create a more targeted search query
        let searchQuery = businessName
        if (location) {
          searchQuery += ` ${location}`
        }
        searchQuery += ' logo brand images'
        
        console.log('🔍 Image search query:', searchQuery)
        
        const searchResponse = await fetch('https://api.firecrawl.dev/v2/search', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer fc-74855b7bfe6a47139f84c883bf5f0ea1',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: searchQuery,
            sources: ["images"],
            limit: 8
          })
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          console.log('✅ Smart image search completed:', searchData.results?.length || 0, 'images found')
          
          // Merge search results into visual assets
          enhancedVisualAssets = extractVisualAssets(data.data, searchData)
        } else {
          console.log('⚠️ Image search failed, using crawl results only')
        }
      } catch (error) {
        console.log('⚠️ Image search error, using crawl results only:', error)
      }
    }

    // Extract screenshot but prevent base64 data from being passed along
    let screenshotUrl = data.data?.[0]?.screenshot
    if (screenshotUrl && (screenshotUrl.startsWith('data:image/') || screenshotUrl.includes('base64'))) {
      console.warn('⚠️ BLOCKED: Firecrawl returned base64 screenshot data instead of URL - this would cause massive token costs!')
      screenshotUrl = null // Don't pass base64 data
    }

    return NextResponse.json({
      jobId: data.id,
      status: data.status,
      total: data.total,
      completed: data.completed,
      creditsUsed: data.creditsUsed,
      expiresAt: data.expiresAt,
      data: data.data || [],
      visualAssets: enhancedVisualAssets,
      screenshot: screenshotUrl // Only pass URL, never base64 data
    })

  } catch (error: any) {
    console.error('💥 Status Check API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
