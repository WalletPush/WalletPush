import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Skip middleware for static assets to prevent 404 issues
  if (
    request.nextUrl.pathname.startsWith('/_next/static/') ||
    request.nextUrl.pathname.startsWith('/_next/image') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/images/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  // Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/auth/sign-up-success',
  '/auth/update-password',
  '/auth/error',
  '/auth/confirm',
  // Portal-specific auth routes
  '/customer/auth/login',
  '/customer/auth/sign-up',
  '/customer/auth/forgot-password',
  '/customer/dashboard',
  '/business/auth/login',
  '/business/auth/sign-up',
  '/business/auth/forgot-password',
  '/business/dashboard', // Temporary public access for development
  '/business/pass-designer', // Temporary public access for development
  '/business/members', // Temporary public access for development
  '/business/settings', // Temporary public access for development
  '/business/distribution', // Temporary public access for development
  '/business/pass-type-ids', // Temporary public access for development
  '/agency/auth/login',
  '/agency/auth/sign-up',
  '/agency/auth/forgot-password',
  '/agency/dashboard',    // Temporary public access for development
  '/api/business-settings', // API routes for development
  '/api/landing-pages', // API routes for development
  '/api/generate-landing-page', // API routes for development
  '/api/test-openai', // API routes for development
  '/api/upload-image', // Image upload API
  '/api/templates', // Pass Designer templates API
  '/api/create-pass', // Pass creation API for landing pages
  '/api/pass-type-ids', // Pass Type IDs management API
  '/api/generate-pass', // PassKit generation API
  '/api/test-pass', // Test PassKit generation
  '/api/apple-pass', // Apple PassKit generation API
  '/api/passkit', // Apple PassKit web service
  '/api/passes', // Pass download API
  '/api/validate-pass', // Pass validation API
  '/api/customer-signup', // Customer signup for landing pages
  '/api/public/join', // Public form submission endpoint
  '/admin/global-pass-type-id', // Admin page for global Pass Type ID management
  '/api/admin/global-pass-type-id', // API for global Pass Type ID management
  '/api/admin/wwdr-certificate', // API for WWDR certificate upload
  '/api/webhooks/apple-wallet' // Apple Wallet webhook for automation triggers
]

  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || 
    request.nextUrl.pathname.startsWith('/auth/') ||
    request.nextUrl.pathname.startsWith('/api/pass-type-ids/') ||
    request.nextUrl.pathname.startsWith('/api/passes/') ||
    request.nextUrl.pathname.startsWith('/api/test-pass/') ||
    request.nextUrl.pathname.startsWith('/api/apple-pass/') ||
    request.nextUrl.pathname.startsWith('/api/passkit/') ||
    request.nextUrl.pathname.startsWith('/api/validate-pass/') ||
    request.nextUrl.pathname.startsWith('/api/admin/')
  )

  // Only redirect to login if it's not a public route and user is not authenticated
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
