import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as string // 'agency' or 'business'
    const entityId = formData.get('entityId') as string
    const domain = formData.get('domain') as string

    if (!file || !entityType || !entityId || !domain) {
      return NextResponse.json({ 
        error: 'Missing required fields: file, entityType, entityId, domain' 
      }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Verify user has permission to upload for this entity
    if (entityType === 'agency') {
      const { data: agency } = await supabase
        .from('agency_accounts')
        .select('id')
        .eq('id', entityId)
        .eq('user_id', user.id)
        .single()

      if (!agency) {
        return NextResponse.json({ error: 'Unauthorized to upload for this agency' }, { status: 403 })
      }
    } else if (entityType === 'business') {
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('id', entityId)
        .single()

      if (!business) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 })
      }

      // Check if user is owner/admin of this business
      const { data: membership } = await supabase
        .from('account_members')
        .select('role')
        .eq('account_id', business.id)
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin'])
        .single()

      if (!membership) {
        return NextResponse.json({ error: 'Unauthorized to upload for this business' }, { status: 403 })
      }
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const timestamp = Date.now()
    const filename = `logo-${timestamp}.${fileExtension}`
    const blobPath = `${entityType}/${entityId}/${filename}`

    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: 'public',
      contentType: file.type
    })

    // Store in branding_assets table
    const { data: brandingAsset, error: insertError } = await supabase
      .from('branding_assets')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        asset_type: 'logo',
        file_url: blob.url,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        domain_locked: domain,
        uploaded_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error storing branding asset:', insertError)
      return NextResponse.json({ error: 'Failed to store branding asset' }, { status: 500 })
    }

    // Update the entity's logo_url
    const updateTable = entityType === 'agency' ? 'agency_accounts' : 'businesses'
    const { error: updateError } = await supabase
      .from(updateTable)
      .update({ logo_url: blob.url })
      .eq('id', entityId)

    if (updateError) {
      console.error('Error updating entity logo:', updateError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      branding_asset: brandingAsset,
      blob_url: blob.url
    })

  } catch (error) {
    console.error('Branding upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}