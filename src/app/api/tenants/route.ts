import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


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

    console.log('🔍 Fetching accounts for user:', user.id, user.email)

    // Get all accounts the user has access to via account_members
    const { data: userAccounts, error: accountsError } = await supabase
      .from('account_members')
      .select(`
        account_id,
        role,
        accounts!inner (
          id,
          type,
          name,
          parent_agency_id,
          status,
          created_at
        )
      `)
      .eq('user_id', user.id)

    if (accountsError) {
      console.error('❌ Error fetching user accounts:', accountsError)
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
    }

    // Get current active account from switcher
    const { data: activeAccount } = await supabase
      .from('user_active_account')
      .select('active_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    // Format accounts for response
    const accounts = userAccounts?.map(ua => {
      const account = Array.isArray(ua.accounts) ? ua.accounts[0] : ua.accounts
      return {
        id: account?.id,
        name: account?.name,
        type: account?.type,
        role: ua.role,
        status: account?.status,
        parent_agency_id: account?.parent_agency_id,
        created_at: account?.created_at
      }
    }) || []

    // Find current account (either active or first available)
    let currentAccount = null
    if (activeAccount?.active_account_id) {
      currentAccount = accounts.find(acc => acc.id === activeAccount.active_account_id)
    }
    if (!currentAccount && accounts.length > 0) {
      currentAccount = accounts[0] // Default to first account
    }

    console.log(`✅ Found ${accounts.length} accounts for user, current:`, currentAccount?.name)

    return NextResponse.json({
      currentAccount,
      accounts,
      // Legacy compatibility
      currentTenant: currentAccount,
      tenants: accounts
    })

  } catch (error) {
    console.error('❌ Accounts API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}