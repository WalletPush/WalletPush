import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch agency settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    console.log('🔍 Fetching agency settings for user:', user.email, 'key:', key)

    // Get or create agency account using our helper function
    const { data: agencyAccountId, error: agencyError } = await supabase
      .rpc('get_or_create_agency_account')

    if (agencyError || !agencyAccountId) {
      console.error('Agency account error:', agencyError)
      return NextResponse.json({ error: 'Failed to get agency account' }, { status: 500 })
    }

    console.log('🏢 Agency account:', agencyAccountId)

    // Get actual settings from database
    const { data: settings, error: settingsError } = await supabase
      .from('agency_settings')
      .select('setting_value')
      .eq('agency_account_id', agencyAccountId)
      .eq('setting_key', key)
      .maybeSingle()

    if (settingsError) {
      console.error('Settings error:', settingsError)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Provide default values if no settings exist
    let defaultData = {}
    switch (key) {
      case 'openrouter':
        defaultData = {
          api_key: '',
          model: 'anthropic/claude-3.5-sonnet',
          enabled: false,
          last_tested: null
        }
        break
      case 'smtp':
        defaultData = {
          host: 'smtp.gmail.com',
          port: 587,
          username: '',
          password: '',
          from_name: 'My Agency',
          from_email: '',
          encryption: 'tls',
          enabled: false
        }
        break
      case 'branding':
        defaultData = {
          logo: null,
          primary_color: '#2563eb',
          secondary_color: '#1e40af',
          company_name: 'My Agency',
          support_email: 'support@myagency.com',
          custom_css: ''
        }
        break
      case 'stripe':
        defaultData = {
          connect_account_id: null,
          is_connected: false,
          account_type: 'standard',
          charges_enabled: false,
          payouts_enabled: false,
          country: 'US',
          currency: 'USD'
        }
        break
      default:
        defaultData = {}
    }

    // Merge defaults with actual data from database
    const finalData = { ...defaultData, ...(settings?.setting_value || {}) }

    console.log(`✅ Returning settings for key: ${key}`, finalData)

    return NextResponse.json({
      success: true,
      data: finalData
    })

  } catch (error) {
    console.error('❌ Agency settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save agency settings
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { key, data } = body

    if (!key || !data) {
      return NextResponse.json({ error: 'Missing key or data' }, { status: 400 })
    }

    console.log('💾 Saving agency settings for user:', user.email, 'key:', key)

    // Get or create agency account using our helper function
    const { data: agencyAccountId, error: agencyError } = await supabase
      .rpc('get_or_create_agency_account')

    if (agencyError || !agencyAccountId) {
      console.error('Agency account error:', agencyError)
      return NextResponse.json({ error: 'Failed to get agency account' }, { status: 500 })
    }

    console.log('🏢 Saving settings for agency:', agencyAccountId)
    
    // Basic validation based on key
    switch (key) {
      case 'openrouter':
        if (!data.api_key && data.enabled) {
          return NextResponse.json({ error: 'API key required when enabled' }, { status: 400 })
        }
        break
      case 'smtp':
        if (data.enabled && (!data.host || !data.port || !data.from_email)) {
          return NextResponse.json({ error: 'Host, port, and from email required when enabled' }, { status: 400 })
        }
        break
      case 'branding':
        if (!data.company_name) {
          return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
        }
        break
    }

    // Save to database using upsert
    const { error: saveError } = await supabase
      .from('agency_settings')
      .upsert({
        agency_account_id: agencyAccountId,
        setting_key: key,
        setting_value: data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'agency_account_id,setting_key'
      })

    if (saveError) {
      console.error('Save error:', saveError)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    console.log(`✅ Successfully saved settings for key: ${key}`)

    return NextResponse.json({
      success: true,
      message: `${key} settings saved successfully`
    })

  } catch (error) {
    console.error('❌ Save agency settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
