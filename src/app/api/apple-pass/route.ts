import { NextResponse } from 'next/server'
import { ApplePassKitGenerator } from '../../../lib/apple-passkit-generator'
import { setPassInStore, getPassStoreSize } from '@/lib/pass-store'

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

    console.log('🍎 Apple Pass Generation Request:')
    console.log('Template ID:', templateId)
    console.log('Form Data:', formData)
    console.log('Device Type:', deviceType)

    // Generate the Apple-compliant .pkpass file
    const { response, passBuffer, actualData } = await ApplePassKitGenerator.generateApplePass({
      templateId,
      formData,
      userId,
      deviceType: deviceType || 'desktop'
    })

    // Store the pass for Apple PassKit web service and downloads
    await ApplePassKitGenerator.storePassInDatabase(
      response.serialNumber,
      response.passTypeIdentifier,
      passBuffer,
      actualData, // Use actualData from GOLDEN RULES implementation
      templateId
    )

    // Also store in memory for immediate downloads
    setPassInStore(response.serialNumber, {
      templateId,
      formData: actualData, // Use actualData (template values) not original formData
      passBuffer,
      createdAt: new Date()
    })
    console.log(`📦 Stored pass ${response.serialNumber} in memory store (size: ${getPassStoreSize()})`)

    console.log('✅ Apple Pass Generated Successfully!')
    console.log('🔗 Download URL:', response.downloadUrl)
    console.log('🆔 Serial Number:', response.serialNumber)
    console.log('📱 Pass Type ID:', response.passTypeIdentifier)

    // Return Apple-compliant response format
    return NextResponse.json({
      url: response.downloadUrl,
      passTypeIdentifier: response.passTypeIdentifier,
      serialNumber: response.serialNumber,
      
      // Additional WalletPush metadata
      meta: {
        success: true,
        passSize: passBuffer.length,
        downloadUrl: `/api/apple-pass/${response.serialNumber}/download`,
        templateId: templateId,
        createdAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Apple Pass Generation Error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: error.message,
          type: 'PassGenerationError'
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate Apple Pass',
        type: 'UnknownError'
      },
      { status: 500 }
    )
  }
}
