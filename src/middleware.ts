import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

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

  // Handle custom domains for landing pages AND business routing (now with Cloudflare proxy support)
  if (hostname !== 'walletpush.io' && !hostname.includes('vercel.app') && !hostname.includes('localhost')) {
    // First check if this is a business page route on a custom domain
    const businessRouteResponse = await handleCustomDomainBusinessRouting(request, hostname, pathname)
    if (businessRouteResponse) {
      return businessRouteResponse
    }
    
    // Then check for landing pages
    const landingPageResponse = await handleCustomDomainLandingPage(request, hostname, pathname)
    if (landingPageResponse) {
      return landingPageResponse
    }
  }

  // Handle walletpush.io business page redirects to custom domains
  if (hostname.includes('walletpush.io')) {
    const customDomainRedirect = await handleBusinessCustomDomainRedirect(request, hostname, pathname)
    if (customDomainRedirect) {
      return customDomainRedirect
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

/**
 * Injects a dynamic script into landing page HTML to:
 * - Capture form submissions
 * - POST to /api/customer-signup with landing_page_id/template_id
 * - On success, redirect to pass download (mobile) and then to member login
 * The login URL is configured via NEXT_PUBLIC_MEMBER_LOGIN_URL (fallback /customer/auth/login)
 */
function injectWalletPassScript(html: string, context: { landing_page_id?: string; template_id?: string; hostname: string }): string {
  try {
    const memberLoginBase = `https://${context.hostname}/customer/auth/login`
    const script = `\n<script>(function(){\n  try {\n    const LP_ID = ${JSON.stringify(context.landing_page_id || '')};\n    const TEMPLATE_ID = ${JSON.stringify(context.template_id || '')};\n    const LOGIN_BASE = ${JSON.stringify(memberLoginBase)};\n    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);\n\n    function injectDeviceHelpers(){\n      try {\n        var deviceMessage = document.getElementById('deviceMessage');\n        var qrContainer = document.getElementById('qrCodeContainer');\n        var formContainer = document.querySelector('.vip-pass-container') || document.querySelector('form')?.parentElement;\n        if (!deviceMessage || !qrContainer || !formContainer) return;\n        var ua = navigator.userAgent;\n        var landingUrl = window.location.href;\n        if (/iPhone|iPad|iPod/i.test(ua)) {\n          deviceMessage.textContent = 'You are on iOS. Complete the form to add your pass to Apple Wallet.';\n          qrContainer.style.display = 'none';\n        } else if (/Android/i.test(ua)) {\n          deviceMessage.innerHTML = 'You are on Android. Install a wallet app if prompted, then complete the form.';\n          qrContainer.style.display = 'none';\n        } else {\n          deviceMessage.textContent = 'You are on desktop. Scan this QR code on your phone to open this page.';\n          if (formContainer) formContainer.style.display = 'none';\n          var qd = document.createElement('div');\n          qd.style.margin = '0 auto';\n          qd.style.textAlign = 'center';\n          qrContainer.appendChild(qd);\n          try {\n            if (window.QRCode) {\n              new window.QRCode(qd, { text: landingUrl, width: 200, height: 200 });\n            } else {\n              var img = new Image();\n              img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(landingUrl);\n              qd.appendChild(img);\n            }\n          } catch (e) { console.error('QR gen failed', e); }\n        }\n      } catch(e) { console.error('device helpers error', e); }\n    }\n\n    function findEmailValue() {\n      const el = document.querySelector('input[name="email"], input[type="email"]');\n      return el ? (el).value || '' : '';\n    }\n\n    async function submitToWalletPush(form) {\n      var button = form.querySelector('button');\n      var note = form.querySelector('.loading-notification');\n      if (!note) {\n        note = document.createElement('div');\n        note.className = 'loading-notification';\n        note.style.display = 'none';\n        if (button && button.parentElement) { button.parentElement.appendChild(note); }\n        else { form.appendChild(note); }\n      }\n      var resetUI = function(){ try { if (button) { button.textContent = 'Join'; button.disabled = false; } if (note) { note.style.display = 'none'; note.textContent = ''; } } catch(_){} };\n      try {\n        if (button) { button.innerHTML = 'Creating Your Pass<span class="loading-dots"></span>'; button.disabled = true; }\n        if (note) { note.textContent = 'Please wait. Pass creation in progress...'; note.style.display = 'block'; }\n\n        const formData = new FormData(form);\n        const payload = {};\n        formData.forEach((v,k)=>{ payload[k] = v; });\n        if (LP_ID) payload["landing_page_id"] = LP_ID;\n        if (!payload["template_id"] && TEMPLATE_ID) payload["template_id"] = TEMPLATE_ID;\n\n        let timeoutHit = false;\n        const guard = setTimeout(function(){ timeoutHit = true; try { alert('Still working... Please stay on this page while we finish creating your pass.'); } catch(_){} }, 12000);\n\n        const res = await fetch('/api/customer-signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });\n        clearTimeout(guard);\n        let data = null;\n        try { data = await res.json(); } catch(_) {}
        if (!res.ok) {
          const msg = (data && (data.error || data.message)) ? (data.error || data.message) : ('Signup failed (' + res.status + ')');
          throw new Error(msg);
        }
        if (!data || !data.download_url) { throw new Error('No download URL returned'); }

        const email = findEmailValue();
        const encodedEmail = encodeURIComponent(email || '');
        const passUrl = (data.download_url || '').replace('?t=', '.pkpass?t=');

        if (isMobile) {
          window.location.href = passUrl;
          setTimeout(function(){ window.location.href = LOGIN_BASE + (encodedEmail ? ('?email=' + encodedEmail) : ''); }, 8000);
        } else {
          try { window.open(data.download_url, '_blank'); } catch(_){}
          if (note) { note.textContent = "Please wait... We're creating your account!"; note.style.display = 'block'; }
          setTimeout(function(){ window.location.href = LOGIN_BASE + (encodedEmail ? ('?email=' + encodedEmail) : ''); }, 3000);
        }
        if (note) { note.style.display = 'none'; }
        if (button) { button.textContent = 'Pass Created'; }
      } catch (err) {
        console.error('WalletPush submit error', err);
        try { alert(err && err.message ? err.message : 'An error occurred. Please try again.'); } catch(_){}
        resetUI();
      }
    }\n\n    function attachHandlers(){\n      const forms = Array.from(document.querySelectorAll('form'));\n      forms.forEach(form=>{\n        if ((form).dataset.__wpBound === '1') return;\n        (form).dataset.__wpBound = '1';\n        form.addEventListener('submit', async function(e){\n          try {\n            e.preventDefault();\n            await submitToWalletPush(form);\n          } catch(err) { console.error('WalletPush submit error', err); }\n        }, { capture: true });\n      });\n    }\n\n    if (document.readyState === 'loading') {\n      document.addEventListener('DOMContentLoaded', function(){ attachHandlers(); injectDeviceHelpers(); });\n    } else {\n      attachHandlers(); injectDeviceHelpers();\n    }\n\n    // Also observe dynamic content changes\n    const observer = new MutationObserver(()=>attachHandlers());\n    observer.observe(document.documentElement, { childList: true, subtree: true });\n  } catch(e) { console.error('WalletPush inject error', e); }\n})();</script>\n`;
    if (html.includes('</body>')) {
      return html.replace('</body>', script + '</body>')
    }
    return html + script
  } catch {
    return html
  }
}

// Handle redirects from walletpush.io to business custom domains
async function handleBusinessCustomDomainRedirect(request: NextRequest, hostname: string, pathname: string) {
  try {
    // Check if this is a business-related route that should be redirected
    const businessRoutes = [
      '/business/dashboard',
      '/business/settings', 
      '/business/pass-designer',
      '/business/distribution',
      '/business/members',
      '/business/pass-type-ids',
      '/business/auth/login',
      '/business/auth/sign-up',
      '/customer/auth/login',
      '/customer/auth/sign-up', 
      '/customer/dashboard'
    ]
    
    if (!businessRoutes.includes(pathname)) {
      return null // Not a business route that needs redirecting
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log(`🔄 Checking for custom domain redirect: ${hostname}${pathname}`)
    
    // For Blue Karma specifically, we know the business_id from the logs
    // TODO: In production, determine business from user session or other context
    const blueKarmaBusinessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    
    const domainResponse = await fetch(
      `${supabaseUrl}/rest/v1/custom_domains?select=domain,business_id&status=eq.active&business_id=eq.${blueKarmaBusinessId}`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!domainResponse.ok) {
      console.log(`❌ Custom domain lookup failed: ${domainResponse.status}`)
      return null
    }

    const domainData = await domainResponse.json()
    
    if (!domainData || domainData.length === 0) {
      console.log(`📝 No active custom domains found for redirect`)
      return null
    }

    const customDomain = domainData[0]
    const redirectUrl = `https://${customDomain.domain}${pathname}${request.nextUrl.search}`
    
    console.log(`✅ Redirecting to custom domain: ${hostname}${pathname} → ${redirectUrl}`)
    
    return NextResponse.redirect(redirectUrl, 302)
    
  } catch (error) {
    console.error('❌ Custom domain redirect error:', error)
    return null
  }
}

// Handle custom domain business routing (dashboard, login, etc.)
async function handleCustomDomainBusinessRouting(request: NextRequest, hostname: string, pathname: string) {
  try {
    // Check if this is a business-related route
    const businessRoutes = [
      '/business/dashboard',
      '/business/settings', 
      '/business/pass-designer',
      '/business/distribution',
      '/business/members',
      '/business/pass-type-ids',
      '/business/auth/login',
      '/business/auth/sign-up',
      '/customer/auth/login',
      '/customer/auth/sign-up', 
      '/customer/dashboard'
    ]
    
    if (!businessRoutes.includes(pathname)) {
      return null // Not a business route
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log(`🏢 Custom domain business route: ${hostname}${pathname}`)
    
    // Check if this domain is registered for a business
    const domainResponse = await fetch(
      `${supabaseUrl}/rest/v1/custom_domains?select=domain,business_id,status&domain=eq.${hostname}&status=eq.active`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!domainResponse.ok) {
      console.log(`❌ Domain lookup failed for business route ${hostname}: ${domainResponse.status}`)
      return null
    }

    const domainData = await domainResponse.json()
    
    if (!domainData || domainData.length === 0) {
      console.log(`📝 Domain ${hostname} not found for business routing`)
      return null
    }

    const domain = domainData[0]
    console.log(`✅ Found business custom domain: ${hostname} → business_id: ${domain.business_id}`)
    
    // Store business context in headers for the routed page
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-business-id', domain.business_id)
    requestHeaders.set('x-custom-domain', hostname)
    
    // Rewrite to the business route with business context
    const url = request.nextUrl.clone()
    url.pathname = pathname // Keep the same path
    
    const response = NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    })
    
    console.log(`✅ Routed business page: ${hostname}${pathname} → ${pathname} (business: ${domain.business_id})`)
    return response
    
  } catch (error) {
    console.error('❌ Custom domain business routing error:', error)
    return null
  }
}

// Handle custom domains for landing pages (Enhanced for Cloudflare proxy)
async function handleCustomDomainLandingPage(request: NextRequest, hostname: string, pathname: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log(`🌐 Custom domain request: ${hostname}${pathname}`)
    
    // Check if this domain is registered in custom_domains using direct REST API
    // Only check active domains that have been verified
    const domainResponse = await fetch(
      `${supabaseUrl}/rest/v1/custom_domains?select=domain,business_id,status,ssl_status&domain=eq.${hostname}&status=eq.active`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!domainResponse.ok) {
      console.log(`❌ Domain lookup failed for ${hostname}: ${domainResponse.status}`)
      return null
    }

    const domainData = await domainResponse.json()
    
    if (!domainData || domainData.length === 0) {
      console.log(`📝 Domain ${hostname} not found in custom_domains or not active`)
      return null // Not a registered custom domain or not active
    }

    const domain = domainData[0]
    const slug = pathname.slice(1) // Remove leading slash
    
    console.log(`✅ Found active custom domain: ${hostname} → business_id: ${domain.business_id}`)

    // Look for landing pages for this business/account
    console.log(`🔍 Looking for landing page: business_id=${domain.business_id}, slug="${slug}"`)
    
    // Fetch recent published pages and match by multiple URL variants
    const landingPageResponse = await fetch(
      `${supabaseUrl}/rest/v1/landing_pages?select=*` +
      `&business_id=eq.${domain.business_id}` +
      `&is_published=eq.true` +
      `&order=updated_at.desc` +
      `&limit=50`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (landingPageResponse.ok) {
      const landingPages = await landingPageResponse.json()

      const normalizedSlug = slug.replace(/^\//, '')
      const variants = new Set<string>([
        normalizedSlug,
        `/${normalizedSlug}`,
        `${hostname}/${normalizedSlug}`,
        `${hostname}${pathname}`,
        `https://${hostname}/${normalizedSlug}`,
        `https://${hostname}${pathname}`,
      ])

      const match = (landingPages || []).find((p: any) => {
        const cuRaw = (p.custom_url || '').toString()
        const cuNormalized = cuRaw
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .replace(/^\//, '')
        return variants.has(cuRaw) || variants.has(cuNormalized) || variants.has(`/${cuNormalized}`)
      })

      if (match) {
        console.log(`✅ Serving landing page: ${match.title || match.name} for ${hostname}${pathname} (matched custom_url="${match.custom_url}")`)
        const injectedHtml = injectWalletPassScript(match.generated_html, {
          landing_page_id: match.id,
          template_id: match.template_id,
          hostname,
        })
        return new NextResponse(injectedHtml, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'X-Custom-Domain': hostname,
            'X-Business-ID': domain.business_id,
            'X-Landing-Page-ID': match.id,
            'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
          }
        })
      } else {
        console.log(`📝 No landing page matched for slug "${slug}" with variants:`, Array.from(variants))
      }
    } else {
      console.log(`❌ Landing page lookup failed: ${landingPageResponse.status}`)
    }

    // If no specific landing page found and pathname is root, check for default homepage
    if (pathname === '/') {
      console.log(`🏠 Looking for default homepage for business_id=${domain.business_id}`)
      
      const defaultPageResponse = await fetch(
        `${supabaseUrl}/rest/v1/landing_pages?select=*&business_id=eq.${domain.business_id}&is_published=eq.true&order=created_at.desc&limit=1`,
        {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (defaultPageResponse.ok) {
        const defaultPages = await defaultPageResponse.json()
        
        if (defaultPages && defaultPages.length > 0) {
          const defaultPage = defaultPages[0]
          console.log(`✅ Serving default homepage: ${defaultPage.title} for ${hostname}`)
          const injectedHtml = injectWalletPassScript(defaultPage.generated_html, {
            landing_page_id: defaultPage.id,
            template_id: defaultPage.template_id,
            hostname,
          })
          return new NextResponse(injectedHtml, {
            status: 200,
            headers: {
              'Content-Type': 'text/html',
              'X-Custom-Domain': hostname,
              'X-Business-ID': domain.business_id,
              'X-Landing-Page-ID': defaultPage.id,
              'X-Default-Page': 'true',
              'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            }
          })
        } else {
          console.log(`📝 No default homepage found for business_id=${domain.business_id}`)
        }
      } else {
        console.log(`❌ Default homepage lookup failed: ${defaultPageResponse.status}`)
      }
    }

    // If we reach here, the domain is registered but no content found
    console.log(`📄 No content found for ${hostname}${pathname} - returning custom 404`)
    
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Page Not Found - ${hostname}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                 margin: 0; padding: 40px; text-align: center; background: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #333; margin-bottom: 20px; }
          p { color: #666; line-height: 1.6; }
          .domain { color: #007bff; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Page Not Found</h1>
          <p>The page you're looking for on <span class="domain">${hostname}</span> doesn't exist.</p>
          <p>This domain is powered by <strong>WalletPush</strong>.</p>
        </div>
      </body>
      </html>
    `, {
      status: 404,
      headers: {
        'Content-Type': 'text/html',
        'X-Custom-Domain': hostname,
        'X-Business-ID': domain.business_id,
        'Cache-Control': 'public, max-age=60' // Cache 404s for 1 minute
      }
    })
    
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Look for business by subdomain or account name using direct REST API
    const accountResponse = await fetch(
      `${supabaseUrl}/rest/v1/accounts?select=id,name,type&or=(name.ilike.${subdomain},custom_subdomain.eq.${subdomain})&type=eq.business`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!accountResponse.ok) {
      return null
    }

    const accountData = await accountResponse.json()
    
    if (!accountData || accountData.length === 0) {
      return null
    }

    const account = accountData[0]
    const slug = pathname.slice(1) // Remove leading slash

    // Look for landing pages for this business
    const landingPageResponse = await fetch(
      `${supabaseUrl}/rest/v1/landing_pages?select=*&business_id=eq.${account.id}&custom_url=eq.${slug}&is_published=eq.true`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (landingPageResponse.ok) {
      const landingPages = await landingPageResponse.json()
      
      if (landingPages && landingPages.length > 0) {
        const landingPage = landingPages[0]
        return new NextResponse(landingPage.generated_html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'X-Subdomain': subdomain,
            'X-Account-ID': account.id
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
