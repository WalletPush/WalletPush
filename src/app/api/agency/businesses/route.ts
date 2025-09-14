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

    console.log('🔍 Fetching businesses for user:', user.email)

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
            type
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

    console.log('🏢 Agency account:', agencyAccountId)

    // TODO: Replace with actual database queries once schema is applied
    // For now, return mock data
    
    const mockBusinesses = [
      {
        id: '1',
        name: 'Coffee Shop Pro',
        email: 'admin@coffeeshoppro.com',
        status: 'active',
        package: {
          id: '2',
          name: 'Business',
          price: 69,
          passLimit: 5000,
          programLimit: 10,
          staffLimit: 5
        },
        usage: {
          passesUsed: 2450,
          programsCreated: 3,
          staffAccounts: 2,
          monthlyRevenue: 69
        },
        createdAt: '2024-01-15',
        lastActive: '2024-01-25',
        domain: 'loyalty.coffeeshoppro.com'
      },
      {
        id: '2',
        name: 'Fitness First',
        email: 'owner@fitnessfirst.com',
        status: 'trial',
        package: {
          id: '1',
          name: 'Starter',
          price: 29,
          passLimit: 1000,
          programLimit: 3,
          staffLimit: 2
        },
        usage: {
          passesUsed: 156,
          programsCreated: 1,
          staffAccounts: 1,
          monthlyRevenue: 0
        },
        createdAt: '2024-01-20',
        lastActive: '2024-01-24',
        trialEndsAt: '2024-02-04'
      },
      {
        id: '3',
        name: 'Restaurant Deluxe',
        email: 'manager@restaurantdeluxe.com',
        status: 'active',
        package: {
          id: '3',
          name: 'Pro',
          price: 97,
          passLimit: 10000,
          programLimit: 20,
          staffLimit: -1
        },
        usage: {
          passesUsed: 7890,
          programsCreated: 8,
          staffAccounts: 12,
          monthlyRevenue: 97
        },
        createdAt: '2024-01-10',
        lastActive: '2024-01-25',
        domain: 'members.restaurantdeluxe.com'
      },
      {
        id: '4',
        name: 'Beauty Salon Elite',
        email: 'info@beautysalonelite.com',
        status: 'suspended',
        package: {
          id: '2',
          name: 'Business',
          price: 69,
          passLimit: 5000,
          programLimit: 10,
          staffLimit: 5
        },
        usage: {
          passesUsed: 4890,
          programsCreated: 9,
          staffAccounts: 4,
          monthlyRevenue: 0
        },
        createdAt: '2024-01-05',
        lastActive: '2024-01-18'
      }
    ]

    console.log(`✅ Returning ${mockBusinesses.length} businesses`)

    return NextResponse.json({
      businesses: mockBusinesses,
      agencyInfo: {
        id: agencyAccountId,
        totalBusinesses: mockBusinesses.length,
        activeBusinesses: mockBusinesses.filter(b => b.status === 'active').length,
        totalRevenue: mockBusinesses.reduce((sum, b) => sum + b.usage.monthlyRevenue, 0)
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
    const { name, email, packageId } = body

    if (!name || !email || !packageId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('🏗️ Creating business for user:', user.email, 'name:', name)

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
            type
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

    console.log('🏢 Creating business for agency:', agencyAccountId)

    // TODO: Replace with actual database operations once schema is applied
    // For now, just validate the data and return success
    
    console.log(`✅ Successfully validated business creation: ${name}`)

    return NextResponse.json({
      success: true,
      message: 'Business created successfully',
      businessId: Date.now().toString()
    })

  } catch (error) {
    console.error('❌ Create business API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
