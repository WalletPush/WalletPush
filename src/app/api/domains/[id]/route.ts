import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cloudflare } from '@/lib/cloudflare'

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
      .select('id, domain, cloudflare_record_id')
      .eq('id', id)
      .eq('business_id', accountId)
      .single()

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found or access denied' }, { status: 404 })
    }

    console.log(`🗑️ Deleting domain: ${domain.domain} (ID: ${id})`)

    // Step 1: Clean up Cloudflare DNS record if it exists
    if (domain.cloudflare_record_id) {
      try {
        console.log(`🌐 Removing Cloudflare DNS record: ${domain.cloudflare_record_id}`)
        await cloudflare.deleteDNSRecord(domain.cloudflare_record_id)
        console.log(`✅ Cloudflare DNS record removed successfully`)
      } catch (cloudflareError) {
        console.error(`❌ Failed to remove Cloudflare DNS record:`, cloudflareError)
        // Continue with database deletion even if Cloudflare cleanup fails
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
      message: `Domain ${domain.domain} deleted successfully. DNS records have been cleaned up.`
    })
    
  } catch (error) {
    console.error('❌ Delete domain error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
