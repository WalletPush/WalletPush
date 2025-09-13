import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching Pass Type IDs from REAL database')
    
    const supabase = await createClient()
    const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191' // Hardcoded for now
    
    // Query both business Pass Type IDs and global Pass Type IDs
    const { data: passTypeIds, error } = await supabase
      .from('pass_type_ids')
      .select('*')
      .or(`tenant_id.eq.${businessId},is_global.eq.true`)
      .order('is_global', { ascending: false }) // Global first
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Database error:', error)
      throw error
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
    console.error('❌ Failed to fetch Pass Type IDs:', error)
    
    return NextResponse.json({ 
      error: 'Failed to fetch Pass Type IDs',
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
    
    // STORE THE ACTUAL CERTIFICATE FILE
    const { writeFile, mkdir } = await import('fs/promises')
    const { join } = await import('path')
    const { existsSync } = await import('fs')
    
    // Create certificates directory
    const certsDir = join(process.cwd(), 'private', 'certificates')
    if (!existsSync(certsDir)) {
      await mkdir(certsDir, { recursive: true })
    }
    
    // Save the certificate with a secure filename
    const timestamp = Date.now()
    const certFileName = `cert_${timestamp}.p12`
    const certPath = join(certsDir, certFileName)
    
    // Store the certificate binary data
    const certBytes = await file.arrayBuffer()
    const certBuffer = Buffer.from(certBytes)
    await writeFile(certPath, certBuffer)
    
    console.log('💾 Certificate saved to:', certPath)
    
    // TODO: Extract real Pass Type ID and Team ID from certificate using node-forge
    // For now, use placeholder values but store the real certificate
    
    // Save to database
    const supabase = await createClient()
    const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    
    const newPassTypeId = {
      tenant_id: isGlobal ? null : businessId, // Global Pass Type IDs have null tenant_id
      label: description || (isGlobal ? 'Global WalletPush Certificate' : 'Uploaded Certificate'),
      pass_type_identifier: 'pass.com.walletpushio', // TODO: Extract from certificate
      team_id: 'NC4W34D5LD', // TODO: Extract from certificate
      p12_path: certPath,
      p12_password_enc: password, // TODO: Encrypt this in production!
      is_validated: true,
      is_global: isGlobal
    }
    
    console.log('💾 Saving to database:', newPassTypeId)
    
    const { data, error } = await supabase
      .from('pass_type_ids')
      .insert(newPassTypeId)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Database insert failed:', error)
      throw error
    }
    
    console.log('✅ Pass Type ID saved to database:', data.id)
    
    return NextResponse.json({
      success: true,
      passTypeId: data,
      message: 'Certificate uploaded and stored successfully'
    })
    
  } catch (error) {
    console.error('❌ Certificate upload failed:', error)
    return NextResponse.json({ 
      error: `Failed to upload certificate: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}