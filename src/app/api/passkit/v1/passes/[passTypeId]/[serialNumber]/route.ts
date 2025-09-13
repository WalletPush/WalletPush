import { NextResponse } from 'next/server'
import { ApplePassKitGenerator } from '../../../../../../lib/apple-passkit-generator'

// Apple PassKit Web Service - Get Latest Pass
// https://developer.apple.com/documentation/walletpasses/adding_a_web_service_to_update_passes

export async function GET(
  request: Request,
  { params }: { params: { passTypeId: string; serialNumber: string } }
) {
  try {
    const { passTypeId, serialNumber } = params
    const authToken = request.headers.get('Authorization')?.replace('ApplePass ', '')
    const ifModifiedSince = request.headers.get('If-Modified-Since')

    console.log(`📱 Apple PassKit Get Latest Pass:`)
    console.log(`Pass Type: ${passTypeId}`)
    console.log(`Serial: ${serialNumber}`)
    console.log(`Auth: ${authToken}`)
    console.log(`If-Modified-Since: ${ifModifiedSince}`)

    // Validate the authorization token
    if (authToken !== serialNumber) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      )
    }

    // Check if pass exists and get last modified date
    // TODO: Look up in Supabase database
    
    // For demo, let's check if we have updates
    const lastModified = new Date()
    const modifiedSince = ifModifiedSince ? new Date(ifModifiedSince) : new Date(0)

    if (lastModified <= modifiedSince) {
      // Pass hasn't been modified
      return NextResponse.json({}, { status: 304 })
    }

    // Generate the latest version of the pass
    const mockFormData = {
      'First_Name': 'David',
      'Last_Name': 'Sambor',
      'Email': 'david.sambor@icloud.com',
      'Points': '1000', // Updated points!
      'member_since': '2024',
      'tier': 'Platinum'
    }

    const { passBuffer } = await ApplePassKitGenerator.generateApplePass({
      templateId: 'your-template-id',
      formData: mockFormData,
      userId: 'david-sambor',
      deviceType: 'mobile'
    })

    console.log(`✅ Serving updated pass: ${passBuffer.length} bytes`)

    // Return the updated .pkpass file
    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.apple.pkpass')
    headers.set('Last-Modified', lastModified.toUTCString())
    headers.set('Cache-Control', 'no-cache')

    return new NextResponse(passBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('❌ PassKit Get Latest Pass Error:', error)
    return NextResponse.json(
      { error: 'Pass not found' },
      { status: 404 }
    )
  }
}
