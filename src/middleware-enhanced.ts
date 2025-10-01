import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { resolveDomainContext, getRouteForDomainContext } from '@/lib/domain-resolver'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || 'localhost:3000'
  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.searchParams.toString()
  const fullUrl = `${hostname}${pathname}${searchParams ? '?' + searchParams : ''}`
  
  console.log(`🚨 MIDDLEWARE START: ${fullUrl}`)
  console.log(`🔍 Request details:`, {
    hostname,
    pathname,
    searchParams: searchParams || 'none',
    method: request.method
  })
  
  // Skip middleware for API routes, static files, and internal Next.js routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    console.log(`⏭️ SKIPPING: ${hostname}${pathname} (static/API route)`)
    return await updateSession(request)
  }

  // Handle custom domain routing using the new 3-tier system
  console.log(`🌐 Processing domain: ${hostname}`)
  
  try {
    // Resolve domain context using our enhanced resolver
    const domainContext = await resolveDomainContext(hostname)
    
    if (!domainContext) {
      console.log(`📝 No domain context found for: ${hostname}, using default routing`)
      return await updateSession(request)
    }
    
    console.log(`✅ Domain context resolved:`, domainContext)
    
    // Determine routing based on domain context
    const routeInfo = getRouteForDomainContext(domainContext, pathname)
    
    // Create request headers with context
    const requestHeaders = new Headers(request.headers)
    Object.entries(routeInfo.headers || {}).forEach(([key, value]) => {
      requestHeaders.set(key, value)
    })
    
    // Handle authentication first
    const authResponse = await updateSession(request)
    
    // If auth redirected, respect that
    if (authResponse.status === 302 || authResponse.status === 307) {
      console.log(`🔒 Auth redirect for: ${hostname}${pathname}`)
      return authResponse
    }
    
    // Handle route rewriting if needed
    if (routeInfo.shouldRewrite && routeInfo.newPath) {
      console.log(`🔄 Rewriting route: ${pathname} → ${routeInfo.newPath}`)
      
      const url = request.nextUrl.clone()
      url.pathname = routeInfo.newPath
      
      const response = NextResponse.rewrite(url, {
        request: { headers: requestHeaders }
      })
      
      // Copy auth cookies
      authResponse.cookies.getAll().forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value, cookie)
      })
      
      console.log(`✅ Route rewritten: ${hostname}${pathname} → ${routeInfo.newPath}`)
      return response
    }
    
    // No rewrite needed, but add context headers
    const response = NextResponse.next({
      request: { headers: requestHeaders }
    })
    
    // Copy auth cookies
    authResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })
    
    console.log(`✅ Route processed with context: ${hostname}${pathname}`)
    return response
    
  } catch (error) {
    console.error('❌ Middleware error:', error)
    return await updateSession(request)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

