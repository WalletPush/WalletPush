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
    const { domain, agency_id, business_id } = await request.json()
    
    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    // Get domain from database
    let query = supabase
      .from('custom_domains')
      .select('*')
      .eq('domain', domain)

    if (agency_id) {
      query = query.eq('agency_id', agency_id)
    }
    
    if (business_id) {
      query = query.eq('business_id', business_id)
    }

    const { data: domainRecord, error: fetchError } = await query.single()

    if (fetchError || !domainRecord) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    }

    console.log('🔍 Verifying domain:', domain)

    // Check domain status in Vercel
    const domainData = await vercel.verifyDomain(domain)
    
    if (!domainData) {
      console.error('❌ Failed to verify domain in Vercel')
      return NextResponse.json({ 
        error: 'Failed to verify domain status'
      }, { status: 500 })
    }

    let isVerified = domainData.verified === true
    let sslStatus = 'pending'

    // Check SSL status based on verification
    if (domainData.verification && domainData.verification.length > 0) {
      const hasValidVerification = domainData.verification.some(v => v.reason === 'verified')
      sslStatus = hasValidVerification ? 'active' : 'pending'
    } else if (isVerified) {
      sslStatus = 'active'
    }

    // Update database with verification status
    const updateData: any = {
      dns_verified_at: isVerified ? new Date().toISOString() : null,
      dns_configured: isVerified,
      ssl_status: sslStatus,
      status: isVerified ? 'active' : 'pending',
      last_verification_attempt: new Date().toISOString()
    }

    const { data: updatedDomain, error: updateError } = await supabase
      .from('custom_domains')
      .update(updateData)
      .eq('id', domainRecord.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Database update error:', updateError)
      return NextResponse.json({ error: 'Database error', details: updateError.message }, { status: 500 })
    }

    // Also update the agency_accounts table if this is an agency domain
    if (agency_id && isVerified) {
      const { error: agencyUpdateError } = await supabase
        .from('agency_accounts')
        .update({ 
          custom_domain_status: 'active',
          dns_configured: true 
        })
        .eq('id', agency_id)

      if (agencyUpdateError) {
        console.error('❌ Failed to update agency status:', agencyUpdateError)
      } else {
        console.log('✅ Updated agency domain status to active')
      }
    }

    console.log(`${isVerified ? '✅' : '❌'} Domain verification result:`, {
      domain,
      verified: isVerified,
      ssl_status: sslStatus
    })

    return NextResponse.json({
      success: true,
      verified: isVerified,
      domain: updatedDomain,
      vercel_data: domainData
    })

  } catch (error) {
    console.error('❌ Domain verification error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
