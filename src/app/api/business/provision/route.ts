import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Create service client with full permissions to bypass RLS for business provisioning
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ No authenticated user for business provision:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🏢 Provisioning business account for user:', user.email)

    // Get user metadata which includes package and business info
    const userMetadata = user.user_metadata || {}
    const selectedPackage = userMetadata.selected_package
    const businessName = userMetadata.business_name
    const fullName = userMetadata.full_name

    if (!businessName) {
      console.error('❌ No business name found in user metadata')
      return NextResponse.json({ error: 'Business name required' }, { status: 400 })
    }

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14)

    // Get the WalletPush agency account ID (hardcoded for now)
    const walletPushAgencyId = 'a7d7baa2-0b71-453e-ab7f-0c19b9214be4'

    // Create business account record
    const businessData = {
      name: businessName,
      slug: businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      contact_email: user.email,
      contact_phone: '', // Can be added later in settings
      status: 'active',
      subscription_status: 'trial',
      subscription_plan: selectedPackage?.package_name || 'starter',
      agency_account_id: walletPushAgencyId,
      max_passes: selectedPackage?.pass_limit || 1000,
      max_members: selectedPackage?.pass_limit || 1000, // Same as passes for now
      monthly_cost: selectedPackage?.package_price || 29,
      trial_ends_at: trialEndDate.toISOString(),
      total_passes_created: 0,
      total_members: 0
    }

    const { data: business, error: businessError } = await serviceSupabase
      .from('businesses')
      .insert(businessData)
      .select()
      .single()

    if (businessError) {
      console.error('❌ Error creating business:', businessError)
      return NextResponse.json({ 
        error: 'Failed to create business account', 
        details: businessError.message 
      }, { status: 500 })
    }

    console.log('✅ Business created:', business.id)

    // Create account record
    const accountData = {
      id: business.id, // Use same ID as business for simplicity
      name: businessName,
      type: 'business',
      status: 'trial'
    }

    const { data: account, error: accountError } = await serviceSupabase
      .from('accounts')
      .insert(accountData)
      .select()
      .single()

    if (accountError) {
      console.error('❌ Error creating account:', accountError)
      // If account creation fails, try to clean up business record
      await serviceSupabase.from('businesses').delete().eq('id', business.id)
      return NextResponse.json({ 
        error: 'Failed to create account', 
        details: accountError.message 
      }, { status: 500 })
    }

    console.log('✅ Account created:', account.id)

    // Update business record with account_id
    const { error: updateBusinessError } = await serviceSupabase
      .from('businesses')
      .update({ account_id: account.id })
      .eq('id', business.id)

    if (updateBusinessError) {
      console.error('❌ Error updating business with account_id:', updateBusinessError)
      // Don't fail the whole process for this, but log it
    } else {
      console.log('✅ Business updated with account_id:', account.id)
    }

    // Create account member record (link user to business)
    const memberData = {
      account_id: account.id,
      user_id: user.id,
      role: 'owner'
    }

    const { error: memberError } = await serviceSupabase
      .from('account_members')
      .insert(memberData)

    if (memberError) {
      console.error('❌ Error creating account member:', memberError)
      // Clean up created records
      await serviceSupabase.from('accounts').delete().eq('id', account.id)
      await serviceSupabase.from('businesses').delete().eq('id', business.id)
      return NextResponse.json({ 
        error: 'Failed to create account membership', 
        details: memberError.message 
      }, { status: 500 })
    }

    console.log('✅ Account member created for user:', user.id)

    // Set this as the user's active account
    const { error: activeAccountError } = await serviceSupabase
      .from('user_active_account')
      .upsert({
        user_id: user.id,
        active_account_id: account.id
      })

    if (activeAccountError) {
      console.error('❌ Error setting active account:', activeAccountError)
      // Don't fail the whole process for this
    } else {
      console.log('✅ Set active account for user:', user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Business account provisioned successfully',
      business: {
        id: business.id,
        name: business.name,
        plan: business.subscription_plan,
        trial_ends_at: business.trial_ends_at
      },
      account: {
        id: account.id,
        name: account.name
      }
    })

  } catch (error) {
    console.error('❌ Business provision API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
