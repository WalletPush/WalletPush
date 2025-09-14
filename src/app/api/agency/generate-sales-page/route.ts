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

    const body = await request.json()
    const { wizardData } = body

    console.log('🚀 Generate sales page request:', { 
      headline: wizardData.headline,
      subHeadline: wizardData.subHeadline,
      keyBenefits: wizardData.keyBenefits?.length,
      howItWorks: wizardData.howItWorks?.length,
      selectedPackages: wizardData.selectedPackages?.length
    })

    // Get or create agency account using our helper function
    const { data: agencyAccountId, error: agencyError } = await supabase
      .rpc('get_or_create_agency_account')

    if (agencyError || !agencyAccountId) {
      console.error('Agency account error:', agencyError)
      return NextResponse.json({ error: 'Failed to get agency account' }, { status: 500 })
    }

    console.log('🏢 Using agency account:', agencyAccountId)

    // Get OpenRouter settings from agency_settings table
    const { data: settings, error: settingsError } = await supabase
      .from('agency_settings')
      .select('setting_value')
      .eq('agency_account_id', agencyAccountId)
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
      const mockHtml = generateMockSalesPageHTML(wizardData)
      
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
      const systemPrompt = `You are an expert sales page copywriter and web developer. You create high-converting sales pages that drive results.

Your task is to generate a complete, modern, responsive HTML sales page based on the provided information.

REQUIREMENTS:
1. Use modern, clean design with excellent typography
2. Make it mobile-responsive with Tailwind CSS
3. Include compelling copy that converts
4. Use the exact headline, sub-headline, benefits, and pricing provided
5. Create a professional layout with proper spacing and visual hierarchy
6. Include call-to-action buttons that stand out
7. Use the "How It Works" section to build trust
8. Include the risk reversal elements to reduce friction
9. Make the pricing table the focal point with clear value proposition

STRUCTURE:
- Hero section with headline, sub-headline, and primary CTA
- Key benefits section with icons/visuals
- How it works (3-step process)
- Pricing table (highlight the popular option)
- Risk reversal/reassurance section
- Final CTA section

STYLE:
- Modern, professional design
- Use gradients and shadows for depth
- Excellent contrast and readability
- Mobile-first responsive design
- Fast loading and optimized

Return ONLY the complete HTML code, no explanations or markdown formatting.`

      const userPrompt = `Generate a high-converting sales page with this information:

HEADLINE (H1): ${wizardData.headline}
SUB-HEADLINE (H2): ${wizardData.subHeadline}

KEY BENEFITS:
${wizardData.keyBenefits?.filter(b => b.trim()).map((benefit, i) => `${i + 1}. ${benefit}`).join('\n') || 'No benefits provided'}

HOW IT WORKS:
${wizardData.howItWorks?.map(step => `Step ${step.step}: ${step.title} - ${step.description}`).join('\n') || 'No steps provided'}

PRICING PACKAGES:
${wizardData.selectedPackages?.map(pkg => `
${pkg.name} - $${pkg.price}/month ${pkg.isPopular ? '(MOST POPULAR)' : ''}
${pkg.description}
- ${pkg.passLimit.toLocaleString()} passes
- ${pkg.programLimit} programs
- ${pkg.staffLimit === -1 ? 'Unlimited' : pkg.staffLimit} staff
Features: ${pkg.features.join(', ')}
`).join('\n') || 'No packages provided'}

RISK REVERSAL/REASSURANCE:
${wizardData.riskReversal?.filter(r => r.trim()).map((item, i) => `• ${item}`).join('\n') || 'No risk reversal provided'}

BRANDING:
${wizardData.logo ? `Logo URL: ${wizardData.logo}` : 'No logo provided'}
${wizardData.backgroundImage ? `Hero Image URL: ${wizardData.backgroundImage}` : 'No hero image provided'}

PAGE INFO:
Title: ${wizardData.pageTitle}
Description: ${wizardData.pageDescription}

Generate a complete, professional sales page that converts visitors into customers.`

      console.log('🤖 Calling OpenRouter API...')
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterConfig.api_key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://walletpush.com',
          'X-Title': 'WalletPush Agency Portal'
        },
        body: JSON.stringify({
          model: openrouterConfig.model || 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 8000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ OpenRouter API error:', response.status, errorData)
        
        let errorMessage = 'AI generation failed'
        if (response.status === 401) {
          errorMessage = 'Invalid OpenRouter API key'
        } else if (response.status === 402) {
          errorMessage = 'Insufficient OpenRouter credits'
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded'
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message
        }
        
        // Fallback to mock HTML
        const mockHtml = generateMockSalesPageHTML(wizardData)
        return NextResponse.json({ 
          data: { 
            html: mockHtml,
            message: `${errorMessage} - Generated with mock data`
          }, 
          error: null 
        })
      }

      const data = await response.json()
      const generatedHtml = data.choices?.[0]?.message?.content

      if (!generatedHtml) {
        console.error('OpenRouter returned empty response')
        const mockHtml = generateMockSalesPageHTML(wizardData)
        return NextResponse.json({ 
          data: { 
            html: mockHtml,
            message: 'AI returned empty response - Generated with mock data'
          }, 
          error: null 
        })
      }

      console.log('✅ Successfully generated sales page with OpenRouter')

      return NextResponse.json({
        data: {
          html: generatedHtml,
          message: 'Sales page generated successfully with AI'
        },
        error: null
      })

    } catch (apiError) {
      console.error('❌ OpenRouter API request failed:', apiError)
      
      // Fallback to mock HTML
      const mockHtml = generateMockSalesPageHTML(wizardData)
      return NextResponse.json({ 
        data: { 
          html: mockHtml,
          message: 'AI generation failed - Generated with mock data'
        }, 
        error: null 
      })
    }

  } catch (error) {
    console.error('❌ Generate sales page error:', error)
    return NextResponse.json(
      { data: null, error: 'Failed to generate sales page' },
      { status: 500 }
    )
  }
}

