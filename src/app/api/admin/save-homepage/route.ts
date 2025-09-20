import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // Get or create agency account
    const { data: agencyAccountId, error: agencyError } = await supabase
      .rpc('get_or_create_agency_account')

    if (agencyError || !agencyAccountId) {
      return NextResponse.json({ 
        error: `Agency account error: ${agencyError?.message || 'No agency account found'}` 
      }, { status: 500 })
    }

    const { htmlContent, pageTitle, pageDescription } = await request.json()

    if (!htmlContent) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 })
    }

    // Save to database
    const { error: saveError } = await supabase
      .from('agency_settings')
      .upsert({
        agency_account_id: agencyAccountId,
        setting_key: 'homepage_html',
        setting_value: {
          html: htmlContent,
          title: pageTitle || 'WalletPush - Digital Wallet Platform',
          description: pageDescription || 'Create and manage digital wallet passes for your business',
          saved_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'agency_account_id,setting_key'
      })

    if (saveError) {
      return NextResponse.json({ 
        error: `Database save failed: ${saveError.message}`,
        code: saveError.code,
        details: saveError.details
      }, { status: 500 })
    }

    // Also save as static HTML file for backup/caching
    try {
      const publicPath = path.join(process.cwd(), 'public', 'homepage.html')
      await writeFile(publicPath, htmlContent, 'utf8')
    } catch (fileError) {
      // Don't fail the request if file save fails
    }

    return NextResponse.json({
      success: true,
      message: 'Homepage saved successfully'
    })

  } catch (error) {
    return NextResponse.json({
      error: `Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: (error as any)?.details || null,
      code: (error as any)?.code || null
    }, { status: 500 })
  }
}
