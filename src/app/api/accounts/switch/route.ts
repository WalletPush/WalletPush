import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { account_id, reason } = await request.json()

    if (!account_id) {
      return NextResponse.json({ error: 'account_id is required' }, { status: 400 })
    }

    console.log('🔄 Switching to account:', account_id, 'for user:', user.email)

    // Use the RPC function to safely switch accounts
    const { error: switchError } = await supabase.rpc('set_active_account', {
      target_account_id: account_id,
      reason: reason || 'user_switch'
    })

    if (switchError) {
      console.error('❌ Error switching account:', switchError)
      return NextResponse.json({ error: 'Failed to switch account' }, { status: 403 })
    }

    // Get the account details to return
    const { data: accountDetails, error: detailsError } = await supabase
      .from('accounts')
      .select('id, type, name, status')
      .eq('id', account_id)
      .single()

    if (detailsError) {
      console.error('❌ Error fetching account details:', detailsError)
      return NextResponse.json({ error: 'Failed to fetch account details' }, { status: 500 })
    }

    console.log('✅ Successfully switched to account:', accountDetails.name)

    return NextResponse.json({
      success: true,
      activeAccount: accountDetails
    })

  } catch (error) {
    console.error('❌ Account switch API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Clearing active account for user:', user.email)

    // Use the RPC function to safely clear active account
    const { error: clearError } = await supabase.rpc('clear_active_account', {
      reason: 'user_clear'
    })

    if (clearError) {
      console.error('❌ Error clearing active account:', clearError)
      return NextResponse.json({ error: 'Failed to clear active account' }, { status: 500 })
    }

    console.log('✅ Successfully cleared active account')

    return NextResponse.json({
      success: true,
      activeAccount: null
    })

  } catch (error) {
    console.error('❌ Account clear API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
