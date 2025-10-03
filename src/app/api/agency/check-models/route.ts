import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get agency account
    const { data: agencyAccountId, error: agencyError } = await supabase.rpc('get_or_create_agency_account')
    
    if (agencyError) {
      return NextResponse.json({ error: 'Failed to get agency account' }, { status: 500 })
    }

    // Get OpenRouter settings
    const { data: settings } = await supabase
      .from('agency_settings')
      .select('setting_value')
      .eq('agency_account_id', agencyAccountId)
      .eq('setting_key', 'openrouter')
      .single()

    const openRouterApiKey = settings?.setting_value?.api_key

    if (!openRouterApiKey) {
      return NextResponse.json({ 
        error: 'OpenRouter API key not configured'
      })
    }

    // Get available models from OpenRouter
    const modelsResponse = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
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
    
    // Filter for Anthropic models
    const anthropicModels = modelsData.data?.filter((model: any) => 
      model.id?.startsWith('anthropic/')
    ) || []

    // Filter for other common models
    const otherModels = modelsData.data?.filter((model: any) => 
      model.id?.includes('claude') || 
      model.id?.includes('gpt') || 
      model.id?.includes('llama')
    ) || []

    return NextResponse.json({
      total_models: modelsData.data?.length || 0,
      anthropic_models: anthropicModels.map((m: any) => ({
        id: m.id,
        name: m.name,
        context_length: m.context_length
      })),
      other_models: otherModels.slice(0, 10).map((m: any) => ({
        id: m.id,
        name: m.name,
        context_length: m.context_length
      })),
      current_model: settings?.setting_value?.model || 'anthropic/claude-3.5-sonnet'
    })

  } catch (error) {
    return NextResponse.json({ 
      error: `Error checking models: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}
