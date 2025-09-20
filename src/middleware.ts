import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  // COMPLETELY DISABLE MIDDLEWARE TO FIX VERCEL CRASHES
  // Just pass through with basic session update
  try {
    return await updateSession(request)
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }

  // DISABLED CODE BELOW - CAUSING CRASHES
  /*
  const hostname = request.headers.get('host') || 'localhost:3000'
  const pathname = request.nextUrl.pathname
  
  // Skip domain detection for API routes, static files, and internal Next.js routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return await updateSession(request)
  }

  // TEMPORARILY DISABLE domain detection to fix Vercel middleware crash
  // TODO: Re-enable after fixing environment variable issues
  const tenantInfo = null // await detectTenantFromDomain(hostname)
  
  if (false && tenantInfo) {
    // Store tenant info in headers for downstream components
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-tenant-id', tenantInfo.accountId)
    requestHeaders.set('x-tenant-type', tenantInfo.accountType)
    requestHeaders.set('x-portal-type', tenantInfo.portalType)
    
    // Route to appropriate portal based on domain type
    if (pathname === '/' || pathname === '/auth/login' || pathname === '/auth/sign-up') {
      const portalRoute = getPortalRoute(tenantInfo.portalType, pathname)
      if (portalRoute !== pathname) {
        const url = request.nextUrl.clone()
        url.pathname = portalRoute
        const response = NextResponse.rewrite(url, {
          request: {
            headers: requestHeaders,
          },
        })
        // Update session and merge with our custom response
        const sessionResponse = await updateSession(request)
        // Copy our custom headers to the session response
        requestHeaders.forEach((value, key) => {
          sessionResponse.headers.set(key, value)
        })
        return sessionResponse
      }
    }
    
    // Continue with session update but include tenant headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    const sessionResponse = await updateSession(request)
    // Copy our custom headers to the session response
    requestHeaders.forEach((value, key) => {
      sessionResponse.headers.set(key, value)
    })
    return sessionResponse
  }
  
  // For localhost development, allow direct access to portal routes
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Allow direct access to portal-specific auth routes during development
    if (pathname.startsWith('/customer/') || pathname.startsWith('/business/') || pathname.startsWith('/agency/')) {
      return await updateSession(request)
    }
  }
  
  // Default behavior for localhost and unknown domains
  return await updateSession(request)
}

async function detectTenantFromDomain(hostname: string) {
  // Skip detection for localhost during development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return null
  }
  
  try {
    const supabase = await createClient()
    
    // Check if this domain exists in our account_domains table
    const { data: domainData } = await supabase
      .from('account_domains')
      .select(`
        domain,
        domain_type,
        accounts!inner (
          id,
          type,
          name
        )
      `)
      .eq('domain', hostname)
      .single()
    
    if (domainData) {
      const account = Array.isArray(domainData.accounts) ? domainData.accounts[0] : domainData.accounts
      return {
        accountId: account?.id,
        accountType: account?.type,
        accountName: account?.name,
        portalType: domainData.domain_type, // 'customer', 'admin', 'main'
        domain: domainData.domain
      }
    }
    
    // Check for subdomain patterns (e.g., admin.business.com, portal.agency.com)
    const subdomainMatch = hostname.match(/^(admin|portal|app|dashboard)\.(.+)$/)
    if (subdomainMatch) {
      const [, subdomain, baseDomain] = subdomainMatch
      
      // Look for the base domain
      const { data: baseDomainData } = await supabase
        .from('account_domains')
        .select(`
          domain,
          domain_type,
          accounts!inner (
            id,
            type,
            name
          )
        `)
        .eq('domain', baseDomain)
        .eq('domain_type', 'customer')
        .single()
      
      if (baseDomainData) {
        // Determine portal type based on subdomain and account type
        let portalType = 'admin'
        const baseAccount = Array.isArray(baseDomainData.accounts) ? baseDomainData.accounts[0] : baseDomainData.accounts
        if (subdomain === 'portal' && baseAccount?.type === 'agency') {
          portalType = 'admin'
        }
        
        return {
          accountId: baseAccount?.id,
          accountType: baseAccount?.type,
          accountName: baseAccount?.name,
          portalType,
          domain: hostname
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('❌ Domain detection error:', error)
    return null
  }
}

function getPortalRoute(portalType: string, pathname: string): string {
  switch (portalType) {
    case 'customer':
      // Customer portal routes
      if (pathname === '/') return '/customer/dashboard'
      if (pathname === '/auth/login') return '/customer/auth/login'
      if (pathname === '/auth/sign-up') return '/customer/auth/sign-up'
      break
      
    case 'admin':
      // Business/Agency admin portal routes
      if (pathname === '/') return '/business/dashboard'
      if (pathname === '/auth/login') return '/business/auth/login'
      if (pathname === '/auth/sign-up') return '/business/auth/sign-up'
      break
      
    case 'main':
      // Agency main site routes (marketing/info pages)
      if (pathname === '/') return '/agency/home'
      if (pathname === '/auth/login') return '/agency/auth/login'
      if (pathname === '/auth/sign-up') return '/agency/auth/sign-up'
      break
  }
  
  return pathname
}
*/

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
