import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get all businesses and Pass Type IDs that an agency can manage

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Fetching manageable resources for user:', user.email)

    // Get or create agency account using our helper function
    const { data: agencyAccountId, error: agencyError } = await supabase
      .rpc('get_or_create_agency_account')

    if (agencyError || !agencyAccountId) {
      console.error('❌ Agency account error:', agencyError)
      return NextResponse.json({ 
        error: 'No agency account found',
        debug: `Agency Error: ${agencyError?.message || 'No agency account ID returned'}`
      }, { status: 404 })
    }

    // Check if this is platform admin
    const { data: isPlatform } = await supabase
      .from('accounts')
      .select('type')
      .eq('id', agencyAccountId)
      .single()

    console.log('🏢 Agency/Platform account:', agencyAccountId, 'Type:', isPlatform?.type)

    // 1. Get manageable businesses from the businesses table
    let businessesQuery = supabase
      .from('businesses')
      .select(`
        id,
        name,
        subscription_status,
        subscription_plan,
        created_at,
        agency_account_id,
        contact_email,
        max_passes,
        total_passes_created,
        total_members,
        monthly_cost
      `)

    // If not platform, only show businesses under this agency
    if (isPlatform?.type !== 'platform') {
      businessesQuery = businessesQuery.eq('agency_account_id', agencyAccountId)
    }

    const { data: businesses, error: businessesError } = await businessesQuery
      .order('created_at', { ascending: false })

    if (businessesError) {
      console.error('❌ Error fetching businesses:', businessesError)
      return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 })
    }

    // 2. Get agency's own Pass Type IDs (that can be assigned)
    let passTypeQuery = supabase
      .from('pass_type_ids')
      .select(`
        id,
        label,
        pass_type_identifier,
        team_id,
        is_validated,
        is_global,
        account_id,
        created_at
      `)

    // If platform, show all Pass Type IDs. If agency, show only theirs + global
    if (isPlatform?.type === 'platform') {
      // Platform sees all Pass Type IDs
      passTypeQuery = passTypeQuery.order('created_at', { ascending: false })
    } else {
      // Agency sees only their own + global
      passTypeQuery = passTypeQuery
        .or(`account_id.eq.${agencyAccountId},is_global.eq.true`)
        .order('is_global', { ascending: false })
        .order('created_at', { ascending: false })
    }

    const { data: passTypes, error: passTypesError } = await passTypeQuery

    if (passTypesError) {
      console.error('❌ Error fetching Pass Type IDs:', passTypesError)
      return NextResponse.json({ error: 'Failed to fetch Pass Type IDs' }, { status: 500 })
    }

    // 3. Get existing assignments to show what's already assigned
    const { data: existingAssignments, error: assignmentsError } = await supabase
      .from('pass_type_assignments')
      .select(`
        pass_type_id,
        business_account_id,
        business_accounts:accounts!business_account_id (
          name
        )
      `)

    if (assignmentsError) {
      console.error('❌ Error fetching existing assignments:', assignmentsError)
    }

    // Create a map of assigned Pass Type IDs
    const passTypeAssignmentMap = new Map()
    existingAssignments?.forEach(assignment => {
      passTypeAssignmentMap.set(assignment.pass_type_id, {
        business_id: assignment.business_account_id,
        business_name: Array.isArray(assignment.business_accounts) 
          ? assignment.business_accounts[0]?.name 
          : (assignment.business_accounts as any)?.name
      })
    })

    // Add assignment info to Pass Type IDs
    const passTypesWithAssignments = passTypes?.map(pt => ({
      ...pt,
      assigned_to: passTypeAssignmentMap.get(pt.id) || null
    }))

    // Get Pass Type ID assignments for these businesses
    const businessIds = (businesses || []).map(b => b.id)
    const { data: assignments } = await supabase
      .from('pass_type_assignments')
      .select(`
        business_account_id,
        pass_type_ids (
          id,
          label,
          is_global
        )
      `)
      .in('business_account_id', businessIds)

    // Create business assignment map
    const businessAssignmentMap = new Map()
    assignments?.forEach(assignment => {
      businessAssignmentMap.set(assignment.business_account_id, assignment.pass_type_ids)
    })

    // Transform businesses data to match dashboard expectations
    const transformedBusinesses = (businesses || []).map(business => ({
      id: business.id,
      name: business.name,
      status: business.subscription_status || 'active',
      created_at: business.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      member_count: business.total_members || 0,
      pass_count: business.total_passes_created || 0,
      revenue: business.monthly_cost || 0,
      assigned_pass_type: businessAssignmentMap.get(business.id) || null
    }))

    // Calculate totals for dashboard stats
    const totalRevenue = transformedBusinesses.reduce((sum, b) => sum + b.revenue, 0)
    const totalMembers = transformedBusinesses.reduce((sum, b) => sum + b.member_count, 0)
    const totalPasses = transformedBusinesses.reduce((sum, b) => sum + b.pass_count, 0)

    console.log(`✅ Found ${businesses?.length || 0} businesses and ${passTypes?.length || 0} Pass Type IDs`)

    return NextResponse.json({
      businesses: transformedBusinesses,
      passTypeIds: passTypesWithAssignments || [], // Note: dashboard expects 'passTypeIds' not 'passTypes'
      totalRevenue,
      monthlyRevenue: totalRevenue, // Assuming monthly for now
      totalMembers,
      totalPasses,
      agencyInfo: {
        id: agencyAccountId,
        type: isPlatform?.type,
        isPlatform: isPlatform?.type === 'platform'
      }
    })

  } catch (error) {
    console.error('❌ Agency manageable resources API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
