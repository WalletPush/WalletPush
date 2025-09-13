import { NextResponse } from 'next/server'
import { PassTypeIDStore } from '../../../../../lib/pass-type-id-store'
import { createHash } from 'crypto'
import archiver from 'archiver'

export async function GET(
  request: Request,
  { params }: { params: { serialNumber: string } }
) {
  try {
    const { serialNumber } = params

    console.log(`Generating downloadable pass: ${serialNumber}`)

    // Get default Pass Type ID
    const passTypeID = await PassTypeIDStore.getDefault()
    if (!passTypeID) {
      return NextResponse.json(
        { error: 'No default Pass Type ID configured' },
        { status: 400 }
      )
    }

    // Create a rich pass.json with your data
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: passTypeID.identifier,
      serialNumber: serialNumber,
      teamIdentifier: passTypeID.team_identifier,
      organizationName: 'WalletPush',
      description: 'WalletPush Loyalty Pass',
      
      storeCard: {
        headerFields: [
          {
            key: 'header',
            label: 'LOYALTY PROGRAM',
            value: 'WalletPush'
          }
        ],
        primaryFields: [
          {
            key: 'member',
            label: 'Member',
            value: 'David Sambor',
            textAlignment: 'PKTextAlignmentLeft'
          }
        ],
        secondaryFields: [
          {
            key: 'points',
            label: 'Points',
            value: '500',
            textAlignment: 'PKTextAlignmentRight'
          },
          {
            key: 'tier',
            label: 'Tier',
            value: 'Gold',
            textAlignment: 'PKTextAlignmentLeft'
          }
        ],
        auxiliaryFields: [
          {
            key: 'expires',
            label: 'Expires',
            value: 'Never',
            textAlignment: 'PKTextAlignmentCenter'
          }
        ],
        backFields: [
          {
            key: 'email',
            label: 'Email',
            value: 'david.sambor@icloud.com'
          },
          {
            key: 'website',
            label: 'Website',
            value: 'walletpush.io'
          },
          {
            key: 'terms',
            label: 'Terms & Conditions',
            value: 'Visit walletpush.io/terms for full terms and conditions.'
          }
        ]
      },

      backgroundColor: 'rgb(26, 26, 26)',
      foregroundColor: 'rgb(255, 255, 255)',
      labelColor: 'rgb(204, 204, 204)',

      barcodes: [
        {
          message: 'david.sambor@icloud.com',
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1',
          altText: 'Scan to view profile'
        }
      ],

      // Web service for pass updates
      webServiceURL: 'https://walletpush.io',
      authenticationToken: serialNumber,

      // Pass relevance
      relevantDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now

      // User info
      userInfo: {
        serialNumber: serialNumber,
        email: 'david.sambor@icloud.com',
        created: new Date().toISOString()
      }
    }

    // Create a simple icon (Apple requires this)
    const iconSvg = `
      <svg width="87" height="87" viewBox="0 0 87 87" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="87" height="87" fill="url(#grad1)" rx="12"/>
        <text x="43.5" y="50" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">WP</text>
      </svg>
    `

    // Convert SVG to a simple placeholder
    const iconBuffer = Buffer.from(iconSvg, 'utf8')

    // Create manifest with checksums
    const passJsonBuffer = Buffer.from(JSON.stringify(passJson, null, 2))
    
    const manifest = {
      'pass.json': createHash('sha1').update(passJsonBuffer).digest('hex'),
      'icon.png': createHash('sha1').update(iconBuffer).digest('hex'),
      'icon@2x.png': createHash('sha1').update(iconBuffer).digest('hex'),
      'icon@3x.png': createHash('sha1').update(iconBuffer).digest('hex')
    }

    const manifestBuffer = Buffer.from(JSON.stringify(manifest))
    
    // Create a more realistic mock signature
    const signatureData = {
      manifest: manifest,
      passTypeIdentifier: passTypeID.identifier,
      teamIdentifier: passTypeID.team_identifier,
      timestamp: new Date().toISOString()
    }
    const signature = Buffer.from(JSON.stringify(signatureData))

    // Create the .pkpass archive
    const passBuffer = await new Promise<Buffer>((resolve, reject) => {
      const archive = archiver('zip', { 
        zlib: { level: 9 },
        store: true // Use no compression for better compatibility
      })
      const chunks: Buffer[] = []

      archive.on('data', (chunk) => chunks.push(chunk))
      archive.on('end', () => resolve(Buffer.concat(chunks)))
      archive.on('error', reject)

      // Add required files
      archive.append(passJsonBuffer, { name: 'pass.json' })
      archive.append(manifestBuffer, { name: 'manifest.json' })
      archive.append(signature, { name: 'signature' })
      
      // Add icon files (required by Apple)
      archive.append(iconBuffer, { name: 'icon.png' })
      archive.append(iconBuffer, { name: 'icon@2x.png' })
      archive.append(iconBuffer, { name: 'icon@3x.png' })

      archive.finalize()
    })

    console.log(`Generated .pkpass file: ${passBuffer.length} bytes`)

    // Set proper headers for .pkpass download
    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.apple.pkpass')
    headers.set('Content-Disposition', `attachment; filename="WalletPush-${serialNumber}.pkpass"`)
    headers.set('Content-Length', passBuffer.length.toString())
    headers.set('Cache-Control', 'no-cache')

    return new NextResponse(passBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error generating downloadable pass:', error)
    
    return NextResponse.json(
      { error: 'Failed to generate pass download' },
      { status: 500 }
    )
  }
}
