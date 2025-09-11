import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // For now, return mock data since we don't have auth working locally
    const mockLandingPages = [
      {
        id: '1',
        name: 'Monthly Wine Club',
        business_name: 'Blue Karma',
        custom_url: 'wine.bluekarma.com/join',
        program_id: '02bdc603-4faf-4cca-abb8-2a5167a8be39',
        logo_url: null,
        background_image_url: null,
        ai_prompt: 'Build me a landing page to promote our Monthly Wine club. Users will get a selection of our finest wines each month for $49.99 per month.',
        generated_html: '<html>...</html>',
        is_published: true,
        created_at: '2024-01-15',
        updated_at: '2024-01-20'
      }
    ]
    
    return NextResponse.json({ data: mockLandingPages, error: null })
  } catch (error) {
    console.error('Error fetching landing pages:', error)
    return NextResponse.json(
      { data: null, error: 'Failed to fetch landing pages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { name, custom_url, program_id, logo_url, background_image_url, ai_prompt, generated_html } = body
    
    // For testing, we'll use the Blue Karma business ID
    const business_id = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    
    const { data, error } = await supabase
      .from('landing_pages')
      .insert({
        business_id,
        program_id: program_id || '02bdc603-4faf-4cca-abb8-2a5167a8be39', // Blue Karma default program
        name,
        custom_url,
        logo_url,
        background_image_url,
        ai_prompt,
        generated_html,
        is_published: false
      })
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to create landing page' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data, error: null })
  } catch (error) {
    console.error('Error creating landing page:', error)
    return NextResponse.json(
      { data: null, error: 'Failed to create landing page' },
      { status: 500 }
    )
  }
}
