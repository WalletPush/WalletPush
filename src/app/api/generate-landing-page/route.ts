import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { prompt, business_name, logo_url, background_image_url, project_state, template_id } = await request.json()
    
    console.log('Generate landing page request:', { prompt, business_name, template_id })
    
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
      const mockHtml = await generateMockHTML(prompt, business_name, logo_url, background_image_url, template_id, supabase, project_state?.requiredFields, project_state?.optionalFields)
      
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

                  const systemPrompt = `You are an expert web developer creating mobile wallet pass signup pages.

CRITICAL OUTPUT REQUIREMENT:
Return ONLY complete HTML code. NO JavaScript, NO middleware code, NO explanations.

DEFAULT DESIGN (use unless custom instructions specify otherwise):
Based on proven high-converting pattern:
- Centered form container with dark semi-transparent overlay
- Logo at top center (if provided)
- Compelling headline (large, bold, white text)
- Sub-headline with benefit/incentive  
- Signup form immediately below (above the fold on mobile)
- Clean, minimal design focused purely on conversion

TECHNICAL REQUIREMENTS:
- Complete HTML document starting with <!DOCTYPE html>
- Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Form posts to /api/customer-signup with method="POST"
- Include: <input type="hidden" name="landing_page_id" value="LANDING_PAGE_ID_PLACEHOLDER">
- Include ALL specified form fields with exact input names from mapping
- Use provided logo and background images if available
- Mobile-first responsive design with proper viewport
- Inline CSS for styling the dark overlay form container

DO NOT INCLUDE:
❌ No JavaScript code (form handling is done by existing middleware)
❌ No event listeners or form submission code
❌ No device detection or redirect logic
❌ No explanations, comments, or markdown
❌ No acknowledgments or conversational text

RETURN FORMAT:
Complete HTML page only, starting with <!DOCTYPE html> and ending with </html>.
The middleware system will automatically inject all JavaScript functionality.`

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

      // CRITICAL: Limit all text inputs to prevent massive token costs
      const sanitizedPrompt = sanitizeText(prompt || '').slice(0, 5000) // Limit to 5K chars max
      const sanitizedBusinessName = business_name ? sanitizeText(business_name).slice(0, 100) : 'Your Business'
      

      // Convert relative URLs to absolute URLs for the HTML generation
      // CRITICAL: Check for base64 data that would cause massive token costs
      let logoFullUrl = null
      let backgroundFullUrl = null
      
      if (logo_url) {
        if (logo_url.startsWith('data:image/') || logo_url.includes('base64')) {
          // For base64 images, include a truncated version for reference
          logoFullUrl = `[BASE64 LOGO IMAGE - Use as logo in design]`
        } else {
          logoFullUrl = logo_url.startsWith('http') ? logo_url : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${logo_url}`
        }
      }
      
      if (background_image_url) {
        if (background_image_url.startsWith('data:image/') || background_image_url.includes('base64')) {
          // For base64 images, include a truncated version for reference
          backgroundFullUrl = `[BASE64 BACKGROUND IMAGE - Use as hero background in design]`
        } else {
          backgroundFullUrl = background_image_url.startsWith('http') ? background_image_url : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${background_image_url}`
        }
      }

      // Build comprehensive prompt with all necessary details
      const formFields = project_state?.requiredFields || []
      const optionalFields = project_state?.optionalFields || []
      const allFields = [...formFields, ...optionalFields]
      
            const userPrompt = `Create HTML signup page for: ${sanitizedBusinessName}

BRANDING:
${logoFullUrl ? `Logo: ${logoFullUrl}` : 'No logo'}
${backgroundFullUrl ? `Background: ${backgroundFullUrl}` : 'No background'}
Primary Color: ${project_state?.primaryColor || '#1877f2'}
Secondary Color: ${project_state?.secondaryColor || '#6b7280'}

FORM FIELDS (create input elements for ALL):
${allFields.length > 0 ? allFields.map(field => `<input name="${field}" type="${field.includes('email') ? 'email' : field.includes('phone') ? 'tel' : 'text'}" ${formFields.includes(field) ? 'required' : ''} placeholder="${field.replace('_', ' ')}">`).join('\n') : '<input name="first_name" type="text" required placeholder="First Name">\n<input name="last_name" type="text" required placeholder="Last Name">\n<input name="email" type="email" required placeholder="Email">\n<input name="phone" type="tel" placeholder="Phone">'}

${project_state?.customInstructions ? `CUSTOM INSTRUCTIONS:
${sanitizeText(project_state.customInstructions).slice(0, 1000)}
` : ''}

CONTENT: ${sanitizedPrompt}

Return complete HTML page only. No JavaScript - middleware handles functionality.`Logo URL: ${logoFullUrl}` : ''}
${backgroundFullUrl ? `Background Image URL: ${backgroundFullUrl}` : ''}

FORM FIELDS REQUIRED:
${allFields.length > 0 ? allFields.map(field => `- ${field} (${formFields.includes(field) ? 'required' : 'optional'})`).join('\n') : '- first_name (required)\n- last_name (required)\n- email (required)\n- phone (optional)'}

DESIGN REQUIREMENTS:
${project_state?.primaryColor ? `Primary Color: ${project_state.primaryColor}` : ''}
${project_state?.secondaryColor ? `Secondary Color: ${project_state.secondaryColor}` : ''}
${project_state?.customInstructions ? `Custom Instructions: ${sanitizeText(project_state.customInstructions).slice(0, 1000)}` : ''}

CONTENT REQUIREMENTS: ${sanitizedPrompt}`

      const apiParams = {
        model: openrouterConfig.model,
        messages: [
          { role: "system" as const, content: sanitizeText(systemPrompt || '') },
          { role: "user" as const, content: sanitizeText(userPrompt || '') }
        ],
        max_tokens: 4000,
        temperature: 0.7
      }
      
      const completion = await openai.chat.completions.create(apiParams)
      
      // Log token usage to track costs
      const usage = completion.usage
      if (usage) {
        console.log('💰 OpenRouter Token Usage:')
        console.log(`   Input tokens: ${usage.prompt_tokens}`)
        console.log(`   Output tokens: ${usage.completion_tokens}`)
        console.log(`   Total tokens: ${usage.total_tokens}`)
        
        // Rough cost calculation (varies by model)
        const inputCost = (usage.prompt_tokens / 1000) * 0.003  // Approximate
        const outputCost = (usage.completion_tokens / 1000) * 0.015  // Approximate
        const totalCost = inputCost + outputCost
        console.log(`   Estimated cost: $${totalCost.toFixed(4)}`)
        
        if (totalCost > 1.0) {
          console.warn(`⚠️ HIGH COST ALERT: This request cost $${totalCost.toFixed(2)}!`)
        }
        if (usage.prompt_tokens > 50000) {
          console.error(`🚨 MASSIVE INPUT TOKENS: ${usage.prompt_tokens} tokens! Check for base64 data in prompt!`)
        }
      }
      
      console.log('OpenRouter response structure:', {
        choices: completion.choices?.length,
        hasContent: !!completion.choices?.[0]?.message?.content,
        finishReason: completion.choices?.[0]?.finish_reason
      })

      // Check for API errors (OpenRouter format)
      if ((completion as any).error) {
        const error = (completion as any).error
        console.error('API Error:', error)
        throw new Error(`API Error: ${error.message || error} (${error.code || 'unknown'})`)
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
      const mockHtml = await generateMockHTML(prompt, business_name, logo_url, background_image_url, template_id, supabase, project_state?.requiredFields, project_state?.optionalFields)
      
      return NextResponse.json({ 
        data: { 
          html: mockHtml,
          message: `OpenRouter failed, generated with mock data. Error: ${error instanceof Error ? error.message : error}`
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

async function generateMockHTML(
  prompt: string, 
  businessName: string, 
  logoUrl?: string, 
  backgroundUrl?: string,
  templateId?: string,
  supabase?: any,
  requiredFields?: string[],
  optionalFields?: string[]
): Promise<string> {
  
  // Map of available form fields - CUSTOMER-FOCUSED ONLY
  const availableFields = {
    firstName: { name: 'first_name', placeholder: 'First Name', type: 'text' },
    lastName: { name: 'last_name', placeholder: 'Last Name', type: 'text' },
    email: { name: 'email', placeholder: 'Email Address', type: 'email' },
    phone: { name: 'phone', placeholder: 'Phone Number', type: 'tel' },
    dateOfBirth: { name: 'date_of_birth', placeholder: 'Date of Birth', type: 'date' },
    address: { name: 'address', placeholder: 'Address', type: 'text' },
    city: { name: 'city', placeholder: 'City', type: 'text' },
    zipCode: { name: 'zip_code', placeholder: 'ZIP Code', type: 'text' },
    company: { name: 'company', placeholder: 'Company', type: 'text' }
  }

  // Build form fields based on business selection
  let formFields: any[] = []
  
  // Add required fields
  if (requiredFields && requiredFields.length > 0) {
    requiredFields.forEach(fieldId => {
      if (availableFields[fieldId as keyof typeof availableFields]) {
        formFields.push({
          ...availableFields[fieldId as keyof typeof availableFields],
          required: true
        })
      }
    })
  }
  
  // Add optional fields
  if (optionalFields && optionalFields.length > 0) {
    optionalFields.forEach(fieldId => {
      if (availableFields[fieldId as keyof typeof availableFields]) {
        formFields.push({
          ...availableFields[fieldId as keyof typeof availableFields],
          required: false
        })
      }
    })
  }
  
  // Default fields if none specified
  if (formFields.length === 0) {
    formFields = [
      { name: 'first_name', placeholder: 'First Name', type: 'text', required: true },
      { name: 'last_name', placeholder: 'Last Name', type: 'text', required: true },
      { name: 'email', placeholder: 'Email Address', type: 'email', required: true },
      { name: 'phone', placeholder: 'Phone Number', type: 'tel', required: false }
    ]
  }

  // SMART FORM GENERATION: Analyze template placeholders to suggest customer fields
  if (templateId && supabase) {
    try {
      const { data: template } = await supabase
        .from('templates')
        .select('template_json, passkit_json')
        .eq('id', templateId)
        .single()

      if (template?.passkit_json?.placeholders) {
        console.log('🔍 Template placeholders found:', Object.keys(template.passkit_json.placeholders))
        
        // Analyze placeholders to suggest customer-facing fields
        const placeholders = Object.keys(template.passkit_json.placeholders)
        const suggestedFields: any[] = []
        
        // Smart mapping: placeholder patterns → form fields
        for (const placeholder of placeholders) {
          const lower = placeholder.toLowerCase()
          
          // Name variations
          if (lower.includes('first') && lower.includes('name')) {
            if (!suggestedFields.find(f => f.name === 'first_name')) {
              suggestedFields.push({ name: 'first_name', placeholder: 'First Name', type: 'text', required: true, maps_to: placeholder })
            }
          } else if (lower.includes('last') && lower.includes('name')) {
            if (!suggestedFields.find(f => f.name === 'last_name')) {
              suggestedFields.push({ name: 'last_name', placeholder: 'Last Name', type: 'text', required: true, maps_to: placeholder })
            }
          } else if (lower.includes('full') && lower.includes('name')) {
            if (!suggestedFields.find(f => f.name === 'full_name')) {
              suggestedFields.push({ name: 'full_name', placeholder: 'Full Name', type: 'text', required: true, maps_to: placeholder })
            }
          }
          
          // Email variations
          else if (lower.includes('email')) {
            if (!suggestedFields.find(f => f.name === 'email')) {
              suggestedFields.push({ name: 'email', placeholder: 'Email Address', type: 'email', required: true, maps_to: placeholder })
            }
          }
          
          // Phone variations
          else if (lower.includes('phone') || lower.includes('mobile')) {
            if (!suggestedFields.find(f => f.name === 'phone')) {
              suggestedFields.push({ name: 'phone', placeholder: 'Phone Number', type: 'tel', required: false, maps_to: placeholder })
            }
          }
          
          // Date of birth variations
          else if (lower.includes('birth') || lower.includes('dob')) {
            if (!suggestedFields.find(f => f.name === 'date_of_birth')) {
              suggestedFields.push({ name: 'date_of_birth', placeholder: 'Date of Birth', type: 'date', required: false, maps_to: placeholder })
            }
          }
          
          // Skip backend-generated fields (MEMBER_ID, Points, Tier, etc.)
          // These are handled server-side with template defaults
        }
        
        // If we found customer-facing placeholders, use them
        if (suggestedFields.length > 0) {
          console.log('🎯 Smart-generated form fields:', suggestedFields.map(f => `${f.name} → ${f.maps_to}`))
          formFields = suggestedFields
        }
      }
    } catch (error) {
      console.log('Could not analyze template for smart form generation:', error)
    }
  }

  const formFieldsHTML = formFields.map(field => 
    `<input type="${field.type}" name="${field.name}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>`
  ).join('\n                ')

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
            background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5))${backgroundUrl ? `, url('${backgroundUrl}')` : ', linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
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
        .loading { display: none; }
        .success { display: none; background: #10b981; padding: 1rem; border-radius: 5px; margin-top: 1rem; }
        .error { display: none; background: #ef4444; padding: 1rem; border-radius: 5px; margin-top: 1rem; }
    </style>
</head>
<body>
    <div class="hero">
        <div class="container">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo">` : ''}
            <h1>Welcome to ${businessName}</h1>
            <p>Join our exclusive membership program and unlock amazing benefits!</p>
            <form class="form" id="signupForm">
                <input type="hidden" name="landing_page_id" value="LANDING_PAGE_ID_PLACEHOLDER">
                ${formFieldsHTML}
                <button type="submit" id="submitBtn">Join Now - It's Free!</button>
                <div class="loading" id="loading">Creating your pass...</div>
                <div class="success" id="success">Success! Your pass has been created and sent to your email.</div>
                <div class="error" id="error">Something went wrong. Please try again.</div>
            </form>
        </div>
    </div>

    <script>
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault()
            
            const form = e.target
            const formData = new FormData(form)
            const data = Object.fromEntries(formData.entries())
            
            const submitBtn = document.getElementById('submitBtn')
            const loading = document.getElementById('loading')
            const success = document.getElementById('success')
            const error = document.getElementById('error')
            
            // Hide previous messages
            success.style.display = 'none'
            error.style.display = 'none'
            
            // Show loading
            submitBtn.style.display = 'none'
            loading.style.display = 'block'
            
            try {
                const response = await fetch('/api/customer-signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })
                
                const result = await response.json()
                
                if (result.success) {
                    success.style.display = 'block'
                    form.reset()
                } else {
                    error.textContent = result.error || 'Something went wrong. Please try again.'
                    error.style.display = 'block'
                }
            } catch (err) {
                error.textContent = 'Network error. Please check your connection and try again.'
                error.style.display = 'block'
            } finally {
                loading.style.display = 'none'
                submitBtn.style.display = 'block'
            }
        })
    </script>
</body>
</html>`
}