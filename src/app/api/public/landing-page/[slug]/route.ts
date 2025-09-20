import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
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

    const { slug } = params

    // Find landing page by custom_url slug
    const { data: landingPage, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('custom_url', slug)
      .eq('is_published', true)
      .single()

    if (error || !landingPage) {
      console.error('Landing page not found:', slug, error)
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head><title>Page Not Found</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Landing Page Not Found</h1>
          <p>The landing page "${slug}" could not be found.</p>
          <p><a href="/">Return to Homepage</a></p>
        </body>
        </html>`,
        {
          status: 404,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      )
    }

    // Return the HTML content directly
    return new NextResponse(landingPage.generated_html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    })

  } catch (error) {
    console.error('Error serving landing page:', error)
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1>Error</h1>
        <p>An error occurred while loading this page.</p>
        <p><a href="/">Return to Homepage</a></p>
      </body>
      </html>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )
  }
}
