import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Starting AI business analysis...')
    
    const { websiteUrl, websiteContent, visualAssets, screenshot } = await request.json()
    
    if (!websiteUrl || !websiteContent) {
      return NextResponse.json({ error: 'Website URL and content are required' }, { status: 400 })
    }

    console.log('📊 Analyzing website:', websiteUrl)
    console.log('📋 Content pages:', websiteContent.length)
    console.log('🎨 Visual assets:', visualAssets ? Object.keys(visualAssets).length : 0)

    // Prepare content for AI analysis
    const contentSummary = websiteContent.map((page: any) => `
**Page: ${page.title}**
URL: ${page.url}
Content: ${page.content.slice(0, 1000)}...
`).join('\n\n')

    // Prepare visual assets summary
    let visualAssetsSummary = ''
    if (visualAssets && visualAssets.allImages?.length > 0) {
      const uniqueColors = [...new Set(visualAssets.brandColors || [])].slice(0, 5) // Limit to 5 colors
      visualAssetsSummary = `
**VISUAL ASSETS DISCOVERED:**
- Business Name: ${visualAssets.businessInfo?.name || 'Extracted from page title'}
- Logo Images: ${visualAssets.logos?.length || 0} found
- Hero/Banner Images: ${visualAssets.heroImages?.length || 0} found  
- Product/Content Images: ${visualAssets.productImages?.length || 0} found
- Brand Colors Found: ${uniqueColors.length > 0 ? uniqueColors.join(', ') : 'None detected'}
- Contact Email: ${visualAssets.businessInfo?.email || 'Not found'}
- Contact Phone: ${visualAssets.businessInfo?.phone || 'Not found'}
- Location/Address: ${visualAssets.businessInfo?.location || 'Not detected'}
- Total Images Available: ${visualAssets.allImages?.length || 0}

**Sample Image URLs:** ${(visualAssets.allImages || []).slice(0, 3).join(', ')}
`
    }

    const analysisPrompt = `
You are an expert business analyst and loyalty program consultant. I've crawled a business website and need you to analyze it to create personalized recommendations for a loyalty program.

**Website URL:** ${websiteUrl}

**Website Content:**
${contentSummary}

${visualAssetsSummary}

**Your Task:**
1. Identify the business type/industry
2. Understand their target audience
3. Analyze their value proposition and visual branding
4. Suggest industry-specific loyalty program strategies
5. Provide compelling statistics for their industry
6. Make initial recommendations for incentives and rewards
7. Comment on their visual branding and suggest how to incorporate it into their loyalty program

**Response Format:**
Please respond in a conversational, enthusiastic tone as if you're an expert consultant who just analyzed their business. Start with something like "I've analyzed your website and here's what I discovered about [Business Name]..."

Include:
- Business type and what makes them unique
- Comments on their visual branding, logo, and color scheme
- Industry-specific loyalty program benefits (with statistics)
- 2-3 initial program suggestions that incorporate their brand elements
- How their existing images/assets could be used in the loyalty program
- Questions to gather more specific information

Keep it engaging and actionable. Make them excited about the possibilities!
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
        'HTTP-Referer': websiteUrl,
        'X-Title': 'WalletPush AI Copilot'
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text()
      console.error('❌ OpenRouter API error:', errorData)
      throw new Error(`OpenRouter API error: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const analysis = aiData.choices[0]?.message?.content

    if (!analysis) {
      throw new Error('No analysis generated')
    }

    console.log('✅ AI analysis completed')

    return NextResponse.json({
      success: true,
      analysis,
      websiteUrl,
      contentPagesAnalyzed: websiteContent.length
    })

  } catch (error: any) {
    console.error('💥 AI Analysis Error:', error)
    return NextResponse.json({ 
      error: 'Failed to analyze website with AI',
      details: error.message 
    }, { status: 500 })
  }
}
