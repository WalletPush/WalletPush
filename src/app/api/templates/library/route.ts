import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch available templates for both agency and business use
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🎨 Fetching template library for user:', user.email)

    // Get query parameters
    const url = new URL(request.url)
    const templateType = url.searchParams.get('type') // 'sales-page' or 'distribution' or 'all'
    const category = url.searchParams.get('category') // 'business-main', 'loyalty', 'coupon', etc.

    // Get current active account
    const { data: activeAccount } = await supabase
      .from('user_active_account')
      .select('active_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let accountId = activeAccount?.active_account_id

    if (!accountId) {
      // Get user's first account (any type)
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
        .in('role', ['owner', 'admin'])
        .limit(1)
        .single()

      accountId = userAccounts?.account_id
    }

    if (!accountId) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 })
    }

    console.log('🏢 Fetching templates for account:', accountId)

    // Build query for templates
    let templatesQuery = supabase
      .from('agency_sales_pages')
      .select('*')
      .eq('is_template', true)

    // Filter by template type if specified
    if (templateType && templateType !== 'all') {
      if (templateType === 'sales-page') {
        templatesQuery = templatesQuery.in('template_category', ['business-main', 'agency-sales', 'general-sales'])
      } else if (templateType === 'distribution') {
        templatesQuery = templatesQuery.in('template_category', ['loyalty', 'coupon', 'membership', 'store-card', 'distribution'])
      }
    }

    // Filter by category if specified
    if (category) {
      templatesQuery = templatesQuery.eq('template_category', category)
    }

    // Order by creation date
    templatesQuery = templatesQuery.order('created_at', { ascending: false })

    const { data: templates, error: templatesError } = await templatesQuery

    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError)
      
      // If table doesn't exist, try to create it first
      if (templatesError.message?.includes('relation "agency_sales_pages" does not exist')) {
        console.log('🔧 Table does not exist, attempting to create it...')
        
        try {
          await createAgencySalesPagesTable(supabase)
          console.log('✅ Table created successfully, retrying query...')
          
          // Retry the original query
          const { data: retryTemplates, error: retryError } = await templatesQuery
          
          if (retryError) {
            console.log('📋 Retry failed, returning mock templates for development')
            return getMockTemplatesResponse()
          }
          
          // Continue with the retry data
          if (!retryTemplates || retryTemplates.length === 0) {
            console.log('📋 No templates found after table creation, returning mock templates')
            return getMockTemplatesResponse()
          }
          
          // Process the retry templates (copy the logic from below)
          const formattedRetryTemplates = (retryTemplates || []).map(template => ({
            id: template.id,
            name: template.page_name,
            description: template.template_description || template.page_subtitle || 'No description',
            category: template.template_category,
            type: template.page_type,
            preview: template.hero_image_url || null,
            templateData: {
              headline: template.headline,
              subheadline: template.subheadline || template.page_subtitle,
              valueProposition: template.value_proposition,
              features: template.features || [],
              testimonials: template.testimonials || [],
              selectedPackages: template.selected_packages || [],
              templateStyle: template.template_style,
              primaryColor: template.primary_color,
              secondaryColor: template.secondary_color,
              accentColor: template.accent_color,
              fontFamily: template.font_family,
              logoUrl: template.logo_url,
              heroImageUrl: template.hero_image_url,
              callToAction: template.call_to_action
            },
            createdAt: template.created_at,
            isGlobal: template.agency_account_id === null,
            createdBy: template.agency_account_id === accountId ? 'You' : 'WalletPush'
          }))

          const retryTemplatesByCategory = formattedRetryTemplates.reduce((acc, template) => {
            const category = template.category || 'general'
            if (!acc[category]) {
              acc[category] = []
            }
            acc[category].push(template)
            return acc
          }, {} as Record<string, typeof formattedRetryTemplates>)

          return NextResponse.json({
            templates: formattedRetryTemplates,
            templatesByCategory: retryTemplatesByCategory,
            totalCount: formattedRetryTemplates.length,
            categories: Object.keys(retryTemplatesByCategory)
          })
          
        } catch (createError) {
          console.error('❌ Failed to create table:', createError)
          console.log('📋 Falling back to mock templates for development')
          return getMockTemplatesResponse()
        }
      }
      
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    // If no templates found in database, return mock templates for development
    if (!templates || templates.length === 0) {
      console.log('📋 No templates found in database, returning mock templates for development')
      return getMockTemplatesResponse()
    }

    // Transform database format to frontend format
    const formattedTemplates = (templates || []).map(template => ({
      id: template.id,
      name: template.page_name,
      description: template.template_description || template.page_subtitle || 'No description',
      category: template.template_category,
      type: template.page_type,
      preview: template.hero_image_url || null,
      
      // Template data for applying
      templateData: {
        headline: template.headline,
        subheadline: template.subheadline || template.page_subtitle,
        valueProposition: template.value_proposition,
        features: template.features || [],
        testimonials: template.testimonials || [],
        selectedPackages: template.selected_packages || [],
        templateStyle: template.template_style,
        primaryColor: template.primary_color,
        secondaryColor: template.secondary_color,
        accentColor: template.accent_color,
        fontFamily: template.font_family,
        logoUrl: template.logo_url,
        heroImageUrl: template.hero_image_url,
        callToAction: template.call_to_action
      },
      
      // Metadata
      createdAt: template.created_at,
      isGlobal: template.agency_account_id === null, // Global templates have no agency_account_id
      createdBy: template.agency_account_id === accountId ? 'You' : 'WalletPush'
    }))

    // Group templates by category
    const templatesByCategory = formattedTemplates.reduce((acc, template) => {
      const category = template.category || 'general'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(template)
      return acc
    }, {} as Record<string, typeof formattedTemplates>)

    console.log(`✅ Found ${formattedTemplates.length} templates across ${Object.keys(templatesByCategory).length} categories`)

    return NextResponse.json({
      templates: formattedTemplates,
      templatesByCategory,
      totalCount: formattedTemplates.length,
      categories: Object.keys(templatesByCategory)
    })

  } catch (error) {
    console.error('❌ Template library API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new template from existing page data
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateData, templateName, templateDescription, templateCategory, templateType } = body

    if (!templateData || !templateName || !templateCategory) {
      return NextResponse.json({ error: 'Missing required template data' }, { status: 400 })
    }

    console.log('💾 Creating new template:', templateName)

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
        .select(`
          account_id,
          role,
          accounts!inner (
            id,
            type
          )
        `)
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin'])
        .limit(1)
        .single()

      accountId = userAccounts?.account_id
    }

    if (!accountId) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 })
    }

    // Generate a slug from the template name
    const templateSlug = templateName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)

    // Create template record
    const newTemplate = {
      agency_account_id: accountId,
      page_name: templateName,
      page_type: templateType || 'general',
      page_slug: templateSlug,
      page_title: templateData.headline || templateName,
      page_subtitle: templateData.subheadline || templateDescription,
      headline: templateData.headline,
      subheadline: templateData.subheadline,
      value_proposition: templateData.valueProposition,
      call_to_action: templateData.callToAction || 'Get Started',
      features: templateData.features || [],
      testimonials: templateData.testimonials || [],
      selected_packages: templateData.selectedPackages || [],
      template_style: templateData.templateStyle || 'modern',
      primary_color: templateData.primaryColor || '#2563eb',
      secondary_color: templateData.secondaryColor || '#64748b',
      accent_color: templateData.accentColor || '#10b981',
      font_family: templateData.fontFamily || 'Inter',
      logo_url: templateData.logoUrl,
      hero_image_url: templateData.heroImageUrl,
      meta_title: templateName,
      meta_description: templateDescription,
      is_published: false,
      is_template: true,
      template_category: templateCategory,
      template_description: templateDescription
    }

    const { data: savedTemplate, error: saveError } = await supabase
      .from('agency_sales_pages')
      .insert([newTemplate])
      .select('*')
      .single()

    if (saveError) {
      console.error('❌ Error saving template:', saveError)
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
    }

    console.log('✅ Successfully created template:', savedTemplate.id)

    return NextResponse.json({
      success: true,
      message: 'Template created successfully',
      template: {
        id: savedTemplate.id,
        name: savedTemplate.page_name,
        category: savedTemplate.template_category,
        description: savedTemplate.template_description
      }
    })

  } catch (error) {
    console.error('❌ Create template API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to return mock templates when database table doesn't exist
function getMockTemplatesResponse() {
  const mockTemplates = [
    {
      id: 'walletpush-main',
      name: 'WalletPush Main Template',
      description: 'Complete main sales page with dark hero, pricing tables, and conversion-optimized copy',
      category: 'business-main',
      type: 'general',
      preview: null,
      templateData: {
        headline: 'Loyalty, memberships & store cards that live on your customer\'s phone — without SMS headaches.',
        subheadline: 'Stop paying for texts. Put your offer on the Lock Screen.',
        valueProposition: 'Customers add your card to Apple Wallet in one tap. You send instant push updates — no carrier rules, no A2P forms, no per-message fees.',
        features: [
          'More repeat visits - gentle nudges on the Lock Screen beat another text in a crowded inbox',
          'Lower costs - flat monthly price, no per-message fees',
          'Easy for staff - scan the Wallet card like a normal barcode/QR',
          'Zero app - customers already have Apple Wallet',
          'Fast launch - go live in minutes, not weeks'
        ],
        testimonials: [],
        selectedPackages: [
          { id: '1', name: 'Starter', price: 29, features: ['1,000 passes/month', '3 programs', '2 staff accounts'], isPopular: false },
          { id: '2', name: 'Business', price: 69, features: ['5,000 passes/month', '10 programs', '5 staff accounts'], isPopular: true },
          { id: '3', name: 'Pro', price: 97, features: ['10,000 passes/month', '20 programs', 'Unlimited staff'], isPopular: false }
        ],
        templateStyle: 'modern-dark',
        primaryColor: '#2563eb',
        secondaryColor: '#7c3aed',
        accentColor: '#10b981',
        fontFamily: 'Inter',
        callToAction: 'Start Free Trial'
      },
      createdAt: new Date().toISOString(),
      isGlobal: true,
      createdBy: 'WalletPush'
    },
    {
      id: 'membership-club',
      name: 'Membership Club Template',
      description: 'Premium membership club template for agencies targeting exclusive membership businesses',
      category: 'membership',
      type: 'membership',
      preview: null,
      templateData: {
        headline: 'Launch a Membership Your Customers Actually Use',
        subheadline: 'We design and launch modern memberships your customers love — added to Apple Wallet in one tap, with lock-screen updates that bring them back again and again.',
        valueProposition: 'Memberships that live in Apple Wallet are the sweet spot: one tap to join, always visible, and easy to redeem in-store.',
        features: [
          'More visits: gentle lock-screen nudges beat another ignored text',
          'Frictionless joining: link or QR → Add to Wallet → done',
          'Lower cost: no per-message fees or carrier hoops'
        ],
        testimonials: [
          { id: '1', name: 'Local Brand', company: 'Membership Business', quote: 'We launched in a week and saw 600 members join in month one.', rating: 5 }
        ],
        selectedPackages: [
          { id: '1', name: 'Club Starter', price: 149, features: ['500 members/month', '1 membership program', '3 staff accounts'], isPopular: false },
          { id: '2', name: 'Club Professional', price: 299, features: ['2,000 members/month', '3 membership programs', '10 staff accounts'], isPopular: true },
          { id: '3', name: 'Club Enterprise', price: 599, features: ['10,000 members/month', 'Unlimited programs', 'Unlimited staff'], isPopular: false }
        ],
        templateStyle: 'membership-premium',
        primaryColor: '#7c3aed',
        secondaryColor: '#ec4899',
        accentColor: '#10b981',
        fontFamily: 'Inter',
        callToAction: 'Book Free Consult'
      },
      createdAt: new Date().toISOString(),
      isGlobal: true,
      createdBy: 'WalletPush'
    },
    {
      id: 'restaurant',
      name: 'Restaurant & Food Template',
      description: 'Warm template for restaurants, cafes, pizza places, and food service businesses',
      category: 'restaurant',
      type: 'loyalty',
      preview: null,
      templateData: {
        headline: 'Turn First-Time Diners Into Loyal Regulars',
        subheadline: 'Digital loyalty cards that live in Apple Wallet. No more forgotten punch cards or lost points.',
        valueProposition: 'Your customers add your loyalty card to Apple Wallet in one tap. You send delicious updates straight to their Lock Screen — new menu items, special offers, and rewards they\'ve earned.',
        features: [
          'No more lost cards - Digital cards can\'t be forgotten at home or lost in wallets',
          'Always on Lock Screen - Your restaurant appears when customers are deciding where to eat',
          'Instant updates - New menu items, daily specials, earned rewards — delivered instantly'
        ],
        testimonials: [
          { id: '1', name: 'Maria\'s Pizzeria', company: 'Downtown', quote: 'Our loyalty program participation went from 20% to 80% after switching to Apple Wallet cards. Customers actually use them now!', rating: 5 }
        ],
        selectedPackages: [
          { id: '1', name: 'Bistro', price: 79, features: ['1,000 loyalty cards', '2 loyalty programs', '3 staff accounts'], isPopular: false },
          { id: '2', name: 'Restaurant Pro', price: 149, features: ['5,000 loyalty cards', '5 loyalty programs', '10 staff accounts'], isPopular: true },
          { id: '3', name: 'Restaurant Chain', price: 299, features: ['20,000 loyalty cards', 'Unlimited programs', 'Unlimited staff'], isPopular: false }
        ],
        templateStyle: 'restaurant-warm',
        primaryColor: '#ea580c',
        secondaryColor: '#dc2626',
        accentColor: '#eab308',
        fontFamily: 'Inter',
        callToAction: 'Start Free Trial'
      },
      createdAt: new Date().toISOString(),
      isGlobal: true,
      createdBy: 'WalletPush'
    }
  ]

  const templatesByCategory = mockTemplates.reduce((acc, template) => {
    const category = template.category || 'general'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(template)
    return acc
  }, {} as Record<string, typeof mockTemplates>)

  return NextResponse.json({
    templates: mockTemplates,
    templatesByCategory,
    totalCount: mockTemplates.length,
    categories: Object.keys(templatesByCategory)
  })
}
