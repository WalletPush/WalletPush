import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get current user's agency account information
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Fetching agency account for user:', user.email)

    // Get or create agency account using the same RPC function as other routes
    const { data: agencyAccountId, error: agencyError } = await supabase
      .rpc('get_or_create_agency_account')

    if (agencyError || !agencyAccountId) {
      console.error('❌ Agency account error:', agencyError)
      return NextResponse.json({ error: 'Failed to get agency account' }, { status: 500 })
    }

    console.log('🏢 Agency account ID:', agencyAccountId)

    // Now get the full agency account details
    const { data: agencyAccount, error: fetchError } = await supabase
      .from('agency_accounts')
      .select(`
        id,
        name,
        email,
        company_name,
        website,
        phone,
        address,
        city,
        state,
        zip_code,
        country,
        subscription_status,
        subscription_plan,
        monthly_price,
        pass_limit,
        businesses_limit,
        pass_type_ids_limit,
        custom_domain,
        custom_domain_status,
        dns_configured,
        logo_url,
        primary_color,
        secondary_color,
        owner_pricing_tier,
        created_at,
        updated_at
      `)
      .eq('id', agencyAccountId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching agency account details:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch agency account details' }, { status: 500 })
    }

    console.log('✅ Found agency account:', agencyAccount.name)

    // Also get custom domains for this agency in the same call
    const { data: customDomains, error: domainsError } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('agency_id', agencyAccountId)
      .order('created_at', { ascending: false })

    if (domainsError) {
      console.error('❌ Error fetching custom domains:', domainsError)
      // Don't fail the whole request, just return empty domains
    }

    console.log(`✅ Found ${customDomains?.length || 0} custom domains for agency`)

    return NextResponse.json({
      success: true,
      agency: agencyAccount,
      customDomains: customDomains || []
    })

  } catch (error) {
    console.error('❌ Agency account API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
