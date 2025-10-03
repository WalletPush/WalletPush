import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get agency account
    const { data: agencyAccountId, error: agencyError } = await supabase.rpc('get_or_create_agency_account')
    
    if (agencyError) {
      return NextResponse.json({ error: 'Failed to get agency account' }, { status: 500 })
    }

    // Get OpenRouter settings
    const { data: settings } = await supabase
      .from('agency_settings')
      .select('setting_value')
      .eq('agency_account_id', agencyAccountId)
      .eq('setting_key', 'openrouter')
      .single()

    const openRouterApiKey = settings?.setting_value?.api_key
    const openRouterModel = settings?.setting_value?.model || 'anthropic/claude-3.5-sonnet'

    if (!openRouterApiKey) {
      return NextResponse.json({ 
        status: 'no_api_key',
        message: 'OpenRouter API key not configured'
      })
    }

    // Test the API with a simple request
    const testResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': request.headers.get('origin') || 'http://localhost:3000',
        'X-Title': 'WalletPush AI Status Check'
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [{ role: 'user', content: 'Hello, are you working?' }],
        temperature: 0.1,
        max_tokens: 10
      })
    })

    if (testResponse.ok) {
      return NextResponse.json({ 
        status: 'working',
        model: openRouterModel,
        message: 'AI service is working correctly'
      })
    } else {
      const errorText = await testResponse.text()
      return NextResponse.json({ 
        status: 'error',
        model: openRouterModel,
        message: `API error (${testResponse.status}): ${errorText}`,
        error: errorText
      })
    }

  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}
