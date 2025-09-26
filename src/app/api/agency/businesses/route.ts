import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// GET - Fetch agency's businesses
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create agency account using our helper function
    const { data: agencyAccountId, error: agencyError } = await supabase
      .rpc('get_or_create_agency_account')

    if (agencyError || !agencyAccountId) {
      return NextResponse.json({ 
        error: 'Failed to get agency account',
        debug: `Agency Error: ${agencyError?.message || 'No agency account ID returned'}. Expected: 49aadd4f-3065-4b6c-9440-dc0b63012338`
      }, { status: 500 })
    }

    // Use the agency account ID directly (it's now returning the correct agency_accounts ID)
    
    const { data: businessAccounts, error: businessError } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        subscription_status,
        subscription_plan,
        created_at,
        updated_at,
        agency_account_id,
        contact_email,
        contact_phone,
        max_passes,
        max_members,
        total_passes_created,
        total_members,
        monthly_cost,
        trial_ends_at
      `)
      .eq('agency_account_id', agencyAccountId)
    
    if (businessError) {
      return NextResponse.json({ 
        error: `Failed to fetch businesses: ${businessError.message}`,
        debug: `Business Error: ${businessError.code} - ${businessError.details}`
      }, { status: 500 })
    }

    // If no businesses found, return empty array (this is a valid state)
    if (!businessAccounts || businessAccounts.length === 0) {
      console.log(`📋 No businesses found for agency: ${agencyAccountId} (this is normal for new agencies)`)
      
      return NextResponse.json({
        businesses: [],
        agencyInfo: {
          id: agencyAccountId,
          totalBusinesses: 0,
          activeBusinesses: 0,
          totalRevenue: 0
        }
      })
    }

    // Transform the data to match the expected format
    const businesses = (businessAccounts || []).map(business => ({
      id: business.id,
      name: business.name,
      email: business.contact_email || `admin@${business.name.toLowerCase().replace(/\s+/g, '')}.com`,
      status: business.subscription_status || 'active',
      package: {
        id: business.subscription_plan || 'starter',
        name: business.subscription_plan === 'starter' ? 'Starter Plan' : 
              business.subscription_plan === 'business' ? 'Business Plan' : 
              business.subscription_plan === 'enterprise' ? 'Enterprise Plan' : 'Custom Plan',
        price: business.monthly_cost || 0,
        passLimit: business.max_passes || 1000,
        programLimit: -1, // Unlimited for agency businesses
        staffLimit: business.max_members || 500
      },
      usage: {
        passesUsed: business.total_passes_created || 0,
        programsCreated: 1, // Default for now
        staffAccounts: business.total_members || 0,
        monthlyRevenue: business.monthly_cost || 0
      },
      createdAt: business.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      lastActive: business.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      domain: `loyalty.${business.name.toLowerCase().replace(/\s+/g, '')}.com`,
      trialEndsAt: business.trial_ends_at?.split('T')[0] || null
    }))

    // Success - return the businesses

    return NextResponse.json({
      businesses: businesses,
      agencyInfo: {
        id: agencyAccountId,
        totalBusinesses: businesses.length,
        activeBusinesses: businesses.filter(b => b.status === 'active').length,
        totalRevenue: businesses.reduce((sum, b) => sum + b.usage.monthlyRevenue, 0)
      }
    })

  } catch (error) {
    console.error('❌ Businesses API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new business
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Create service client with full permissions to bypass RLS for business creation
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
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      slug, 
      contact_email, 
      contact_phone, 
      address, 
      subscription_plan, 
      custom_domain 
    } = body

    if (!name || !contact_email || !subscription_plan) {
      return NextResponse.json({ error: 'Missing required fields (name, contact_email, subscription_plan)' }, { status: 400 })
    }

    // Get or create agency account using our helper function with regular client (needs session)
    const { data: agencyAccountId, error: agencyError } = await supabase
      .rpc('get_or_create_agency_account')

    if (agencyError || !agencyAccountId) {
      return NextResponse.json({ 
        error: 'Failed to get agency account',
        debug: `Agency Error: ${agencyError?.message || 'No agency account ID returned'}`
      }, { status: 500 })
    }

    // Set pricing based on subscription plan
    const pricingMap = {
      starter: { cost: 19.99, passes: 1000, members: 500 },
      business: { cost: 49.99, passes: 5000, members: 2000 },
      enterprise: { cost: 149.99, passes: 25000, members: 10000 }
    }
    
    const pricing = pricingMap[subscription_plan as keyof typeof pricingMap] || pricingMap.starter

    // First, create the business record using service client (following successful pattern)
    const { data: newBusiness, error: businessError } = await serviceSupabase
      .from('businesses')
      .insert({
        agency_account_id: agencyAccountId,
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        contact_email,
        contact_phone,
        address,
        subscription_plan,
        subscription_status: 'trial',
        monthly_cost: pricing.cost,
        max_passes: pricing.passes,
        max_members: pricing.members,
        custom_domain: custom_domain || null,
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
        next_billing_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (businessError) {
      console.error('❌ Failed to create business:', businessError)
      return NextResponse.json({ 
        error: `Failed to create business: ${businessError.message}`,
        debug: `Business Error: ${businessError.message} | Code: ${businessError.code} | Details: ${businessError.details}`
      }, { status: 500 })
    }

    console.log('✅ Created business:', newBusiness.id)

    // Now create the account record using the same ID as business (this pattern works)
    const { data: newAccount, error: accountError } = await serviceSupabase
      .from('accounts')
      .insert({
        id: newBusiness.id, // Use same ID as business for simplicity
        name: name,
        type: 'business',
        status: 'trial'
      })
      .select()
      .single()

    if (accountError) {
      console.error('❌ Failed to create account:', accountError)
      // If account creation fails, clean up business record
      await serviceSupabase.from('businesses').delete().eq('id', newBusiness.id)
      return NextResponse.json({ 
        error: `Failed to create account: ${accountError.message}`,
        debug: `Account Error: ${accountError.message} | Code: ${accountError.code} | Details: ${accountError.details}`
      }, { status: 500 })
    }

    console.log('✅ Created account:', newAccount.id)

    // Update business to link to the account
    const { error: updateError } = await serviceSupabase
      .from('businesses')
      .update({ account_id: newAccount.id })
      .eq('id', newBusiness.id)

    if (updateError) {
      console.error('❌ Failed to link business to account:', updateError)
      // Clean up both records if linking fails
      await serviceSupabase.from('accounts').delete().eq('id', newAccount.id)
      await serviceSupabase.from('businesses').delete().eq('id', newBusiness.id)
      return NextResponse.json({ 
        error: `Failed to link business to account: ${updateError.message}`,
        debug: `Update Error: ${updateError.message}`
      }, { status: 500 })
    }

    console.log('✅ Linked business to account successfully')

    return NextResponse.json({
      success: true,
      message: 'Business and account created successfully',
      business: { ...newBusiness, account_id: newAccount.id },
      account: newAccount
    })

  } catch (error) {
    console.error('❌ Create business API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
