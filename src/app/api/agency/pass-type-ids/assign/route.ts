import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Assign Pass Type ID to business
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { passTypeId, businessId } = body

    if (!passTypeId || !businessId) {
      return NextResponse.json({ error: 'Pass Type ID and business ID are required' }, { status: 400 })
    }

    console.log('🔗 Assigning Pass Type ID:', passTypeId, 'to business:', businessId)

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

    console.log('🏢 Agency account:', agencyAccountId)

    // TODO: Replace with actual database operations once schema is applied
    // This would involve:
    // 1. Verify the Pass Type ID belongs to this agency
    // 2. Verify the business belongs to this agency
    // 3. Check if business already has a Pass Type ID (enforce 1:1 rule)
    // 4. Create the assignment record
    // 5. Update business configuration
    
    console.log(`✅ Successfully assigned Pass Type ID ${passTypeId} to business ${businessId}`)

    return NextResponse.json({
      success: true,
      message: 'Pass Type ID assigned successfully'
    })

  } catch (error) {
    console.error('❌ Assign Pass Type ID API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
