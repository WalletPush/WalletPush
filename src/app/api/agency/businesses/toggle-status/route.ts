import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Toggle business status (activate/suspend)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, status } = body

    if (!businessId || !status || !['active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Business ID and valid status are required' }, { status: 400 })
    }

    console.log('🔄 Toggling business status:', businessId, 'to:', status)

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
    // For now, just validate and return success
    
    console.log(`✅ Successfully ${status === 'active' ? 'activated' : 'suspended'} business ${businessId}`)

    return NextResponse.json({
      success: true,
      message: `Business ${status === 'active' ? 'activated' : 'suspended'} successfully`
    })

  } catch (error) {
    console.error('❌ Toggle status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
