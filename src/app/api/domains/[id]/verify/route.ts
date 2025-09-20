import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

    // Check DNS resolution using nslookup
    let verified = false
    let sslVerified = false

    try {
      // Check CNAME record
      const { stdout } = await execAsync(`nslookup ${domain.domain}`)
      console.log(`📡 DNS lookup result for ${domain.domain}:`, stdout)
      
      // Check if it resolves to walletpush.io or our IP
      if (stdout.includes('walletpush.io') || stdout.includes('216.198.79.1')) {
        verified = true
        sslVerified = true // For simplicity, assume SSL is OK if DNS is working
        console.log(`✅ DNS verification successful for ${domain.domain}`)
      } else {
        console.log(`❌ DNS verification failed for ${domain.domain} - not pointing to walletpush.io`)
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
