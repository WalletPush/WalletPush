/**
 * Custom Domain Utilities
 * Handles business custom domain resolution and URL generation
 */

import { createClient } from '@/lib/supabase/server'

export interface CustomDomainInfo {
  domain: string
  business_id: string
  status: string
  ssl_status: string
}

/**
 * Get custom domain for a business
 */
export async function getBusinessCustomDomain(businessId: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data: customDomain, error } = await supabase
      .from('custom_domains')
      .select('domain')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .single()
    
    if (error || !customDomain) {
      return null
    }
    
    return customDomain.domain
  } catch (error) {
    console.error('Error getting business custom domain:', error)
    return null
  }
}

/**
 * Generate customer login URL for a business (uses custom domain if available)
 */
export async function getBusinessCustomerLoginUrl(businessId: string, email?: string): Promise<string> {
  const customDomain = await getBusinessCustomDomain(businessId)
  
  let baseUrl: string
  if (customDomain) {
    baseUrl = `https://${customDomain}`
  } else {
    baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }
  
  let loginUrl = `${baseUrl}/customer/auth/login`
  
  if (email) {
    loginUrl += `?email=${encodeURIComponent(email)}`
  }
  
  return loginUrl
}

/**
 * Generate business dashboard URL (uses custom domain if available)
 */
export async function getBusinessDashboardUrl(businessId: string): Promise<string> {
  const customDomain = await getBusinessCustomDomain(businessId)
  
  if (customDomain) {
    return `https://${customDomain}/business/dashboard`
  } else {
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/business/dashboard`
  }
}

/**
 * Generate any business URL with custom domain support
 */
export async function getBusinessUrl(businessId: string, path: string): Promise<string> {
  const customDomain = await getBusinessCustomDomain(businessId)
  
  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  
  if (customDomain) {
    return `https://${customDomain}${path}`
  } else {
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${path}`
  }
}

/**
 * Check if a domain is a custom domain for any business
 */
export async function isCustomDomain(hostname: string): Promise<CustomDomainInfo | null> {
  try {
    const supabase = await createClient()
    
    const { data: customDomain, error } = await supabase
      .from('custom_domains')
      .select('domain, business_id, status, ssl_status')
      .eq('domain', hostname)
      .eq('status', 'active')
      .single()
    
    if (error || !customDomain) {
      return null
    }
    
    return customDomain
  } catch (error) {
    console.error('Error checking custom domain:', error)
    return null
  }
}
