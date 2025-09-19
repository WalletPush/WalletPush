import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Validate that ID is provided
    if (!id) {
      return NextResponse.json(
        { error: 'Landing page ID is required' },
        { status: 400 }
      )
    }

    // Delete the landing page from database
    const { error } = await supabase
      .from('landing_pages')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to delete landing page' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Landing page deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting landing page:', error)
    return NextResponse.json(
      { error: 'Failed to delete landing page' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Validate that ID is provided
    if (!id) {
      return NextResponse.json(
        { error: 'Landing page ID is required' },
        { status: 400 }
      )
    }

    // Get specific landing page from database
    const { data: landingPage, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch landing page' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data: landingPage })
  } catch (error) {
    console.error('Error fetching landing page:', error)
    return NextResponse.json(
      { error: 'Failed to fetch landing page' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params
    const body = await request.json()

    // Validate that ID is provided
    if (!id) {
      return NextResponse.json(
        { error: 'Landing page ID is required' },
        { status: 400 }
      )
    }

    const { name, title, description, custom_url, html_content, settings, status } = body
    
    // Update the landing page in database
    const { data, error } = await supabase
      .from('landing_pages')
      .update({
        name: name || title,
        custom_url,
        logo_url: settings?.logo || null,
        background_image_url: settings?.backgroundImage || null,
        ai_prompt: `Updated landing page for: ${title || name || 'Untitled Page'}. Description: ${description || 'No description provided'}`,
        generated_html: html_content,
        is_published: status === 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update landing page' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error updating landing page:', error)
    return NextResponse.json(
      { error: 'Failed to update landing page' },
      { status: 500 }
    )
  }
}
