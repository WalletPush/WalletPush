import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client for server-side operations
function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    
    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 })
    }

    const supabase = createSupabaseClient()
    
    console.log('🎨 Looking up branding for domain:', domain)

    // First, check if this is an agency custom domain in custom_domains table
    const { data: agencyDomain, error: agencyError } = await supabase
      .from('custom_domains')
      .select(`
        domain,
        agency_id,
        agency_accounts!inner(
          name,
          logo_url,
          primary_color,
          secondary_color
        )
      `)
      .eq('domain', domain)
      .eq('domain_type', 'agency')
      .eq('status', 'active')
      .single()

    if (!agencyError && agencyDomain) {
      const agency = Array.isArray(agencyDomain.agency_accounts) 
        ? agencyDomain.agency_accounts[0] 
        : agencyDomain.agency_accounts

      console.log('✅ Found agency branding from custom_domains:', {
        domain,
        agency_name: agency.name,
        has_logo: !!agency.logo_url
      })

      return NextResponse.json({
        logo_url: agency.logo_url,
        primary_color: agency.primary_color || '#3B82F6',
        secondary_color: agency.secondary_color || '#1E40AF',
        agency_name: agency.name,
        custom_domain: domain,
        type: 'agency'
      })
    }

    // If not found in custom_domains, check agency_accounts table directly
    const { data: agencyAccount, error: agencyAccountError } = await supabase
      .from('agency_accounts')
      .select(`
        name,
        logo_url,
        primary_color,
        secondary_color,
        custom_domain,
        custom_domain_status
      `)
      .eq('custom_domain', domain)
      .eq('custom_domain_status', 'active')
      .single()

    if (!agencyAccountError && agencyAccount) {
      console.log('✅ Found agency branding from agency_accounts:', {
        domain,
        agency_name: agencyAccount.name,
        has_logo: !!agencyAccount.logo_url
      })

      return NextResponse.json({
        logo_url: agencyAccount.logo_url,
        primary_color: agencyAccount.primary_color || '#3B82F6',
        secondary_color: agencyAccount.secondary_color || '#1E40AF',
        agency_name: agencyAccount.name,
        custom_domain: domain,
        type: 'agency'
      })
    }

    // If not an agency domain, check if it's a business custom domain
    const { data: businessDomain, error: businessError } = await supabase
      .from('custom_domains')
      .select(`
        domain,
        business_id,
        businesses!inner(
          name,
          logo_url,
          primary_color,
          secondary_color
        )
      `)
      .eq('domain', domain)
      .eq('domain_type', 'business')
      .eq('status', 'active')
      .single()

    if (!businessError && businessDomain) {
      const business = Array.isArray(businessDomain.businesses) 
        ? businessDomain.businesses[0] 
        : businessDomain.businesses

      console.log('✅ Found business branding:', {
        domain,
        business_name: business.name,
        has_logo: !!business.logo_url
      })

      return NextResponse.json({
        logo_url: business.logo_url,
        primary_color: business.primary_color || '#3B82F6',
        secondary_color: business.secondary_color || '#1E40AF',
        business_name: business.name,
        custom_domain: domain,
        type: 'business'
      })
    }

    // No custom branding found
    console.log('📝 No custom branding found for domain:', domain)
    return NextResponse.json({ error: 'No branding found for this domain' }, { status: 404 })

  } catch (error) {
    console.error('❌ Branding API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}