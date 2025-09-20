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

    // Get current active account (same logic as working GET /api/domains)
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
        .maybeSingle()

      accountId = userAccounts?.account_id
    }

    // Fallback: check businesses table directly
    if (!accountId) {
      const { data: businessAccount } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()

      accountId = businessAccount?.id
    }

    if (!accountId) {
      console.error('❌ No account found for user:', user.id)
      return NextResponse.json({ error: 'No account found' }, { status: 404 })
    }

    console.log('🔍 Delete domain - using accountId:', accountId)

    // Verify domain belongs to current account before deleting
    const { data: domain } = await supabase
      .from('custom_domains')
      .select('id, domain, vercel_domain_id, business_id')
      .eq('id', id)
      .eq('business_id', accountId)
      .single()

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found or access denied' }, { status: 404 })
    }

    console.log(`🗑️ Deleting domain: ${domain.domain} (ID: ${id})`)
    console.log(`🔍 Using accountId: ${accountId} for business_id match`)
    console.log(`🔍 Domain business_id: ${domain.business_id}`)

    // Step 1: Remove domain from Vercel if it exists
    let vercelDeleted = false
    if (domain.vercel_domain_id) {
      try {
        console.log(`🌐 Removing domain from Vercel: ${domain.vercel_domain_id}`)
        await vercel.removeDomain(domain.vercel_domain_id)
        console.log(`✅ Domain removed from Vercel successfully`)
        vercelDeleted = true
      } catch (vercelError) {
        console.error(`❌ Failed to remove domain from Vercel:`, vercelError)
        console.error(`❌ Vercel error details:`, vercelError instanceof Error ? vercelError.message : vercelError)
        // FAIL THE ENTIRE OPERATION if Vercel cleanup fails
        return NextResponse.json({ 
          error: `Failed to remove domain from Vercel: ${vercelError instanceof Error ? vercelError.message : 'Unknown error'}` 
        }, { status: 500 })
      }
    } else {
      console.log(`⚠️ No vercel_domain_id found, skipping Vercel cleanup`)
      vercelDeleted = true // Consider it "deleted" if it wasn't in Vercel
    }

    // Step 2: Delete domain from database
    console.log(`🗑️ Executing DELETE WHERE id='${id}' AND business_id='${accountId}'`)
    
    const { error: deleteError, count } = await supabase
      .from('custom_domains')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('business_id', accountId)

    console.log(`📊 Delete result: error=${deleteError}, count=${count}`)

    if (deleteError) {
      console.error('❌ Error deleting domain from database:', deleteError)
      return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 })
    }

    if (count === 0) {
      console.error('❌ No rows deleted - accountId mismatch or domain not found')
      return NextResponse.json({ error: 'Domain not found or access denied' }, { status: 404 })
    }

    console.log(`✅ Domain deleted successfully from both Vercel and database: ${domain.domain}`)

    return NextResponse.json({ 
      success: true,
      vercel_deleted: vercelDeleted,
      database_deleted: true,
      message: `Domain ${domain.domain} deleted successfully. Removed from Vercel and database.`
    })
    
  } catch (error) {
    console.error('❌ Delete domain error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
