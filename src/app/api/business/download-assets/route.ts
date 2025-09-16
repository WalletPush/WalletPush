import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'
import { promises as fsPromises } from 'fs'

interface AssetDownloadRequest {
  businessId: string
  programName: string
  logoUrls: string[]
  heroImageUrls: string[]
}

interface DownloadedAsset {
  originalUrl: string
  localPath: string
  filename: string
  success: boolean
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, programName, logoUrls, heroImageUrls }: AssetDownloadRequest = await request.json()

    // Create business-specific directory
    const businessDir = path.join(process.cwd(), 'public', 'generated-assets', `business-${businessId}`)
    await fsPromises.mkdir(businessDir, { recursive: true })

    console.log(`Created directory: ${businessDir}`)
    console.log(`Downloading ${logoUrls.length} logos and ${heroImageUrls.length} hero images...`)

    // Download logos
    const downloadedLogos: DownloadedAsset[] = []
    for (let i = 0; i < logoUrls.length; i++) {
      const logoUrl = logoUrls[i]
      if (!logoUrl || logoUrl === 'None') continue

      try {
        const filename = `logo-${i + 1}-${Date.now()}.jpg`
        const localPath = `/generated-assets/business-${businessId}/${filename}`
        const fullPath = path.join(businessDir, filename)

        console.log(`Downloading logo ${i + 1}: ${logoUrl}`)
        
        const response = await fetch(logoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; WalletPush/1.0)',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const buffer = await response.arrayBuffer()
        await fsPromises.writeFile(fullPath, Buffer.from(buffer))

        downloadedLogos.push({
          originalUrl: logoUrl,
          localPath,
          filename,
          success: true
        })

        console.log(`✅ Logo ${i + 1} downloaded successfully`)
      } catch (error) {
        console.error(`❌ Failed to download logo ${i + 1}:`, error)
        downloadedLogos.push({
          originalUrl: logoUrl,
          localPath: '',
          filename: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Download hero images (limit to 7)
    const downloadedHeroImages: DownloadedAsset[] = []
    const heroUrlsToDownload = heroImageUrls.slice(0, 7)
    
    for (let i = 0; i < heroUrlsToDownload.length; i++) {
      const heroUrl = heroUrlsToDownload[i]
      if (!heroUrl || heroUrl === 'None') continue

      try {
        const filename = `hero-${i + 1}-${Date.now()}.jpg`
        const localPath = `/generated-assets/business-${businessId}/${filename}`
        const fullPath = path.join(businessDir, filename)

        console.log(`Downloading hero image ${i + 1}: ${heroUrl}`)
        
        const response = await fetch(heroUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; WalletPush/1.0)',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const buffer = await response.arrayBuffer()
        await fsPromises.writeFile(fullPath, Buffer.from(buffer))

        downloadedHeroImages.push({
          originalUrl: heroUrl,
          localPath,
          filename,
          success: true
        })

        console.log(`✅ Hero image ${i + 1} downloaded successfully`)
      } catch (error) {
        console.error(`❌ Failed to download hero image ${i + 1}:`, error)
        downloadedHeroImages.push({
          originalUrl: heroUrl,
          localPath: '',
          filename: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Get the best assets for the pass (first successful downloads)
    const bestLogo = downloadedLogos.find(logo => logo.success)
    const bestStripImage = downloadedHeroImages.find(hero => hero.success)

    // Summary
    const summary = {
      businessId,
      programName,
      downloadDirectory: `/generated-assets/business-${businessId}/`,
      logos: {
        attempted: logoUrls.length,
        successful: downloadedLogos.filter(l => l.success).length,
        failed: downloadedLogos.filter(l => !l.success).length,
        assets: downloadedLogos
      },
      heroImages: {
        attempted: heroUrlsToDownload.length,
        successful: downloadedHeroImages.filter(h => h.success).length,
        failed: downloadedHeroImages.filter(h => !h.success).length,
        assets: downloadedHeroImages
      },
      passAssets: {
        logoUrl: bestLogo?.localPath || '/ai-copilot-assets/default-icon.png',
        stripImageUrl: bestStripImage?.localPath || null
      },
      landingAssets: {
        allLogos: downloadedLogos.filter(l => l.success).map(l => l.localPath),
        allHeroImages: downloadedHeroImages.filter(h => h.success).map(h => h.localPath)
      }
    }

    console.log('Asset download summary:', summary)

    return NextResponse.json({ 
      success: true,
      message: `Downloaded ${summary.logos.successful} logos and ${summary.heroImages.successful} hero images`,
      ...summary
    })

  } catch (error) {
    console.error('Asset download error:', error)
    return NextResponse.json({ 
      error: 'Failed to download assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
