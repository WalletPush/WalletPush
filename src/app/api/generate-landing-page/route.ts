import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { prompt, business_name, logo_url, background_image_url, project_state } = await request.json()
    
    console.log('Generate landing page request:', { prompt, business_name })
    
    // For testing, we'll use the Blue Karma business ID
    const business_id = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    
    // Get OpenRouter settings for the business
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('setting_value')
      .eq('business_id', business_id)
      .eq('setting_key', 'openrouter')
      .maybeSingle()
    
    console.log('OpenRouter settings query:', { settings, settingsError })
    
    if (settingsError) {
      console.error('Settings error:', settingsError)
      return NextResponse.json(
        { data: null, error: 'Failed to fetch OpenRouter settings' },
        { status: 500 }
      )
    }
    
    const openrouterConfig = settings?.setting_value
    console.log('OpenRouter config:', { enabled: openrouterConfig?.enabled, hasApiKey: !!openrouterConfig?.api_key })
    
    if (!openrouterConfig?.enabled || !openrouterConfig?.api_key) {
      // Generate mock HTML when OpenRouter not configured
      const mockHtml = generateMockHTML(prompt, business_name, logo_url, background_image_url)
      
      return NextResponse.json({ 
        data: { 
          html: mockHtml,
          message: 'Generated with mock data (OpenRouter not configured)'
        }, 
        error: null 
      })
    }
    
    // Use real OpenRouter API
    try {
      const openai = new OpenAI({
        apiKey: openrouterConfig.api_key,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://walletpush.com",
          "X-Title": "WalletPush"
        }
      })

      const systemPrompt = `You are an expert web developer creating landing pages for WalletPush.

TASK: Create a complete, responsive HTML landing page based on the provided requirements.

OUTPUT FORMAT:
1. Brief acknowledgment (1-2 sentences)
2. Add separator: ---HTML---
3. Complete HTML code

REQUIREMENTS:
- Use Tailwind CSS via CDN
- Form posts to /api/public/join with method="POST"
- Include hidden fields: <input type="hidden" name="tenant_id" value="{{TENANT_ID}}"> and <input type="hidden" name="program_id" value="{{PROGRAM_ID}}">
- Use provided branding assets (logo, background image)
- Include all specified form fields as <input> elements
- Professional, conversion-optimized design
- Prominently display the incentive offer
- Clear benefits section with bullet points
- Mobile responsive design
- Include client-side form validation

STRUCTURE:
- Header with logo
- Hero section with headline and incentive
- Benefits section with bullet points
- Signup form with specified fields
- Footer

Do not ask questions. Build immediately using all provided information.`

      // Sanitize text to remove problematic Unicode characters
      const sanitizeText = (text: string) => {
        return text
          .replace(/\u2028/g, ' ') // Line separator (character 8232)
          .replace(/\u2029/g, ' ') // Paragraph separator
          .replace(/[\u2000-\u206F]/g, ' ') // All Unicode spaces and general punctuation
          .replace(/[\u2E00-\u2E7F]/g, ' ') // Supplemental punctuation
          .replace(/[\u3000-\u303F]/g, ' ') // CJK symbols and punctuation
          .replace(/[^\x20-\x7E\x0A\x0D]/g, ' ') // Keep only basic ASCII printable chars, newlines, and carriage returns
          .replace(/\s+/g, ' ') // Normalize multiple spaces
          .trim()
      }

      const sanitizedPrompt = sanitizeText(prompt).slice(0, 2000) // Limit prompt to 2000 chars
      const sanitizedBusinessName = business_name ? sanitizeText(business_name) : ''

      // Convert relative URLs to absolute URLs for the HTML generation
      const logoFullUrl = logo_url ? `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${logo_url}` : null
      const backgroundFullUrl = background_image_url ? `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${background_image_url}` : null

      const userPrompt = `Business: ${sanitizedBusinessName}
${logoFullUrl ? `Logo URL: ${logoFullUrl}` : ''}
${backgroundFullUrl ? `Background Image URL: ${backgroundFullUrl}` : ''}

Requirements: ${sanitizedPrompt}`

      console.log('=== DEBUG TOKEN COUNT ===')
      console.log('Original prompt length:', prompt.length)
      console.log('Logo URL length:', logo_url?.length || 0)
      console.log('Background URL length:', background_image_url?.length || 0)
      console.log('Business name length:', business_name?.length || 0)
      console.log('Using model:', openrouterConfig.model)
      console.log('=========================')

      const apiParams = {
        model: openrouterConfig.model,
        messages: [
          { role: "system" as const, content: sanitizeText(systemPrompt) },
          { role: "user" as const, content: sanitizeText(userPrompt) }
        ],
        max_tokens: 4000,
        temperature: 0.7
      }

      console.log('Calling OpenRouter with params:', JSON.stringify(apiParams, null, 2))
      
      const completion = await openai.chat.completions.create(apiParams)
      
      console.log('OpenRouter response:', JSON.stringify(completion, null, 2))

      // Check for API errors
      if (completion.choices[0]?.error) {
        const error = completion.choices[0].error
        console.error('API Error:', error)
        throw new Error(`API Error: ${error.message} (${error.code})`)
      }

      const fullResponse = completion.choices[0]?.message?.content

      if (!fullResponse) {
        console.error('OpenRouter returned empty response - full completion object:', completion)
        throw new Error('OpenRouter returned empty response')
      }

      // Check if response was cut off
      const finishReason = completion.choices[0]?.finish_reason
      if (finishReason === 'length') {
        console.warn('Response was truncated due to length limit')
        // Continue processing but note it was truncated
      }

      // Simple extraction using the ---HTML--- separator
      const parts = fullResponse.split('---HTML---')
      
      let conversationalMessage = ''
      let extractedHtml = ''
      
      if (parts.length >= 2) {
        conversationalMessage = parts[0].trim()
        extractedHtml = parts[1].trim()
        console.log('SUCCESS: Split on ---HTML--- separator')
      } else {
        // Fallback: Check if this is a partial/conversational response without HTML
        if (fullResponse.includes('<!DOCTYPE html>')) {
          const doctypeIndex = fullResponse.indexOf('<!DOCTYPE html>')
          conversationalMessage = fullResponse.substring(0, doctypeIndex).trim()
          extractedHtml = fullResponse.substring(doctypeIndex).trim()
          console.log('FALLBACK: Used DOCTYPE detection')
        } else {
          // This appears to be a conversational-only response (no HTML yet)
          conversationalMessage = fullResponse.trim()
          extractedHtml = '' // No HTML to extract
          console.log('CONVERSATIONAL ONLY: No HTML in this response')
        }
      }

      console.log('Conversational message length:', conversationalMessage.length)
      console.log('Extracted HTML length:', extractedHtml.length)
      console.log('First 200 chars of message:', conversationalMessage.substring(0, 200))

      return NextResponse.json({ 
        data: { 
          html: extractedHtml || null, // Can be null for conversational-only responses
          message: conversationalMessage, // Clean conversational response only
          model: openrouterConfig.model,
          hasHtml: !!extractedHtml
        }, 
        error: null 
      })

    } catch (error) {
      console.error('OpenRouter API error:', error)
      
      // Generate mock HTML as fallback
      const mockHtml = generateMockHTML(prompt, business_name, logo_url, background_image_url)
      
      return NextResponse.json({ 
        data: { 
          html: mockHtml,
          message: `OpenRouter failed, generated with mock data. Error: ${error.message}`
        }, 
        error: null 
      })
    }
    
  } catch (error) {
    console.error('Error generating landing page:', error)
    return NextResponse.json(
      { data: null, error: 'Failed to generate landing page' },
      { status: 500 }
    )
  }
}

