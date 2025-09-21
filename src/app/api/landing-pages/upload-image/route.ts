import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { promises as fs } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user authentication and business ID
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business ID from user's active account
    const { data: activeAccount } = await supabase
      .from('user_active_account')
      .select('active_account_id')
      .eq('user_id', user.id)
      .single()

    const businessId = activeAccount?.active_account_id
    if (!businessId) {
      return NextResponse.json({ error: 'No active business account' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo', 'background', 'social', 'additional'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB' }, { status: 400 })
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' }, { status: 400 })
    }

    // Prepare file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const contentType = file.type || 'application/octet-stream'

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${type}_${timestamp}_${randomString}.${extension}`

    // Preferred: Upload to Supabase Storage so URLs are stable on Vercel
    const bucket = 'landing-pages'
    const storagePath = `business-${businessId}/landing-pages/${filename}`

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, buffer, { contentType, upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicData } = await supabase.storage
        .from(bucket)
        .getPublicUrl(storagePath)

      if (publicData?.publicUrl) {
        return NextResponse.json({
          url: publicData.publicUrl,
          message: 'File uploaded successfully',
          fileName: file.name,
          size: file.size,
          type: file.type
        })
      }

      // If storage succeeded but no public URL, treat as error
      return NextResponse.json({ error: 'Storage public URL not available' }, { status: 500 })
    } catch (e: any) {
      // On Vercel, the filesystem is read-only at /var/task; do NOT try to write to /public in production
      if (process.env.NODE_ENV !== 'production') {
        // Dev-only fallback to public/uploads for local testing
        const businessDir = join(process.cwd(), 'public', 'uploads', `business-${businessId}`, 'landing-pages')
        await fs.mkdir(businessDir, { recursive: true })
        const filepath = join(businessDir, filename)
        await fs.writeFile(filepath, buffer)
        const origin = request.headers.get('x-forwarded-proto') && request.headers.get('x-forwarded-host')
          ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('x-forwarded-host')}`
          : (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000')
        const publicUrl = `${origin}/uploads/business-${businessId}/landing-pages/${filename}`
        return NextResponse.json({
          url: publicUrl,
          message: 'File uploaded successfully (dev fallback)',
          fileName: file.name,
          size: file.size,
          type: file.type
        })
      }
      return NextResponse.json({ error: `Storage upload failed: ${e?.message || e}` }, { status: 500 })
    }

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
