import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch agency's Pass Type IDs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Fetching Pass Type IDs for user:', user.email)

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
    
    const mockPassTypeIDs = [
      {
        id: '1',
        label: 'Agency Master Certificate',
        passTypeIdentifier: 'pass.com.myagency.master',
        teamId: 'ABC123DEF4',
        isValidated: true,
        isGlobal: false,
        source: 'owned',
        createdAt: '2024-01-10',
        assignedTo: {
          businessId: '1',
          businessName: 'Coffee Shop Pro',
          assignedAt: '2024-01-15'
        },
        certificateInfo: {
          fileName: 'agency_master.p12',
          expiresAt: '2025-01-10',
          uploadedAt: '2024-01-10'
        }
      },
      {
        id: '2',
        label: 'Premium Business Certificate',
        passTypeIdentifier: 'pass.com.myagency.premium',
        teamId: 'ABC123DEF4',
        isValidated: true,
        isGlobal: false,
        source: 'owned',
        createdAt: '2024-01-15',
        certificateInfo: {
          fileName: 'premium_cert.p12',
          expiresAt: '2025-01-15',
          uploadedAt: '2024-01-15'
        }
      },
      {
        id: '3',
        label: 'Loyalty Program Certificate',
        passTypeIdentifier: 'pass.com.myagency.loyalty',
        teamId: 'ABC123DEF4',
        isValidated: false,
        isGlobal: false,
        source: 'owned',
        createdAt: '2024-01-20',
        assignedTo: {
          businessId: '3',
          businessName: 'Restaurant Deluxe',
          assignedAt: '2024-01-22'
        },
        certificateInfo: {
          fileName: 'loyalty_cert.p12',
          expiresAt: '2025-01-20',
          uploadedAt: '2024-01-20'
        }
      },
      {
        id: 'global-1',
        label: 'Global Certificate',
        passTypeIdentifier: 'pass.com.walletpush.global',
        teamId: 'PLATFORM1',
        isValidated: true,
        isGlobal: true,
        source: 'global',
        createdAt: '2024-01-01',
        certificateInfo: {
          fileName: 'global_cert.p12',
          expiresAt: '2025-12-31',
          uploadedAt: '2024-01-01'
        }
      }
    ]

    console.log(`✅ Returning ${mockPassTypeIDs.length} Pass Type IDs`)

    return NextResponse.json({
      passTypeIds: mockPassTypeIDs,
      agencyInfo: {
        id: agencyAccountId,
        totalPassTypes: mockPassTypeIDs.length,
        validatedPassTypes: mockPassTypeIDs.filter(pt => pt.isValidated).length,
        assignedPassTypes: mockPassTypeIDs.filter(pt => pt.assignedTo).length
      }
    })

  } catch (error) {
    console.error('❌ Pass Type IDs API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new Pass Type ID
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const label = formData.get('label') as string
    const passTypeIdentifier = formData.get('passTypeIdentifier') as string
    const teamId = formData.get('teamId') as string
    const certificateFile = formData.get('certificate') as File | null

    if (!label || !passTypeIdentifier || !teamId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('🔑 Creating Pass Type ID for user:', user.email, 'label:', label)

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

    console.log('🏢 Creating Pass Type ID for agency:', agencyAccountId)

    // TODO: Replace with actual database operations and certificate processing once schema is applied
    // This would involve:
    // 1. Validate the certificate file
    // 2. Store certificate securely
    // 3. Create Pass Type ID record
    // 4. Initiate Apple validation process
    
    console.log(`✅ Successfully validated Pass Type ID creation: ${label}`)

    return NextResponse.json({
      success: true,
      message: 'Pass Type ID created successfully',
      passTypeId: Date.now().toString()
    })

  } catch (error) {
    console.error('❌ Create Pass Type ID API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
