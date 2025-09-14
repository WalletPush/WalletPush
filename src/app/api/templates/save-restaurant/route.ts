import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Save the restaurant template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🍕 Saving restaurant template for user:', user.email)

    // Define the restaurant template data
    const restaurantTemplate = {
      agency_account_id: null, // Make it global so all agencies can use it
      page_name: 'Restaurant Loyalty Template',
      page_type: 'loyalty',
      page_slug: 'restaurant-loyalty-template',
      page_title: 'Turn First-Time Diners Into Loyal Regulars',
      page_subtitle: 'Digital loyalty cards that live in Apple Wallet',
      target_audience: 'Restaurants, cafes, pizza places, and food service businesses',
      hero_image_url: null,
      logo_url: '/images/walletpush-logo.png',
      favicon_url: null,
      headline: 'Turn First-Time Diners Into Loyal Regulars',
      subheadline: 'Digital loyalty cards that live in Apple Wallet. No more forgotten punch cards or lost points.',
      value_proposition: 'Your customers add your loyalty card to Apple Wallet in one tap. You send delicious updates straight to their Lock Screen — new menu items, special offers, and rewards they\'ve earned.',
      call_to_action: 'Start Free Trial',
      features: [
        'No more lost cards - Digital cards can\'t be forgotten at home or lost in wallets',
        'Always on Lock Screen - Your restaurant appears when customers are deciding where to eat',
        'Instant updates - New menu items, daily specials, earned rewards — delivered instantly',
        '40% More repeat visits - Lock Screen visibility drives return customers',
        '25% Higher average order - Rewards encourage customers to spend more',
        '60% Better engagement - vs traditional punch cards or apps',
        '90% Customer retention - Digital cards never get lost or forgotten'
      ],
      testimonials: [
        {
          id: '1',
          name: 'Maria\'s Pizzeria',
          company: 'Downtown Location',
          quote: 'Our loyalty program participation went from 20% to 80% after switching to Apple Wallet cards. Customers actually use them now!',
          rating: 5
        }
      ],
      selected_packages: [
        {
          id: '1',
          name: 'Bistro',
          description: 'Perfect for small restaurants and cafes',
          price: 79,
          features: ['1,000 loyalty cards', '2 loyalty programs', '3 staff accounts', 'Loyalty program tools', 'Menu integration'],
          isPopular: false
        },
        {
          id: '2',
          name: 'Restaurant Pro',
          description: 'Ideal for established restaurants with multiple locations',
          price: 149,
          features: ['5,000 loyalty cards', '5 loyalty programs', '10 staff accounts', 'Advanced analytics', 'POS integration', 'Multi-location support'],
          isPopular: true
        },
        {
          id: '3',
          name: 'Restaurant Chain',
          description: 'Full-featured solution for restaurant chains and franchises',
          price: 299,
          features: ['20,000 loyalty cards', 'Unlimited programs', 'Unlimited staff', 'Franchise management', 'Custom integrations'],
          isPopular: false
        }
      ],
      template_style: 'restaurant-warm',
      primary_color: '#ea580c', // Orange
      secondary_color: '#dc2626', // Red
      accent_color: '#eab308', // Yellow
      font_family: 'Inter',
      meta_title: 'Restaurant Loyalty Template - Apple Wallet Loyalty Cards',
      meta_description: 'Turn first-time diners into loyal regulars with digital loyalty cards that live in Apple Wallet. Perfect for restaurants, cafes, and food service businesses.',
      meta_keywords: 'restaurant loyalty, digital punch cards, apple wallet loyalty, restaurant rewards, customer retention, food service loyalty',
      is_published: false,
      custom_domain: null,
      analytics_code: null,
      is_template: true,
      template_category: 'restaurant',
      template_description: 'Warm orange/red gradient template perfect for restaurants, cafes, pizza places, and food service businesses. Features restaurant-specific copy, loyalty program examples, and food industry testimonials.'
    }

    // Save the template to the database
    const { data: savedTemplate, error: saveError } = await supabase
      .from('agency_sales_pages')
      .insert([restaurantTemplate])
      .select('*')
      .single()

    if (saveError) {
      console.error('❌ Error saving restaurant template:', saveError)
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
    }

    console.log('✅ Successfully saved restaurant template:', savedTemplate.id)

    return NextResponse.json({
      success: true,
      message: 'Restaurant template saved successfully',
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
    console.error('❌ Save restaurant template API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
