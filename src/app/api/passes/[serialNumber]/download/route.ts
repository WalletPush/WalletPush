import { NextResponse } from 'next/server'
import { PassKitGenerator } from '../../../../../lib/passkit-generator'

export async function GET(
  request: Request,
  { params }: { params: { serialNumber: string } }
) {
  try {
    const { serialNumber } = params

    // In production, you would:
    // 1. Look up the pass by serial number in your database
    // 2. Get the associated template and form data
    // 3. Regenerate or retrieve the stored pass

    // For demo purposes, we'll generate a sample pass
    const mockFormData = {
      'First_Name': 'John',
      'Last_Name': 'Doe', 
      'Email': 'john.doe@example.com',
      'Points': '250'
    }

    console.log(`Downloading pass: ${serialNumber}`)

    // Generate the pass
    const passBuffer = await PassKitGenerator.generatePass({
      templateId: 'demo-template',
      formData: mockFormData,
      userId: 'demo-user',
      deviceType: 'mobile'
    })

    // Set proper headers for .pkpass download
    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.apple.pkpass')
    headers.set('Content-Disposition', `attachment; filename="pass-${serialNumber}.pkpass"`)
    headers.set('Content-Length', passBuffer.length.toString())

    return new NextResponse(passBuffer as BodyInit, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error downloading pass:', error)
    
    return NextResponse.json(
      { error: 'Pass not found or could not be generated' },
      { status: 404 }
    )
  }
}
