import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { validatePlaceholderMapping, extractPlaceholdersFromTemplate } from '../../../../lib/placeholder-validator'

/**
 * Create a wallet pass from a landing page form submission
 * This endpoint ensures bulletproof placeholder mapping
 */
export async function POST(
  request: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const { templateId } = params
    const formData = await request.json()
    
    // Get template from our store (development mode)
    const templatesResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/templates`)
    const templatesData = await templatesResponse.json()
    const template = templatesData.data.find((t: any) => t.id === templateId)
    
    if (!template) {
      return NextResponse.json(
        { error: `Template with ID ${templateId} not found` },
        { status: 404 }
      )
    }
    
    // Validate placeholder mapping
    const validation = validatePlaceholderMapping(template.template_json, formData)
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid form data mapping',
          details: validation.errors,
          missingPlaceholders: validation.missingPlaceholders,
          unmatchedFields: validation.unmatchedFormFields
        },
        { status: 400 }
      )
    }
    
    // Create the pass with validated data
    const passData = {
      templateId: templateId,
      data: validation.mappedData,
      serialNumber: `WP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      passTypeIdentifier: `pass.com.walletpush.${templateId}`,
      createdAt: new Date().toISOString()
    }
    
    // For development - simulate pass creation
    const passUrl = `https://wallet.walletpush.io/p/${btoa(JSON.stringify(passData))}`
    
    // In production, this would:
    // 1. Create actual .pkpass file with Apple PassKit
    // 2. Store pass in database
    // 3. Send push notifications if needed
    // 4. Return proper Apple Wallet URL
    
    return NextResponse.json({
      success: true,
      url: passUrl,
      serialNumber: passData.serialNumber,
      passTypeIdentifier: passData.passTypeIdentifier,
      message: 'Pass created successfully'
    })
    
  } catch (error) {
    console.error('Error creating pass:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get template information and required placeholders
 */
export async function GET(
  request: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const { templateId } = params
    
    // Get template from our store
    const templatesResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/templates`)
    const templatesData = await templatesResponse.json()
    const template = templatesData.data.find((t: any) => t.id === templateId)
    
    if (!template) {
      return NextResponse.json(
        { error: `Template with ID ${templateId} not found` },
        { status: 404 }
      )
    }
    
    // Extract placeholder information
    const placeholders = extractPlaceholdersFromTemplate(template.template_json)
    
    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        passType: template.pass_type
      },
      placeholders: placeholders,
      requiredFields: placeholders.filter(p => p.isRequired).map(p => p.name),
      optionalFields: placeholders.filter(p => !p.isRequired).map(p => p.name)
    })
    
  } catch (error) {
    console.error('Error getting template info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
