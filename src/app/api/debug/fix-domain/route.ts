import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    // Create service client with full permissions
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const body = await request.json().catch(() => ({}))
    const domain = body.domain || 'walletpush.io'
    const businessId = body.business_id || '75c3013b-36bd-4d87-a684-61a72cda7e02' // Sambor Beach Club
    
    console.log(`🔧 Fixing domain setup for: ${domain}`)
    
    // Step 1: Add walletpush.io to custom_domains table
    const { data: customDomain, error: domainError } = await supabase
      .from('custom_domains')
      .upsert({
        domain: domain,
        business_id: businessId,
        status: 'active',
        ssl_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (domainError) {
      console.error('❌ Failed to register domain:', domainError)
      return NextResponse.json({ error: 'Failed to register domain', details: domainError }, { status: 500 })
    }
    
    console.log('✅ Domain registered:', customDomain)
    
    // Step 2: Fix the existing landing page with NULL program_id/template_id
    const landingPageId = body.landing_page_id || '4d1f175f-2cfe-4b32-ae8a-f10e8e5e9c39'
    
    // Get a template for this business to use as program_id/template_id
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('id, program_id')
      .eq('account_id', businessId)
      .limit(1)
      .single()
    
    if (template && !templateError) {
      console.log('🔧 Fixing landing page with template:', template.id)
      
      const { data: updatedLandingPage, error: updateError } = await supabase
        .from('landing_pages')
        .update({
          template_id: template.id,
          program_id: template.program_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', landingPageId)
        .select()
        .single()
      
      if (updateError) {
        console.error('⚠️ Failed to update landing page:', updateError)
      } else {
        console.log('✅ Landing page updated:', updatedLandingPage)
      }
      
      return NextResponse.json({
        success: true,
        domain_registered: customDomain,
        landing_page_updated: updatedLandingPage,
        template_used: template
      })
    } else {
      console.warn('⚠️ No template found for business, domain registered but landing page not updated')
      
      return NextResponse.json({
        success: true,
        domain_registered: customDomain,
        landing_page_updated: null,
        warning: 'No template found to fix landing page program_id/template_id'
      })
    }
    
  } catch (error) {
    console.error('❌ Fix domain error:', error)
    return NextResponse.json({ error: 'Fix domain failed', details: error }, { status: 500 })
  }
}
