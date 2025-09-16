import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
        agency_id,
        contact_email,
        contact_phone,
        max_passes,
        max_members,
        total_passes_created,
        total_members,
        monthly_cost,
        trial_ends_at
      `)
      .eq('agency_id', agencyAccountId)
    
    if (businessError) {
      return NextResponse.json({ 
        error: `Failed to fetch businesses: ${businessError.message}`,
        debug: `Business Error: ${businessError.code} - ${businessError.details}`
      }, { status: 500 })
    }

    // If no businesses found, debug what's in the businesses table
    if (!businessAccounts || businessAccounts.length === 0) {
      const { data: allBusinesses, error: allError } = await supabase
        .from('businesses')
        .select('id, name, agency_id')
        .limit(10)
      
      return NextResponse.json({ 
        error: `No businesses found for agency ${agencyAccountId}`,
        debug: `Found ${allBusinesses?.length || 0} total businesses. Sample: ${JSON.stringify(allBusinesses?.slice(0,3) || [])}`,
        agencyId: agencyAccountId
      }, { status: 404 })
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

    // Get or create agency account using our helper function
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

    // Create business in database
    const { data: newBusiness, error: businessError } = await supabase
      .from('businesses')
      .insert({
        agency_id: agencyAccountId,
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
        debug: `Database Error: ${businessError.message} | Code: ${businessError.code} | Details: ${businessError.details}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Business created successfully',
      business: newBusiness
    })

  } catch (error) {
    console.error('❌ Create business API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
