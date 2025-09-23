import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Admin: Uploading Global Pass Type ID certificate')
    
    // TODO: Add proper admin authentication check here
    // For now, we'll allow it but log it as admin operation
    
    const formData = await request.formData()
    const file = formData.get('certificate') as File
    const password = formData.get('password') as string
    const description = formData.get('description') as string
    const passTypeIdentifier = formData.get('pass_type_identifier') as string
    const teamId = formData.get('team_id') as string
    
    if (!file || !password || !passTypeIdentifier || !teamId) {
      return NextResponse.json({ 
        error: 'Certificate file, password, Pass Type Identifier, and Team ID are required for global certificates' 
      }, { status: 400 })
    }
    
    console.log('📝 Global Certificate details:', {
      fileName: file.name,
      size: file.size,
      description,
      passTypeIdentifier,
      teamId
    })
    
    // UPLOAD GLOBAL CERTIFICATE TO VERCEL BLOB
    const { put } = await import('@vercel/blob')
    
    // Generate unique filename for global blob storage
    const timestamp = Date.now()
    const certFileName = `global_cert_${timestamp}.p12`
    const blobKey = `certificates/global/${certFileName}`
    
    // Convert file to stream and upload to blob
    console.log(`📤 Uploading global certificate to Vercel Blob: ${blobKey}`)
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
    
    console.log('💾 Global certificate uploaded to blob:', blob.url)
    
    // Save to database as global Pass Type ID
    const supabase = await createClient()
    
    const newGlobalPassTypeId = {
      account_id: null, // Global Pass Type IDs have null account_id
      label: description || 'Global WalletPush Certificate',
      pass_type_identifier: passTypeIdentifier,
      team_id: teamId,
      p12_path: `./private/certificates/global/${certFileName}`, // Keep legacy path for compatibility
      p12_blob_url: blob.url, // New: Vercel Blob URL
      p12_password_enc: password, // TODO: Encrypt this in production!
      cert_password: password, // Also store in new field
      is_validated: true,
      is_global: true
    }
    
    console.log('💾 Saving Global Pass Type ID to database:', newGlobalPassTypeId)
    
    const { data, error } = await supabase
      .from('pass_type_ids')
      .insert(newGlobalPassTypeId)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Database insert failed:', error)
      throw error
    }
    
    console.log('✅ Global Pass Type ID saved to database:', data.id)
    
    return NextResponse.json({
      success: true,
      passTypeId: data,
      message: 'Global certificate uploaded and stored successfully'
    })
    
  } catch (error) {
    console.error('❌ Global certificate upload failed:', error)
    return NextResponse.json({ 
      error: `Failed to upload global certificate: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin: Fetching Global Pass Type IDs')
    
    const supabase = await createClient()
    
    // Query only global Pass Type IDs
    const { data: globalPassTypeIds, error } = await supabase
      .from('pass_type_ids')
      .select('*')
      .eq('is_global', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }
    
    console.log(`✅ Found ${globalPassTypeIds?.length || 0} Global Pass Type IDs`)
    
    return NextResponse.json({
      globalPassTypeIds: globalPassTypeIds || [],
      success: true
    })
    
  } catch (error) {
    console.error('❌ Failed to fetch Global Pass Type IDs:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch Global Pass Type IDs' 
    }, { status: 500 })
  }
}

