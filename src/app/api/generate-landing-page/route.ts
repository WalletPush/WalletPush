import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { prompt, business_name, logo_url, background_image_url } = body
    
    console.log('Generate landing page request:', { prompt, business_name })
    
    // For testing, we'll use the Blue Karma business ID
    const business_id = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    
    // Get OpenAI settings for the business
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('setting_value')
      .eq('business_id', business_id)
      .eq('setting_key', 'openai')
      .maybeSingle()
    
    console.log('OpenAI settings query:', { settings, settingsError })
    
    if (settingsError) {
      console.error('Settings error:', settingsError)
      // Generate mock HTML when can't fetch settings
      const mockHtml = generateMockHTML(prompt, business_name, logo_url, background_image_url)
      
      return NextResponse.json({ 
        data: { 
          html: mockHtml,
          message: 'Generated with mock data (Settings not accessible)'
        }, 
        error: null 
      })
    }
    
    const openaiConfig = settings?.setting_value
    console.log('OpenAI config:', { enabled: openaiConfig?.enabled, hasApiKey: !!openaiConfig?.api_key })
    
    if (!openaiConfig?.enabled || !openaiConfig?.api_key) {
      // Generate mock HTML when OpenAI not configured
      const mockHtml = generateMockHTML(prompt, business_name, logo_url, background_image_url)
      
      return NextResponse.json({ 
        data: { 
          html: mockHtml,
          message: 'Generated with mock data (OpenAI not configured)'
        }, 
        error: null 
      })
    }
    
    // Use real OpenAI API
    try {
      const openai = new OpenAI({
        apiKey: openaiConfig.api_key,
      })

      const systemPrompt = `You are an expert web developer and designer. Generate a complete, production-ready HTML landing page based on the user's requirements. The page should be:

1. Fully responsive and mobile-optimized
2. Include modern CSS styling with gradients, shadows, and animations
3. Have a compelling hero section with the provided background image
4. Include the business logo if provided
5. Feature a signup form with the requested fields (full name, email, phone at minimum)
6. Add trust indicators and feature highlights
7. Include proper JavaScript for form handling
8. Use the Inter font family
9. Be visually appealing with good UX principles

Always include:
- Proper DOCTYPE and meta tags
- Responsive design
- Form validation
- Modern CSS styling
- Professional appearance

Return ONLY the complete HTML code, no explanations.`

      // Sanitize text to remove problematic Unicode characters
      const sanitizeText = (text: string) => {
        return text
          .replace(/[\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F]/g, ' ') // Remove special unicode spaces and punctuation
          .replace(/[^\x00-\xFF]/g, ' ') // Remove any non-Latin characters that might cause encoding issues
          .replace(/\s+/g, ' ') // Normalize multiple spaces
          .trim()
      }

      const sanitizedPrompt = sanitizeText(prompt)
      const sanitizedBusinessName = sanitizeText(business_name)

      const userPrompt = `Business: ${sanitizedBusinessName}
${logo_url ? `Logo URL: ${logo_url}` : 'No logo provided'}
${background_image_url ? `Background Image URL: ${background_image_url}` : 'No background image provided'}

User Requirements: ${sanitizedPrompt}`

      // Handle model fallback since GPT-5 might not be available yet
      let modelToUse = openaiConfig.model
      if (openaiConfig.model === 'gpt-5-mini' || openaiConfig.model === 'gpt-5') {
        modelToUse = 'gpt-4o-mini' // Fallback to available model
        console.log(`Falling back from ${openaiConfig.model} to ${modelToUse}`)
      }

      console.log('Calling OpenAI with model:', modelToUse)
      console.log('Sanitized prompt length:', sanitizedPrompt.length)
      console.log('Original prompt chars at 170-175:', prompt.slice(170, 175).split('').map(c => c.charCodeAt(0)))

      const completion = await openai.chat.completions.create({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      })

      const generatedHtml = completion.choices[0]?.message?.content

      if (!generatedHtml) {
        throw new Error('OpenAI returned empty response')
      }

      return NextResponse.json({ 
        data: { 
          html: generatedHtml,
          message: `Generated with ${openaiConfig.model}`
        }, 
        error: null 
      })

    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError)
      
      // Fall back to mock HTML if OpenAI fails
      const mockHtml = generateMockHTML(prompt, business_name, logo_url, background_image_url)
      
      return NextResponse.json({ 
        data: { 
          html: mockHtml,
          message: `OpenAI failed, generated with mock data. Error: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`
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

function generateMockHTML(prompt: string, businessName: string, logoUrl?: string, backgroundImageUrl?: string): string {
  // Extract key information from prompt for better mock generation
  const isPriceMatch = prompt.match(/\$(\d+(?:\.\d{2})?)/g)
  const price = isPriceMatch ? isPriceMatch[0] : '$49.99'
  
  const isWineClub = prompt.toLowerCase().includes('wine')
  const isMembership = prompt.toLowerCase().includes('membership')
  const isSubscription = prompt.toLowerCase().includes('month')
  
  const defaultBackground = backgroundImageUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" fill="%23667eea"><rect width="100%" height="100%"/></svg>'
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessName} - ${isWineClub ? 'Wine Club' : isMembership ? 'Membership' : 'Sign Up'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .hero {
            background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${defaultBackground}');
            background-size: cover;
            background-position: center;
            min-height: 100vh;
            display: flex;
            align-items: center;
            color: white;
            text-align: center;
            padding: 20px;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            width: 100%;
        }
        .logo { 
            max-width: 150px; 
            margin-bottom: 30px;
            ${logoUrl ? '' : 'display: none;'}
        }
        h1 { 
            font-size: 3rem; 
            font-weight: 700;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .subtitle {
            font-size: 1.5rem;
            margin-bottom: 40px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        .signup-form {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin: 40px auto;
            max-width: 500px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            color: #333;
        }
        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #555;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        .price {
            font-size: 2rem;
            font-weight: 700;
            color: #667eea;
            margin: 20px 0;
        }
        .cta-button {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 16px 40px;
            border: none;
            border-radius: 8px;
            font-size: 1.2rem;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: transform 0.2s;
        }
        .cta-button:hover { 
            transform: translateY(-2px); 
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .feature {
            text-align: center;
            padding: 20px;
        }
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 15px;
        }
        .trust-badges {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin-top: 20px;
            font-size: 0.9rem;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="hero">
        <div class="container">
            ${logoUrl ? `<img src="${logoUrl}" alt="${businessName}" class="logo">` : ''}
            <h1>${isWineClub ? 'Join Our Exclusive Wine Club' : isMembership ? `Join ${businessName} Membership` : `Welcome to ${businessName}`}</h1>
            <p class="subtitle">${isWineClub ? 'Curated selections of premium wines delivered monthly' : isMembership ? 'Unlock exclusive benefits and rewards' : 'Experience something special'}</p>
            
            <div class="signup-form">
                <h3 style="margin-bottom: 20px; text-align: center;">${isSubscription ? 'Start Your Journey' : 'Sign Up Today'}</h3>
                <div class="price">${price}${isSubscription ? '/month' : ''}</div>
                
                <form>
                    <div class="form-group">
                        <label for="fullName">Full Name</label>
                        <input type="text" id="fullName" name="fullName" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone Number</label>
                        <input type="tel" id="phone" name="phone" required>
                    </div>
                    <button type="submit" class="cta-button">Join Now & Pay ${price}</button>
                </form>
                
                <div class="features">
                    <div class="feature">
                        <div class="feature-icon">${isWineClub ? '🍷' : '✨'}</div>
                        <h4>${isWineClub ? 'Premium Selection' : 'Exclusive Access'}</h4>
                        <p>${isWineClub ? 'Hand-picked wines from award-winning vineyards' : 'Member-only perks and benefits'}</p>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">${isWineClub ? '🚚' : '🎁'}</div>
                        <h4>${isWineClub ? 'Free Delivery' : 'Special Rewards'}</h4>
                        <p>${isWineClub ? 'Delivered right to your door every month' : 'Earn points and redeem rewards'}</p>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">${isWineClub ? '📚' : '💫'}</div>
                        <h4>${isWineClub ? 'Tasting Notes' : 'VIP Treatment'}</h4>
                        <p>${isWineClub ? 'Detailed guides and pairing suggestions' : 'Priority service and support'}</p>
                    </div>
                </div>
                
                <div class="trust-badges">
                    <span>🔒 Secure Payment</span>
                    <span>📱 Mobile Wallet Pass</span>
                    <span>✅ Cancel Anytime</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Handle form submission
        document.querySelector('form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            // Here you would normally send to your backend
            console.log('Form submitted:', data);
            
            // Show success message
            alert('Welcome to ${businessName}! Your mobile wallet pass will be sent to your email shortly.');
        });
    </script>
</body>
</html>`
}
