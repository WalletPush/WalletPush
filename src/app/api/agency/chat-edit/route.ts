import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  optimizeHTMLForAI, 
  restoreOptimizedHTML, 
  identifyTargetSection,
  mergeChangesIntoFullHTML,
  isFullPageEdit
} from '@/lib/html-optimizer'

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

    // Check if this is a full page edit or section-specific edit
    const isFullPage = isFullPageEdit(message)
    const targetSections = isFullPage ? [] : identifyTargetSection(message)
    
    console.log('🎯 Edit type analysis:', {
      isFullPageEdit: isFullPage,
      targetSections: targetSections,
      message: message.substring(0, 100) + '...'
    })

    let htmlToSend: string
    let optimization: any = null

    if (isFullPage) {
      // For full page edits, send the complete HTML but still extract CSS/scripts to reduce tokens
      const cssRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
      const cssBlocks: string[] = []
      htmlToSend = currentHtml
      
      // Extract CSS blocks to reduce token usage
      let match
      while ((match = cssRegex.exec(currentHtml)) !== null) {
        cssBlocks.push(match[1])
        htmlToSend = htmlToSend.replace(match[0], `<style>/* CSS_BLOCK_${cssBlocks.length - 1} */</style>`)
      }
      
      // Extract external CSS links
      const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*>/gi
      const cssLinks: string[] = []
      htmlToSend = htmlToSend.replace(linkRegex, (match) => {
        cssLinks.push(match)
        return `<!-- CSS_LINK_${cssLinks.length - 1} -->`
      })
      
      // Extract scripts
      const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>/gi
      const scriptBlocks: string[] = []
      htmlToSend = htmlToSend.replace(scriptRegex, (match) => {
        scriptBlocks.push(match)
        return `<!-- SCRIPT_BLOCK_${scriptBlocks.length - 1} -->`
      })
      
      optimization = { cssBlocks, cssLinks, scriptBlocks }
      
      console.log('📄 Full page edit - HTML length:', {
        original: currentHtml.length,
        optimized: htmlToSend.length,
        compressionRatio: Math.round((htmlToSend.length / currentHtml.length) * 100) + '%'
      })
    } else {
      // For section-specific edits, use advanced optimization
      optimization = optimizeHTMLForAI(currentHtml, targetSections)
      htmlToSend = optimization.optimizedHtml
      
      console.log('📊 Section-specific edit - HTML optimization:', {
        originalLength: currentHtml.length,
        optimizedLength: optimization.optimizedHtml.length,
        compressionRatio: optimization.compressionRatio + '%',
        sectionsFound: optimization.sections.map((s: any) => s.name),
        targetSections
      })
    }

    // Prepare the prompt for Claude
    const prompt = `You are a professional HTML editor for sales pages. The user wants to make specific changes to their existing sales page.

🚨 CRITICAL REQUIREMENTS:
- You MUST respond ONLY in valid JSON format
- You MUST return the COMPLETE, FULL HTML document with all changes applied
- Do NOT return partial HTML or snippets - return the ENTIRE page from <!DOCTYPE html> to </html>
- Make the requested changes to the HTML structure and content
- Preserve all CSS placeholders (/* CSS_BLOCK_X */), CSS link placeholders (<!-- CSS_LINK_X -->), script placeholders (<!-- SCRIPT_BLOCK_X -->), and data-wp- attributes
- Return the complete modified HTML document with all placeholders intact
${isFullPage ? '- This is a FULL PAGE edit - make changes throughout the entire document' : `- Focus on the ${targetSections.join(', ')} section(s) based on the user's request`}

User's request: "${message}"

${isFullPage ? 'COMPLETE HTML DOCUMENT' : 'OPTIMIZED HTML'} (CSS and scripts are preserved as placeholders):
${htmlToSend}

RESPOND ONLY IN THIS JSON FORMAT (no additional text):
{
  "message": "Brief explanation of changes made",
  "updatedHtml": "THE COMPLETE MODIFIED HTML DOCUMENT WITH ALL PLACEHOLDERS INTACT - MUST START WITH <!DOCTYPE html> AND END WITH </html>"
}`

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
            temperature: 0.1,
            max_tokens: 32000,
            response_format: { type: "json_object" }
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
      
      if (response.updatedHtml) {
        // Restore CSS and scripts to the modified HTML
        let restoredHtml = restoreOptimizedHTML(
          response.updatedHtml,
          optimization.cssBlocks,
          optimization.cssLinks,
          optimization.scriptBlocks
        )
        
        // For section-specific edits, merge changes back into full HTML
        if (!isFullPage && targetSections.length > 0 && optimization.sections && optimization.sections.length > 0) {
          restoredHtml = mergeChangesIntoFullHTML(currentHtml, restoredHtml, targetSections)
        }
        
        // Validate that we got a complete HTML document
        if (!restoredHtml.includes('<!DOCTYPE html>') || !restoredHtml.includes('</html>')) {
          console.warn('⚠️ Claude returned incomplete HTML document')
          return NextResponse.json({
            message: "I need to provide a complete HTML document. The response was incomplete. Please try again.",
            updatedHtml: null
          })
        }
        
        console.log('✅ Returning response:', {
          message: response.message?.substring(0, 100) + '...',
          hasUpdatedHtml: !!restoredHtml,
          htmlLength: restoredHtml?.length || 0,
          originalLength: currentHtml.length,
          editType: isFullPage ? 'full-page' : 'section-specific',
          sectionsModified: targetSections
        })
        
        return NextResponse.json({
          message: response.message,
          updatedHtml: restoredHtml
        })
      } else {
        return NextResponse.json({
          message: response.message || "I made the changes but couldn't return the updated HTML. Please try again.",
          updatedHtml: null
        })
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Claude response as JSON:', parseError)
      console.log('Raw response:', assistantMessage.substring(0, 500) + '...')
      
      // If Claude didn't respond in JSON format, just return the message
      return NextResponse.json({
        message: "I understand your request, but I had trouble formatting my response properly. Please try rephrasing your request.",
        updatedHtml: null
      })
    }

  } catch (error) {
    console.error('❌ Chat edit API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
