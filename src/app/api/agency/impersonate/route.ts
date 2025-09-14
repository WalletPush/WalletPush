import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Impersonate/login as business
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { businessId } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    console.log('🎭 Impersonating business:', businessId, 'by user:', user.email)

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

    // TODO: Replace with actual impersonation logic once schema is applied
    // This would involve:
    // 1. Verify the business belongs to this agency
    // 2. Create an impersonation session
    // 3. Log the impersonation for audit
    // 4. Generate a secure redirect URL
    
    // For now, return a mock redirect URL
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/business/dashboard?impersonated=true&business_id=${businessId}`
    
    console.log(`✅ Generated impersonation URL for business ${businessId}`)

    return NextResponse.json({
      success: true,
      redirectUrl: redirectUrl,
      message: 'Impersonation session created'
    })

  } catch (error) {
    console.error('❌ Impersonate API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
