import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get all Pass Type IDs available to a business (assigned + owned)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current active account (should be a business)
    const { data: activeAccount } = await supabase
      .from('user_active_account')
      .select('active_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    // If no active account, get user's first business account
    let businessAccountId = activeAccount?.active_account_id
    
    if (!businessAccountId) {
      const { data: userAccounts } = await supabase
        .from('account_members')
        .select(`
          account_id,
          accounts!inner (
            id,
            type
          )
        `)
        .eq('user_id', user.id)
        .eq('accounts.type', 'business')
        .limit(1)
        .single()

      businessAccountId = userAccounts?.account_id
    }

    if (!businessAccountId) {
      return NextResponse.json({ error: 'No business account found' }, { status: 404 })
    }

    console.log('🔍 Fetching Pass Type IDs for business:', businessAccountId)

    // 1. Get assigned Pass Type IDs
    const { data: assignedPassTypes, error: assignedError } = await supabase
      .from('pass_type_assignments')
      .select(`
        id,
        created_at,
        pass_type_ids!inner (
          id,
          label,
          pass_type_identifier,
          team_id,
          is_validated,
          is_global,
          created_at
        ),
        assigned_by_accounts:accounts!assigned_by_account_id (
          name,
          type
        )
      `)
      .eq('business_account_id', businessAccountId)

    if (assignedError) {
      console.error('❌ Error fetching assigned Pass Type IDs:', assignedError)
      return NextResponse.json({ error: 'Failed to fetch assigned Pass Type IDs' }, { status: 500 })
    }

    // 2. Get owned Pass Type IDs (created by this business)
    const { data: ownedPassTypes, error: ownedError } = await supabase
      .from('pass_type_ids')
      .select('*')
      .eq('account_id', businessAccountId)

    if (ownedError) {
      console.error('❌ Error fetching owned Pass Type IDs:', ownedError)
      return NextResponse.json({ error: 'Failed to fetch owned Pass Type IDs' }, { status: 500 })
    }

    // 3. Get global Pass Type IDs (available to all)
    const { data: globalPassTypes, error: globalError } = await supabase
      .from('pass_type_ids')
      .select('*')
      .eq('is_global', true)

    if (globalError) {
      console.error('❌ Error fetching global Pass Type IDs:', globalError)
      return NextResponse.json({ error: 'Failed to fetch global Pass Type IDs' }, { status: 500 })
    }

    // Format the response
    const assignedFormatted = (assignedPassTypes || []).map(apt => ({
      ...apt.pass_type_ids,
      source: 'assigned',
      assigned_by: apt.assigned_by_accounts?.name,
      assigned_by_type: apt.assigned_by_accounts?.type,
      assignment_id: apt.id,
      assignment_date: apt.created_at
    }))

    const ownedFormatted = (ownedPassTypes || []).map(opt => ({
      ...opt,
      source: 'owned'
    }))

    const globalFormatted = (globalPassTypes || []).map(gpt => ({
      ...gpt,
      source: 'global'
    }))

    console.log(`✅ Found Pass Type IDs - Assigned: ${assignedFormatted.length}, Owned: ${ownedFormatted.length}, Global: ${globalFormatted.length}`)

    return NextResponse.json({
      assigned: assignedFormatted,
      owned: ownedFormatted,
      global: globalFormatted,
      // Legacy format for existing code
      passTypeIds: [...assignedFormatted, ...ownedFormatted, ...globalFormatted]
    })

  } catch (error) {
    console.error('❌ Business Pass Type IDs API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
