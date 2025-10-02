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
    const { domain, agency_id } = await request.json()
    
    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    console.log('🔍 Getting DNS info for domain:', domain)

    // First check if domain exists in our database
    const supabase = createSupabaseClient()
    const { data: domainRecord } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('domain', domain)
      .single()

    // Get domain info from Vercel (this will show verification requirements)
    let domainData
    try {
      domainData = await vercel.getDomain(domain)
      console.log('📋 Domain data from Vercel:', {
        verified: domainData.verified,
        hasVerification: !!domainData.verification,
        verificationCount: domainData.verification?.length || 0,
        verification: domainData.verification
      })
    } catch (vercelError) {
      console.error('❌ Vercel API failed:', vercelError)
      return NextResponse.json({ 
        error: 'Failed to get domain info from Vercel',
        details: vercelError instanceof Error ? vercelError.message : 'Unknown Vercel error'
      }, { status: 500 })
    }

    // Format DNS records for display
    const dnsRecords = []
    
    if (domainData.verification && domainData.verification.length > 0) {
      for (const record of domainData.verification) {
        if (record.type === 'TXT') {
          dnsRecords.push({
            type: 'TXT',
            name: record.domain,
            value: record.value,
            description: 'Domain ownership verification',
            status: record.reason === 'verified' ? 'verified' : 'pending'
          })
        } else if (record.type === 'CNAME') {
          dnsRecords.push({
            type: 'CNAME',
            name: record.domain,
            value: record.value,
            description: 'Points your domain to Vercel',
            status: record.reason === 'verified' ? 'verified' : 'pending'
          })
        } else if (record.type === 'A') {
          dnsRecords.push({
            type: 'A',
            name: record.domain,
            value: record.value,
            description: 'Points your domain to Vercel servers',
            status: record.reason === 'verified' ? 'verified' : 'pending'
          })
        }
      }
    }

    // If no verification records but domain is verified, show standard CNAME
    if (dnsRecords.length === 0 && domainData.verified) {
      dnsRecords.push({
        type: 'CNAME',
        name: domain,
        value: 'cname.vercel-dns.com',
        description: 'Standard CNAME record (already configured)',
        status: 'verified'
      })
    }

    // If no records at all, provide default instructions
    if (dnsRecords.length === 0) {
      dnsRecords.push({
        type: 'CNAME',
        name: domain,
        value: 'cname.vercel-dns.com',
        description: 'Point your domain to Vercel',
        status: 'pending'
      })
    }

    return NextResponse.json({
      success: true,
      domain: domain,
      verified: domainData.verified,
      dns_records: dnsRecords,
      verification_instructions: domainData.verification || [],
      database_status: domainRecord?.status || 'not_found',
      instructions: {
        title: `DNS Configuration for ${domain}`,
        steps: [
          "1. Log in to your DNS provider (Cloudflare, GoDaddy, etc.)",
          "2. Navigate to DNS management for your domain",
          "3. Add the DNS records shown below",
          "4. Wait 5-10 minutes for DNS propagation",
          "5. Click 'Verify Domain' to check configuration"
        ]
      }
    })

  } catch (error) {
    console.error('❌ DNS info error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
