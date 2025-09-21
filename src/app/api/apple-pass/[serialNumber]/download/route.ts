import { NextResponse } from 'next/server'
import { ApplePassKitGenerator } from '../../../../../lib/apple-passkit-generator'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  { params }: { params: { serialNumber: string } }
) {
  try {
    const { serialNumber } = params

    console.log(`📱 Apple Pass Download Request: ${serialNumber}`)

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Look up the pass data directly from the passes table
    console.log(`🔍 Looking up pass data for serial: ${serialNumber}`)
    
    const { data: passRecord, error: passError } = await supabase
      .from('passes')
      .select(`
        id,
        serial,
        pass_data,
        template_id,
        customer_id,
        business_id,
        platform,
        install_count,
        created_at,
        customers (
          first_name,
          last_name,
          email,
          phone
        ),
        templates (
          id,
          pass_type_identifier,
          template_json,
          passkit_json
        )
      `)
      .eq('serial', serialNumber)
      .single()

    if (passError || !passRecord) {
      console.error(`❌ Pass not found for serial ${serialNumber}:`, passError)
      return NextResponse.json(
        {
          error: `❌ Pass ${serialNumber} not found`,
          serialNumber,
          type: 'PassNotFoundError'
        },
        { status: 404 }
      )
    }

    // Extract customer and template data safely
    const customer = Array.isArray(passRecord.customers) ? passRecord.customers[0] : passRecord.customers
    const template = Array.isArray(passRecord.templates) ? passRecord.templates[0] : passRecord.templates

    console.log(`✅ Found pass record:`, {
      id: passRecord.id,
      serial: passRecord.serial,
      customer: customer?.email,
      template: template?.id
    })

    // 2. Use the stored pass_data if available, otherwise generate from stored customer data
    let passData = passRecord.pass_data

    if (!passData) {
      console.log(`⚠️ No stored pass_data, regenerating from customer data`)
      
      // Fallback: Regenerate from customer and template data
      // (customer and template already extracted above)
      
      if (!customer || !template) {
        console.error(`❌ Missing customer or template data for pass ${serialNumber}`)
        return NextResponse.json(
          {
            error: `❌ Invalid pass data for ${serialNumber}`,
            serialNumber,
            type: 'PassDataError'
          },
          { status: 500 }
        )
      }

      // Build form data from customer
      const formData = {
        First_Name: customer.first_name || '',
        Last_Name: customer.last_name || '',
        Email: customer.email || '',
        Phone: customer.phone || '',
        Member_ID: `MB${Date.now()}`,
        Points: '0',
        Current_Offer: 'Welcome!',
        // Add any template defaults
        ...(template.passkit_json?.placeholders || {})
      }

      console.log(`🔄 Regenerating pass with form data:`, formData)

      // Generate the pass
      const passResult = await ApplePassKitGenerator.generateApplePass({
        templateId: template.id,
        formData,
        userId: customer.email,
        deviceType: 'web',
        templateOverride: {
          id: template.id,
          passkit_json: template.passkit_json,
          pass_type_identifier: template.pass_type_identifier,
          template_json: template.template_json,
        } as any
      })

      passData = passResult.actualData

      // Update the passes table with the generated data for future requests
      await supabase
        .from('passes')
        .update({ pass_data: passData })
        .eq('id', passRecord.id)

      console.log(`✅ Regenerated and cached pass data`)
    }

    // 3. Generate the .pkpass file from the pass data
    console.log(`🔄 Generating .pkpass file for ${serialNumber}`)

    // Use the existing generateApplePass method to convert stored pass data to .pkpass
    const passResult = await ApplePassKitGenerator.generateApplePass({
      templateId: passRecord.template_id,
      formData: passData,
      userId: customer?.email || 'customer',
      deviceType: 'web',
      templateOverride: {
        id: template?.id || passRecord.template_id,
        passkit_json: template?.passkit_json,
        pass_type_identifier: template?.pass_type_identifier,
        template_json: template?.template_json,
      } as any
    })

    const passBuffer = passResult.passBuffer

    if (!passBuffer) {
      throw new Error('Failed to generate pass buffer')
    }

    console.log(`✅ Generated .pkpass: ${passBuffer.length} bytes`)

    // 4. Update install count
    await supabase
      .from('passes')
      .update({ 
        install_count: (passRecord.install_count || 0) + 1,
        last_update: new Date().toISOString()
      })
      .eq('id', passRecord.id)

    // 5. Set Apple-compliant headers for .pkpass download
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

    return new NextResponse(passBuffer as BodyInit, {
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