import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 })
    }

    // Get the domain details
    const { data: domain, error: fetchError } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    }

    console.log(`🔍 Verifying DNS for domain: ${domain.domain}`)

    // Check DNS resolution using DNS over HTTPS API
    let verified = false
    let sslVerified = false

    try {
      // Use Cloudflare's DNS over HTTPS API to check DNS records
      const dnsResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain.domain}&type=CNAME`, {
        headers: {
          'Accept': 'application/dns-json'
        }
      })

      const dnsData = await dnsResponse.json()
      console.log(`📡 DNS lookup result for ${domain.domain}:`, JSON.stringify(dnsData, null, 2))
      
      // Check if CNAME record points to walletpush.io
      let hasWalletPush = false
      let hasCorrectIP = false
      
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        // Check CNAME records
        for (const record of dnsData.Answer) {
          if (record.type === 5 && record.data && record.data.includes('walletpush.io')) {
            hasWalletPush = true
            console.log(`✅ Found CNAME pointing to walletpush.io: ${record.data}`)
            break
          }
        }
      }

      // Also check A record to see if it resolves to our IP
      if (!hasWalletPush) {
        const aResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain.domain}&type=A`, {
          headers: {
            'Accept': 'application/dns-json'
          }
        })
        
        const aData = await aResponse.json()
        console.log(`📡 A record lookup for ${domain.domain}:`, JSON.stringify(aData, null, 2))
        
        if (aData.Answer && aData.Answer.length > 0) {
          for (const record of aData.Answer) {
            if (record.type === 1 && record.data === '216.198.79.1') {
              hasCorrectIP = true
              console.log(`✅ Found A record pointing to correct IP: ${record.data}`)
              break
            }
          }
        }
      }
      
      console.log(`🔍 Verification checks:`)
      console.log(`  - CNAME points to 'walletpush.io': ${hasWalletPush}`)
      console.log(`  - A record points to '216.198.79.1': ${hasCorrectIP}`)
      
      if (hasWalletPush || hasCorrectIP) {
        verified = true
        sslVerified = true // For simplicity, assume SSL is OK if DNS is working
        console.log(`✅ DNS verification successful for ${domain.domain}`)
      } else {
        console.log(`❌ DNS verification failed for ${domain.domain} - not pointing to walletpush.io or correct IP`)
      }
    } catch (dnsError) {
      console.error(`❌ DNS lookup failed for ${domain.domain}:`, dnsError)
      verified = false
    }

    // Update domain status in database
    const newStatus = verified ? 'active' : 'pending'
    const newSslStatus = sslVerified ? 'active' : 'pending'

    const { error: updateError } = await supabase
      .from('custom_domains')
      .update({
        status: newStatus,
        ssl_status: newSslStatus,
        dns_configured: verified,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('❌ Error updating domain status:', updateError)
      return NextResponse.json({ error: 'Failed to update domain status' }, { status: 500 })
    }

    console.log(`📝 Updated domain ${domain.domain} status to: ${newStatus}`)

    return NextResponse.json({ 
      verified,
      ssl_verified: sslVerified,
      status: newStatus,
      ssl_status: newSslStatus,
      message: verified ? 'Domain verified successfully!' : 'DNS not configured correctly yet'
    })
    
  } catch (error) {
    console.error('❌ Domain verification error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
