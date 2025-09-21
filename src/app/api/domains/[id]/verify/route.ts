import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { vercel } from '@/lib/vercel'

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

    console.log(`🚀 Adding domain to Vercel and verifying: ${domain.domain}`)

    let verified = false
    let sslVerified = false
    let vercelDomainId = null
    let verificationInstructions = null

    try {
      // Check if domain already exists in Vercel, if not add it
      if (domain.vercel_domain_id) {
        console.log(`🔍 Checking existing domain status in Vercel: ${domain.domain}`)

        // Force a re-verification to refresh verification instructions/status
        const verifiedInfo = await vercel.verifyDomain(domain.domain)
        vercelDomainId = verifiedInfo.name
        verified = verifiedInfo.verified

        if (verifiedInfo.verification && verifiedInfo.verification.length > 0) {
          verificationInstructions = verifiedInfo.verification
        }

        console.log(`📊 Domain status from Vercel (post-verify):`, {
          domain: verifiedInfo.name,
          verified: verified,
          needsVerification: !!verificationInstructions
        })

        if (verified) {
          sslVerified = true // Vercel handles SSL automatically
          console.log(`✅ Domain ${domain.domain} is verified and SSL enabled!`)
        } else {
          console.log(`⏳ Domain requires DNS verification`)
          console.log(`📋 Verification instructions:`, verificationInstructions)
        }
      } else {
        console.log(`🌐 Adding ${domain.domain} to Vercel project...`)

        const vercelResult = await vercel.addAndVerifyDomain(domain.domain)

        if (vercelResult.domain) {
          vercelDomainId = vercelResult.domain.name
          verified = vercelResult.verified
          verificationInstructions = vercelResult.verificationInstructions

          console.log(`✅ Domain added to Vercel:`, {
            domain: vercelResult.domain.name,
            verified: verified,
            needsVerification: !!verificationInstructions
          })

          if (verified) {
            sslVerified = true // Vercel handles SSL automatically
            console.log(`✅ Domain ${domain.domain} is verified and SSL enabled!`)
          } else {
            console.log(`⏳ Domain added but requires DNS verification`)
            console.log(`📋 Verification instructions:`, verificationInstructions)
          }
        }
      }
    } catch (vercelError) {
      console.error(`❌ Vercel domain setup failed for ${domain.domain}:`, vercelError)
      // Do not set verified based on manual DNS fallback to avoid incorrect "active" states
      verified = false
    }

    // Store Vercel domain info for future management
    let updateData: any = {
      status: (verified && sslVerified) ? 'active' : 'pending',
      ssl_status: sslVerified ? 'active' : 'pending',
      dns_configured: verified,
      updated_at: new Date().toISOString()
    }
    
    if (vercelDomainId) {
      updateData.vercel_domain_id = vercelDomainId
    }
    
    if (verificationInstructions) {
      updateData.verification_instructions = JSON.stringify(verificationInstructions)
    }

    // If Vercel reports no production deployments, attempt to trigger one
    let deploymentTriggered: boolean | undefined
    let deploymentMessage: string | undefined
    try {
      const hasProd = await vercel.hasProductionDeployment()
      if (!hasProd) {
        const result = await vercel.triggerDeployment()
        deploymentTriggered = result.triggered
        deploymentMessage = result.message
      }
    } catch (e) {
      console.warn('⚠️ Deployment check/trigger failed:', e)
    }

    // Update domain status in database
    const { error: updateError } = await supabase
      .from('custom_domains')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('❌ Error updating domain status:', updateError)
      return NextResponse.json({ error: 'Failed to update domain status' }, { status: 500 })
    }

    console.log(`📝 Updated domain ${domain.domain} status to: ${updateData.status}`)

    return NextResponse.json({ 
      verified,
      ssl_verified: sslVerified,
      status: updateData.status,
      ssl_status: updateData.ssl_status,
      vercel_domain_id: vercelDomainId,
      verification_instructions: verificationInstructions,
      deployment_triggered: deploymentTriggered,
      deployment_message: deploymentMessage,
      message: verified ? 
        'Domain added to Vercel successfully! SSL certificate will be issued automatically.' : 
        verificationInstructions ? 
          'Domain added to Vercel but requires DNS verification. Please configure the DNS records shown.' :
          'Domain configuration failed. Please check the logs.'
    })
    
  } catch (error) {
    console.error('❌ Domain verification error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
