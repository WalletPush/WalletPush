import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Test OpenRouter API connection
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { apiKey, model } = body

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    console.log('🧪 Testing OpenRouter connection for user:', user.email, 'model:', model)

    // Test the OpenRouter API connection
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://walletpush.com',
          'X-Title': 'WalletPush Agency Portal'
        },
        body: JSON.stringify({
          model: model || 'anthropic/claude-sonnet-4',
          messages: [
            {
              role: 'user',
              content: 'Hello! This is a test message to verify the API connection. Please respond with "Connection successful!"'
            }
          ],
          max_tokens: 50,
          temperature: 0.1
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ OpenRouter API error:', response.status, errorData)
        
        let errorMessage = 'API connection failed'
        if (response.status === 401) {
          errorMessage = 'Invalid API key'
        } else if (response.status === 402) {
          errorMessage = 'Insufficient credits'
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded'
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message
        }
        
        return NextResponse.json({ 
          success: false, 
          error: errorMessage 
        })
      }

      const data = await response.json()
      console.log('✅ OpenRouter connection successful')

      return NextResponse.json({
        success: true,
        message: 'Connection successful!',
        response: data.choices?.[0]?.message?.content || 'API responded successfully'
      })

    } catch (apiError) {
      console.error('❌ OpenRouter API request failed:', apiError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to connect to OpenRouter API' 
      })
    }

  } catch (error) {
    console.error('❌ Test OpenRouter API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
