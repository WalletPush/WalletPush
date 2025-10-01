import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { put } from '@vercel/blob'
import { vercel } from '@/lib/vercel'

// Create admin client for server-side operations
function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const PLATFORM_OWNER_EMAIL = 'david.sambor@icloud.com'

// Generate secure password
function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Agency creation API called')
    
    const formData = await request.formData()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const customDomain = formData.get('customDomain') as string
    const agencyPlan = formData.get('agencyPlan') as string
    const autoGenerateCredentials = formData.get('autoGenerateCredentials') === 'true'
    const logo = formData.get('logo') as File | null

    console.log('📋 Form data received:', {
      name,
      email,
      customDomain,
      agencyPlan,
      autoGenerateCredentials,
      logoSize: logo?.size
    })

    if (!name || !email || !customDomain) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, email, and customDomain are required' 
      }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    // Check if agency already exists
    const { data: existingAgency } = await supabase
      .from('agency_accounts')
      .select('id, email')
      .eq('email', email)
      .single()

    if (existingAgency) {
      return NextResponse.json({ 
        error: 'Agency with this email already exists' 
      }, { status: 409 })
    }

    // Generate password if needed
    const password = autoGenerateCredentials ? generateSecurePassword() : null

    // Upload logo if provided
    let logoUrl = null
    if (logo) {
      try {
        console.log('📸 Uploading logo to Vercel Blob...')
        const logoBlob = await put(`agency/logos/${Date.now()}-${logo.name}`, logo, {
          access: 'public',
        })
        logoUrl = logoBlob.url
        console.log('✅ Logo uploaded:', logoUrl)
      } catch (logoError) {
        console.error('❌ Logo upload failed:', logoError)
        // Continue without logo rather than failing
      }
    }

    // Determine plan limits - USE THE CORRECT PRICES!
    const planLimits = {
      'starter_100k': { passes: 100000, price: 297 },
      'business_150k': { passes: 150000, price: 997 },  // $997 LIFETIME not $297!
      'enterprise_250k': { passes: 250000, price: 497 }
    }
    const planInfo = planLimits[agencyPlan as keyof typeof planLimits] || planLimits.starter_100k
    
    console.log('💰 Plan selected:', agencyPlan, 'Price:', planInfo.price, 'Passes:', planInfo.passes)
    console.log('💰 Full planLimits object:', planLimits)
    console.log('💰 Lookup result:', planLimits[agencyPlan as keyof typeof planLimits])

    // Create Supabase auth user FIRST (required for agency_accounts.user_id)
    let authUser = null
    if (password) {
      try {
        console.log('👤 Creating Supabase auth user...')
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            agency_name: name,
            role: 'agency_admin'
          }
        })

        if (authError) {
          console.error('❌ Auth user creation failed:', authError)
          return NextResponse.json({ 
            error: 'Failed to create auth user',
            details: authError.message 
          }, { status: 500 })
        } else {
          authUser = authData.user
          console.log('✅ Auth user created:', authUser.id)
        }
      } catch (authError) {
        console.error('❌ Auth user creation error:', authError)
        return NextResponse.json({ 
          error: 'Failed to create auth user',
          details: authError instanceof Error ? authError.message : 'Unknown error'
        }, { status: 500 })
      }
    } else {
      return NextResponse.json({ 
        error: 'Password is required for agency creation' 
      }, { status: 400 })
    }

    // Create agency account with the auth user's ID
    console.log('🏢 Creating agency account...')
    console.log('📋 Using form data:', { name, email, customDomain, agencyPlan, logoUrl })
    
    const { data: newAgency, error: agencyError } = await supabase
      .from('agency_accounts')
      .insert({
        user_id: authUser.id,
        name: name,                      // Agency name from form
        email: email,                    // Contact email from form  
        company_name: name,              // Use agency name as company name
        admin_password: password,
        logo_url: logoUrl,
        owner_pricing_tier: agencyPlan,  // This is the agency's pass limit plan
        pass_limit: planInfo.passes,
        monthly_price: planInfo.price,   // SET THE CORRECT PRICE HERE!
        subscription_status: 'active',   // Agencies are active, not trial
        custom_domain: customDomain,     // ADD THE FUCKING CUSTOM DOMAIN!
        custom_domain_status: 'pending', // Set initial status
        // NO subscription_plan - that's for businesses only!
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (agencyError) {
      console.error('❌ Failed to create agency:', agencyError)
      return NextResponse.json({ 
        error: 'Failed to create agency account',
        details: agencyError.message 
      }, { status: 500 })
    }

    console.log('✅ Agency created:', newAgency.id)

    // Update auth user metadata with agency_id
    try {
      await supabase.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          ...authUser.user_metadata,
          agency_id: newAgency.id
        }
      })
    } catch (updateError) {
      console.error('❌ Failed to update auth user metadata:', updateError)
    }

    // Add custom domain to Vercel and database
    let domainInfo = null
    try {
      console.log('🌐 Adding custom domain to Vercel:', customDomain)
      
      // Add domain to Vercel
      const vercelResult = await vercel.addAndVerifyDomain(customDomain)
      
      if (vercelResult.domain) {
        // Add domain to database
        const { data: domainRecord, error: domainError } = await supabase
          .from('custom_domains')
          .insert({
            domain: customDomain,
            domain_type: 'agency',
            agency_id: newAgency.id,
            status: vercelResult.verified ? 'active' : 'pending',
            ssl_status: vercelResult.verified ? 'active' : 'pending',
            vercel_domain_id: vercelResult.domain.name,
            verification_instructions: vercelResult.verificationInstructions || null,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (domainError) {
          console.error('❌ Failed to save domain to database:', domainError)
        } else {
          console.log('✅ Domain saved to database:', domainRecord.id)
        }

        domainInfo = {
          domain: customDomain,
          vercel_verified: vercelResult.verified,
          verification_instructions: vercelResult.verificationInstructions
        }
      }
    } catch (domainError) {
      console.error('❌ Domain setup failed:', domainError)
      // Continue without failing the entire agency creation
      domainInfo = {
        domain: customDomain,
        vercel_verified: false,
        error: domainError instanceof Error ? domainError.message : 'Unknown domain error'
      }
    }

    // Return success response
    const response = {
      success: true,
      agency: {
        id: newAgency.id,
        name: newAgency.name,
        email: newAgency.email
      },
      credentials: password ? {
        email,
        password
      } : null,
      domain_info: domainInfo,
      auth_user: authUser ? { id: authUser.id } : null
    }

    console.log('🎉 Agency creation completed successfully')
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Agency creation API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
