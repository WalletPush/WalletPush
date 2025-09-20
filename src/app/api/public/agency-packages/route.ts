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

    // Use the specific agency account ID that has packages
    const agencyId = 'a7d7baa2-0b71-453e-ab7f-0c19b9214be4'

    // Fetch packages from database
    const { data: packages, error: packagesError } = await supabase
      .from('agency_packages')
      .select('*')
      .eq('agency_account_id', agencyId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (packagesError) {
      console.error('❌ Error fetching packages:', packagesError)
      return getDefaultPackages()
    }

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

    return NextResponse.json({
      success: true,
      packages: formattedPackages
    })

  } catch (error) {
    console.error('❌ Error fetching packages:', error)
    return getDefaultPackages()
  }
}

function getDefaultPackages() {
  console.log('📦 Returning default packages')
  return NextResponse.json({
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
}
