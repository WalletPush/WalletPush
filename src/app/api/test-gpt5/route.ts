import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get agency account for OpenRouter settings
    const { data: agencyAccountId, error: agencyError } = await supabase.rpc('get_or_create_agency_account')
    
    if (agencyError) {
      return NextResponse.json({ 
        error: 'Failed to get agency account',
        details: agencyError.message
      })
    }

    // Get OpenRouter settings
    const { data: settings, error: settingsError } = await supabase
      .from('agency_settings')
      .select('setting_value')
      .eq('agency_account_id', agencyAccountId)
      .eq('setting_key', 'openrouter')
      .single()

    const apiKey = settings?.setting_value?.api_key
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'No OpenRouter API key configured in agency settings',
        agencyAccountId,
        settingsError: settingsError?.message
      })
    }

    // Test GPT-5 specifically
    const testResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': request.headers.get('origin') || 'http://localhost:3000',
        'X-Title': 'GPT-5 Test'
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [{ role: 'user', content: 'Hello, are you working?' }],
        temperature: 0.1,
        max_tokens: 10
      })
    })

    if (testResponse.ok) {
      const data = await testResponse.json()
      return NextResponse.json({ 
        success: true,
        model: 'openai/gpt-5',
        message: 'GPT-5 is working!',
        response: data
      })
    } else {
      const errorText = await testResponse.text()
      return NextResponse.json({ 
        success: false,
        model: 'openai/gpt-5',
        error: `GPT-5 failed (${testResponse.status}): ${errorText}`,
        status: testResponse.status
      })
    }

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: `Error testing GPT-5: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}
