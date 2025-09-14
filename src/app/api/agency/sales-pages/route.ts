import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/agency/sales-pages called')
    
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('🔐 Auth check:', { user: !!user, error: userError?.message })
    
    if (userError || !user) {
      console.error('❌ Auth failed:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      title, 
      description, 
      custom_url, 
      html_content, 
      settings, 
      status 
    } = body

    console.log('💾 Saving agency sales page:', { name, title, status, hasHtml: !!html_content })

    // Get or create agency account
    console.log('🏢 Getting agency account...')
    const { data: agencyAccountId, error: agencyError } = await supabase
      .rpc('get_or_create_agency_account')

    console.log('🏢 Agency account result:', { agencyAccountId, error: agencyError?.message })

    if (agencyError || !agencyAccountId) {
      console.error('❌ Agency account error:', agencyError)
      return NextResponse.json({ 
        error: `AGENCY_ACCOUNT_ERROR: ${agencyError?.message || 'No agency account ID returned'}` 
      }, { status: 500 })
    }

    // Generate a slug from the name
    const pageSlug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-') || 'sales-page'

    // Prepare data for upsert
    const pageData = {
      agency_account_id: agencyAccountId,
      page_name: name,
      page_type: 'sales',
      page_slug: pageSlug,
      page_title: title,
      page_subtitle: description,
      
      // Content from settings
      headline: settings?.headline || '',
      subheadline: settings?.subHeadline || '',
      value_proposition: settings?.keyBenefits?.join(', ') || '',
      call_to_action: 'Get Started Now', // Default CTA
      selected_packages: settings?.selectedPackages || [],
      features: settings?.howItWorks || [],
      
      // Design
      template_style: settings?.selectedTemplate || settings?.customTemplate || 'custom',
      
      // Meta
      meta_title: title,
      meta_description: description,
      
      // Publishing
      is_published: status === 'published',
      is_active: true,
      custom_domain: custom_url,
      
      // Generated content
      html_content: html_content,
      
      // Timestamps
      updated_at: new Date().toISOString()
    }

    console.log('📝 Page data prepared:', { 
      ...pageData, 
      html_content: html_content ? `${html_content.substring(0, 100)}...` : 'null',
      selected_packages: pageData.selected_packages?.length || 0,
      features: pageData.features?.length || 0
    })

    // Use UPSERT to either INSERT or UPDATE existing page
    console.log('💽 Upserting into agency_sales_pages...')
    const { data: salesPage, error: upsertError } = await supabase
      .from('agency_sales_pages')
      .upsert(pageData, {
        onConflict: 'agency_account_id,page_slug'
      })
      .select()
      .single()

    console.log('💽 Upsert result:', { 
      success: !!salesPage, 
      error: upsertError?.message,
      salesPageId: salesPage?.id 
    })

    if (upsertError) {
      console.error('❌ Upsert error:', upsertError)
      return NextResponse.json({ 
        error: `DATABASE_UPSERT_ERROR: ${upsertError.message} | Code: ${upsertError.code} | Details: ${upsertError.details}` 
      }, { status: 500 })
    }

    console.log('✅ Sales page saved successfully:', salesPage.id)

    return NextResponse.json({
      success: true,
      message: `Sales page "${name}" saved successfully!`,
      data: salesPage
    })

  } catch (error) {
    console.error('❌ Save sales page error:', error)
    return NextResponse.json(
      { error: `SAVE_ERROR: ${error.message || error}` },
      { status: 500 }
    )
  }
}

// GET - Fetch saved sales pages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create agency account
    const { data: agencyAccountId, error: agencyError } = await supabase
      .rpc('get_or_create_agency_account')

    if (agencyError || !agencyAccountId) {
      console.error('Agency account error:', agencyError)
      return NextResponse.json({ error: 'Failed to get agency account' }, { status: 500 })
    }

    // Fetch sales pages for this agency
    const { data: salesPages, error: fetchError } = await supabase
      .from('agency_sales_pages')
      .select('*')
      .eq('agency_account_id', agencyAccountId)
      .eq('is_template', false)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch sales pages' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      pages: salesPages || []
    })

  } catch (error) {
    console.error('❌ Fetch sales pages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales pages' },
      { status: 500 }
    )
  }
}