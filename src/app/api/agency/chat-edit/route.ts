import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, currentHtml, wizardData } = await request.json()

    if (!message || !currentHtml) {
      return NextResponse.json({ error: 'Message and current HTML are required' }, { status: 400 })
    }

    // Get agency account for OpenRouter settings
    const { data: agencyAccountId, error: agencyError } = await supabase.rpc('get_or_create_agency_account')
    
    if (agencyError) {
      console.error('❌ Agency account error:', agencyError)
      return NextResponse.json({ error: 'Failed to get agency account' }, { status: 500 })
    }

    // Get OpenRouter settings
    console.log('🔍 Looking for OpenRouter settings for agency:', agencyAccountId)
    
    const { data: settings, error: settingsError } = await supabase
      .from('agency_settings')
      .select('setting_value')
      .eq('agency_account_id', agencyAccountId)
      .eq('setting_key', 'openrouter')
      .single()

    console.log('🔑 Settings query result:', { settings, error: settingsError?.message })

    // Extract API key and model from the openrouter settings object
    const openRouterApiKey = settings?.setting_value?.api_key
    const openRouterModel = settings?.setting_value?.model || 'anthropic/claude-3.5-sonnet'
    
    // Fallback models to try if the primary model fails (OpenRouter compatible)
    // GPT-5 is the primary fallback, then other models
    const fallbackModels = [
      openRouterModel,
      'openai/gpt-5',  // Primary fallback
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-haiku',
      'anthropic/claude-3-opus',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.1-8b-instruct'
    ]

    if (!openRouterApiKey) {
      return NextResponse.json({ 
        message: "I'd love to help edit your sales page! However, you need to configure your OpenRouter API key in the settings first.",
        updatedHtml: null 
      })
    }

    console.log('✅ Found OpenRouter API key, proceeding with chat...')

    // Prepare the prompt for Claude
    const prompt = `You are a professional HTML editor for sales pages. The user wants to make specific changes to their existing sales page.

🚨 CRITICAL REQUIREMENTS - READ CAREFULLY:
- You MUST return the COMPLETE, FULL HTML document with all changes applied
- Do NOT return partial HTML or snippets - return the ENTIRE page from <!DOCTYPE html> to </html>
- The response MUST include ALL sections: header, hero, features, pricing, footer, etc.
- Preserve all existing styling, scripts, and functionality unless specifically asked to change them
- Make ONLY the changes requested by the user
- Ensure the returned HTML is ready to display in an iframe
- DO NOT remove any attributes that start with data-wp- (data-wp-bind, data-wp-slot, data-wp-component)
- DO NOT remove comment markers like <!-- WP:DYNAMIC-START --> and <!-- WP:DYNAMIC-END -->
- You may change text inside elements with data-wp-bind, but leave the attributes in place

❌ WRONG: Returning only the changed section
✅ CORRECT: Returning the complete HTML document with changes applied

User's request: "${message}"

CURRENT COMPLETE HTML DOCUMENT:
${currentHtml}

INSTRUCTIONS:
1. Read the user's request carefully
2. Make the requested changes to the HTML
3. Return the COMPLETE modified HTML document (from <!DOCTYPE html> to </html>)
4. Explain what you changed in a brief message

You MUST respond in this exact JSON format:
{
  "message": "Brief explanation of what I changed",
  "updatedHtml": "THE COMPLETE FULL HTML DOCUMENT WITH YOUR CHANGES APPLIED - STARTING WITH <!DOCTYPE html> AND ENDING WITH </html>"
}

🚨 FINAL WARNING: The "updatedHtml" field must contain the ENTIRE HTML document, not just the changed parts! If you return partial HTML, the website will break!`

    // Try multiple models with fallback
    let openRouterData: any = null
    let lastError: string = ''
    
    for (const model of fallbackModels) {
      console.log(`🔄 Trying model: ${model}`)
      
      try {
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': request.headers.get('origin') || 'http://localhost:3000',
            'X-Title': 'WalletPush Sales Page Editor'
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 16000
          })
        })

        if (openRouterResponse.ok) {
          openRouterData = await openRouterResponse.json()
          console.log(`✅ Success with model: ${model}`)
          break
        } else {
          const errorText = await openRouterResponse.text()
          lastError = `Model ${model} failed (${openRouterResponse.status}): ${errorText}`
          console.log(`❌ ${lastError}`)
        }
      } catch (error) {
        lastError = `Model ${model} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.log(`❌ ${lastError}`)
      }
    }

    if (!openRouterData) {
      console.error('❌ All models failed:', lastError)
      return NextResponse.json({ 
        message: `All AI models are currently unavailable. Last error: ${lastError}. Please try again in a few minutes.`,
        updatedHtml: null 
      })
    }
    console.log('🤖 OpenRouter response:', JSON.stringify(openRouterData, null, 2))
    
    if (!openRouterData.choices || openRouterData.choices.length === 0) {
      console.error('❌ No choices in OpenRouter response:', openRouterData)
      return NextResponse.json({ 
        message: "OpenRouter didn't return any response choices. Please check your API key and try again.",
        updatedHtml: null 
      })
    }
    
    const assistantMessage = openRouterData.choices[0]?.message?.content

    if (!assistantMessage) {
      console.error('❌ No message content in OpenRouter response:', openRouterData.choices[0])
      return NextResponse.json({ 
        message: "I didn't receive a proper response. Please try rephrasing your request.",
        updatedHtml: null 
      })
    }

    // Try to parse JSON response from Claude
    try {
      const response = JSON.parse(assistantMessage)
      
      // Validate that we got a complete HTML document
      if (response.updatedHtml && !response.updatedHtml.includes('<!DOCTYPE html>')) {
        console.warn('⚠️ Claude returned incomplete HTML, requesting complete document...')
        return NextResponse.json({
          message: "I need to provide a complete HTML document. Let me try again with the full page.",
          updatedHtml: null
        })
      }
      
      console.log('✅ Returning response:', {
        message: response.message?.substring(0, 100) + '...',
        hasUpdatedHtml: !!response.updatedHtml,
        htmlLength: response.updatedHtml?.length || 0
      })
      
      return NextResponse.json({
        message: response.message,
        updatedHtml: response.updatedHtml
      })
    } catch (parseError) {
      // If Claude didn't respond in JSON format, just return the message
      return NextResponse.json({
        message: assistantMessage,
        updatedHtml: null
      })
    }

  } catch (error) {
    console.error('❌ Chat edit API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
