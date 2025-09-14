import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // For now, try to get any agency's homepage (later we can make it domain-specific)
    const { data: settings, error } = await supabase
      .from('agency_settings')
      .select('setting_value')
      .eq('setting_key', 'homepage_html')
      .limit(1)
      .single()

    if (error) {
      console.log('No custom homepage found in database')
      return NextResponse.json({ html: null })
    }

    if (settings?.setting_value?.html) {
      return NextResponse.json({ 
        html: settings.setting_value.html,
        title: settings.setting_value.title,
        description: settings.setting_value.description 
      })
    }

    return NextResponse.json({ html: null })

  } catch (error) {
    console.error('❌ Get homepage API error:', error)
    return NextResponse.json({ html: null })
  }
}
