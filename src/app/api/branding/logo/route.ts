import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/branding/logo
 * Upload business logo to Vercel Blob organized by business_id
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('logo') as File
    const businessId = formData.get('businessId') as string

    if (!file) {
      return NextResponse.json({ error: 'No logo file provided' }, { status: 400 })
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload PNG, JPG, or WebP files.' 
      }, { status: 400 })
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large. Please upload files under 2MB.' 
      }, { status: 400 })
    }

    // Get file extension
    const extension = file.name.split('.').pop() || 'png'
    
    // Create organized blob path: business-logos/{business_id}/logo.{ext}
    const blobPath = `business-logos/${businessId}/logo.${extension}`

    console.log(`🖼️ Uploading business logo to: ${blobPath}`)

    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false // Keep consistent filename for updates
    })

    console.log(`✅ Logo uploaded successfully: ${blob.url}`)

    // Optionally, store the logo URL in the database
    // You can add database logic here to associate the logo with the business
    
    return NextResponse.json({
      success: true,
      logoUrl: blob.url,
      blobPath,
      message: 'Logo uploaded successfully'
    })

  } catch (error) {
    console.error('❌ Error uploading business logo:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/branding/logo
 * Delete business logo from Vercel Blob
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    // Note: Vercel Blob doesn't have a delete API yet, but we can mark as deleted in DB
    // For now, we'll just return success
    console.log(`🗑️ Logo deletion requested for business: ${businessId}`)

    return NextResponse.json({
      success: true,
      message: 'Logo deletion requested'
    })

  } catch (error) {
    console.error('❌ Error deleting business logo:', error)
    return NextResponse.json(
      { error: 'Failed to delete logo' },
      { status: 500 }
    )
  }
}
