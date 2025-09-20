import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unlink } from 'fs/promises'
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

    // Delete homepage setting from database
    const { error: deleteError } = await supabase
      .from('agency_settings')
      .delete()
      .eq('agency_account_id', agencyAccountId)
      .eq('setting_key', 'homepage_html')

    if (deleteError) {
      return NextResponse.json({ 
        error: `Database delete failed: ${deleteError.message}`,
        code: deleteError.code,
        details: deleteError.details
      }, { status: 500 })
    }

    // Also try to delete static HTML file
    try {
      const publicPath = path.join(process.cwd(), 'public', 'homepage.html')
      await unlink(publicPath)
    } catch (fileError) {
      // Ignore file errors - file might not exist
    }

    return NextResponse.json({
      success: true,
      message: 'Homepage reset to default successfully'
    })

  } catch (error) {
    return NextResponse.json({
      error: `Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: (error as any)?.details || null,
      code: (error as any)?.code || null
    }, { status: 500 })
  }
}
