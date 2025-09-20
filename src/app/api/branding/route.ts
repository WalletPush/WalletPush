import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get branding for current account or by domain

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    
    // Check for tenant info from middleware headers
    const tenantId = request.headers.get('x-tenant-id')
    const tenantType = request.headers.get('x-tenant-type')
    
    let branding = null
    
    if (tenantId) {
      // Get branding from tenant info provided by middleware
      const { data: accountData } = await supabase
        .from('accounts')
        .select('id, name, type, branding')
        .eq('id', tenantId)
        .single()

      branding = accountData?.branding || getDefaultBranding()
      branding.account_name = accountData?.name
      branding.account_type = accountData?.type
    } else if (domain) {
      // Get branding by custom domain (fallback)
      const { data: domainData } = await supabase
        .from('account_domains')
        .select(`
          accounts!inner (
            id,
            name,
            type,
            branding
          )
        `)
        .eq('domain', domain)
        .single()
      
      branding = Array.isArray(domainData?.accounts) 
        ? domainData.accounts[0]?.branding || null
        : (domainData?.accounts as any)?.branding || null
      
      if (branding && domainData) {
        const account = Array.isArray(domainData.accounts) ? domainData.accounts[0] : domainData.accounts
        branding.account_name = account?.name
        branding.account_type = account?.type
      }
    } else {
      // Get branding for current active account
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        // Return default WalletPush branding for unauthenticated users
        return NextResponse.json({
          branding: getDefaultBranding()
        })
      }

      // Get current active account
      const { data: activeAccount } = await supabase
        .from('user_active_account')
        .select('active_account_id')
        .eq('user_id', user.id)
        .maybeSingle()

      let accountId = activeAccount?.active_account_id

      if (!accountId) {
        const { data: userAccounts } = await supabase
          .from('account_members')
          .select('account_id')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        accountId = userAccounts?.account_id
      }

      if (accountId) {
        const { data: accountData } = await supabase
          .from('accounts')
          .select('id, name, type, branding')
          .eq('id', accountId)
          .single()

        branding = accountData?.branding || getDefaultBranding()
        branding.account_name = accountData?.name
        branding.account_type = accountData?.type
      }
    }
    
    // Fallback to default branding
    if (!branding) {
      branding = getDefaultBranding()
    }
    
    return NextResponse.json({ branding })
    
  } catch (error) {
    console.error('❌ Branding API error:', error)
    return NextResponse.json({ 
      branding: getDefaultBranding() 
    })
  }
}

// PUT - Update branding for current account
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const brandingData = await request.json()
    
    // Get current active account
    const { data: activeAccount } = await supabase
      .from('user_active_account')
      .select('active_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let accountId = activeAccount?.active_account_id

    if (!accountId) {
      const { data: userAccounts } = await supabase
        .from('account_members')
        .select('account_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      accountId = userAccounts?.account_id
    }

    if (!accountId) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 })
    }

    // Validate and sanitize branding data
    const validatedBranding = validateBrandingData(brandingData)
    
    // Update account branding
    const { data: updatedAccount, error: updateError } = await supabase
      .from('accounts')
      .update({ branding: validatedBranding })
      .eq('id', accountId)
      .select('branding')
      .single()

    if (updateError) {
      console.error('❌ Error updating branding:', updateError)
      return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      branding: updatedAccount.branding
    })
    
  } catch (error) {
    console.error('❌ Branding update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDefaultBranding() {
  return {
    logo_url: '/images/walletpush-logo.png',
    primary_color: '#2E3748',
    secondary_color: '#4F46E5',
    background_color: '#1a1f2e',
    text_color: '#ffffff',
    company_name: 'WalletPush',
    welcome_message: 'Welcome to WalletPush',
    tagline: 'Digital Wallet Solutions',
    custom_css: null,
    account_name: 'WalletPush',
    account_type: 'platform'
  }
}

function validateBrandingData(data: any) {
  const validated: any = {}
  
  // Validate colors (hex format)
  const colorFields = ['primary_color', 'secondary_color', 'background_color', 'text_color']
  colorFields.forEach(field => {
    if (data[field] && /^#[0-9A-F]{6}$/i.test(data[field])) {
      validated[field] = data[field]
    }
  })
  
  // Validate strings
  const stringFields = ['company_name', 'welcome_message', 'tagline', 'logo_url']
  stringFields.forEach(field => {
    if (data[field] && typeof data[field] === 'string' && data[field].length <= 255) {
      validated[field] = data[field].trim()
    }
  })
  
  // Validate custom CSS (basic sanitization)
  if (data.custom_css && typeof data.custom_css === 'string') {
    // Remove potentially dangerous CSS
    const sanitized = data.custom_css
      .replace(/javascript:/gi, '')
      .replace(/expression\(/gi, '')
      .replace(/import\s+/gi, '')
    
    if (sanitized.length <= 10000) { // Limit CSS size
      validated.custom_css = sanitized
    }
  }
  
  return validated
}
