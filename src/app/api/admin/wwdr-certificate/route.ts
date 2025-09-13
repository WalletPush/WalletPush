import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('📨 WWDR Certificate upload request received')
    console.log('📨 Content-Type:', request.headers.get('content-type'))
    
    const formData = await request.formData()
    const file = formData.get('wwdr_certificate') as File
    const description = formData.get('description') as string
    
    console.log('📁 Form data received:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      description
    })

    if (!file) {
      return NextResponse.json(
        { error: 'No WWDR certificate file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.cer') && !file.name.toLowerCase().endsWith('.crt')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a .cer or .crt file' },
        { status: 400 }
      )
    }

    console.log(`📁 Uploading WWDR certificate: ${file.name} (${file.size} bytes)`)

    // Create certificates directory if it doesn't exist
    const certificatesDir = path.join(process.cwd(), 'private', 'certificates', 'global')
    if (!existsSync(certificatesDir)) {
      await mkdir(certificatesDir, { recursive: true })
    }

    // Save the WWDR certificate file
    const wwdrPath = path.join(certificatesDir, 'AppleWWDRCAG4.cer')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(wwdrPath, buffer)
    console.log(`✅ WWDR certificate saved to: ${wwdrPath}`)

    // Convert to PEM format for OpenSSL compatibility
    const { execSync } = require('child_process')
    const pemPath = path.join(certificatesDir, 'AppleWWDRCAG4.pem')
    
    try {
      // First try DER format (most common for .cer files)
      execSync(`openssl x509 -inform DER -in "${wwdrPath}" -out "${pemPath}"`, { stdio: 'pipe' })
      console.log(`✅ WWDR certificate converted to PEM (DER format): ${pemPath}`)
    } catch (derError) {
      try {
        // If DER fails, try PEM format (in case the .cer is already in PEM format)
        execSync(`openssl x509 -inform PEM -in "${wwdrPath}" -out "${pemPath}"`, { stdio: 'pipe' })
        console.log(`✅ WWDR certificate converted to PEM (PEM format): ${pemPath}`)
      } catch (pemError) {
        console.error('⚠️ Failed to convert WWDR to PEM (tried both DER and PEM formats):', {
          derError: derError.message,
          pemError: pemError.message
        })
        // Continue anyway, the .cer file might still work for signing
      }
    }

    return NextResponse.json({
      success: true,
      message: 'WWDR certificate uploaded successfully',
      wwdr_path: wwdrPath,
      pem_path: pemPath,
      description: description || 'Apple WWDR Certificate',
      file_size: file.size,
      uploaded_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ WWDR certificate upload error:', error)
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

