import { createClient } from '@/lib/supabase/client'

export interface BrandingConfig {
  logo: string
  companyName: string
  primaryColor?: string
  secondaryColor?: string
  domain: string
  type: 'platform' | 'agency' | 'business'
}

// Default platform branding (WalletPush)
const PLATFORM_BRANDING: BrandingConfig = {
  logo: '/images/walletpush-logo.png',
  companyName: 'WalletPush',
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  domain: 'walletpush.io',
  type: 'platform'
}

/**
 * SECURE BRANDING RESOLVER
 * 
 * Rules:
 * 1. Branding is LOCKED to the requesting domain
 * 2. No cross-domain branding contamination possible
 * 3. Hierarchical fallback: Business -> Agency -> Platform
 * 4. Domain verification prevents spoofing
 */
export async function resolveBrandingForDomain(hostname: string): Promise<BrandingConfig> {
  try {
    // Always return platform branding for walletpush.io
    if (hostname === 'walletpush.io' || hostname === 'www.walletpush.io' || hostname.includes('localhost')) {
      return PLATFORM_BRANDING
    }

    const supabase = createClient()

    // Step 1: Check if this is a business custom domain
    const { data: businessDomain } = await supabase
      .from('custom_domains')
      .select(`
        domain,
        businesses!inner(
          id,
          name,
          logo_url,
          primary_color,
          secondary_color
        )
      `)
      .eq('domain', hostname)
      .eq('domain_type', 'business')
      .eq('status', 'active')
      .single()

    if (businessDomain?.businesses && businessDomain.businesses.length > 0) {
      const business = businessDomain.businesses[0]
      return {
        logo: business.logo_url || '/images/default-business-logo.png',
        companyName: business.name,
        primaryColor: business.primary_color || '#3B82F6',
        secondaryColor: business.secondary_color || '#1E40AF',
        domain: hostname,
        type: 'business'
      }
    }

    // Step 2: Check if this is an agency custom domain
    const { data: agencyDomain } = await supabase
      .from('custom_domains')
      .select(`
        domain,
        agency_accounts!inner(
          id,
          name,
          logo_url,
          primary_color,
          secondary_color
        )
      `)
      .eq('domain', hostname)
      .eq('domain_type', 'agency')
      .eq('status', 'active')
      .single()

    if (agencyDomain?.agency_accounts && agencyDomain.agency_accounts.length > 0) {
      const agency = agencyDomain.agency_accounts[0]
      return {
        logo: agency.logo_url || '/images/default-agency-logo.png',
        companyName: agency.name,
        primaryColor: agency.primary_color || '#3B82F6',
        secondaryColor: agency.secondary_color || '#1E40AF',
        domain: hostname,
        type: 'agency'
      }
    }

    // Step 3: Fallback to platform branding (security default)
    return PLATFORM_BRANDING

  } catch (error) {
    console.error('Error resolving branding:', error)
    // Security fallback: Always return platform branding on error
    return PLATFORM_BRANDING
  }
}

/**
 * Get branding for current page context
 * Uses window.location.hostname in browser
 */
export async function getCurrentBranding(): Promise<BrandingConfig> {
  if (typeof window === 'undefined') {
    // Server-side: return platform branding
    return PLATFORM_BRANDING
  }
  
  return resolveBrandingForDomain(window.location.hostname)
}

/**
 * SECURITY: Verify domain ownership before allowing branding changes
 * Prevents malicious actors from overriding branding on domains they don't own
 */
export async function verifyDomainOwnership(
  domain: string, 
  entityId: string, 
  entityType: 'agency' | 'business'
): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { data } = await supabase
      .from('custom_domains')
      .select('id')
      .eq('domain', domain)
      .eq('domain_type', entityType)
      .eq(entityType === 'agency' ? 'agency_id' : 'business_id', entityId)
      .eq('status', 'active')
      .single()

    return !!data
  } catch {
    return false
  }
}
