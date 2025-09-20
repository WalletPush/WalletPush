import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PackageFeature {
  id: string
  name: string
  description: string
  enabled: boolean
}

interface SaasPackage {
  id: string
  name: string
  description: string
  price: number
  passLimit: number
  programLimit: number
  staffLimit: number
  features: PackageFeature[]
  isActive: boolean
}

// Helper function to transform features object to array format expected by frontend
function transformFeaturesToArray(featuresObj: any): PackageFeature[] {
  const featureMap = {
    customBranding: { name: 'Custom Branding', description: 'Upload logo and customize colors' },
    analytics: { name: 'Analytics', description: 'Insights and reporting' },
    apiAccess: { name: 'API Access', description: 'REST API for integrations' },
    prioritySupport: { name: 'Priority Support', description: 'Faster response times' },
    whitelabelDomain: { name: 'White-label Domain', description: 'Custom domain for customer portal' },
    smtpConfiguration: { name: 'SMTP Configuration', description: 'Custom email sending' },
    webhookSupport: { name: 'Webhook Support', description: 'Real-time event notifications' },
    multilocationSupport: { name: 'Multi-location Support', description: 'Multiple business locations' }
  }

  return Object.entries(featureMap).map(([key, config], index) => ({
    id: `${key}-${index}`,
    name: config.name,
    description: config.description,
    enabled: key === 'analytics' ? featuresObj[key] !== 'none' : Boolean(featuresObj[key])
  }))
}

// Helper function to transform features array back to object format for database
function transformFeaturesToObject(featuresArray: PackageFeature[]): any {
  const result: any = {}
  
  featuresArray.forEach(feature => {
    const key = feature.name.toLowerCase().replace(/[^a-z]/g, '')
    if (key.includes('analytics')) {
      result.analytics = feature.enabled ? 'advanced' : 'none'
    } else if (key.includes('custom') && key.includes('branding')) {
      result.customBranding = feature.enabled
    } else if (key.includes('api')) {
      result.apiAccess = feature.enabled
    } else if (key.includes('priority')) {
      result.prioritySupport = feature.enabled
    } else if (key.includes('whitelabel') || key.includes('domain')) {
      result.whitelabelDomain = feature.enabled
    } else if (key.includes('smtp')) {
      result.smtpConfiguration = feature.enabled
    } else if (key.includes('webhook')) {
      result.webhookSupport = feature.enabled
    } else if (key.includes('multilocation') || key.includes('location')) {
      result.multilocationSupport = feature.enabled
    }
  })
  
  return result
}

