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

    // Generate unique timestamp for filename
    const timestamp = Date.now()

    // Handle certificate file upload if provided
    let p12BlobUrl: string | null = null
    if (certificateFile) {
      const { put } = await import('@vercel/blob')
      const certFileName = `agency_cert_${timestamp}.p12`
      const blobKey = `certificates/${agencyAccountId}/${certFileName}`
      
      // Convert file to stream and upload to blob
      console.log(`📤 Uploading agency certificate to Vercel Blob: ${blobKey}`)
      const arrayBuffer = await certificateFile.arrayBuffer()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(arrayBuffer))
          controller.close()
        }
      })
      
      const blob = await put(blobKey, stream, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN!
      })
      
      p12BlobUrl = blob.url
      console.log('💾 Agency certificate uploaded to blob:', p12BlobUrl)
    }

    // Create Pass Type ID record in database
    const newPassTypeId = {
      account_id: agencyAccountId,
      label,
      pass_type_identifier: passTypeIdentifier,
      team_id: teamId,
      p12_path: certificateFile ? `./private/certificates/agency_cert_${timestamp}.p12` : null,
      p12_blob_url: p12BlobUrl,
      p12_password_enc: formData.get('password') as string || null,
      cert_password: formData.get('password') as string || null,
      is_validated: true,
      is_global: false
    }

    const { data: savedPassTypeId, error: saveError } = await supabase
      .from('pass_type_ids')
      .insert(newPassTypeId)
      .select()
      .single()

    if (saveError) {
      console.error('❌ Database save error:', saveError)
      throw saveError
    }
    
    console.log(`✅ Successfully created Pass Type ID: ${savedPassTypeId.id}`)

    return NextResponse.json({
      success: true,
      message: 'Pass Type ID created successfully',
      passTypeId: savedPassTypeId
    })

  } catch (error) {
    console.error('❌ Create Pass Type ID API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
