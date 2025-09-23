import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('💬 Processing AI chat message...')
    
    const { message, conversationHistory, websiteUrl, crawlData } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    console.log('📨 User message:', message)
    console.log('💼 Website:', websiteUrl)

    // Build conversation context
    const conversationContext = conversationHistory
      .filter((msg: any) => msg.role !== 'system')
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))

    // Add context about the website if available
    let contextInfo = ''
    if (crawlData && crawlData.length > 0) {
      contextInfo = `
**Business Website Context:**
${crawlData.slice(0, 3).map((page: any) => `
- ${page.metadata?.title || 'Page'}: ${page.markdown?.slice(0, 200)}...
`).join('\n')}
`
    }

    const systemPrompt = `
You are an expert AI Copilot for creating loyalty programs and marketing materials. You're helping a business owner create the perfect loyalty program based on their website analysis.

${contextInfo}

**Your Role:**
- Ask strategic questions to understand their business goals
- Suggest industry-specific loyalty program features
- Guide them through program configuration decisions
- Help them define incentives, rewards, and member benefits
- Eventually help create both the loyalty pass and promotional landing page

**Key Information to Gather:**
1. What incentive/offer they want to provide (REQUIRED for pass creation)
2. What customer information to collect (name, email, phone, etc.)
3. Program type (points-based, visit-based, spend-based, etc.)
4. Target audience and customer behavior
5. Business goals and success metrics

**Guidelines:**
- Be conversational and enthusiastic
- Provide specific, actionable recommendations
- Use industry statistics when relevant
- Ask one focused question at a time
- Guide toward concrete decisions
- Suggest proven loyalty program strategies

**Current Conversation Context:**
Website: ${websiteUrl || 'Not provided'}

Previous conversation:
${conversationContext.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

Respond to their latest message: "${message}"
`

    // Get OpenRouter settings from business settings
    const supabase = await createClient()
    
    // Get authenticated user to determine business context
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    // Fetch OpenRouter settings from business_settings
    // For now, we'll use the first business setting, but this should be based on the current business context
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('setting_value')
      .eq('setting_key', 'openrouter')
      .limit(1)
      .single()

    if (settingsError || !settings?.setting_value?.api_key) {
      throw new Error('OpenRouter API key not configured. Please configure it in Settings.')
    }

    const openRouterConfig = settings.setting_value
    const openRouterApiKey = openRouterConfig.api_key
    const openRouterModel = openRouterConfig.model || 'anthropic/claude-3.5-sonnet'

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': websiteUrl || 'https://walletpush.com',
        'X-Title': 'WalletPush AI Copilot Chat'
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...conversationContext.slice(-10), // Keep last 10 messages for context
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1500,
        temperature: 0.8
      })
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text()
      console.error('❌ OpenRouter API error:', errorData)
      throw new Error(`OpenRouter API error: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const response = aiData.choices[0]?.message?.content

    if (!response) {
      throw new Error('No response generated')
    }

    console.log('✅ AI response generated')

    return NextResponse.json({
      success: true,
      response
    })

  } catch (error: any) {
    console.error('💥 AI Chat Error:', error)
    return NextResponse.json({ 
      error: 'Failed to process chat message',
      details: error.message 
    }, { status: 500 })
  }
}
