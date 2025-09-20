import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

interface LandingPageProps {
  params: { slug: string }
}

export const dynamic = 'force-dynamic'

async function getLandingPage(slug: string) {
  // Create public Supabase client (service role for public data)
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

  console.log('🔍 Looking for landing page with slug:', slug)

  // Try to find landing page by custom_url slug
  // Handle different URL formats: "bkloyalty", "walletpush.io/bkloyalty", "https://walletpush.io/bkloyalty"
  const { data: landingPages, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('is_published', true)
    .or(`custom_url.eq.${slug},custom_url.ilike.%/${slug},custom_url.ilike.%${slug}`)

  if (error) {
    console.error('Database error:', error)
    return null
  }

  if (!landingPages || landingPages.length === 0) {
    console.log('❌ No landing page found for slug:', slug)
    return null
  }

  const landingPage = landingPages[0]
  console.log('✅ Found landing page:', landingPage.name, 'with custom_url:', landingPage.custom_url)
  return landingPage
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { slug } = params
  
  // Skip if it's a known app route
  const skipRoutes = [
    'api', 'auth', 'business', 'customer', 'agency', 'admin', 
    '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml'
  ]
  
  if (skipRoutes.includes(slug)) {
    notFound()
  }

  const landingPage = await getLandingPage(slug)
  
  if (!landingPage) {
    notFound()
  }

  // Return the landing page HTML as a React component
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: landingPage.generated_html
      }}
    />
  )
}
