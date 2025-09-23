import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching Pass Type IDs from REAL database')
    
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current active account
    const { data: activeAccount } = await supabase
      .from('user_active_account')
      .select('active_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let accountId = activeAccount?.active_account_id

    // If no active account, get user's first account
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
      // Fallback to hardcoded business ID for backward compatibility
      accountId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    }

    // Get account type to determine what Pass Type IDs to show
    const { data: accountInfo } = await supabase
      .from('accounts')
      .select('type')
      .eq('id', accountId)
      .single()

    let passTypeIds = []

    if (accountInfo?.type === 'business') {
      // For businesses, get assigned + owned + global Pass Type IDs
      
      // 1. Get assigned Pass Type IDs
      const { data: assignedPassTypes } = await supabase
        .from('pass_type_assignments')
        .select(`
          pass_type_ids!inner (*)
        `)
        .eq('business_account_id', accountId)

      // 2. Get owned Pass Type IDs
      const { data: ownedPassTypes } = await supabase
        .from('pass_type_ids')
        .select('*')
        .eq('account_id', accountId)

      // 3. Get global Pass Type IDs
      const { data: globalPassTypes } = await supabase
        .from('pass_type_ids')
        .select('*')
        .eq('is_global', true)

      // Combine all Pass Type IDs
      passTypeIds = [
        ...(assignedPassTypes?.map(apt => ({ ...apt.pass_type_ids, source: 'assigned' })) || []),
        ...(ownedPassTypes?.map(opt => ({ ...opt, source: 'owned' })) || []),
        ...(globalPassTypes?.map(gpt => ({ ...gpt, source: 'global' })) || [])
      ]

    } else {
      // For agencies/platform, get their own Pass Type IDs + global
      const { data: agencyPassTypes, error } = await supabase
        .from('pass_type_ids')
        .select('*')
        .or(`account_id.eq.${accountId},is_global.eq.true`)
        .order('is_global', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Database error:', error)
        throw error
      }

      passTypeIds = (agencyPassTypes || []).map(item => ({ 
        ...item, 
        source: item.is_global ? 'global' : 'owned' 
      }))
    }
    
    console.log(`✅ Found ${passTypeIds?.length || 0} Pass Type IDs in database`)
    
    // Transform to match frontend interface using actual DB schema
    const transformedData = (passTypeIds || []).map(item => ({
      id: item.id,
      identifier: item.pass_type_identifier,
      description: item.label,
      team_identifier: item.team_id,
      organization_name: item.is_global ? 'WalletPush (Global)' : 'WalletPush',
      certificate_file_name: item.p12_path ? item.p12_path.split('/').pop() : 'Not uploaded',
      certificate_file_path: item.p12_path,
      certificate_password: item.p12_password_enc,
      certificate_expiry: '2026-12-10', // Default since not in DB
      status: item.is_validated ? 'active' : 'pending',
      is_default: item.is_global, // Global Pass Type IDs are default
      is_global: item.is_global || false, // Include global flag
      source: item.source || 'unknown', // assigned, owned, or global
      created_at: item.created_at,
      updated_at: item.updated_at || item.created_at,
      // Backwards compatibility
      label: item.label,
      pass_type_identifier: item.pass_type_identifier,
      team_id: item.team_id
    }))
    
    return NextResponse.json({
      passTypeIds: transformedData,
      success: true
    })
    
  } catch (error) {
    console.error('❌ Pass Type IDs fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      passTypeIds: []
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Uploading new Pass Type ID certificate to DATABASE')
    
    const formData = await request.formData()
    const file = formData.get('certificate') as File
    const password = formData.get('password') as string
    const description = formData.get('description') as string
    const isGlobal = formData.get('is_global') === 'true'
    
    if (!file || !password) {
      return NextResponse.json({ 
        error: 'Certificate file and password are required' 
      }, { status: 400 })
    }
    
    console.log('📝 Certificate details:', {
      fileName: file.name,
      size: file.size,
      description,
      isGlobal
    })
    
    // Get current user and account first
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    
    // UPLOAD CERTIFICATE TO VERCEL BLOB
    const { put } = await import('@vercel/blob')
    
    // Generate unique filename for blob storage
    const timestamp = Date.now()
    const certFileName = `cert_${timestamp}.p12`
    const blobKey = `certificates/${accountId || 'global'}/${certFileName}`
    
    // Convert file to stream and upload to blob
    console.log(`📤 Uploading certificate to Vercel Blob: ${blobKey}`)
    const arrayBuffer = await file.arrayBuffer()
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
    
    console.log('💾 Certificate uploaded to blob:', blob.url)

    if (!accountId) {
      // Fallback for backward compatibility
      accountId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    }
    
    const newPassTypeId = {
      account_id: isGlobal ? null : accountId, // Global Pass Type IDs have null account_id
      label: description || (isGlobal ? 'Global WalletPush Certificate' : 'Uploaded Certificate'),
      pass_type_identifier: 'pass.com.walletpushio', // TODO: Extract from certificate
      team_id: 'NC4W34D5LD', // TODO: Extract from certificate
      p12_path: `./private/certificates/${certFileName}`, // Keep legacy path for compatibility
      p12_blob_url: blob.url, // New: Vercel Blob URL
      p12_password_enc: password, // TODO: Encrypt this in production!
      cert_password: password, // Also store in new field
      apns_key_id: null,
      apns_team_id: 'NC4W34D5LD',
      apns_p8_path: null,
      issuer_id: null,
      service_account_path: null,
      is_validated: true, // Assume valid for now
      is_global: isGlobal || false
    }
    
    console.log('💾 Saving Pass Type ID to database:', newPassTypeId)
    
    const { data: savedPassTypeId, error: saveError } = await supabase
      .from('pass_type_ids')
      .insert(newPassTypeId)
      .select()
      .single()
    
    if (saveError) {
      console.error('❌ Database save error:', saveError)
      throw saveError
    }
    
    console.log('✅ Pass Type ID saved successfully:', savedPassTypeId.id)
    
    return NextResponse.json({
      success: true,
      passTypeId: savedPassTypeId,
      message: 'Pass Type ID certificate uploaded and saved successfully'
    })
    
  } catch (error) {
    console.error('❌ Pass Type ID upload error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}