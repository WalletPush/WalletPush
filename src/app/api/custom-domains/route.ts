import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { vercel } from '@/lib/vercel'

// Create admin client for server-side operations
function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const { domain, domain_type, agency_id, business_id } = await request.json()
    
    if (!domain || !domain_type) {
      return NextResponse.json({ error: 'Domain and domain_type are required' }, { status: 400 })
    }

    if (domain_type === 'agency' && !agency_id) {
      return NextResponse.json({ error: 'agency_id is required for agency domains' }, { status: 400 })
    }

    if (domain_type === 'business' && !business_id) {
      return NextResponse.json({ error: 'business_id is required for business domains' }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    // Check if domain already exists
    const { data: existingDomain } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('domain', domain)
      .single()

    if (existingDomain) {
      return NextResponse.json({ error: 'Domain already exists' }, { status: 409 })
    }

    // Check if domain already exists in Vercel, if not add it
    console.log('🌐 Adding domain to Vercel:', domain)
    let vercelResult
    try {
      // Try to get existing domain first
      const existingDomain = await vercel.getDomain(domain)
      console.log(`✅ Domain already exists in Vercel:`, existingDomain.name)
      vercelResult = {
        domain: existingDomain,
        verified: existingDomain.verified,
        verificationInstructions: existingDomain.verification || []
      }
    } catch (error) {
      // Domain doesn't exist, add it
      console.log(`🆕 Domain not found, adding to Vercel: ${domain}`)
      vercelResult = await vercel.addAndVerifyDomain(domain)
    }
    
    if (!vercelResult.domain) {
      console.error('❌ Vercel domain creation failed')
      return NextResponse.json({ 
        error: 'Failed to add domain to Vercel'
      }, { status: 500 })
    }

    // Get verification instructions from Vercel
    let verificationInstructions = null
    if (vercelResult.verificationInstructions && vercelResult.verificationInstructions.length > 0) {
      const cname = vercelResult.verificationInstructions.find(v => v.type === 'CNAME')
      const txt = vercelResult.verificationInstructions.find(v => v.type === 'TXT')
      
      verificationInstructions = {
        cname: cname?.value || 'cname.vercel-dns.com',
        txt: txt?.value
      }
    }

    // Insert into database
    const { data: newDomain, error: dbError } = await supabase
      .from('custom_domains')
      .insert({
        domain,
        domain_type,
        agency_id: domain_type === 'agency' ? agency_id : null,
        business_id: domain_type === 'business' ? business_id : null,
        vercel_domain_id: vercelResult.domain?.name || domain,
        verification_instructions: verificationInstructions,
        status: 'pending',
        ssl_status: 'pending'
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      return NextResponse.json({ error: 'Database error', details: dbError.message }, { status: 500 })
    }

    console.log('✅ Domain created successfully:', newDomain)

    return NextResponse.json({
      success: true,
      domain: newDomain,
      verification_instructions: verificationInstructions
    })

  } catch (error) {
    console.error('❌ Custom domains API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agency_id = searchParams.get('agency_id')
    const business_id = searchParams.get('business_id')
    
    const supabase = createSupabaseClient()
    
    let query = supabase.from('custom_domains').select('*')
    
    if (agency_id) {
      query = query.eq('agency_id', agency_id)
    }
    
    if (business_id) {
      query = query.eq('business_id', business_id)
    }
    
    const { data: domains, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ domains })
    
  } catch (error) {
    console.error('❌ Custom domains GET error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}