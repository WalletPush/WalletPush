import { NextRequest, NextResponse } from 'next/server'
import { PassGeneratorWithMapping } from '@/lib/pass-generator-with-mapping'
import { ApplePassKitGenerator } from '@/lib/apple-passkit-generator'

// POST /api/generate-pass-with-mapping - Generate pass using custom field mappings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      templateId, 
      customerId, 
      businessId, 
      formData = {},
      returnType = 'data' // 'data' | 'pass' | 'both'
    } = body

    // Validate required fields
    if (!templateId || !customerId || !businessId) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId, customerId, businessId' },
        { status: 400 }
      )
    }

    console.log('🎫 Generating pass with custom field mapping:', {
      templateId,
      customerId,
      businessId,
      returnType
    })

    // 1. Generate pass data with custom field mappings
    const mappingResult = await PassGeneratorWithMapping.generatePassWithCustomFields({
      templateId,
      customerId,
      businessId,
      formData
    })

    if (!mappingResult.success) {
      throw new Error('Failed to generate pass data with mappings')
    }

    const response: any = {
      success: true,
      mappingResult: {
        fieldsResolved: mappingResult.fieldsResolved,
        mappingsUsed: mappingResult.mappingsUsed,
        passData: mappingResult.passData
      }
    }

    // 2. Optionally generate the actual pass file
    if (returnType === 'pass' || returnType === 'both') {
      try {
        console.log('📱 Generating Apple Pass file...')
        
        const passResult = await ApplePassKitGenerator.generateApplePass({
          templateId,
          formData: mappingResult.passData,
          userId: customerId, // Use customer ID as user ID
          deviceType: 'apple'
        })

        if (returnType === 'pass') {
          // Return the pass file directly
          return new NextResponse(passResult.passBuffer, {
            headers: {
              'Content-Type': 'application/vnd.apple.pkpass',
              'Content-Disposition': `attachment; filename="wallet-pass-${customerId}.pkpass"`
            }
          })
        } else {
          // Include pass data in response
          response.passGeneration = {
            success: true,
            passSize: passResult.passBuffer.length,
            actualData: passResult.actualData
          }
        }

      } catch (passError) {
        console.error('❌ Error generating pass file:', passError)
        response.passGeneration = {
          success: false,
          error: passError instanceof Error ? passError.message : 'Pass generation failed'
        }
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ Pass generation with mapping error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to generate pass with custom field mapping' 
      },
      { status: 500 }
    )
  }
}

// GET /api/generate-pass-with-mapping - Get available mappings for a template
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const templateId = url.searchParams.get('templateId')
    const businessId = url.searchParams.get('businessId')

    if (!templateId || !businessId) {
      return NextResponse.json(
        { error: 'Missing required parameters: templateId, businessId' },
        { status: 400 }
      )
    }

    console.log('🔍 Getting available mappings for template:', templateId)

    const mappings = await PassGeneratorWithMapping.getAvailableMappings(templateId, businessId)

    return NextResponse.json({
      success: true,
      data: mappings
    })

  } catch (error: any) {
    console.error('❌ Error getting available mappings:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to get available mappings' 
      },
      { status: 500 }
    )
  }
}