function generateMockHTML(prompt: string, businessName: string, logoUrl?: string, backgroundUrl?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessName} - Join Today</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; line-height: 1.6; }
        .hero { 
            min-height: 100vh; 
            background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${backgroundUrl || '/api/placeholder/1200/600'}');
            background-size: cover; 
            background-position: center;
            display: flex; 
            align-items: center; 
            justify-content: center;
            color: white;
            text-align: center;
            padding: 2rem;
        }
        .container { max-width: 500px; }
        .logo { width: 120px; height: 120px; margin: 0 auto 2rem; border-radius: 50%; }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; font-weight: 700; }
        p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
        .form { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 2rem; border-radius: 10px; }
        input { width: 100%; padding: 12px; margin-bottom: 1rem; border: none; border-radius: 5px; font-size: 16px; }
        button { width: 100%; padding: 12px; background: #4F46E5; color: white; border: none; border-radius: 5px; font-size: 16px; font-weight: 600; cursor: pointer; }
        button:hover { background: #4338CA; }
    </style>
</head>
<body>
    <div class="hero">
        <div class="container">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo">` : ''}
            <h1>Welcome to ${businessName}</h1>
            <p>Join our exclusive membership program and unlock amazing benefits!</p>
            <form class="form" onsubmit="alert('Thank you for joining!'); return false;">
                <input type="text" placeholder="First Name" required>
                <input type="text" placeholder="Last Name" required>
                <input type="email" placeholder="Email Address" required>
                <input type="tel" placeholder="Phone Number" required>
                <button type="submit">Join Now - It's Free!</button>
            </form>
        </div>
    </div>
</body>
</html>`
}