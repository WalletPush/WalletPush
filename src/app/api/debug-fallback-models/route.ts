import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // This is just a static list of the fallback models we're using
  const fallbackModels = [
    'Your configured model (from settings)',
    'openai/gpt-5 (PRIMARY FALLBACK)',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-haiku', 
    'anthropic/claude-3-opus',
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'meta-llama/llama-3.1-70b-instruct',
    'meta-llama/llama-3.1-8b-instruct'
  ]

  return NextResponse.json({
    message: 'Current fallback models in order:',
    fallback_models: fallbackModels,
    note: 'The system will try each model in order until one works',
    gpt5_included: true,
    claude_models_included: true
  })
}
