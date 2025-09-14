import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check for OpenRouter settings in business_settings
    const { data: settings, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('setting_key', 'openrouter')
      .limit(5)
    
    console.log('OpenRouter settings check:', { settings, error })
    
    return NextResponse.json({
      success: true,
      settings,
      error,
      message: settings?.length ? `Found ${settings.length} OpenRouter settings` : 'No OpenRouter settings found'
    })
    
  } catch (error) {
    console.error('Debug check error:', error)
    return NextResponse.json({ error: 'Debug check failed' }, { status: 500 })
  }
}
