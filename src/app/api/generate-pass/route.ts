import { NextResponse } from 'next/server'
import { PassKitGenerator } from '../../../lib/passkit-generator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { templateId, formData, userId, deviceType } = body

    // Validate required fields
    if (!templateId || !formData) {
      return NextResponse.json(
        { error: 'templateId and formData are required' },
        { status: 400 }
      )
    }

    console.log('Generating pass for template:', templateId)
    console.log('Form data:', formData)

    // Generate the .pkpass file
    const passBuffer = await PassKitGenerator.generatePass({
      templateId,
      formData,
      userId,
      deviceType: deviceType || 'desktop'
    })

    // Generate a unique identifier for this pass
    const serialNumber = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // In production, you would store the pass in a database or file system
    // For now, we'll return the pass directly
    
    const passUrl = PassKitGenerator.generatePassUrl(serialNumber)

    return NextResponse.json({
      success: true,
      serialNumber,
      passUrl,
      downloadUrl: `/api/passes/${serialNumber}/download`,
      message: 'Pass generated successfully',
      passSize: passBuffer.length
    })

  } catch (error) {
    console.error('Error generating pass:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate pass' },
      { status: 500 }
    )
  }
}
