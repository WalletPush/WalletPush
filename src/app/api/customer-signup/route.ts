import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentBusinessId } from '@/lib/business-context'
import { ApplePassKitGenerator } from '@/lib/apple-passkit-generator'
import { processTemplateForPassGeneration } from '@/lib/dynamic-template-processor'

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
      firstName,    // Alternative field name from forms
      lastName,     // Alternative field name from forms
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

    // Handle field name variations - some forms use firstName/lastName instead of first_name/last_name
    const actualFirstName = first_name || firstName || ''
    const actualLastName = last_name || lastName || ''

    console.log('🎯 Customer signup request:', { landing_page_id, email, actualFirstName, actualLastName })

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
            program_id,
            template_json,
            passkit_json,
            pass_type_identifier,
            account_id,
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
      // Handle template from landing page join (could be object or array)
      template = Array.isArray(landingPage.templates) 
        ? landingPage.templates[0] 
        : landingPage.templates
    } else if (template_id) {
      // Use the specific template ID provided
      console.log('🎯 Using provided template ID:', template_id)
      
      const { data: foundTemplate, error: templateError } = await supabase
        .from('templates')
        .select(`
          id,
          program_id,
          template_json,
          passkit_json,
          pass_type_identifier,
          account_id,
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
          program_id,
          template_json,
          passkit_json,
          pass_type_identifier,
          account_id,
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

    // Ensure PassTypeID exists on the template
    const templatePassTypeIdentifier = (actualTemplate as any)?.pass_type_identifier
    if (!templatePassTypeIdentifier) {
      return NextResponse.json(
        { success: false, error: 'Template is missing pass_type_identifier. Please configure a Pass Type ID for this template.' },
        { status: 400 }
      )
    }

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
        // For public landing pages, get business_id from the landing page or template
        if (landingPage?.business_id) {
          business_id = landingPage.business_id
        } else if (template?.account_id) {
          business_id = template.account_id
        } else {
          // Last resort: find business_id from the template's account relationship
          const { data: templateAccount } = await supabase
            .from('templates')
            .select('account_id')
            .eq('id', template_id)
            .single()
          
          if (templateAccount?.account_id) {
            business_id = templateAccount.account_id
          } else {
            business_id = await getCurrentBusinessId(request) || 'be023bdf-c668-4cec-ac51-65d3c02ea191' // Fallback for development
            console.warn('⚠️ Using fallback business_id, could not determine from landing page or template')
          }
        }
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

    // 3. Get template placeholders (business-defined default values from Pass Designer)
    let templateDefaults: Record<string, string> = {}
    let templatePlaceholders: string[] = []
    
    if (actualTemplate?.passkit_json?.placeholders && Array.isArray(actualTemplate.passkit_json.placeholders)) {
      // Convert Pass Designer placeholders array to key-value pairs
      actualTemplate.passkit_json.placeholders.forEach((placeholder: any) => {
        if (placeholder.key && placeholder.defaultValue !== undefined) {
          templateDefaults[placeholder.key] = placeholder.defaultValue
          templatePlaceholders.push(placeholder.key)
        }
      })
      console.log('🎯 Using Pass Designer placeholder defaults:', templateDefaults)
    } else {
      // Fallback to old logic if no placeholders array
      templateDefaults = actualTemplate?.passkit_json?.placeholders || {}
      templatePlaceholders = Object.keys(templateDefaults)
      console.log('🔍 Using fallback placeholder logic:', templateDefaults)
    }

    console.log('🎯 Template placeholders from Pass Designer:', templatePlaceholders)

    // 4. Create intelligent new member defaults instead of using template sample data
    const newMemberDefaults: { [key: string]: string } = {}
    
    // Generate intelligent defaults for common business placeholders
    for (const placeholder of templatePlaceholders) {
      const lower = placeholder.toLowerCase()
      
      // Points should start at 0 for new members (not sample data)
      if (lower.includes('points') || lower.includes('point')) {
        newMemberDefaults[placeholder] = '0'
      }
      // Balance should start at 0.00 for new members
      else if (lower.includes('balance') || lower.includes('credit')) {
        newMemberDefaults[placeholder] = '0.00'
      }
      // Tier should be starter/basic for new members
      else if (lower.includes('tier') || lower.includes('level') || lower.includes('status')) {
        newMemberDefaults[placeholder] = 'Standard'
      }
      // Current offer should be welcome bonus for new members
      else if (lower.includes('offer') || lower.includes('promotion') || lower.includes('deal')) {
        newMemberDefaults[placeholder] = 'Welcome to our rewards program!'
      }
      // Expiry dates should be reasonable future dates
      else if (lower.includes('expiry') || lower.includes('expires')) {
        const futureDate = new Date()
        futureDate.setFullYear(futureDate.getFullYear() + 1)
        newMemberDefaults[placeholder] = futureDate.toLocaleDateString()
      }
      // Use template defaults for other placeholders that weren't intelligently mapped
      else {
        newMemberDefaults[placeholder] = templateDefaults[placeholder] || ''
      }
    }
    
    console.log('🎯 Intelligent new member defaults:', newMemberDefaults)

    // 5. Prepare form data for pass generation starting with intelligent new member defaults
    const formData: { [key: string]: string } = {
      ...newMemberDefaults, // Start with intelligent new member defaults
      // Customer-provided data (from form) - these override any defaults
      firstName: actualFirstName,
      lastName: actualLastName,
      email: email || '',
      phone: phone || '',
      dateOfBirth: date_of_birth || '',
      address: address || '',
      city: city || '',
      zipCode: zip_code || '',
      company: company || '',
      ...additional_data
    }

    // 6. SMART MAPPING: Map form data to template placeholders
    
    // Map customer data to ALL possible placeholder variations in the template
    for (const placeholder of templatePlaceholders) {
      const lower = placeholder.toLowerCase()
      
      // Name mappings
      if (lower.includes('first') && lower.includes('name')) {
        formData[placeholder] = actualFirstName
      } else if (lower.includes('last') && lower.includes('name')) {
        formData[placeholder] = actualLastName
      } else if (lower.includes('full') && lower.includes('name')) {
        formData[placeholder] = `${actualFirstName} ${actualLastName}`.trim()
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
      // Use dynamic template processing for better field mapping
      const processingResult = await processTemplateForPassGeneration(
        actualTemplate.id,
        {
          // Map all form data (keeping the existing formData structure)
          ...formData,
          // Also include raw form fields for better mapping
          first_name: actualFirstName, last_name: actualLastName, email, phone, company, date_of_birth,
          address, city, state, zip_code,
          firstName: actualFirstName, lastName: actualLastName, // Common variations
          ...additional_data
        },
        supabase
      )
      
      // Use processed data if available, otherwise fallback to existing formData
      const finalFormData = processingResult?.processedData || formData
      
      // 🔍 CRITICAL DEBUG: Inline template debugging
      const templateDebugInfo = {
        actualTemplate_id: actualTemplate.id,
        templatePassTypeIdentifier: templatePassTypeIdentifier,
        actualTemplate_keys: Object.keys(actualTemplate),
        passkit_json_exists: !!actualTemplate.passkit_json,
        template_json_exists: !!actualTemplate.template_json,
        finalFormData: finalFormData
      }

      const templateOverrideData = {
        id: actualTemplate.id,
        passkit_json: actualTemplate.passkit_json,
        pass_type_identifier: templatePassTypeIdentifier,
        template_json: actualTemplate.template_json,
        program_id: actualTemplate.program_id,
        account_id: actualTemplate.account_id
      }

      const passResult = await ApplePassKitGenerator.generateApplePass({
        templateId: actualTemplate.id,
        formData: finalFormData,
        userId: email, // Use email as user identifier
        deviceType: 'web',
        templateOverride: templateOverrideData as any,
        businessId: business_id // Pass business context for dynamic certificate selection
      })

      // 🔍 INLINE DEBUG: Pass generation results
      const passGenerationDebug = {
        pass_generated_successfully: true,
        serialNumber: passResult.response.serialNumber,
        passTypeIdentifier: passResult.response.passTypeIdentifier,
        actualData_type: typeof passResult.actualData,
        actualData_keys: Object.keys(passResult.actualData || {}),
        actualData_sample: passResult.actualData
      }

      // 5. Save customer to database with pass details and initial business intelligence values
      // Use upsert to handle potential duplicates (user might have attempted signup before)
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .upsert({
          business_id, // 🎯 CRITICAL: Link customer to business for multi-tenant
          landing_page_id: landing_page_id || null, // Allow null if no landing page
          template_id: actualTemplate.id,
          
          // 👤 Customer personal information
          first_name: actualFirstName,
          last_name: actualLastName,
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
        }, {
          onConflict: 'business_id,email', // Handle duplicates by email+business combination
          ignoreDuplicates: false // Update existing records with new data
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
        console.error('❌ Full customer insert payload:', {
          business_id,
          landing_page_id: landing_page_id || null,
          template_id: actualTemplate.id,
          first_name: actualFirstName,
          last_name: actualLastName,
          email,
          phone,
          date_of_birth,
          address,
          city,
          state,
          zip_code,
          company
        })
        
        // Enhanced error details for debugging
        const errorDetail = customerError.code === '23505' 
          ? 'Customer already exists (duplicate email/business combination)'
          : customerError.code === '23503'
          ? `Foreign key constraint violation: ${customerError.message}`
          : customerError.code === '23502'
          ? `Not null constraint violation: ${customerError.message}`
          : `Database error: ${customerError.message}`;
          
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to save customer information',
            detail: errorDetail,
            debug: {
              error_code: customerError.code,
              error_message: customerError.message,
              error_details: customerError.details,
              hint: customerError.hint
            }
          },
          { status: 500 }
        )
      }

      console.log('✅ Customer saved successfully:', customer.id)

      // 🔍 DEBUG: Log template data before passes insert
      console.log('🔍 Template data for passes insert:', {
        template_id: actualTemplate.id,
        program_id: actualTemplate.program_id,
        account_id: actualTemplate.account_id,
        business_id,
        customer_id: customer.id
      })
      
      // 🔍 INLINE DEBUG: Full template analysis
      const fullTemplateDebug = {
        full_actualTemplate: actualTemplate,
        program_id_type: typeof actualTemplate.program_id,
        program_id_value: actualTemplate.program_id
      }

      // 6. Save complete pass data to passes table
      console.log('🔍 STEP 6: Starting pass data save to passes table')
      
      // Ensure pass_data is valid JSON
      let passDataJson = {}
      try {
        console.log('🔍 passResult.actualData type:', typeof passResult.actualData)
        console.log('🔍 passResult.actualData value:', passResult.actualData)
        
        passDataJson = passResult.actualData && typeof passResult.actualData === 'object' 
          ? passResult.actualData 
          : JSON.parse(passResult.actualData || '{}')
          
        console.log('🔍 Processed passDataJson:', passDataJson)
      } catch (e) {
        console.error('❌ Invalid pass data JSON:', e)
        console.error('❌ Raw actualData was:', passResult.actualData)
        passDataJson = {}
      }

      // 🔍 CRITICAL FIX: Ensure program_id is not null
      let program_id = actualTemplate.program_id
      
      // If program_id is null/undefined, try to get it from the programs relation
      if (!program_id && actualTemplate.programs) {
        const programs = actualTemplate.programs
        if (Array.isArray(programs) && programs[0]) {
          program_id = programs[0].id
        } else if (programs && typeof programs === 'object') {
          program_id = programs.id
        }
        console.log('🔍 Retrieved program_id from programs relation:', program_id)
      }
      
      // If still no program_id, this is a critical error
      if (!program_id) {
        console.error('❌ CRITICAL: No program_id found for template:', actualTemplate.id)
        console.error('❌ Template details:', {
          id: actualTemplate.id,
          program_id: actualTemplate.program_id,
          programs: actualTemplate.programs,
          account_id: actualTemplate.account_id
        })
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Template is missing program association. Please contact support.',
            debug: {
              template_id: actualTemplate.id,
              program_id: actualTemplate.program_id,
              programs: actualTemplate.programs,
              fullTemplateDebug,
              templateDebugInfo
            }
          },
          { status: 500 }
        )
      }

      const insertData = {
        customer_id: customer.id,
        business_id,
        program_id: program_id,
        template_id: actualTemplate.id,
        platform: 'apple',
        serial: passResult.response.serialNumber,
        object_id: passResult.response.passTypeIdentifier,
        pass_data: passDataJson,
        auth_token: null,
        install_count: 0,
        created_at: new Date().toISOString()
      }
      
      console.log('🔍 ABOUT TO INSERT INTO PASSES TABLE:')
      console.log('🔍 Insert data:', JSON.stringify(insertData, null, 2))
      
      const { data: passRecord, error: passError } = await supabase
        .from('passes')
        .insert(insertData)
        .select()
        .single()
        
      console.log('🔍 PASSES INSERT RESULT:')
      console.log('🔍 passRecord:', passRecord)
      console.log('🔍 passError:', passError)

      if (passError) {
        console.error('❌ Failed to save pass data:', passError)
        console.error('❌ Pass insert data:', {
          customer_id: customer.id,
          business_id,
          program_id: actualTemplate.program_id,
          template_id: actualTemplate.id,
          serial: passResult.response.serialNumber,
          object_id: passResult.response.passTypeIdentifier
        })
        console.error('❌ Full passError details:', JSON.stringify(passError, null, 2))
        
        // CRITICAL: Delete the customer if pass creation fails to avoid orphaned records
        console.log('🔍 ATTEMPTING TO DELETE CUSTOMER:', customer.id)
        const { error: deleteError } = await supabase.from('customers').delete().eq('id', customer.id)
        console.log('🔍 Customer deletion result:', deleteError ? `FAILED: ${deleteError.message}` : 'SUCCESS')
        
        return NextResponse.json(
          { 
            success: false, 
            error: `Pass creation failed. Debug: ${JSON.stringify({
              passError: passError,
              insertData: insertData,
              template: {
                id: actualTemplate.id,
                program_id: actualTemplate.program_id,
                account_id: actualTemplate.account_id
              }
            }, null, 2)}`,
            debug: {
              passError: passError,
              insertData: insertData,
              template: {
                id: actualTemplate.id,
                program_id: actualTemplate.program_id,
                account_id: actualTemplate.account_id
              }
            }
          },
          { status: 500 }
        )
      } else {
        console.log('✅ Pass data saved successfully:', passRecord.id)
      }

      // 7. Return success response with pass details and inline debugging
      return NextResponse.json({
        success: true,
        message: 'Welcome! Your pass has been created successfully.',
        customer_id: customer.id,
        business_id: business_id, // 🎯 ADD: Business ID for redirect logic
        pass_serial_number: passResult.response.serialNumber,
        pass_type_identifier: passResult.response.passTypeIdentifier,
        pass_url: passResult.response.downloadUrl,
        download_url: passResult.response.downloadUrl,
        pass_data: passResult.actualData,
        // 🔍 INLINE DEBUG INFO
        debug_info: {
          templateDebugInfo,
          templateOverrideData: {
            id: templateOverrideData.id,
            pass_type_identifier: templateOverrideData.pass_type_identifier,
            has_passkit_json: !!templateOverrideData.passkit_json,
            has_template_json: !!templateOverrideData.template_json
          },
          passGenerationDebug,
          fullTemplateDebug
        }
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
