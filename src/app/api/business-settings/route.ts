import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const url = new URL(request.url)
    const settingKey = url.searchParams.get('key')
    
    // For testing, we'll use the Blue Karma business ID
    const business_id = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    
    console.log('GET business-settings:', { business_id, settingKey })
    
    let query = supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', business_id)
    
    if (settingKey) {
      query = query.eq('setting_key', settingKey)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }
    
    // Transform data to key-value format for easier use
    const settings = data.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value
      return acc
    }, {} as Record<string, any>)
    
    return NextResponse.json({ data: settingKey ? settings[settingKey] : settings, error: null })
  } catch (error) {
    console.error('Error fetching business settings:', error)
    return NextResponse.json(
      { data: null, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { setting_key, setting_value } = body
    
    // For testing, we'll use the Blue Karma business ID
    const business_id = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    
    const { data, error } = await supabase
      .from('business_settings')
      .upsert({
        business_id,
        setting_key,
        setting_value,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to update setting' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data, error: null })
  } catch (error) {
    console.error('Error updating business setting:', error)
    return NextResponse.json(
      { data: null, error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}
