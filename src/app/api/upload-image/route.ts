import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Upload API called')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo' or 'background'
    
    console.log('📁 File details:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      uploadType: type
    })
    
    if (!file) {
      console.log('❌ No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file size (limit to 2MB for now to debug)
    if (file.size > 2 * 1024 * 1024) {
      console.log('❌ File too large:', file.size)
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB' },
        { status: 400 }
      )
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' },
        { status: 400 }
      )
    }

    console.log('🔄 Converting to base64...')
    // Convert file to base64 data URL for temporary storage
    let bytes: ArrayBuffer
    try {
      bytes = await file.arrayBuffer()
      console.log('✅ Got array buffer, size:', bytes.byteLength)
    } catch (error) {
      console.error('❌ Failed to get array buffer:', error)
      throw new Error('Failed to read file data')
    }
    
    let buffer: Buffer
    try {
      buffer = Buffer.from(bytes)
      console.log('✅ Created buffer')
    } catch (error) {
      console.error('❌ Failed to create buffer:', error)
      throw new Error('Failed to process file data')
    }
    
    let base64: string
    try {
      base64 = buffer.toString('base64')
      console.log('✅ Created base64, length:', base64.length)
    } catch (error) {
      console.error('❌ Failed to convert to base64:', error)
      throw new Error('Failed to encode file')
    }
    
    const dataUrl = `data:${file.type};base64,${base64}`
    
    console.log('✅ Upload successful:', file.name, `(${file.size} bytes)`)
    return NextResponse.json({ 
      url: dataUrl,
      message: 'File processed successfully',
      fileName: file.name,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Error processing file:', error)
    return NextResponse.json(
      { error: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
