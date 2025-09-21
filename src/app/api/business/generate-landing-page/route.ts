import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface LandingPageRequest {
  programData: any
  businessId: string
  templateId: string
  programId: string
  screenshot?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { programData, businessId, templateId, programId, screenshot }: LandingPageRequest = await request.json()

    console.log('Generating landing page for program:', programData.templateName)

    // Get OpenRouter settings for Claude-powered generation
    const { data: businessSettings } = await supabase
      .from('business_settings')
      .select('setting_value')
      .eq('setting_key', 'openrouter')
      .limit(1)
      .single()

    if (!businessSettings?.setting_value?.api_key) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 400 })
    }

    const openRouterApiKey = businessSettings.setting_value.api_key

    // Generate landing page using Claude or fallback to static HTML
    let landingPageHtml: string
    const landingPageData = {
      // Basic Info
      programName: programData.templateName,
      organizationName: programData.organizationName,
      businessType: programData.businessType || 'business',
      
      // Hero Section
      heroTitle: `Join ${programData.templateName}`,
      heroSubtitle: programData.description || `Welcome to ${programData.organizationName}'s exclusive loyalty program`,
      heroImage: programData.stripImageUrl || programData.logoUrl || '/images/default-hero.jpg',
      
      // Welcome Offer
      welcomeOffer: {
        title: 'Welcome Offer',
        description: programData.frontFields?.secondaryField?.value || programData.welcomeIncentive,
        highlight: true
      },
      
      // Benefits Section
      benefits: [
        {
          title: 'Instant Rewards',
          description: programData.frontFields?.secondaryField?.value || 'Get rewarded from your first visit',
          icon: '🎁'
        },
        {
          title: 'Easy to Use',
          description: 'Save to Apple Wallet and start earning instantly',
          icon: '📱'
        },
        {
          title: 'Exclusive Perks',
          description: 'Access member-only offers and experiences',
          icon: '⭐'
        },
        {
          title: 'Points System',
          description: `Earn ${programData.frontFields?.headerField?.label || 'points'} with every visit`,
          icon: '💰'
        }
      ],
      
      // How It Works
      howItWorks: [
        {
          step: 1,
          title: 'Join the Program',
          description: 'Sign up instantly with your name, email, and phone'
        },
        {
          step: 2,
          title: 'Save to Wallet',
          description: 'Add your loyalty card to Apple Wallet for easy access'
        },
        {
          step: 3,
          title: 'Start Earning',
          description: `Earn ${programData.frontFields?.headerField?.label || 'points'} and enjoy exclusive rewards`
        }
      ],
      
      // Call to Action
      ctaButton: {
        text: 'Join Now & Get Your Welcome Offer',
        action: 'signup',
        highlight: true
      },
      
      // Design/Branding
      branding: {
        primaryColor: programData.textColor || '#3862EA',
        backgroundColor: programData.backgroundColor || '#FFFFFF',
        logoUrl: programData.logoUrl || '/images/default-logo.png',
        font: 'Inter, sans-serif'
      },
      
      // Form Data Capture (matches program requirements)
      formFields: programData.backFields?.map((field: any) => ({
        name: field.label.toLowerCase().replace(/\s+/g, '_'),
        label: field.label,
        type: field.label.toLowerCase().includes('email') ? 'email' : 
              field.label.toLowerCase().includes('phone') ? 'tel' : 'text',
        required: true,
        placeholder: field.placeholder
      })) || [
        { name: 'first_name', label: 'First Name', type: 'text', required: true },
        { name: 'last_name', label: 'Last Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true }
      ],
      
      // SEO
      meta: {
        title: `${programData.templateName} - Join ${programData.organizationName}'s Loyalty Program`,
        description: `Join ${programData.templateName} and get ${programData.welcomeIncentive}. Earn rewards with every visit to ${programData.organizationName}.`,
        keywords: `loyalty program, rewards, ${programData.organizationName}, ${programData.businessType}, membership`
      },
      
      // Technical Integration
      integration: {
        templateId: templateId,
        programId: programId,
        businessId: businessId,
        passTypeId: programData.passTypeId || 'pass.come.globalwalletpush',
        memberIdPrefix: programData.memberIdPrefix || 'MB'
      }
    }

    // Generate landing page HTML using Claude if screenshot available, otherwise use static template
    if (screenshot) {
      console.log('🎨 Generating custom landing page with Claude using website screenshot...')
      console.log('📸 Screenshot URL:', screenshot)
      
      // CRITICAL: Prevent sending base64 data which costs massive tokens!
      if (screenshot.startsWith('data:image/') || screenshot.includes('base64')) {
        console.error('❌ BLOCKED: Screenshot is base64 data, not URL! This would cost $100+ in tokens!')
        console.log('🔄 Falling back to static template to prevent token explosion')
        landingPageHtml = generateLandingPageHtml(landingPageData)
        
        const response = {
          success: true,
          message: `Landing page for "${programData.templateName}" generated successfully! (Static template used - screenshot was base64 data)`,
          landingPageId: null,
          landingPageData: landingPageData,
          htmlContent: landingPageHtml,
          previewUrl: `/business/distribution/preview?program=${programId}`,
          publishUrl: `/programs/${programId}/join`
        }
        return NextResponse.json(response)
      }
      
      const claudePrompt = `Create a loyalty program landing page that matches the visual style of the provided screenshot.

PROGRAM: ${landingPageData.programName} for ${landingPageData.organizationName}
CONTENT: Hero "${landingPageData.heroTitle}", offer "${landingPageData.welcomeOffer.description}", 4 benefits, 3-step process, signup form
DESIGN: Match screenshot colors, typography, spacing. Include logo: ${landingPageData.branding.logoUrl}

Generate complete HTML with inline CSS only. No explanations.`

      try {
        const claudeResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'X-Title': 'WalletPush Landing Page Generator'
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3.5-sonnet',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: claudePrompt
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: screenshot
                    }
                  }
                ]
              }
            ],
            temperature: 0.3,
            max_tokens: 2000
          })
        })

        if (claudeResponse.ok) {
          const claudeResult = await claudeResponse.json()
          
          // Log token usage to track costs
          const usage = claudeResult.usage
          if (usage) {
            console.log('💰 Claude Token Usage:')
            console.log(`   Input tokens: ${usage.prompt_tokens}`)
            console.log(`   Output tokens: ${usage.completion_tokens}`)
            console.log(`   Total tokens: ${usage.total_tokens}`)
            
            // Rough cost calculation (Claude 3.5 Sonnet rates)
            const inputCost = (usage.prompt_tokens / 1000) * 0.003  // $3 per 1K input tokens
            const outputCost = (usage.completion_tokens / 1000) * 0.015  // $15 per 1K output tokens
            const totalCost = inputCost + outputCost
            console.log(`   Estimated cost: $${totalCost.toFixed(4)}`)
            
            if (totalCost > 1.0) {
              console.warn(`⚠️ HIGH COST ALERT: This request cost $${totalCost.toFixed(2)}!`)
            }
          }
          
          landingPageHtml = claudeResult.choices[0]?.message?.content || generateLandingPageHtml(landingPageData)
          console.log('✅ Custom landing page generated with Claude')
        } else {
          console.warn('⚠️ Claude generation failed, using static template')
          const errorData = await claudeResponse.json()
          console.error('Claude error:', errorData)
          landingPageHtml = generateLandingPageHtml(landingPageData)
        }
      } catch (error) {
        console.warn('⚠️ Claude generation error, using static template:', error)
        landingPageHtml = generateLandingPageHtml(landingPageData)
      }
    } else {
      console.log('📄 Generating static landing page (no screenshot available)')
      landingPageHtml = generateLandingPageHtml(landingPageData)
    }

    // Save landing page configuration to database (optional)
    const { data: savedLandingPage, error: saveError } = await supabase
      .from('landing_pages')
      .insert({
        program_id: programId,
        business_id: businessId,
        name: `${programData.templateName} Landing Page`,
        custom_url: `${programData.templateName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.walletpush.local`,
        ai_prompt: `AI generated landing page for ${programData.templateName} program`,
        generated_html: landingPageHtml,
        is_published: true
      })
      .select()
      .single()

    if (saveError) {
      console.warn('Failed to save landing page to database:', saveError)
      // Continue without saving - not critical
    }

    const response = {
      success: true,
      message: `Landing page for "${programData.templateName}" generated successfully!`,
      landingPageId: savedLandingPage?.id || null,
      landingPageData: landingPageData,
      htmlContent: landingPageHtml,
      previewUrl: `/business/distribution/preview?program=${programId}`,
      publishUrl: `/programs/${programId}/join`
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Landing page generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate landing page',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function generateLandingPageHtml(data: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.meta.title}</title>
    <meta name="description" content="${data.meta.description}">
    <meta name="keywords" content="${data.meta.keywords}">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            color: #1a202c; 
            line-height: 1.7;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Hero Section */
        .hero { 
            padding: 120px 0;
            text-align: center;
            background: linear-gradient(135deg, ${data.branding.primaryColor}08, ${data.branding.primaryColor}03);
        }
        .hero-content {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
        }
        .hero h1 { 
            font-size: clamp(3rem, 6vw, 5rem); 
            font-weight: 700; 
            margin-bottom: 30px; 
            color: #1a202c;
            letter-spacing: -0.02em;
        }
        .hero p { 
            font-size: 1.3rem; 
            margin-bottom: 50px; 
            color: #4a5568;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        .hero img { 
            max-width: 350px; 
            margin: 40px 0; 
            border-radius: 16px; 
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            transition: transform 0.3s ease;
        }
        .hero img:hover {
            transform: translateY(-8px);
        }
        
        /* Welcome Offer */
        .offer { 
            background: ${data.branding.primaryColor}; 
            color: white; 
            padding: 100px 0; 
            text-align: center;
        }
        .offer-content {
            max-width: 800px;
            margin: 0 auto;
        }
        .offer h2 { 
            font-size: 3rem; 
            margin-bottom: 25px; 
            font-weight: 600;
            letter-spacing: -0.02em;
        }
        .offer p { 
            font-size: 1.4rem; 
            background: rgba(255,255,255,0.15);
            padding: 25px 50px;
            border-radius: 60px;
            display: inline-block;
            border: 1px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
        }
        
        /* Benefits Grid */
        .benefits { 
            padding: 100px 0; 
            background: #ffffff;
        }
        .benefits h2 { 
            text-align: center; 
            font-size: 2.8rem; 
            margin-bottom: 70px; 
            color: #1a202c;
            font-weight: 600;
            letter-spacing: -0.02em;
        }
        .benefits-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
            gap: 40px; 
        }
        .benefit { 
            text-align: center; 
            padding: 50px 35px; 
            border-radius: 20px; 
            background: white; 
            border: 1px solid #e2e8f0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
        }
        .benefit:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }
        .benefit .icon { 
            font-size: 3rem; 
            margin-bottom: 25px; 
            color: ${data.branding.primaryColor};
        }
        .benefit h3 { 
            font-size: 1.4rem; 
            margin-bottom: 15px; 
            color: #1a202c;
            font-weight: 600;
        }
        .benefit p {
            color: #4a5568;
            font-size: 1rem;
            line-height: 1.6;
        }
        
        /* How It Works */
        .how-it-works { background: #f8f9fa; padding: 80px 0; }
        .how-it-works h2 { text-align: center; font-size: 2.5rem; margin-bottom: 60px; }
        .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; }
        .step { text-align: center; }
        .step-number { 
            width: 60px; height: 60px; 
            background: ${data.branding.primaryColor}; 
            color: white; 
            border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; 
            font-size: 1.5rem; font-weight: bold; 
            margin: 0 auto 20px; 
        }
        
        /* CTA Section */
        .cta { 
            background: ${data.branding.primaryColor}; 
            color: white; 
            padding: 80px 0; 
            text-align: center; 
        }
        .cta h2 { font-size: 2.5rem; margin-bottom: 20px; }
        .cta-button { 
            display: inline-block; 
            background: white; 
            color: ${data.branding.primaryColor}; 
            padding: 20px 40px; 
            border-radius: 10px; 
            text-decoration: none; 
            font-size: 1.2rem; 
            font-weight: 600; 
            margin-top: 30px;
            transition: transform 0.2s;
        }
        .cta-button:hover { transform: translateY(-2px); }
        
        /* Form */
        .signup-form { max-width: 400px; margin: 40px auto 0; }
        .form-group { margin-bottom: 20px; }
        .form-group input { 
            width: 100%; 
            padding: 15px; 
            border: 2px solid white; 
            border-radius: 8px; 
            font-size: 1rem;
        }
        .submit-btn { 
            width: 100%; 
            background: white; 
            color: ${data.branding.primaryColor}; 
            border: none; 
            padding: 18px; 
            border-radius: 8px; 
            font-size: 1.1rem; 
            font-weight: 600; 
            cursor: pointer;
        }
        
        @media (max-width: 768px) {
            .hero h1 { font-size: 2rem; }
            .offer h2, .benefits h2, .how-it-works h2, .cta h2 { font-size: 2rem; }
        }
    </style>
