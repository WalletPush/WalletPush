import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get all businesses and Pass Type IDs that an agency can manage
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Fetching manageable resources for user:', user.email)

    // Get current active account (should be agency or platform)
    const { data: activeAccount } = await supabase
      .from('user_active_account')
      .select('active_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    // If no active account, get user's first agency account
    let agencyAccountId = activeAccount?.active_account_id
    
    if (!agencyAccountId) {
      const { data: userAccounts } = await supabase
        .from('account_members')
        .select(`
          account_id,
          role,
          accounts!inner (
            id,
            type
          )
        `)
        .eq('user_id', user.id)
        .in('accounts.type', ['agency', 'platform'])
        .in('role', ['owner', 'admin'])
        .limit(1)
        .single()

      agencyAccountId = userAccounts?.account_id
    }

    if (!agencyAccountId) {
      return NextResponse.json({ error: 'No agency account found' }, { status: 404 })
    }

    // Check if this is platform admin
    const { data: isPlatform } = await supabase
      .from('accounts')
      .select('type')
      .eq('id', agencyAccountId)
      .single()

    console.log('🏢 Agency/Platform account:', agencyAccountId, 'Type:', isPlatform?.type)

    // 1. Get manageable businesses
    let businessesQuery = supabase
      .from('accounts')
      .select(`
        id,
        name,
        status,
        created_at,
        parent_agency_id
      `)
      .eq('type', 'business')

    // If not platform, only show businesses under this agency
    if (isPlatform?.type !== 'platform') {
      businessesQuery = businessesQuery.eq('parent_agency_id', agencyAccountId)
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
    const assignmentMap = new Map()
    existingAssignments?.forEach(assignment => {
      assignmentMap.set(assignment.pass_type_id, {
        business_id: assignment.business_account_id,
        business_name: assignment.business_accounts?.name
      })
    })

    // Add assignment info to Pass Type IDs
    const passTypesWithAssignments = passTypes?.map(pt => ({
      ...pt,
      assigned_to: assignmentMap.get(pt.id) || null
    }))

    console.log(`✅ Found ${businesses?.length || 0} businesses and ${passTypes?.length || 0} Pass Type IDs`)

    return NextResponse.json({
      businesses: businesses || [],
      passTypes: passTypesWithAssignments || [],
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
