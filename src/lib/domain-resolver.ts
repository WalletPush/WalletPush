/**
 * Domain Resolution System for 3-Tier Custom Domain Hierarchy
 * Handles: Platform (walletpush.io) → Agency (myagency.com) → Business (mybusiness.com)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create service client for middleware usage
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

export interface DomainContext {
  domain_type: 'platform' | 'agency' | 'business'
  owner_id: string | null
  owner_name: string | null
  agency_id: string | null
  agency_name: string | null
  business_id: string | null
  business_name: string | null
}

/**
 * Resolve domain context using the database function
 */
export async function resolveDomainContext(hostname: string): Promise<DomainContext | null> {
  try {
    // Clean hostname (remove port, www prefix)
    const cleanHostname = hostname.replace(/^www\./, '').split(':')[0].toLowerCase()
    
    console.log(`🔍 Resolving domain context for: ${cleanHostname}`)
    
    const { data, error } = await supabase
      .rpc('resolve_domain_context', { input_domain: cleanHostname })
    
    if (error) {
      console.error('❌ Domain resolution error:', error)
      return null
    }
    
    if (!data || data.length === 0) {
      console.log(`📝 No domain context found for: ${cleanHostname}`)
      return null
    }
    
    const context = data[0] as DomainContext
    console.log(`✅ Domain context resolved:`, context)
    
    return context
  } catch (error) {
    console.error('❌ Domain resolution exception:', error)
    return null
  }
}

/**
 * Get the appropriate base URL for a business based on domain hierarchy
 */
export async function getBusinessBaseUrl(businessId: string): Promise<string> {
  try {
    // First check if business has its own custom domain
    const { data: businessDomain } = await supabase
      .from('custom_domains')
      .select('domain')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .eq('domain_type', 'business')
      .single()
    
    if (businessDomain) {
      return `https://${businessDomain.domain}`
    }
    
    // If no business domain, check if agency has custom domain
    const { data: agencyDomain } = await supabase
      .rpc('get_agency_domain_for_business', { input_business_id: businessId })
    
    if (agencyDomain) {
      return `https://${agencyDomain}`
    }
    
    // Fallback to platform domain
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://walletpush.io'
  } catch (error) {
    console.error('❌ Error getting business base URL:', error)
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://walletpush.io'
  }
}

/**
 * Get the appropriate base URL for an agency
 */
export async function getAgencyBaseUrl(agencyId: string): Promise<string> {
  try {
    const { data: agencyAccount } = await supabase
      .from('agency_accounts')
      .select('custom_domain')
      .eq('id', agencyId)
      .eq('custom_domain_status', 'active')
      .single()
    
    if (agencyAccount?.custom_domain) {
      return `https://${agencyAccount.custom_domain}`
    }
    
    // Fallback to platform domain
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://walletpush.io'
  } catch (error) {
    console.error('❌ Error getting agency base URL:', error)
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://walletpush.io'
  }
}

/**
 * Determine the correct route path based on domain context and requested path
 */
export function getRouteForDomainContext(
  context: DomainContext,
  requestedPath: string
): { shouldRewrite: boolean; newPath?: string; headers?: Record<string, string> } {
  const headers: Record<string, string> = {}
  
  // Add context headers for downstream components
  if (context.domain_type) headers['x-domain-type'] = context.domain_type
  if (context.owner_id) headers['x-owner-id'] = context.owner_id
  if (context.agency_id) headers['x-agency-id'] = context.agency_id
  if (context.business_id) headers['x-business-id'] = context.business_id
  
  switch (context.domain_type) {
    case 'platform':
      // Platform domain - normal routing
      return { shouldRewrite: false, headers }
    
    case 'agency':
      // Agency domain - handle agency and business routes
      if (requestedPath.startsWith('/agency/')) {
        // Agency routes on agency domain - normal routing with context
        return { shouldRewrite: false, headers }
      } else if (requestedPath.startsWith('/business/')) {
        // Business routes on agency domain - add agency context
        return { shouldRewrite: false, headers }
      } else if (requestedPath === '/' || requestedPath.startsWith('/auth/')) {
        // Root or auth routes on agency domain - redirect to agency dashboard
        return { 
          shouldRewrite: true, 
          newPath: requestedPath === '/' ? '/agency/dashboard' : `/agency${requestedPath}`,
          headers 
        }
      }
      break
    
    case 'business':
      // Business domain - handle customer and business routes
      if (requestedPath.startsWith('/customer/')) {
        // Customer routes on business domain - normal routing with context
        return { shouldRewrite: false, headers }
      } else if (requestedPath.startsWith('/business/')) {
        // Business admin routes on business domain - normal routing with context
        return { shouldRewrite: false, headers }
      } else if (requestedPath === '/' || requestedPath.startsWith('/auth/')) {
        // Root or auth routes on business domain - redirect to customer dashboard
        return { 
          shouldRewrite: true, 
          newPath: requestedPath === '/' ? '/customer/dashboard' : `/customer${requestedPath}`,
          headers 
        }
      }
      break
  }
  
  return { shouldRewrite: false, headers }
}

/**
 * Check if a domain is configured and active
 */
export async function isDomainActive(hostname: string): Promise<boolean> {
  try {
    const cleanHostname = hostname.replace(/^www\./, '').split(':')[0].toLowerCase()
    
    // Platform domains are always active
    if (cleanHostname === 'walletpush.io') {
      return true
    }
    
    const { data } = await supabase
      .from('custom_domains')
      .select('id')
      .eq('domain', cleanHostname)
      .eq('status', 'active')
      .single()
    
    return !!data
  } catch {
    return false
  }
}

/**
 * Generate DNS verification record for a domain
 */
export function generateDNSVerificationRecord(domain: string): string {
  // Generate a unique verification token
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `walletpush-verification=${timestamp}-${random}`
}

/**
 * Get DNS instructions for domain setup
 */
export function getDNSInstructions(domain: string, domainType: 'agency' | 'business') {
  const verificationRecord = generateDNSVerificationRecord(domain)
  
  return {
    verificationRecord,
    instructions: [
      {
        type: 'CNAME',
        name: domain,
        value: 'cname.vercel-dns.com',
        description: `Point ${domain} to Vercel's servers`
      },
      {
        type: 'TXT',
        name: `_walletpush-challenge.${domain}`,
        value: verificationRecord,
        description: 'Verification record to prove domain ownership'
      }
    ],
    steps: [
      `Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)`,
      `Navigate to DNS settings for ${domain}`,
      `Add a CNAME record pointing ${domain} to cname.vercel-dns.com`,
      `Add a TXT record for _walletpush-challenge.${domain} with value: ${verificationRecord}`,
      `Wait 5-10 minutes for DNS propagation`,
      `Click "Verify Domain" below to activate your custom domain`
    ]
  }
}

