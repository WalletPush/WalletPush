import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    // Create service client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const hostname = request.nextUrl.searchParams.get('domain') || 'walletpush.io'
    
    console.log(`🔍 Checking domain registration for: ${hostname}`)
    
    // Check custom_domains table
    const { data: customDomains, error: customError } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('domain', hostname)
    
    // Check businesses table for business with this domain
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('id, name, slug')
      .limit(5)
    
    // Check landing_pages table
    const { data: landingPages, error: lpError } = await supabase
      .from('landing_pages')
      .select('id, name, custom_url, is_published, business_id, program_id, template_id')
      .eq('is_published', true)
      .limit(10)
    
    return NextResponse.json({
      hostname,
      custom_domains: {
        data: customDomains,
        error: customError
      },
      businesses: {
        data: businesses,
        error: bizError
      },
      landing_pages: {
        data: landingPages,
        error: lpError
      }
    })
    
  } catch (error) {
    console.error('Domain check error:', error)
    return NextResponse.json({ error: 'Domain check failed', details: error }, { status: 500 })
  }
}
