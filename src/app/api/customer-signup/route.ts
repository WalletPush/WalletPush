import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApplePassKitGenerator } from '@/lib/apple-passkit-generator'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request JSON:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const { 
      landing_page_id, 
      template_id,
      first_name, 
      last_name, 
      email, 
      phone, 
      date_of_birth,
      address,
      city,
      state,
      zip_code,
      company,
      additional_data = {} 
    } = body

    console.log('🎯 Customer signup request:', { landing_page_id, email, first_name, last_name })

    let landingPage = null
    let template = null

    if (landing_page_id) {
      // 1. Get the landing page and its associated template
      const { data: foundLandingPage, error: landingPageError } = await supabase
        .from('landing_pages')
        .select(`
          id,
          name,
          template_id,
          business_id,
          program_id,
          templates (
            id,
            template_json,
            passkit_json,
            pass_type_identifier,
            programs (
              id,
              name
            )
          )
        `)
        .eq('id', landing_page_id)
        .single()

      if (landingPageError || !foundLandingPage) {
        console.error('❌ Landing page not found:', landingPageError)
        return NextResponse.json(
          { success: false, error: 'Landing page not found' },
          { status: 404 }
        )
      }
      
      landingPage = foundLandingPage
      template = landingPage.templates
    } else if (template_id) {
      // Use the specific template ID provided
      console.log('🎯 Using provided template ID:', template_id)
      
      const { data: foundTemplate, error: templateError } = await supabase
        .from('templates')
        .select(`
          id,
          template_json,
          passkit_json,
          pass_type_identifier,
          programs (
            id,
            name
          )
        `)
        .eq('id', template_id)
        .single()
      
      if (templateError || !foundTemplate) {
        console.error('❌ Template not found:', templateError)
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        )
      }
      
      template = foundTemplate
      console.log('✅ Found template:', template.id)
    } else {
      // Fallback: Use the first available template
      console.log('🔄 No landing page or template specified, using demo template...')
      
      const { data: templates } = await supabase
        .from('templates')
        .select(`
          id,
          template_json,
          passkit_json,
          programs (
            id,
            name
          )
        `)
        .limit(1)
      
      if (templates && templates.length > 0) {
        template = templates[0]
        console.log('🎯 Using demo template:', template.id)
      } else {
        return NextResponse.json(
          { success: false, error: 'No templates available' },
          { status: 404 }
        )
      }
    }

    if (!template) {
      console.error('❌ No template found')
      return NextResponse.json(
        { success: false, error: 'No pass template available' },
        { status: 400 }
      )
    }

    const actualTemplate = Array.isArray(template) ? template[0] : template
    console.log('✅ Found template:', actualTemplate.id)

    // 2. Determine the business_id for multi-tenant architecture
    let business_id = null
    
    if (landingPage && landingPage.business_id) {
      // Get business_id from landing page
      business_id = landingPage.business_id
      console.log('🏢 Business ID from landing page:', business_id)
    } else if (actualTemplate?.programs) {
      // Get business_id from template's program account relationship
      // First, get the program's account_id which is the business_id
      const { data: program, error: programError } = await supabase
        .from('programs')
        .select('account_id')
        .eq('id', (() => {
          const programs = actualTemplate.programs
          if (Array.isArray(programs) && programs[0]) {
            return programs[0].id
          }
          return (programs as any)?.id
        })())
        .single()
      
      if (program && !programError) {
        business_id = program.account_id
        console.log('🏢 Business ID from template program:', business_id)
      }
    }
    
    if (!business_id) {
      console.error('❌ Could not determine business_id for customer')
      console.error('❌ Debug info:', {
        hasLandingPage: !!landingPage,
        landingPageBusinessId: landingPage?.business_id,
        hasTemplate: !!actualTemplate,
        hasTemplatePrograms: !!actualTemplate?.programs,
        templateProgramsId: (() => {
          const programs = actualTemplate?.programs
          if (Array.isArray(programs) && programs[0]) {
            return programs[0].id
          }
          return (programs as any)?.id
        })()
      })
      
      // For development: Use hardcoded business ID if we can't determine it
      if (process.env.NODE_ENV === 'development') {
        business_id = 'be023bdf-c668-4cec-ac51-65d3c02ea191' // Blue Karma business ID
        console.log('🚧 DEV MODE: Using hardcoded business_id:', business_id)
      } else {
        return NextResponse.json(
          { success: false, error: 'Unable to determine business association' },
          { status: 400 }
        )
      }
    }

    // 3. Check if customer already exists for this business/email combination
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, email, pass_serial_number')
      .eq('email', email)
      .eq('business_id', business_id) // Check within the same business
      .maybeSingle()

    if (existingCustomer) {
      console.log('🔄 Customer already exists for this business, returning existing pass')
      return NextResponse.json({
        success: true,
        message: 'You have already signed up! Check your email for your pass.',
        customer_id: existingCustomer.id,
        pass_serial_number: existingCustomer.pass_serial_number
      })
    }

    // 3. Get template placeholders (business-defined default values)
    const templateDefaults = actualTemplate?.passkit_json?.placeholders || {}
    const templatePlaceholders = Object.keys(templateDefaults)

    console.log('🎯 Template placeholders from Pass Designer:', templatePlaceholders)

    // 4. Prepare form data for pass generation starting with Pass Designer defaults
    const formData: { [key: string]: string } = {
      ...templateDefaults, // Start with Pass Designer defaults
      // Customer-provided data (from form)
      firstName: first_name || '',
      lastName: last_name || '',
      email: email || '',
      phone: phone || '',
      dateOfBirth: date_of_birth || '',
      address: address || '',
      city: city || '',
      zipCode: zip_code || '',
      company: company || '',
      ...additional_data
    }

    // SMART MAPPING: Map form data to template placeholders
    
    // Map customer data to ALL possible placeholder variations in the template
    for (const placeholder of templatePlaceholders) {
      const lower = placeholder.toLowerCase()
      
      // Name mappings
      if (lower.includes('first') && lower.includes('name')) {
        formData[placeholder] = first_name || ''
      } else if (lower.includes('last') && lower.includes('name')) {
        formData[placeholder] = last_name || ''
      } else if (lower.includes('full') && lower.includes('name')) {
        formData[placeholder] = `${first_name || ''} ${last_name || ''}`.trim()
      }
      
      // Email mappings
      else if (lower.includes('email')) {
        formData[placeholder] = email || ''
      }
      
      // Phone mappings
      else if (lower.includes('phone') || lower.includes('mobile')) {
        formData[placeholder] = phone || ''
      }
      
      // Date of birth mappings
      else if (lower.includes('birth') || lower.includes('dob')) {
        formData[placeholder] = date_of_birth || ''
      }
      
      // Address mappings
      else if (lower.includes('address')) {
        formData[placeholder] = address || ''
      } else if (lower.includes('city')) {
        formData[placeholder] = city || ''
      } else if (lower.includes('zip')) {
        formData[placeholder] = zip_code || ''
      }
      
      // Company mappings
      else if (lower.includes('company')) {
        formData[placeholder] = company || ''
      }
    }

    // Generate dynamic values for system-generated placeholders only
    const memberId = `MB${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    
    // Add member ID variations if template uses them
    for (const placeholder of templatePlaceholders) {
      const lower = placeholder.toLowerCase()
      if (lower.includes('member') && lower.includes('id')) {
        formData[placeholder] = memberId
      }
    }
    
    // All other placeholders (Points, Tier, Offers) use Pass Designer defaults
    // DO NOT override business-set default values

    console.log('🎯 Form data for pass generation:', formData)

    // 4. Generate the Apple Pass
    try {
      const passResult = await ApplePassKitGenerator.generateApplePass({
        templateId: actualTemplate.id,
        formData: formData,
        userId: email, // Use email as user identifier
        deviceType: 'web',
        templateOverride: {
          id: actualTemplate.id,
          passkit_json: actualTemplate.passkit_json,
          pass_type_identifier: actualTemplate.pass_type_identifier,
          template_json: actualTemplate.template_json,
        } as any
      })

      console.log('✅ Pass generated successfully:', {
        serialNumber: passResult.response.serialNumber,
        passTypeIdentifier: passResult.response.passTypeIdentifier
      })

      // 5. Save customer to database with pass details and initial business intelligence values
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          business_id, // 🎯 CRITICAL: Link customer to business for multi-tenant
          landing_page_id: landing_page_id || null, // Allow null if no landing page
          template_id: actualTemplate.id,
          
          // 👤 Customer personal information
          first_name,
          last_name,
          email,
          phone,
          date_of_birth,
          address,
          city,
          state,
          zip_code,
          company,
          form_data: { ...formData, ...additional_data },
          
          // 🎫 Pass details
          pass_serial_number: passResult.response.serialNumber,
          pass_type_identifier: passResult.response.passTypeIdentifier,
          pass_url: passResult.response.downloadUrl || null,
          signup_source: 'landing_page',
          
          // 💰 Initial financial tracking (all start at 0)
          total_spent: 0.00,
          last_order_amount: 0.00,
          average_order_value: 0.00,
          customer_lifetime_value: 0.00,
          
          // 🎯 Initial loyalty points (based on template defaults or 0)
          points_balance: parseInt(formData.Points || '0') || 0,
          points_earned: parseInt(formData.Points || '0') || 0,
          points_redeemed: 0,
          
          // 💳 Initial store card balance
          card_balance: 0.00,
          
          // 🔄 Initial visit tracking (first visit is signup)
          visit_count: 1,
          last_visit_date: new Date().toISOString(),
          
          // 🎁 Initial redemption tracking
          redemption_count: 0,
          last_redemption_date: null,
          
          // 📅 Initial order tracking
          order_count: 0,
          last_order_date: null,
          
          // 🏆 Initial membership info (from template defaults)
          membership_tier: formData.Tier || formData.Member_Level || 'Standard',
          membership_plan: formData.Tier || formData.Member_Level || 'Basic',
          
          // 🎁 Initial offer tracking (from template if available)
          current_offer: formData.Current_Offer || '',
          past_offers: [],
          offers_claimed_count: 0,
          offers_redeemed_count: 0,
          last_offer_claimed_date: null,
          
          // 📝 Initial customer management
          notes: '',
          tags: []
        })
        .select()
        .single()

      if (customerError) {
        console.error('❌ Failed to save customer:', customerError)
        console.error('❌ Customer insert data:', {
          business_id,
          landing_page_id: landing_page_id || null,
          template_id: actualTemplate.id,
          email
        })
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to save customer information',
            debug: process.env.NODE_ENV === 'development' ? customerError : undefined
          },
          { status: 500 }
        )
      }

      console.log('✅ Customer saved successfully:', customer.id)

      // 6. Return success response with pass details
      return NextResponse.json({
        success: true,
        message: 'Welcome! Your pass has been created successfully.',
        customer_id: customer.id,
        pass_serial_number: passResult.response.serialNumber,
        pass_type_identifier: passResult.response.passTypeIdentifier,
        pass_url: passResult.response.downloadUrl, // Add this for the success page
        download_url: passResult.response.downloadUrl,
        pass_data: passResult.actualData
      })

    } catch (passError) {
      console.error('❌ Failed to generate pass:', passError)
      return NextResponse.json(
        { success: false, error: passError instanceof Error ? passError.message : 'Failed to generate your pass.' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('❌ Customer signup error:', error)
    
    // Ensure we always return JSON
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to process signup. Please try again.',
        debug: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
