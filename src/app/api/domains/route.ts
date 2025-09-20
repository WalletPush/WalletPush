import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List domains for current account
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current active account
    const { data: activeAccount } = await supabase
      .from('user_active_account')
      .select('active_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let accountId = activeAccount?.active_account_id

    if (!accountId) {
      const { data: userAccounts } = await supabase
        .from('account_members')
        .select('account_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      accountId = userAccounts?.account_id
    }

    if (!accountId) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 })
    }

    // Get domains for this account
    const { data: domains, error: domainsError } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('business_id', accountId)
      .order('created_at', { ascending: false })

    if (domainsError) {
      console.error('❌ Error fetching domains:', domainsError)
      return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 })
    }

    return NextResponse.json({ domains })
    
  } catch (error) {
    console.error('❌ Domains API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add new domain
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { domain, domain_type, is_primary } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    // Try new account system first
    const { data: activeAccount } = await supabase
      .from('user_active_account')
      .select('active_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let accountId = activeAccount?.active_account_id

    if (!accountId) {
      const { data: userAccounts } = await supabase
        .from('account_members')
        .select('account_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      accountId = userAccounts?.account_id
    }

    // If no account found via new account system, check if this user's active account 
    // is actually a business ID (businesses exist in both accounts and businesses tables)
    if (!accountId) {
      console.log('🔍 No account found via account system, checking if user has business in active account')
      
      // Check if the user has been set up with an active account that's a business
      if (activeAccount?.active_account_id) {
        // Verify this active_account_id exists in businesses table
        const { data: businessData } = await supabase
          .from('businesses')
          .select('id, name')
          .eq('id', activeAccount.active_account_id)
          .single()

        if (businessData) {
          accountId = businessData.id
          console.log('✅ Found business via active_account_id:', businessData.name, businessData.id)
        }
      }
    }

    if (!accountId) {
      console.error('❌ No account ID found for user:', user.id)
      return NextResponse.json({ 
        error: 'No account found',
        details: 'User has no associated business account'
      }, { status: 404 })
    }

    console.log('✅ Found account ID:', accountId)

    // Check if domain already exists
    const { data: existingDomain } = await supabase
      .from('custom_domains')
      .select('id')
      .eq('domain', domain)
      .single()

    if (existingDomain) {
      return NextResponse.json({ error: 'Domain already exists' }, { status: 409 })
    }

    // Add new domain
    const { data: newDomain, error: insertError } = await supabase
      .from('custom_domains')
      .insert({
        business_id: accountId,
        domain,
        status: 'pending',
        ssl_status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error adding domain:', insertError)
      return NextResponse.json({ 
        error: 'Failed to add domain', 
        details: insertError.message,
        code: insertError.code 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      domain: newDomain 
    })
    
  } catch (error) {
    console.error('❌ Add domain error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Remove domain
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('id')

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 })
    }

    // Get current active account
    const { data: activeAccount } = await supabase
      .from('user_active_account')
      .select('active_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let accountId = activeAccount?.active_account_id

    if (!accountId) {
      const { data: userAccounts } = await supabase
        .from('account_members')
        .select('account_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      accountId = userAccounts?.account_id
    }

    if (!accountId) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 })
    }

    // Delete domain (only if it belongs to current account)
    const { error: deleteError } = await supabase
      .from('custom_domains')
      .delete()
      .eq('id', domainId)
      .eq('business_id', accountId)

    if (deleteError) {
      console.error('❌ Error deleting domain:', deleteError)
      return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('❌ Delete domain error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
