import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Create admin client for server-side operations
function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const PLATFORM_OWNER_EMAIL = 'david.sambor@icloud.com'

export async function GET(request: NextRequest) {
  try {
    // First check authentication using server client
    const userSupabase = await createServerClient()
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()
    
    console.log('🔍 Platform agencies API called. Auth check:', {
      hasUser: !!user,
      userEmail: user?.email || 'none',
      authError: authError?.message || 'none'
    })
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message || 'No user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is platform owner
    if (user.email !== PLATFORM_OWNER_EMAIL) {
      console.log('❌ Access denied. User email:', user.email, 'Required:', PLATFORM_OWNER_EMAIL)
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    console.log('✅ Platform owner authenticated:', user.email)
    
    // Use the authenticated client (not service role) so RLS applies correctly
    const supabase = userSupabase
    
    console.log('🔍 Fetching all agencies from agency_accounts table...')
    
    // Get all agencies with their custom domains
    const { data: agencies, error, count } = await supabase
      .from('agency_accounts')
      .select(`
        id,
        name,
        email,
        created_at,
        subscription_status,
        admin_password,
        logo_url,
        owner_pricing_tier,
        pass_limit,
        custom_domain,
        custom_domain_status,
        custom_domains:custom_domains!agency_id(
          id,
          domain,
          status,
          domain_type,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch agencies' }, { status: 500 })
    }

    console.log('📊 Raw agencies query result:', {
      count,
      error,
      agencies: agencies?.map(a => ({
        id: a.id,
        name: a.name,
        email: a.email,
        admin_password: a.admin_password,
        custom_domains: a.custom_domains
      }))
    })

    // Transform the data to include custom domain info
    const transformedAgencies = agencies?.map(agency => ({
      id: agency.id,
      name: agency.name,
      email: agency.email,
      created_at: agency.created_at,
      subscription_status: agency.subscription_status || 'active',
      subscription_plan: agency.owner_pricing_tier || 'starter_100k', // Use owner_pricing_tier for agencies
      admin_password: agency.admin_password,
      logo_url: agency.logo_url,
      pass_limit: agency.pass_limit,
      businesses_count: 0, // TODO: Add actual count if needed
      custom_domain: agency.custom_domain || agency.custom_domains?.[0]?.domain, // Check both places
      domain_status: agency.custom_domain_status || agency.custom_domains?.[0]?.status || 'needs_setup'
    })) || []

    console.log('🚀 Sending to frontend:', {
      count: transformedAgencies.length,
      sample: transformedAgencies[0] ? {
        name: transformedAgencies[0].name,
        admin_password: transformedAgencies[0].admin_password,
        custom_domain: transformedAgencies[0].custom_domain,
        domain_status: transformedAgencies[0].domain_status
      } : null
    })

    return NextResponse.json(transformedAgencies)

  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
