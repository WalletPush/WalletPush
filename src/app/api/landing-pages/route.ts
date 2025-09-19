import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get real landing pages from database
    const { data: landingPages, error } = await supabase
      .from('landing_pages')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to fetch landing pages' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data: landingPages || [], error: null })
  } catch (error) {
    console.error('Error fetching landing pages:', error)
    return NextResponse.json(
      { data: null, error: 'Failed to fetch landing pages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { name, title, description, custom_url, html_content, settings, status, template_id, program_id } = body
    
    // For testing, we'll use the Blue Karma business ID
    const business_id = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    
    // Use the selected template_id (from Step 1) or null if not valid
    const selectedTemplateId = template_id || settings?.programTemplate || null
    const selectedProgramId = program_id || null // Don't force a program_id
    
    // Use only the basic columns that exist in the current schema
    const { data, error } = await supabase
      .from('landing_pages')
      .insert({
        business_id,
        name: name || title || 'Untitled Landing Page',
        custom_url: custom_url ? `${custom_url}-${Date.now()}` : `landing-${Date.now()}.example.com`,
        generated_html: html_content || '<html><body>Generated landing page content</body></html>',
        ai_prompt: `Generated landing page for: ${title || name || 'Untitled Page'}. Description: ${description || 'No description provided'}.`,
        is_published: status === 'published'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to create landing page' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data, error: null })
  } catch (error) {
    console.error('Error creating landing page:', error)
    return NextResponse.json(
      { data: null, error: 'Failed to create landing page' },
      { status: 500 }
    )
  }
}
