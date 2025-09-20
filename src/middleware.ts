import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || 'localhost:3000'
  const pathname = request.nextUrl.pathname
  
  // Skip middleware for API routes, static files, and internal Next.js routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    return await updateSession(request)
  }

  // Skip for localhost development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return await updateSession(request)
  }

  // Handle custom domains for landing pages
  if (hostname !== 'walletpush.io' && !hostname.includes('vercel.app')) {
    const landingPageResponse = await handleCustomDomainLandingPage(request, hostname, pathname)
    if (landingPageResponse) {
      return landingPageResponse
    }
  }

  // Handle walletpush.io subdomain routing for businesses
  if (hostname.includes('walletpush.io') && hostname !== 'walletpush.io') {
    const subdomainResponse = await handleSubdomainRouting(request, hostname, pathname)
    if (subdomainResponse) {
      return subdomainResponse
    }
  }

  // Default behavior
  return await updateSession(request)
}

// Handle custom domains for landing pages
async function handleCustomDomainLandingPage(request: NextRequest, hostname: string, pathname: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if this domain is registered in account_domains
    const { data: domainData } = await supabase
      .from('account_domains')
      .select(`
        domain,
        domain_type,
        account_id,
        accounts!inner (
          id,
          type,
          name
        )
      `)
      .eq('domain', hostname)
      .single()

    if (!domainData) {
      return null // Not a registered custom domain
    }

    // Look for landing pages for this business/account
    const { data: landingPage } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('business_id', domainData.account_id)
      .or(`custom_url.eq.${pathname.slice(1)},custom_url.ilike.%/${pathname.slice(1)}`)
      .eq('is_published', true)
      .single()

    if (landingPage) {
      // Serve the landing page HTML directly
      return new NextResponse(landingPage.generated_html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'X-Custom-Domain': hostname,
          'X-Account-ID': domainData.account_id
        }
      })
    }

    // If no specific landing page found, check for default homepage
    if (pathname === '/') {
      const { data: defaultPage } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('business_id', domainData.account_id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (defaultPage) {
        return new NextResponse(defaultPage.generated_html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'X-Custom-Domain': hostname,
            'X-Account-ID': domainData.account_id
          }
        })
      }
    }

    return null // Let it continue to 404
  } catch (error) {
    console.error('❌ Custom domain handling error:', error)
    return null
  }
}

// Handle subdomain routing for businesses (e.g., business1.walletpush.io)
async function handleSubdomainRouting(request: NextRequest, hostname: string, pathname: string) {
  try {
    const subdomain = hostname.split('.')[0]
    
    if (['www', 'api', 'admin', 'app'].includes(subdomain)) {
      return null // Skip common subdomains
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Look for business by subdomain or account name
    const { data: accountData } = await supabase
      .from('accounts')
      .select('id, name, type')
      .or(`name.ilike.${subdomain},custom_subdomain.eq.${subdomain}`)
      .eq('type', 'business')
      .single()

    if (accountData) {
      // Look for landing pages for this business
      const { data: landingPage } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('business_id', accountData.id)
        .or(`custom_url.eq.${pathname.slice(1)},custom_url.ilike.%/${pathname.slice(1)}`)
        .eq('is_published', true)
        .single()

      if (landingPage) {
        return new NextResponse(landingPage.generated_html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'X-Subdomain': subdomain,
            'X-Account-ID': accountData.id
          }
        })
      }
    }

    return null
  } catch (error) {
    console.error('❌ Subdomain routing error:', error)
    return null
  }
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
