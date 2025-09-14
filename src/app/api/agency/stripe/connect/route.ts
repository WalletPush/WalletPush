import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Initiate Stripe Connect flow for agency
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { accountType, country } = body

    if (!accountType || !country) {
      return NextResponse.json({ error: 'Account type and country are required' }, { status: 400 })
    }

    console.log('🔗 Initiating Stripe Connect for user:', user.email, 'type:', accountType, 'country:', country)

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
            type,
            name
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

    console.log('🏢 Creating Stripe Connect account for agency:', agencyAccountId)

    // TODO: Replace with actual Stripe API integration
    // For now, return a mock connect URL
    
    const mockConnectUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_mock&scope=read_write&redirect_uri=${encodeURIComponent('https://walletpush.com/agency/settings?stripe=connected')}&state=${agencyAccountId}`

    console.log('✅ Generated Stripe Connect URL')

    return NextResponse.json({
      success: true,
      connectUrl: mockConnectUrl,
      message: 'Stripe Connect URL generated successfully'
    })

  } catch (error) {
    console.error('❌ Stripe Connect API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
