import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Save the retail template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🛍️ Saving retail template for user:', user.email)

    // Define the retail template data
    const retailTemplate = {
      agency_account_id: null, // Make it global so all agencies can use it
      page_name: 'Retail & Shopping Template',
      page_type: 'loyalty',
      page_slug: 'retail-shopping-template',
      page_title: 'Turn Shoppers Into Loyal Customers',
      page_subtitle: 'Digital loyalty cards and store credit that live in Apple Wallet',
      target_audience: 'Retail stores, boutiques, fashion, beauty, electronics, and shopping businesses',
      hero_image_url: null,
      logo_url: '/images/walletpush-logo.png',
      favicon_url: null,
      headline: 'Turn Shoppers Into Loyal Customers',
      subheadline: 'Digital loyalty cards and store credit that live in Apple Wallet. Reward purchases, track points, and send personalized offers straight to their Lock Screen.',
      value_proposition: 'Your customers add your store card to Apple Wallet in one tap. You send exclusive offers, point updates, and new arrival alerts that appear right on their Lock Screen.',
      call_to_action: 'Get Started',
      features: [
        'Always in their wallet - Digital cards can\'t be forgotten at home or lost in purses',
        'Instant notifications - New arrivals, sales, and earned rewards appear on Lock Screen',
        'Track everything - Points, purchases, store credit — all updated in real-time',
        '45% More repeat customers - Lock Screen visibility drives return visits',
        '30% Higher average spend - Rewards encourage larger purchases',
        '65% Better engagement - vs traditional loyalty cards',
        '80% Program participation - Digital cards are always accessible'
      ],
      testimonials: [
        {
          id: '1',
          name: 'Bella Boutique',
          company: 'San Francisco',
          quote: 'Our customer retention improved by 45% and average order value increased by 30% after switching to Apple Wallet loyalty cards.',
          rating: 5
        }
      ],
      selected_packages: [
        {
          id: '1',
          name: 'Shop',
          description: 'Perfect for small retail stores and boutiques',
          price: 89,
          features: ['1,000 loyalty cards', '2 programs', '3 staff accounts', 'Loyalty program', 'Store credit cards'],
          isPopular: false
        },
        {
          id: '2',
          name: 'Retail Pro',
          description: 'Ideal for established retailers with multiple programs',
          price: 179,
          features: ['5,000 loyalty cards', '5 programs', '10 staff accounts', 'Advanced analytics', 'POS integration', 'Customer segments'],
          isPopular: true
        },
        {
          id: '3',
          name: 'Retail Chain',
          description: 'Full-featured solution for retail chains and franchises',
          price: 349,
          features: ['15,000 loyalty cards', 'Unlimited programs', 'Unlimited staff', 'Multi-location support', 'Franchise management'],
          isPopular: false
        }
      ],
      template_style: 'retail-professional',
      primary_color: '#475569', // Slate
      secondary_color: '#1e293b', // Dark slate
      accent_color: '#64748b', // Light slate
      font_family: 'Inter',
      meta_title: 'Retail & Shopping Template - Apple Wallet Loyalty Cards',
      meta_description: 'Turn shoppers into loyal customers with digital loyalty cards and store credit that live in Apple Wallet. Perfect for retail stores and shopping businesses.',
      meta_keywords: 'retail loyalty, store loyalty cards, apple wallet retail, digital store cards, customer retention, shopping rewards',
      is_published: false,
      custom_domain: null,
      analytics_code: null,
      is_template: true,
      template_category: 'retail',
      template_description: 'Professional slate/neutral gradient template perfect for retail stores, boutiques, fashion, beauty, electronics, and shopping businesses. Features retail-specific copy, store card examples, and shopping industry testimonials.'
    }

    // Save the template to the database
    const { data: savedTemplate, error: saveError } = await supabase
      .from('agency_sales_pages')
      .insert([retailTemplate])
      .select('*')
      .single()

    if (saveError) {
      console.error('❌ Error saving retail template:', saveError)
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
    }

    console.log('✅ Successfully saved retail template:', savedTemplate.id)

    return NextResponse.json({
      success: true,
      message: 'Retail template saved successfully',
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
    console.error('❌ Save retail template API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