// GET - Fetch agency's SAAS packages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Fetching SAAS packages for user:', user.email)

    // Get or create agency account using our helper function
    const { data: agencyAccountId, error: agencyError } = await supabase
      .rpc('get_or_create_agency_account')

    if (agencyError || !agencyAccountId) {
      console.error('❌ Agency account error:', agencyError)
      return NextResponse.json({ 
        error: `AGENCY_ACCOUNT_ERROR: ${agencyError?.message || 'No agency account ID returned'}` 
      }, { status: 500 })
    }

    console.log('🏢 Agency account:', agencyAccountId)

    // Fetch packages from database
    const { data: packages, error: packagesError } = await supabase
      .from('agency_packages')
      .select('*')
      .eq('agency_account_id', agencyAccountId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (packagesError) {
      console.error('❌ Error fetching packages:', packagesError)
      return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
    }

    // Transform database format to frontend format
    let formattedPackages = (packages || []).map(pkg => ({
      id: pkg.id,
      name: pkg.package_name,
      description: pkg.package_description,
      price: parseFloat(pkg.monthly_price),
      passLimit: pkg.pass_limit,
      programLimit: pkg.program_limit,
      staffLimit: pkg.staff_limit,
      features: transformFeaturesToArray(pkg.features || {}),
      isActive: pkg.is_active
    }))

    // If no packages exist, create default ones
    if (formattedPackages.length === 0) {
      console.log('📦 No packages found, creating defaults...')
      
      const defaultPackagesData = [
        {
          package_name: 'Starter',
          package_description: 'Perfect for small businesses getting started',
          monthly_price: 29,
          pass_limit: 1000,
          program_limit: 3,
          staff_limit: 2,
          features: {
            customBranding: true,
            analytics: 'basic',
            apiAccess: false,
            prioritySupport: false,
            whitelabelDomain: false,
            smtpConfiguration: false,
            webhookSupport: false,
            multilocationSupport: false
          },
          display_order: 1,
          agency_account_id: agencyAccountId
        },
        {
          package_name: 'Business',
          package_description: 'Ideal for growing businesses with multiple programs',
          monthly_price: 69,
          pass_limit: 5000,
          program_limit: 10,
          staff_limit: 5,
          features: {
            customBranding: true,
            analytics: 'advanced',
            apiAccess: true,
            prioritySupport: true,
            whitelabelDomain: true,
            smtpConfiguration: false,
            webhookSupport: false,
            multilocationSupport: false
          },
          display_order: 2,
          agency_account_id: agencyAccountId
        },
        {
          package_name: 'Pro',
          package_description: 'Full-featured solution for enterprise businesses',
          monthly_price: 97,
          pass_limit: 10000,
          program_limit: 20,
          staff_limit: -1, // Unlimited
          features: {
            customBranding: true,
            analytics: 'enterprise',
            apiAccess: true,
            prioritySupport: true,
            whitelabelDomain: true,
            smtpConfiguration: true,
            webhookSupport: true,
            multilocationSupport: true
          },
          display_order: 3,
          agency_account_id: agencyAccountId
        }
      ]

      // Insert default packages
      const { data: insertedPackages, error: insertError } = await supabase
        .from('agency_packages')
        .insert(defaultPackagesData)
        .select('*')

      if (insertError) {
        console.error('❌ Error creating default packages:', insertError)
        // Return empty array if creation fails
        formattedPackages = []
      } else {
        console.log('✅ Created default packages')
        formattedPackages = (insertedPackages || []).map(pkg => ({
          id: pkg.id,
          name: pkg.package_name,
          description: pkg.package_description,
          price: parseFloat(pkg.monthly_price),
          passLimit: pkg.pass_limit,
          programLimit: pkg.program_limit,
          staffLimit: pkg.staff_limit,
          features: transformFeaturesToArray(pkg.features || {}),
          isActive: pkg.is_active
        }))
      }
    }

    console.log(`✅ Returning ${formattedPackages.length} SAAS packages`)

    return NextResponse.json({
      packages: formattedPackages,
      agencyInfo: {
        id: agencyAccountId,
        passAllocation: 100000,
        businessesUnlimited: true,
        passTypeIdsUnlimited: true
      }
    })

  } catch (error) {
    console.error('❌ SAAS packages API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save agency's SAAS packages
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { packages } = body

    if (!packages || !Array.isArray(packages)) {
      return NextResponse.json({ error: 'Invalid packages data' }, { status: 400 })
    }

    console.log('💾 Saving SAAS packages for user:', user.email)

    // Get or create agency account using our helper function
    console.log('🔍 Calling get_or_create_agency_account...')
    const { data: agencyAccountId, error: agencyError } = await supabase
      .rpc('get_or_create_agency_account')

    console.log('🏢 Agency account result:', { agencyAccountId, agencyError })

    if (agencyError || !agencyAccountId) {
      console.error('❌ Agency account error:', agencyError)
      return NextResponse.json({ 
        error: `AGENCY_ACCOUNT_ERROR: ${agencyError?.message || 'No agency account ID returned'}` 
      }, { status: 500 })
    }

    console.log('✅ Using agency account:', agencyAccountId)

    // Validate packages
    for (const pkg of packages) {
      if (!pkg.name || typeof pkg.price !== 'number' || typeof pkg.passLimit !== 'number') {
        return NextResponse.json({ error: 'Invalid package data' }, { status: 400 })
      }
    }

    // Transform frontend format to database format
    const dbPackages = packages.map((pkg: any, index: number) => ({
      agency_account_id: agencyAccountId,
      package_name: pkg.name,
      package_description: pkg.description || '',
      monthly_price: pkg.price,
      pass_limit: pkg.passLimit,
      program_limit: pkg.programLimit,
      staff_limit: pkg.staffLimit,
      features: transformFeaturesToObject(pkg.features || []),
      display_order: index + 1,
      is_active: pkg.isActive !== false
    }))

    console.log('🗑️ Deleting existing packages for agency:', agencyAccountId)
    // Delete existing packages and insert new ones (upsert approach)
    const { error: deleteError } = await supabase
      .from('agency_packages')
      .delete()
      .eq('agency_account_id', agencyAccountId)

    if (deleteError) {
      console.error('❌ Error deleting existing packages:', deleteError)
      return NextResponse.json({ 
        error: `DELETE_ERROR: ${deleteError.message} | Code: ${deleteError.code}` 
      }, { status: 500 })
    }

    console.log('✅ Existing packages deleted, inserting new packages...')
    console.log('📦 Packages to insert:', dbPackages.length, 'packages')

    // Insert new packages
    const { data: insertedPackages, error: insertError } = await supabase
      .from('agency_packages')
      .insert(dbPackages)
      .select('*')

    if (insertError) {
      console.error('❌ Error inserting packages:', insertError)
      return NextResponse.json({ 
        error: `INSERT_ERROR: ${insertError.message} | Code: ${insertError.code} | Details: ${insertError.details}` 
      }, { status: 500 })
    }

    console.log('✅ Successfully inserted packages:', insertedPackages?.length)

    console.log(`✅ Successfully saved ${insertedPackages?.length || 0} packages`)

    return NextResponse.json({
      success: true,
      message: 'SAAS packages saved successfully',
      packagesCount: insertedPackages?.length || 0,
      packages: (insertedPackages || []).map(pkg => ({
        id: pkg.id,
        name: pkg.package_name,
        description: pkg.package_description,
        price: parseFloat(pkg.monthly_price),
        passLimit: pkg.pass_limit,
        programLimit: pkg.program_limit,
        staffLimit: pkg.staff_limit,
        features: transformFeaturesToArray(pkg.features || {}),
        isActive: pkg.is_active
      }))
    })

  } catch (error) {
    console.error('❌ Save SAAS packages API error:', error)
    return NextResponse.json({ 
      error: `SAVE_ERROR: ${error instanceof Error ? error.message : error}`,
      details: error
    }, { status: 500 })
  }
}
