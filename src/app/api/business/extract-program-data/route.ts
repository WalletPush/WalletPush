import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationHistory, websiteUrl, visualAssets, screenshot } = await request.json()

    // Get business through account_members → accounts → businesses chain
    const { data: userAccounts, error: accountsError } = await supabase
      .from('account_members')
      .select(`
        account_id,
        accounts!inner (
          id,
          type
        )
      `)
      .eq('user_id', user.id)
      .eq('accounts.type', 'business')
      .limit(1)
      .single()

    if (accountsError || !userAccounts) {
      return NextResponse.json({ error: 'No business account found for this user' }, { status: 404 })
    }

    const businessId = userAccounts.account_id

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

    // Prepare conversation text for Claude
    const conversationText = conversationHistory
      .map((msg: Message) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n')

    // Create BULLETPROOF extraction prompt for Claude
    const extractionPrompt = `RESPOND WITH ONLY JSON. NO EXPLANATIONS. NO HTML. NO MARKDOWN.

Analyze this conversation and extract program details:

${conversationText}

Website: ${websiteUrl}
Business: ${visualAssets?.businessInfo?.name || 'Unknown'}
Location: ${visualAssets?.businessInfo?.location || 'Unknown'}
Colors: ${visualAssets?.brandColors?.join(', ') || '#000000'}
Logos: ${visualAssets?.logos?.slice(0, 2).join(', ') || 'None'}
Images: ${visualAssets?.heroImages?.slice(0, 2).join(', ') || 'None'}

RETURN ONLY THIS JSON STRUCTURE:
{
  "programName": "exact program name from conversation",
  "organizationName": "business name",
  "programDescription": "Welcome to our [program name]",
  "welcomeIncentive": "exact incentive offer from conversation",
  "programType": "store_card",
  "businessType": "restaurant",
  "primaryBrandColor": "#000000",
  "bestLogoUrl": "first available logo URL or empty string",
  "bestStripImageUrl": "first available image URL or empty string", 
  "memberIdPrefix": "2 letters from program name",
  "extractionConfidence": "high",
  "passFieldLabels": {
    "pointsLabel": "Points",
    "incentiveLabel": "Welcome Offer"
  }
}

CRITICAL: Respond with ONLY the JSON object above. No other text.`

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'WalletPush AI Copilot - Program Extraction'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: screenshot ? [
              {
                type: 'text',
                text: extractionPrompt + '\n\nADDITIONAL: I\'ve included their website screenshot. When generating landing pages later, match this exact visual style - colors, typography, layout patterns, and overall aesthetic.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: screenshot
                }
              }
            ] : extractionPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const result = await response.json()
    const extractedText = result.choices[0]?.message?.content

    if (!extractedText) {
      throw new Error('No response from Claude')
    }

    console.log('Raw Claude response:', extractedText.substring(0, 500) + '...')

    // Parse the JSON response with robust error handling
    let extractedData
    try {
      // First try direct parsing
      extractedData = JSON.parse(extractedText)
    } catch (error) {
      console.log('Direct JSON parse failed, trying extraction...')
      
      // Try to extract JSON from the response (handles Claude adding extra text)
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          extractedData = JSON.parse(jsonMatch[0])
          console.log('JSON extraction successful')
        } catch (secondError) {
          console.error('JSON extraction also failed:', secondError)
          throw new Error(`Invalid JSON from Claude. Response: ${extractedText.substring(0, 200)}...`)
        }
      } else {
        console.error('No JSON found in response:', extractedText.substring(0, 200))
        throw new Error(`No JSON found in Claude response: ${extractedText.substring(0, 200)}...`)
      }
    }

    // Generate random 4-digit member ID
    const memberIdNumber = Math.floor(1000 + Math.random() * 9000)
    const memberIdPrefix = extractedData.memberIdPrefix || 'MB'
    const defaultMemberId = `${memberIdPrefix}${memberIdNumber}`

    // Enhance with ALL data needed for pass generation
    const programData = {
      ...extractedData,
      
      // Pass Template Data
      templateName: extractedData.programName,
      organizationName: extractedData.organizationName,
      description: extractedData.programDescription,
      
      // Default Member ID
      defaultMemberId: defaultMemberId,
      
      // Pass Design
      backgroundColor: '#FFFFFF', // Always white background for safety
      textColor: extractedData.primaryBrandColor || '#000000',
      iconUrl: '/ai-copilot-assets/default-icon.png', // Always use W icon
      
      // Asset URLs (will be downloaded)
      logoUrl: extractedData.bestLogoUrl,
      stripImageUrl: extractedData.bestStripImageUrl,
      
      // Pass Fields Configuration
      frontFields: {
        headerField: {
          label: extractedData.passFieldLabels?.pointsLabel || 'Points',
          placeholder: '${Points}',
          defaultValue: '0'
        },
        primaryField: null, // No primary field as per requirements
        secondaryField: {
          label: extractedData.passFieldLabels?.incentiveLabel || 'Welcome Offer',
          placeholder: '${Current_Offer}',
          value: extractedData.welcomeIncentive
        }
      },
      
      // Barcode Configuration
      barcode: {
        type: 'QR',
        content: '${MEMBER_ID}',
        altText: '${MEMBER_ID}'
      },
      
      // Back Fields Configuration
      backFields: [
        { label: 'First Name', placeholder: '${First_Name}' },
        { label: 'Last Name', placeholder: '${Last_Name}' },
        { label: 'Email', placeholder: '${Email}' },
        { label: 'Phone', placeholder: '${Phone}' }
      ],
      
      // Standard data capture
      dataCapture: ['name', 'email', 'phone'],
      tierStructure: 'visit-based',
      
      // Business info for reference
      businessInfo: {
        name: extractedData.organizationName,
        type: extractedData.businessType,
        location: visualAssets?.businessInfo?.location || 'Location',
        websiteUrl: websiteUrl || ''
      }
    }

    console.log('🤖 Claude extracted program data:', programData)

    // Download assets for this program
    let downloadedAssets = null
    console.log('🖼️ Visual assets check:', {
      hasVisualAssets: !!visualAssets,
      logosCount: visualAssets?.logos?.length || 0,
      heroImagesCount: visualAssets?.heroImages?.length || 0,
      logos: visualAssets?.logos?.slice(0, 2) || [],
      heroImages: visualAssets?.heroImages?.slice(0, 2) || []
    })
    
    // ALWAYS try to download assets if we have URLs from Claude extraction
    const hasClaudeAssets = extractedData.bestLogoUrl !== 'None' || extractedData.bestStripImageUrl !== 'None'
    const hasFirecrawlAssets = (visualAssets?.logos?.length > 0 || visualAssets?.heroImages?.length > 0)
    
    console.log('🎯 Asset download decision:', {
      hasClaudeAssets,
      hasFirecrawlAssets,
      bestLogoUrl: extractedData.bestLogoUrl,
      bestStripImageUrl: extractedData.bestStripImageUrl
    })
    
    if (hasFirecrawlAssets || hasClaudeAssets) {
      try {
        console.log('🚀 Triggering asset download...')
        const assetResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/business/download-assets`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
            // No auth header needed for internal API call
          },
          body: JSON.stringify({
            businessId: businessId,
            programName: extractedData.programName,
            logoUrls: [
              ...(visualAssets?.logos || []),
              ...(extractedData.bestLogoUrl !== 'None' ? [extractedData.bestLogoUrl] : [])
            ].filter((url, index, arr) => arr.indexOf(url) === index), // Remove duplicates
            heroImageUrls: [
              ...(visualAssets?.heroImages || []),
              ...(extractedData.bestStripImageUrl !== 'None' ? [extractedData.bestStripImageUrl] : [])
            ].filter((url, index, arr) => arr.indexOf(url) === index) // Remove duplicates
          })
        })

        if (assetResponse.ok) {
          downloadedAssets = await assetResponse.json()
          console.log('Assets downloaded successfully:', downloadedAssets.message)
          
          // Update program data with downloaded asset paths
          programData.logoUrl = downloadedAssets.passAssets.logoUrl
          programData.stripImageUrl = downloadedAssets.passAssets.stripImageUrl
          programData.allDownloadedAssets = downloadedAssets
        } else {
          console.error('Asset download failed:', await assetResponse.text())
        }
      } catch (error) {
        console.error('Asset download error:', error)
        // Continue without assets - use defaults
      }
    }

    return NextResponse.json({ 
      success: true,
      programData,
      confidence: extractedData.extractionConfidence,
      assetsDownloaded: downloadedAssets ? true : false,
      downloadSummary: downloadedAssets?.message || 'No assets to download'
    })

  } catch (error) {
    console.error('Program extraction error:', error)
    return NextResponse.json({ 
      error: 'Failed to extract program data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
