import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Save the main sales page as a template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('💾 Saving main page as template for user:', user.email)

    // Get current active account (should be agency or platform)
    const { data: activeAccount } = await supabase
      .from('user_active_account')
      .select('active_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    // If no active account, get user's first agency account
    let agencyAccountId = activeAccount?.active_account_id
    
    if (!agencyAccountId) {
      const { data: userAccounts } = await supabase
        .from('account_members')
        .select(`
          account_id,
          role,
          accounts!inner (
            id,
            type
          )
        `)
        .eq('user_id', user.id)
        .in('accounts.type', ['agency', 'platform'])
        .in('role', ['owner', 'admin'])
        .limit(1)
        .single()

      agencyAccountId = userAccounts?.account_id
    }

    if (!agencyAccountId) {
      return NextResponse.json({ error: 'No agency account found' }, { status: 404 })
    }

    // Define the main page template data
    const mainPageTemplate = {
      agency_account_id: null, // Make it global so all agencies can use it
      page_name: 'WalletPush Main Template',
      page_type: 'general',
      page_slug: 'walletpush-main-template',
      page_title: 'Loyalty, memberships & store cards that live on your customer\'s phone',
      page_subtitle: 'Stop paying for texts. Put your offer on the Lock Screen.',
      target_audience: 'Businesses looking for SMS alternatives',
      hero_image_url: null,
      logo_url: '/images/walletpush-logo.png',
      favicon_url: null,
      headline: 'Loyalty, memberships & store cards that live on your customer\'s phone — without SMS headaches.',
      subheadline: 'Stop paying for texts. Put your offer on the Lock Screen.',
      value_proposition: 'Customers add your card to Apple Wallet in one tap. You send instant push updates — no carrier rules, no A2P forms, no per-message fees.',
      call_to_action: 'Start Free Trial',
      features: [
        'More repeat visits - gentle nudges on the Lock Screen beat another text in a crowded inbox',
        'Lower costs - flat monthly price, no per-message fees',
        'Easy for staff - scan the Wallet card like a normal barcode/QR',
        'Zero app - customers already have Apple Wallet',
        'Fast launch - go live in minutes, not weeks',
        'Always visible - your card lives on their Lock Screen'
      ],
      testimonials: [
        {
          id: '1',
          name: 'Sarah Johnson',
          company: 'Local Coffee Shop',
          quote: 'We switched from SMS and saved $200/month while getting better engagement!',
          rating: 5
        },
        {
          id: '2', 
          name: 'Mike Chen',
          company: 'Fitness Studio',
          quote: 'Our members love having their membership card in Apple Wallet. No more forgotten cards!',
          rating: 5
        }
      ],
      selected_packages: [
        {
          id: '1',
          name: 'Starter',
          description: 'Perfect for small businesses getting started',
          price: 29,
          features: ['1,000 passes/month', '3 programs', '2 staff accounts', 'Custom branding', 'Basic analytics'],
          isPopular: false
        },
        {
          id: '2',
          name: 'Business', 
          description: 'Ideal for growing businesses with multiple programs',
          price: 69,
          features: ['5,000 passes/month', '10 programs', '5 staff accounts', 'Custom branding', 'Advanced analytics', 'API access', 'Priority support', 'White-label domain'],
          isPopular: true
        },
        {
          id: '3',
          name: 'Pro',
          description: 'Full-featured solution for enterprise businesses', 
          price: 97,
          features: ['10,000 passes/month', '20 programs', 'Unlimited staff accounts', 'Custom branding', 'Enterprise analytics', 'API access', 'Priority support', 'White-label domain', 'SMTP configuration'],
          isPopular: false
        }
      ],
      template_style: 'modern-dark',
      primary_color: '#2563eb',
      secondary_color: '#7c3aed', 
      accent_color: '#10b981',
      font_family: 'Inter',
      meta_title: 'WalletPush - Digital Wallet Membership Platform',
      meta_description: 'Loyalty, memberships & store cards that live on your customer\'s phone — without SMS headaches. Stop paying for texts. Put your offer on the Lock Screen.',
      meta_keywords: 'apple wallet, digital loyalty cards, SMS alternative, push notifications, membership cards',
      is_published: false,
      custom_domain: null,
      analytics_code: null,
      is_template: true, // Mark this as a template
      template_category: 'business-main',
      template_description: 'Complete main sales page template with dark hero, pricing tables, FAQs, and conversion-optimized copy. Perfect for businesses wanting to showcase their digital wallet platform with professional design and conversion-optimized copy.'
    }

    // Save the template to the database
    const { data: savedTemplate, error: saveError } = await supabase
      .from('agency_sales_pages')
      .insert([mainPageTemplate])
      .select('*')
      .single()

    if (saveError) {
      console.error('❌ Error saving template:', saveError)
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
    }

    console.log('✅ Successfully saved main page template:', savedTemplate.id)

    return NextResponse.json({
      success: true,
      message: 'Main page template saved successfully',
      template: {
        id: savedTemplate.id,
        name: savedTemplate.page_name,
        slug: savedTemplate.page_slug,
        type: savedTemplate.page_type,
        category: savedTemplate.template_category,
        description: savedTemplate.template_description
      }
    })

  } catch (error) {
    console.error('❌ Save template API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
