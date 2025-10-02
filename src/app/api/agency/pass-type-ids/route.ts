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

    // Get or create agency account using the same RPC function as other routes
    const { data: agencyAccountId, error: agencyError } = await supabase
      .rpc('get_or_create_agency_account')

    if (agencyError || !agencyAccountId) {
      console.error('❌ Agency account error:', agencyError)
      return NextResponse.json({ error: 'Failed to get agency account' }, { status: 500 })
    }

    console.log('🏢 Agency account:', agencyAccountId)

    // Query Pass Type IDs from database
    // Return Pass Type IDs associated with this specific agency account AND global certificates
    // Include: agency-specific certificates (account_id = agencyAccountId) OR global certificates (is_global = true AND account_id IS NULL)
    const { data: passTypeIds, error: passTypeIdsError } = await supabase
      .from('pass_type_ids')
      .select(`
        id,
        label,
        pass_type_identifier,
        team_id,
        is_validated,
        is_global,
        created_at,
        p12_blob_url,
        p12_path,
        cert_password,
        account_id
      `)
      .or(`account_id.eq.${agencyAccountId},and(is_global.eq.true,account_id.is.null)`)
      .order('is_global', { ascending: false })
      .order('created_at', { ascending: false })

    if (passTypeIdsError) {
      console.error('❌ Error fetching Pass Type IDs:', passTypeIdsError)
      return NextResponse.json({ error: 'Failed to fetch Pass Type IDs' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const formattedPassTypeIds = passTypeIds?.map(pt => ({
      id: pt.id.toString(),
      label: pt.label,
      passTypeIdentifier: pt.pass_type_identifier,
      teamId: pt.team_id,
      isValidated: pt.is_validated || false,
      isGlobal: pt.is_global || false,
      source: pt.is_global ? 'global' : 'owned',
      createdAt: pt.created_at?.split('T')[0] || '',
      certificateInfo: {
        fileName: pt.p12_path ? pt.p12_path.split('/').pop() || 'unknown.p12' : null,
        blobUrl: pt.p12_blob_url,
        hasPassword: !!pt.cert_password,
        uploadedAt: pt.created_at?.split('T')[0] || ''
      }
    })) || []

    console.log(`✅ Returning ${formattedPassTypeIds.length} Pass Type IDs for agency ${agencyAccountId}`)

    return NextResponse.json({
      passTypeIds: formattedPassTypeIds,
      agencyInfo: {
        id: agencyAccountId,
        totalPassTypes: formattedPassTypeIds.length,
        validatedPassTypes: formattedPassTypeIds.filter(pt => pt.isValidated).length,
        assignedPassTypes: 0 // TODO: Count actual assignments when that feature is implemented
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

    // Get or create agency account using the same RPC function as other routes
    const { data: agencyAccountId, error: agencyError } = await supabase
      .rpc('get_or_create_agency_account')

    if (agencyError || !agencyAccountId) {
      console.error('❌ Agency account error:', agencyError)
      return NextResponse.json({ error: 'Failed to get agency account' }, { status: 500 })
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
