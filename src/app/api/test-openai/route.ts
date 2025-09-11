import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { api_key, model = 'gpt-5-mini', enabled = true } = body
    
    // For testing, we'll use the Blue Karma business ID
    const business_id = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    
    console.log('Updating OpenAI settings for business:', business_id)
    
    const { data, error } = await supabase
      .from('business_settings')
      .upsert({
        business_id,
        setting_key: 'openai',
        setting_value: {
          api_key,
          model,
          enabled,
          last_tested: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'business_id,setting_key'
      })
      .select()
      .maybeSingle()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      message: 'OpenAI settings updated successfully'
    })
  } catch (error) {
    console.error('Error updating OpenAI settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update OpenAI settings' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // For testing, we'll use the Blue Karma business ID
    const business_id = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', business_id)
      .eq('setting_key', 'openai')
      .maybeSingle()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      message: 'OpenAI settings retrieved successfully'
    })
  } catch (error) {
    console.error('Error retrieving OpenAI settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve OpenAI settings' },
      { status: 500 }
    )
  }
}
