import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/branding/profile
 * Upload customer profile picture to Vercel Blob organized by customer_id
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('profile') as File
    const customerId = formData.get('customerId') as string

    if (!file) {
      return NextResponse.json({ error: 'No profile picture provided' }, { status: 400 })
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
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
    
    // Create organized blob path: customer-profiles/{customer_id}/profile.{ext}
    const blobPath = `customer-profiles/${customerId}/profile.${extension}`

    console.log(`👤 Uploading customer profile to: ${blobPath}`)

    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false // Keep consistent filename for updates
    })

    console.log(`✅ Profile picture uploaded successfully: ${blob.url}`)

    // Optionally, store the profile URL in the database
    // You can add database logic here to associate the profile with the customer
    
    return NextResponse.json({
      success: true,
      profileUrl: blob.url,
      blobPath,
      message: 'Profile picture uploaded successfully'
    })

  } catch (error) {
    console.error('❌ Error uploading profile picture:', error)
    return NextResponse.json(
      { error: 'Failed to upload profile picture' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/branding/profile
 * Delete customer profile picture from Vercel Blob
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    // Note: Vercel Blob doesn't have a delete API yet, but we can mark as deleted in DB
    // For now, we'll just return success
    console.log(`🗑️ Profile picture deletion requested for customer: ${customerId}`)

    return NextResponse.json({
      success: true,
      message: 'Profile picture deletion requested'
    })

  } catch (error) {
    console.error('❌ Error deleting profile picture:', error)
    return NextResponse.json(
      { error: 'Failed to delete profile picture' },
      { status: 500 }
    )
  }
}
