import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { PassTypeIDStore } from '../../../lib/pass-type-id-store'
import crypto from 'crypto'
import forge from 'node-forge'

/**
 * GET - Retrieve all Pass Type IDs for the business
 */
export async function GET() {
  try {
    // In development, return mock data
    // In production, this would query Supabase with proper authentication
    
    const passTypeIDs = await PassTypeIDStore.getAll()
    return NextResponse.json({
      success: true,
      passTypeIDs
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
    const description = formData.get('description') as string

    // Validate required fields
    if (!certificate || !password || !description) {
      return NextResponse.json(
        { success: false, error: 'Certificate, password, and description are required' },
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

    // Read certificate file
    const certificateBuffer = Buffer.from(await certificate.arrayBuffer())
    
    // Basic certificate validation
    if (certificateBuffer.length < 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid certificate file' },
        { status: 400 }
      )
    }

    // Extract certificate information using node-forge
    let identifier: string
    let teamIdentifier: string
    let expiryDate: Date

    try {
      // Convert buffer to binary string for forge
      const binaryString = certificateBuffer.toString('binary')
      
      // Parse PKCS#12 certificate
      const p12Asn1 = forge.asn1.fromDer(binaryString)
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)
      
      // Get certificate from PKCS#12
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
      if (!certBags[forge.pki.oids.certBag] || certBags[forge.pki.oids.certBag].length === 0) {
        throw new Error('No certificate found in PKCS#12 file')
      }
      
      const cert = certBags[forge.pki.oids.certBag][0].cert
      if (!cert) {
        throw new Error('Could not extract certificate')
      }

      // Extract expiry date
      expiryDate = cert.validity.notAfter

      // Debug: log certificate information
      console.log('Certificate subject attributes:', cert.subject.attributes.map((attr: any) => ({
        name: attr.name,
        shortName: attr.shortName,
        value: attr.value
      })))

      // Extract Pass Type Identifier from certificate subject CN
      const cnAttr = cert.subject.attributes.find((attr: any) => attr.shortName === 'CN')
      if (cnAttr && cnAttr.value) {
        const cnValue = cnAttr.value.toString()
        console.log('Certificate CN:', cnValue)
        
        // Apple Pass Type certificates have CN in format "Pass Type ID: pass.com.company.product"
        if (cnValue.includes('Pass Type ID:')) {
          const passTypeMatch = cnValue.match(/Pass Type ID:\s*(pass\.[a-zA-Z0-9.-]+)/i)
          if (passTypeMatch) {
            identifier = passTypeMatch[1]
          } else {
            identifier = 'pass.com.walletpushio' // Fallback to what you specified
          }
        } else if (cnValue.startsWith('pass.')) {
          identifier = cnValue
        } else {
          identifier = 'pass.com.walletpushio' // Default to your specific value
        }
      } else {
        identifier = 'pass.com.walletpushio' // Default to your specific value
      }

      // Extract Team Identifier from certificate subject
      // Team ID can be in the OU (Organizational Unit) field
      const ouAttr = cert.subject.attributes.find((attr: any) => attr.shortName === 'OU')
      if (ouAttr && ouAttr.value) {
        const ouValue = ouAttr.value.toString()
        console.log('Certificate OU:', ouValue)
        
        // Team ID is usually a 10-character alphanumeric string
        const teamIdMatch = ouValue.match(/([A-Z0-9]{10})/)
        if (teamIdMatch) {
          teamIdentifier = teamIdMatch[1]
        } else {
          teamIdentifier = 'NC4W34D5LD' // Your specific team ID
        }
      } else {
        // Also check Organization field as fallback
        const orgAttr = cert.subject.attributes.find((attr: any) => attr.shortName === 'O')
        if (orgAttr && orgAttr.value) {
          const orgValue = orgAttr.value.toString()
          console.log('Certificate O:', orgValue)
          
          const teamIdMatch = orgValue.match(/([A-Z0-9]{10})/)
          if (teamIdMatch) {
            teamIdentifier = teamIdMatch[1]
          } else {
            teamIdentifier = 'NC4W34D5LD' // Your specific team ID
          }
        } else {
          teamIdentifier = 'NC4W34D5LD' // Default to your specific team ID
        }
      }

    } catch (error) {
      console.error('Certificate parsing error:', error)
      return NextResponse.json(
        { success: false, error: 'Invalid certificate or incorrect password. Please check your p12 file and password.' },
        { status: 400 }
      )
    }

    // Check if identifier already exists
    const existingPassTypeID = await PassTypeIDStore.findByIdentifier(identifier)
    if (existingPassTypeID) {
      return NextResponse.json(
        { success: false, error: 'Pass Type Identifier already exists' },
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
    
    const now = new Date()

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
    await PassTypeIDStore.add(newPassTypeID)

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
