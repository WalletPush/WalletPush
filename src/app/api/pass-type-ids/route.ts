import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { PassTypeIDStore } from '../../../lib/pass-type-id-store'
import crypto from 'crypto'

/**
 * GET - Retrieve all Pass Type IDs for the business
 */
export async function GET() {
  try {
    // In development, return mock data
    // In production, this would query Supabase with proper authentication
    
    return NextResponse.json({
      success: true,
      passTypeIDs: PassTypeIDStore.getAll()
    })
  } catch (error) {
    console.error('Error fetching Pass Type IDs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Pass Type IDs' },
      { status: 500 }
    )
  }
}

/**
 * POST - Upload and store a new Pass Type ID certificate
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    const certificate = formData.get('certificate') as File
    const password = formData.get('password') as string
    const identifier = formData.get('identifier') as string
    const description = formData.get('description') as string
    const teamIdentifier = formData.get('teamIdentifier') as string

    // Validate required fields
    if (!certificate || !password || !identifier || !description || !teamIdentifier) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!certificate.name.endsWith('.p12') && !certificate.name.endsWith('.pfx')) {
      return NextResponse.json(
        { success: false, error: 'Invalid certificate file. Please upload a .p12 or .pfx file' },
        { status: 400 }
      )
    }

    // Validate Pass Type Identifier format
    if (!identifier.startsWith('pass.') || identifier.split('.').length < 3) {
      return NextResponse.json(
        { success: false, error: 'Invalid Pass Type Identifier. Must be in format: pass.com.yourcompany.yourpass' },
        { status: 400 }
      )
    }

    // Check if identifier already exists
    const existingPassTypeID = PassTypeIDStore.findByIdentifier(identifier)
    if (existingPassTypeID) {
      return NextResponse.json(
        { success: false, error: 'Pass Type Identifier already exists' },
        { status: 400 }
      )
    }

    // Validate team identifier format (10 characters, alphanumeric)
    if (!/^[A-Z0-9]{10}$/.test(teamIdentifier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Team Identifier. Must be 10 alphanumeric characters' },
        { status: 400 }
      )
    }

    // Read certificate file
    const certificateBuffer = Buffer.from(await certificate.arrayBuffer())
    
    // Basic certificate validation (in production, use proper certificate parsing)
    if (certificateBuffer.length < 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid certificate file' },
        { status: 400 }
      )
    }

    // Create secure file name
    const fileHash = crypto.createHash('sha256').update(certificateBuffer).digest('hex').substring(0, 16)
    const fileName = `cert_${fileHash}.p12`

    // In production, you would:
    // 1. Validate the certificate against Apple's requirements
    // 2. Extract certificate expiry date and other metadata
    // 3. Encrypt and store the certificate securely
    // 4. Store metadata in database
    
    // For development, simulate certificate processing
    const now = new Date()
    const expiryDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)) // 1 year from now

    const newPassTypeID = {
      id: `pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      identifier,
      description,
      team_identifier: teamIdentifier,
      certificate_file_name: fileName,
      certificate_expiry: expiryDate.toISOString(),
      status: 'active' as const,
      is_default: false, // Will be set by PassTypeIDStore.add()
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      business_id: 'be023bdf-c668-4cec-ac51-65d3c02ea191' // Hardcoded for development
    }

    // Store certificate file (in production, use secure cloud storage)
    // For development, we'll just simulate storage
    console.log(`Certificate stored: ${fileName} (${certificateBuffer.length} bytes)`)

    // Add to development store
    PassTypeIDStore.add(newPassTypeID)

    return NextResponse.json({
      success: true,
      passTypeID: newPassTypeID,
      message: 'Pass Type ID uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading Pass Type ID:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload certificate' },
      { status: 500 }
    )
  }
}
