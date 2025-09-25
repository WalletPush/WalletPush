import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Simulate the middleware URL matching logic
  const hostname = 'walletpush.io'
  const pathname = '/sambor/join-1758837186411'
  const slug = pathname.slice(1) // Remove leading slash
  
  // This is what the middleware generates
  const normalizedSlug = slug.replace(/^\//, '')
  const variants = new Set<string>([
    normalizedSlug,
    `/${normalizedSlug}`,
    `${hostname}/${normalizedSlug}`,
    `${hostname}${pathname}`,
    `https://${hostname}/${normalizedSlug}`,
    `https://${hostname}${pathname}`,
  ])
  
  // This is what's in the database
  const customUrl = "walletpush.io/sambor/join-1758837186411"
  
  // This is the normalization logic from middleware
  const cuRaw = customUrl
  const cuNormalized = cuRaw
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/^\//, '')
  
  // Test matching
  const matches = variants.has(cuRaw) || variants.has(cuNormalized) || variants.has(`/${cuNormalized}`)
  
  return NextResponse.json({
    test_info: {
      hostname,
      pathname,
      slug,
      normalizedSlug
    },
    variants: Array.from(variants),
    database: {
      custom_url_raw: cuRaw,
      custom_url_normalized: cuNormalized
    },
    matching: {
      has_raw: variants.has(cuRaw),
      has_normalized: variants.has(cuNormalized),
      has_slash_normalized: variants.has(`/${cuNormalized}`),
      final_match: matches
    }
  })
}
