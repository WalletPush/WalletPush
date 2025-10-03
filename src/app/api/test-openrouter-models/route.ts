import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get agency account for OpenRouter settings
    const { data: agencyAccountId, error: agencyError } = await supabase.rpc('get_or_create_agency_account')
    
    if (agencyError) {
      return NextResponse.json({ 
        error: 'Failed to get agency account',
        details: agencyError.message
      })
    }

    // Get OpenRouter settings
    const { data: settings, error: settingsError } = await supabase
      .from('agency_settings')
      .select('setting_value')
      .eq('agency_account_id', agencyAccountId)
      .eq('setting_key', 'openrouter')
      .single()

    const apiKey = settings?.setting_value?.api_key
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'No OpenRouter API key configured in agency settings',
        agencyAccountId,
        settingsError: settingsError?.message
      })
    }

    // Get available models from OpenRouter
    const modelsResponse = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text()
      return NextResponse.json({ 
        error: `Failed to fetch models: ${errorText}`,
        status: modelsResponse.status
      })
    }

    const modelsData = await modelsResponse.json()
    
    // Filter for models that might work for HTML editing
    const relevantModels = modelsData.data?.filter((model: any) => 
      model.id?.includes('claude') || 
      model.id?.includes('gpt') || 
      model.id?.includes('llama') ||
      model.id?.includes('gemini')
    ) || []

    // Test a few key models
    const testModels = [
      'openai/gpt-5',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-haiku',
      'anthropic/claude-3-opus',
      'meta-llama/llama-3.1-70b-instruct'
    ]

    const availableTestModels = testModels.filter(modelId => 
      relevantModels.some((model: any) => model.id === modelId)
    )

    return NextResponse.json({
      total_models: modelsData.data?.length || 0,
      available_test_models: availableTestModels,
      all_relevant_models: relevantModels.map((m: any) => ({
        id: m.id,
        name: m.name,
        context_length: m.context_length,
        pricing: m.pricing
      })).slice(0, 20), // Limit to first 20
      gpt5_available: relevantModels.some((m: any) => m.id === 'openai/gpt-5'),
      claude_available: relevantModels.some((m: any) => m.id?.includes('claude'))
    })

  } catch (error) {
    return NextResponse.json({ 
      error: `Error checking models: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}
