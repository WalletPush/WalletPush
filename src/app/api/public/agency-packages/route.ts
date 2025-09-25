import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface PackageFeature {
  id: string
  name: string
  description?: string
  included: boolean
}

function transformFeaturesToArray(featuresObject: any): PackageFeature[] {
  if (!featuresObject || typeof featuresObject !== 'object') {
    return []
  }

  // Transform object format to array format for your specific database structure
  const features: PackageFeature[] = []
  
  if (featuresObject.analytics) {
    features.push({ id: 'analytics', name: 'Advanced Analytics', included: true })
  }
  if (featuresObject.apiAccess) {
    features.push({ id: 'api', name: 'API Access', included: true })
  }
  if (featuresObject.customBranding) {
    features.push({ id: 'branding', name: 'Custom Branding', included: true })
  }
  if (featuresObject.webhookSupport) {
    features.push({ id: 'webhooks', name: 'Webhook Support', included: true })
  }
  if (featuresObject.prioritySupport) {
    features.push({ id: 'priority', name: 'Priority Support', included: true })
  } else {
    features.push({ id: 'support', name: 'Email Support', included: true })
  }
  if (featuresObject.whitelabelDomain) {
    features.push({ id: 'whitelabel', name: 'White-label Domain', included: true })
  }
  if (featuresObject.smtpConfiguration) {
    features.push({ id: 'smtp', name: 'SMTP Configuration', included: true })
  }
  if (featuresObject.multilocationSupport) {
    features.push({ id: 'multilocation', name: 'Multi-location Support', included: true })
  }
  
  // Add basic features for all packages
  features.unshift({ id: 'notifications', name: 'Push Notifications', included: true })
  
  return features
}

// GET - Fetch public agency packages for homepage
export async function GET(request: NextRequest) {
  try {
    // Create public Supabase client (service role for public data)
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

    console.log('🔍 Fetching public agency packages for homepage')

    // Get the current domain and find the agency that owns it
    const hostname = request.headers.get('host') || 'localhost:3000'
    console.log(`🌐 Detected hostname: ${hostname}`)
    
    let agencyId = 'a7d7baa2-0b71-453e-ab7f-0c19b9214be4' // fallback for localhost
    
    // For non-localhost domains, find agency by custom_domain
    if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      console.log(`🌐 Looking up agency for domain: ${hostname}`)
      
      const { data: agencyAccount, error: agencyError } = await supabase
        .from('agency_accounts')
        .select('id')
        .or(`custom_domain.eq.${hostname},website.eq.${hostname}`)
        .single()
      
      if (agencyAccount && !agencyError) {
        agencyId = agencyAccount.id
        console.log(`✅ Found agency for domain ${hostname}: ${agencyId}`)
      } else {
        console.log(`⚠️ No agency found for domain ${hostname}, using fallback: ${agencyId}`)
        console.log(`⚠️ Agency lookup error:`, agencyError)
      }
    } else {
      console.log(`🏠 Using localhost fallback agency ID: ${agencyId}`)
    }
    
    console.log(`📦 Using agency ID: ${agencyId}`)

    // Fetch packages from database
    const { data: packages, error: packagesError } = await supabase
      .from('agency_packages')
      .select('*')
      .eq('agency_account_id', agencyId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (packagesError) {
      console.error('❌ Error fetching packages:', packagesError)
      console.error('❌ Packages error details:', {
        code: packagesError.code,
        message: packagesError.message,
        details: packagesError.details,
        hint: packagesError.hint
      })
      return getDefaultPackages()
    }

    console.log(`🔍 Raw packages query result:`, packages)

    if (!packages || packages.length === 0) {
      console.log('📦 No packages found, using defaults')
      return getDefaultPackages()
    }

    // Transform database format to frontend format
    const formattedPackages = packages.map(pkg => {
      const features = transformFeaturesToArray(pkg.features || {})
      
      // Add pass limit as first feature
      const passLimitText = pkg.pass_limit >= 5000 ? `Up to ${pkg.pass_limit.toLocaleString()} active passes` : `Up to ${pkg.pass_limit} active passes`
      features.unshift({ id: 'passes', name: passLimitText, included: true })
      
      return {
        id: pkg.id,
        name: pkg.package_name,
        description: pkg.package_description,
        price: parseFloat(pkg.monthly_price),
        passLimit: pkg.pass_limit,
        programLimit: pkg.program_limit,
        staffLimit: pkg.staff_limit,
        features: features,
        isPopular: pkg.package_name.toLowerCase().includes('business')
      }
    })

    console.log(`✅ Found ${formattedPackages.length} packages`)

    const response = NextResponse.json({
      success: true,
      packages: formattedPackages
    })
    
    // Add CORS headers for production domains
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return response

  } catch (error) {
    console.error('❌ Error fetching packages:', error)
    return getDefaultPackages()
  }
}

function getDefaultPackages() {
  console.log('📦 Returning default packages')
  const response = NextResponse.json({
    success: true,
    packages: [
      {
        id: 'starter',
        name: 'Starter',
        description: 'Perfect for small businesses',
        price: 29,
        passLimit: 1000,
        programLimit: 3,
        staffLimit: 2,
        features: [
          { id: 'passes', name: 'Up to 1,000 active passes', included: true },
          { id: 'notifications', name: 'Unlimited push notifications', included: true },
          { id: 'analytics', name: 'Basic analytics', included: true },
          { id: 'support', name: 'Email support', included: true }
        ],
        isPopular: false
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'Best for growing businesses',
        price: 79,
        passLimit: 10000,
        programLimit: 10,
        staffLimit: 10,
        features: [
          { id: 'passes', name: 'Up to 10,000 active passes', included: true },
          { id: 'notifications', name: 'Unlimited push notifications', included: true },
          { id: 'analytics', name: 'Advanced analytics', included: true },
          { id: 'automations', name: 'Automated campaigns', included: true },
          { id: 'api', name: 'API access', included: true },
          { id: 'support', name: 'Priority support', included: true }
        ],
        isPopular: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large organizations',
        price: 199,
        passLimit: 100000,
        programLimit: -1, // Unlimited
        staffLimit: -1, // Unlimited
        features: [
          { id: 'passes', name: 'Unlimited active passes', included: true },
          { id: 'notifications', name: 'Unlimited push notifications', included: true },
          { id: 'analytics', name: 'Advanced analytics & reporting', included: true },
          { id: 'automations', name: 'Advanced automation workflows', included: true },
          { id: 'api', name: 'Full API access', included: true },
          { id: 'whitelabel', name: 'White-label options', included: true },
          { id: 'sla', name: '99.9% uptime SLA', included: true },
          { id: 'support', name: '24/7 dedicated support', included: true }
        ],
        isPopular: false
      }
    ]
  })
  
  // Add CORS headers for production domains
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  
  return response
}
