import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { vercel } from '@/lib/vercel'

// DELETE - Remove specific domain by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
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

    // Verify domain belongs to current account before deleting
    const { data: domain } = await supabase
      .from('custom_domains')
      .select('id, domain, vercel_domain_id')
      .eq('id', id)
      .eq('business_id', accountId)
      .single()

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found or access denied' }, { status: 404 })
    }

    console.log(`🗑️ Deleting domain: ${domain.domain} (ID: ${id})`)

    // Step 1: Remove domain from Vercel if it exists
    if (domain.vercel_domain_id) {
      try {
        console.log(`🌐 Removing domain from Vercel: ${domain.vercel_domain_id}`)
        await vercel.removeDomain(domain.vercel_domain_id)
        console.log(`✅ Domain removed from Vercel successfully`)
      } catch (vercelError) {
        console.error(`❌ Failed to remove domain from Vercel:`, vercelError)
        // Continue with database deletion even if Vercel cleanup fails
      }
    }

    // Step 2: Delete domain from database
    const { error: deleteError } = await supabase
      .from('custom_domains')
      .delete()
      .eq('id', id)
      .eq('business_id', accountId)

    if (deleteError) {
      console.error('❌ Error deleting domain from database:', deleteError)
      return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 })
    }

    console.log(`✅ Domain deleted successfully: ${domain.domain}`)

    return NextResponse.json({ 
      success: true,
      message: `Domain ${domain.domain} deleted successfully. Removed from Vercel and database.`
    })
    
  } catch (error) {
    console.error('❌ Delete domain error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
