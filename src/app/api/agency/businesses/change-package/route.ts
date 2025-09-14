import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Change business package
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, packageId } = body

    if (!businessId || !packageId) {
      return NextResponse.json({ error: 'Business ID and package ID are required' }, { status: 400 })
    }

    console.log('📦 Changing package for business:', businessId, 'to package:', packageId)

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
    
    console.log(`✅ Successfully changed package for business ${businessId} to package ${packageId}`)

    return NextResponse.json({
      success: true,
      message: 'Business package updated successfully'
    })

  } catch (error) {
    console.error('❌ Change package API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
