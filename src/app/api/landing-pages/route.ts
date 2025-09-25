import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentBusinessId } from '@/lib/business-context'

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
    
    // Use the selected template_id (from Step 1) or null if not valid
    const selectedTemplateId = template_id || settings?.programTemplate || null
    const selectedProgramId = program_id || null // Don't force a program_id
    
    // For public landing pages, business_id comes from the selected template or explicit body parameter
    let business_id = body.business_id
    
    // If no explicit business_id, get it from the selected template
    if (!business_id && selectedTemplateId) {
      console.log('🔍 Getting business_id from selected template:', selectedTemplateId)
      
      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .select('account_id')
        .eq('id', selectedTemplateId)
        .single()
      
      if (templateData && !templateError) {
        // Get business_id from template's account_id
        business_id = templateData.account_id
        console.log('✅ Found business_id from template:', business_id)
      } else {
        console.warn('⚠️ Could not get business_id from template:', templateError)
      }
    }
    
    // For authenticated admin users creating landing pages, try to get from user context
    if (!business_id) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (user && !userError) {
        const { data: userAccount } = await supabase
          .from('account_members')
          .select('account_id')
          .eq('user_id', user.id)
          .in('role', ['owner', 'admin'])
          .single()
        
        if (userAccount) {
          business_id = userAccount.account_id
          console.log('✅ Found business_id from authenticated user:', business_id)
        }
      }
    }
    
    // Fallback for development/testing (Blue Karma)
    if (!business_id) {
      business_id = await getCurrentBusinessId(request)
      
      if (!business_id) {
        return NextResponse.json({ error: 'No business found for current user' }, { status: 404 })
      }
      console.warn('⚠️ Using Blue Karma fallback business_id for development')
    }
    
    // Use only the basic columns that exist in the current schema
    const { data, error } = await supabase
      .from('landing_pages')
      .insert({
        business_id,
        name: name || title || 'Untitled Landing Page',
        custom_url: custom_url ? `${custom_url}-${Date.now()}` : `landing-${Date.now()}.example.com`,
        generated_html: html_content || '<html><body>Generated landing page content</body></html>',
        ai_prompt: `Generated landing page for: ${title || name || 'Untitled Page'}. Description: ${description || 'No description provided'}.`,
        is_published: status === 'published',
        template_id: selectedTemplateId,
        program_id: selectedProgramId
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