function generateMockSalesPageHTML(wizardData: any): string {
  const popularPackage = wizardData.selectedPackages?.find((pkg: any) => pkg.isPopular) || wizardData.selectedPackages?.[0]
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${wizardData.pageTitle || 'Sales Page'}</title>
    <meta name="description" content="${wizardData.pageDescription || 'Generated sales page'}">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card-shadow { box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Hero Section -->
    <section class="gradient-bg text-white py-20">
        <div class="container mx-auto px-6 text-center">
            ${wizardData.logo ? `<img src="${wizardData.logo}" alt="Logo" class="h-12 mx-auto mb-8">` : ''}
            <h1 class="text-5xl font-bold mb-6">${wizardData.headline || 'Transform Your Business Today'}</h1>
            <p class="text-xl mb-8 max-w-3xl mx-auto">${wizardData.subHeadline || 'Discover the solution that will revolutionize your business operations.'}</p>
            <button class="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
                Get Started Now
            </button>
        </div>
    </section>

    <!-- Key Benefits -->
    <section class="py-16 bg-white">
        <div class="container mx-auto px-6">
            <h2 class="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
            <div class="grid md:grid-cols-3 gap-8">
                ${wizardData.keyBenefits?.filter((b: string) => b.trim()).map((benefit: string, i: number) => `
                <div class="text-center p-6">
                    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-2xl font-bold text-blue-600">${i + 1}</span>
                    </div>
                    <h3 class="text-xl font-semibold mb-2">Benefit ${i + 1}</h3>
                    <p class="text-gray-600">${benefit}</p>
                </div>
                `).join('') || '<p class="text-center text-gray-500">No benefits specified</p>'}
            </div>
        </div>
    </section>

    <!-- How It Works -->
    <section class="py-16 bg-gray-50">
        <div class="container mx-auto px-6">
            <h2 class="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div class="grid md:grid-cols-3 gap-8">
                ${wizardData.howItWorks?.map((step: any) => `
                <div class="text-center">
                    <div class="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-2xl font-bold">${step.step}</span>
                    </div>
                    <h3 class="text-xl font-semibold mb-2">${step.title}</h3>
                    <p class="text-gray-600">${step.description}</p>
                </div>
                `).join('') || '<p class="text-center text-gray-500">No steps specified</p>'}
            </div>
        </div>
    </section>

    <!-- Pricing -->
    <section class="py-16 bg-white">
        <div class="container mx-auto px-6">
            <h2 class="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
            <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                ${wizardData.selectedPackages?.map((pkg: any) => `
                <div class="border-2 ${pkg.isPopular ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} rounded-xl p-6 relative card-shadow">
                    ${pkg.isPopular ? '<div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</div>' : ''}
                    <div class="text-center">
                        <h3 class="text-2xl font-bold mb-2">${pkg.name}</h3>
                        <p class="text-gray-600 mb-4">${pkg.description}</p>
                        <div class="text-4xl font-bold mb-6">$${pkg.price}<span class="text-lg text-gray-500">/month</span></div>
                        <ul class="text-left space-y-2 mb-6">
                            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>${pkg.passLimit.toLocaleString()} passes</li>
                            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>${pkg.programLimit} programs</li>
                            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>${pkg.staffLimit === -1 ? 'Unlimited' : pkg.staffLimit} staff</li>
                            ${pkg.features.map((feature: string) => `<li class="flex items-center"><span class="text-green-500 mr-2">✓</span>${feature}</li>`).join('')}
                        </ul>
                        <button class="w-full ${pkg.isPopular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} text-white py-3 rounded-lg font-semibold transition-colors">
                            Choose ${pkg.name}
                        </button>
                    </div>
                </div>
                `).join('') || '<p class="text-center text-gray-500">No packages specified</p>'}
            </div>
        </div>
    </section>

    <!-- Risk Reversal -->
    <section class="py-16 bg-gray-50">
        <div class="container mx-auto px-6 text-center">
            <h2 class="text-3xl font-bold mb-8">Your Success is Guaranteed</h2>
            <div class="max-w-2xl mx-auto">
                ${wizardData.riskReversal?.filter((r: string) => r.trim()).map((item: string) => `
                <div class="flex items-center justify-center mb-4">
                    <span class="text-green-500 mr-3">✓</span>
                    <span class="text-lg">${item}</span>
                </div>
                `).join('') || '<p class="text-gray-500">No guarantees specified</p>'}
            </div>
        </div>
    </section>

    <!-- Final CTA -->
    <section class="gradient-bg text-white py-16">
        <div class="container mx-auto px-6 text-center">
            <h2 class="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p class="text-xl mb-8">Join thousands of satisfied customers today</p>
            <button class="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
                Start Your Journey Now
            </button>
        </div>
    </section>
</body>
</html>`
}
