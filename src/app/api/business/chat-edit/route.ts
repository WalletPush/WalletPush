import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentBusinessId } from '@/lib/business-context'
import { 
  optimizeHTMLForAI, 
  restoreOptimizedHTML, 
  identifyTargetSection,
  mergeChangesIntoFullHTML
} from '@/lib/html-optimizer'

export async function POST(request: NextRequest) {
  console.log('🚀 Chat-edit API called')
  console.log('📝 Headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    // Try using the createClient with the request to get proper auth
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('👤 User auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      email: user?.email,
      error: userError?.message 
    })
    
    // For now, skip auth check to test if the API works
    console.log('⚠️ Skipping auth check for debugging...')
    // Use hardcoded user for debugging
    const debugUser = user || { id: '485ec6aa-89a4-48d1-b6e2-42c06067da67', email: 'david.sambor@icloud.com' }

    const { message, currentHtml, wizardData } = await request.json()

    if (!message || !currentHtml) {
      return NextResponse.json({ error: 'Message and current HTML are required' }, { status: 400 })
    }

    // Get business account and OpenRouter settings
    console.log('🔍 Looking for business account and OpenRouter settings...')
    
    // Get business ID dynamically
    const businessId = await getCurrentBusinessId(request)
    
    if (!businessId) {
      return NextResponse.json({ error: 'No business found for current user' }, { status: 404 })
    }
    
    // Get OpenRouter settings from business settings
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('setting_value')
      .eq('business_id', businessId)
      .eq('setting_key', 'openrouter')
      .single()

    console.log('🔑 Business settings query result:', { 
      hasSettings: !!settings,
      hasSettingValue: !!settings?.setting_value,
      hasApiKey: !!settings?.setting_value?.api_key,
      apiKeyLength: settings?.setting_value?.api_key?.length || 0,
      enabled: settings?.setting_value?.enabled,
      error: settingsError?.message 
    })

    // Extract API key from the openrouter settings object
    const openRouterApiKey = settings?.setting_value?.api_key

    if (!openRouterApiKey) {
      console.error('❌ No OpenRouter API key found in business settings')
      return NextResponse.json({ 
        message: "I'd love to help edit your landing page! However, you need to configure your OpenRouter API key in the business settings first.",
        updatedHtml: null 
      })
    }

    console.log('✅ OpenRouter API key found, length:', openRouterApiKey.length)

    console.log('✅ Found OpenRouter API key, proceeding with chat...')
    console.log('📝 User message:', message)
    console.log('📄 Current HTML length:', currentHtml?.length || 0)

    // Prepare the prompt for AI
    const prompt = `You are a professional HTML editor for landing pages. The user wants to make specific changes to their existing landing page.

CRITICAL REQUIREMENTS:
- You MUST return the COMPLETE, FULL HTML document with all changes applied
- Do NOT return partial HTML or snippets - return the ENTIRE page
- Preserve all existing styling, scripts, and functionality unless specifically asked to change them
- Make ONLY the changes requested by the user
- Ensure the returned HTML is ready to display in an iframe
- Keep all form actions and hidden fields intact

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
  "updatedHtml": "THE COMPLETE FULL HTML DOCUMENT WITH YOUR CHANGES APPLIED"
}

IMPORTANT: The "updatedHtml" field must contain the ENTIRE HTML document, not just the changed parts!`

    // Call OpenRouter API
    console.log('🚀 Making OpenRouter API request...')
    
    let openRouterResponse
    try {
      openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': request.headers.get('origin') || 'http://localhost:3000',
          'X-Title': 'WalletPush Business Landing Page Editor'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 16000
        })
      })
    } catch (fetchError) {
      console.error('❌ OpenRouter API fetch error:', fetchError)
      return NextResponse.json({ 
        message: "Network error connecting to AI service. Please try again.",
        updatedHtml: null 
      })
    }

    console.log('📡 OpenRouter API response status:', openRouterResponse.status)

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text()
      console.error('❌ OpenRouter API error:', {
        status: openRouterResponse.status,
        statusText: openRouterResponse.statusText,
        body: errorText
      })
      
      return NextResponse.json({ 
        message: `AI service error (${openRouterResponse.status}). Please try again in a moment.`,
        updatedHtml: null 
      })
    }

    const openRouterData = await openRouterResponse.json()
    console.log('📊 OpenRouter response structure:', {
      choices: openRouterData.choices?.length || 0,
      usage: openRouterData.usage
    })
    
    const assistantMessage = openRouterData.choices[0]?.message?.content

    if (!assistantMessage) {
      console.error('❌ No assistant message in OpenRouter response:', openRouterData)
      return NextResponse.json({ 
        message: "I didn't receive a proper response. Please try rephrasing your request.",
        updatedHtml: null 
      })
    }

    console.log('✅ Received assistant message, length:', assistantMessage.length)

    // Try to parse JSON response from AI
    try {
      console.log('🔍 Attempting to parse AI response as JSON...')
      const response = JSON.parse(assistantMessage)
      
      console.log('✅ Successfully parsed JSON response:', {
        hasMessage: !!response.message,
        hasUpdatedHtml: !!response.updatedHtml,
        htmlLength: response.updatedHtml?.length || 0
      })
      
      // Validate that we got a complete HTML document
      if (response.updatedHtml && !response.updatedHtml.includes('<!DOCTYPE html>')) {
        console.warn('⚠️ AI returned incomplete HTML, requesting complete document...')
        return NextResponse.json({
          message: "I need to provide a complete HTML document. Let me try again with the full page.",
          updatedHtml: null
        })
      }
      
      return NextResponse.json({
        message: response.message || "I've made the requested changes to your landing page.",
        updatedHtml: response.updatedHtml
      })
    } catch (parseError) {
      console.warn('⚠️ AI response is not JSON, using as plain text message:', parseError)
      // If AI didn't respond in JSON format, just return the message
      return NextResponse.json({
        message: assistantMessage.substring(0, 500) + (assistantMessage.length > 500 ? '...' : ''),
        updatedHtml: null
      })
    }

  } catch (error) {
    console.error('❌ Chat edit API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
