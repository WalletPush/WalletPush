import { NextResponse } from 'next/server'
import { ApplePassKitGenerator } from '../../../../../lib/apple-passkit-generator'
// Use shared pass store from main route
import { passStore } from '../../route'

/**
 * DYNAMIC helper function to get the most recent template ID
 */
async function getMostRecentTemplateId(): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/templates`, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.status}`)
    }
    
    const { data: templates } = await response.json()
    if (templates && templates.length > 0) {
      return templates[0].id // Most recent template
    }
    
    throw new Error('No templates found')
  } catch (error) {
    console.error('❌ Failed to get template ID:', error)
    // Fallback to Blue Karma template ID
    return 'ae76dc2a-e295-4219-b5ce-f6ecd8961de1'
  }
}

/**
 * DYNAMIC helper function to extract placeholder defaults from any template
 */
async function extractPlaceholderDefaultsFromTemplate(templateId: string): Promise<{ [key: string]: string }> {
  try {
    console.log(`🎯 Extracting placeholders for template: ${templateId}`)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/templates`, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.status}`)
    }
    
    const { data: templates } = await response.json()
    const template = templates.find((t: any) => t.id === templateId)
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }
    
    console.log(`✅ Found template: ${template.template_json?.name || 'Unnamed'}`)
    console.log(`🎯 Has PassKit JSON: ${template.passkit_json ? 'YES' : 'NO'}`)
    
    // If template has PassKit JSON with placeholders, use those!
    if (template.passkit_json?.placeholders) {
      console.log(`📋 Using stored placeholder defaults:`, template.passkit_json.placeholders)
      return template.passkit_json.placeholders
    }
    
    // Extract placeholders from the template's field values
    console.log(`⚠️ No stored placeholders found, extracting from template fields`)
    const placeholders: { [key: string]: string } = {}
    
    // Extract from template_json fields
    if (template.template_json?.fields) {
      for (const field of template.template_json.fields) {
        if (field.value && field.value.includes('${')) {
          // Extract placeholder name from ${PLACEHOLDER_NAME}
          const matches = field.value.match(/\$\{([^}]+)\}/g)
          if (matches) {
            for (const match of matches) {
              const placeholderName = match.replace(/\$\{|\}/g, '')
              // Use the field's current value or a default
              placeholders[placeholderName] = field.defaultValue || field.value || `Sample ${placeholderName}`
            }
          }
        }
      }
    }
    
    console.log(`🎯 Extracted placeholders from template:`, placeholders)
    
    // If we found placeholders, use them
    if (Object.keys(placeholders).length > 0) {
      return placeholders
    }
    
    // Ultimate fallback for Blue Karma template
    return {
      'Points': '0',
      'Current_Offer': '20% Discount Off Your Next Visit',
      'First_Name': 'John',
      'Last_Name': 'Doe',
      'MEMBER_ID': '1234',
      'Email': 'john.doe@bluekarma.com'
    }
    
  } catch (error) {
    console.error('❌ Failed to extract placeholders:', error)
    
    // Ultimate fallback
    return {
      'Points': '0',
      'Current_Offer': '20% Discount Off Your Next Visit',
      'First_Name': 'John',
      'Last_Name': 'Doe',
      'MEMBER_ID': '1234',
      'Email': 'john.doe@example.com'
    }
  }
}

export async function GET(
  request: Request,
  { params }: { params: { serialNumber: string } }
) {
  try {
    const { serialNumber } = params

    console.log(`📱 Apple Pass Download Request: ${serialNumber}`)

    // First, try to find the stored pass data
    let passData = passStore.get(serialNumber)
    
    console.log(`🔍 Looking for pass: ${serialNumber}`)
    console.log(`🔍 Store size: ${passStore.size}`)
    console.log(`🔍 Store contents:`, Array.from(passStore.keys()))
    console.log(`🔍 Pass found in store: ${!!passData}`)
    
    if (!passData) {
      // If not found, this might be a preview pass, try to generate with default data
      console.log(`⚠️ Pass ${serialNumber} not found in store, generating with preview data`)
      
      // Force Blue Karma template for testing
      const templateId = 'ae76dc2a-e295-4219-b5ce-f6ecd8961de1'
      
      // DYNAMIC: Use the template's stored placeholder defaults
      const sampleFormData = await extractPlaceholderDefaultsFromTemplate(templateId)

      passData = {
        templateId,
        formData: sampleFormData,
        createdAt: new Date()
      }
    }

    // Generate or regenerate the pass
    let passBuffer = passData.passBuffer
    
    if (!passBuffer) {
      console.log(`🔄 Generating new pass for ${serialNumber}`)
      
      const { response, passBuffer: newPassBuffer } = await ApplePassKitGenerator.generateApplePass({
        templateId: passData.templateId,
        formData: passData.formData,
        userId: 'user',
        deviceType: 'desktop'
      })

      passBuffer = newPassBuffer
      
      // Cache the generated pass
      passStore.set(serialNumber, {
        ...passData,
        passBuffer
      })
      
      console.log(`✅ Generated .pkpass: ${passBuffer.length} bytes`)
    } else {
      console.log(`📦 Serving cached pass: ${passBuffer.length} bytes`)
    }

    // Set Apple-compliant headers for .pkpass download
    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.apple.pkpass')
    headers.set('Content-Disposition', `attachment; filename="walletpush-pass-${serialNumber}.pkpass"`)
    headers.set('Content-Length', passBuffer.length.toString())
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')

    // Add CORS headers for web compatibility
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'GET')
    headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return new NextResponse(passBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('❌ Apple Pass Download Error:', error)
    
    // Return user-friendly error
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Pass not found or could not be generated',
        serialNumber: params.serialNumber,
        type: 'PassGenerationError'
      },
      { status: 500 }
    )
  }
}

// Pass data is now stored directly in the main route using shared passStore