</head>
<body>
    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-content">
            ${data.branding.logoUrl ? `<img src="${data.branding.logoUrl}" alt="${data.organizationName} Logo">` : ''}
            <h1>${data.heroTitle}</h1>
            <p>${data.heroSubtitle}</p>
        </div>
    </section>

    <!-- Welcome Offer -->
    <section class="offer">
        <div class="container">
            <div class="offer-content">
                <h2>${data.welcomeOffer.title}</h2>
                <p>${data.welcomeOffer.description}</p>
            </div>
        </div>
    </section>

    <!-- Benefits -->
    <section class="benefits">
        <div class="container">
            <h2>Why Join ${data.programName}?</h2>
            <div class="benefits-grid">
                ${data.benefits.map((benefit: any) => `
                    <div class="benefit">
                        <div class="icon">${benefit.icon}</div>
                        <h3>${benefit.title}</h3>
                        <p>${benefit.description}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- How It Works -->
    <section class="how-it-works">
        <div class="container">
            <h2>How It Works</h2>
            <div class="steps">
                ${data.howItWorks.map((step: any) => `
                    <div class="step">
                        <div class="step-number">${step.step}</div>
                        <h3>${step.title}</h3>
                        <p>${step.description}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Call to Action -->
    <section class="cta">
        <div class="container">
            <h2>Ready to Join?</h2>
            <p>Start earning rewards today with ${data.programName}</p>
            
            <form class="signup-form" action="/api/members/signup" method="POST">
                <input type="hidden" name="program_id" value="${data.integration.programId}">
                <input type="hidden" name="template_id" value="${data.integration.templateId}">
                
                ${data.formFields.map((field: any) => `
                    <div class="form-group">
                        <input 
                            type="${field.type}" 
                            name="${field.name}" 
                            placeholder="${field.label}" 
                            required="${field.required}"
                        >
                    </div>
                `).join('')}
                
                <button type="submit" class="submit-btn">
                    ${data.ctaButton.text}
                </button>
            </form>
        </div>
    </section>
</body>
</html>`
}
