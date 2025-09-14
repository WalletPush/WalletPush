import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Save the membership club template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('💾 Saving membership club template for user:', user.email)

    // Define the membership club template data
    const membershipClubTemplate = {
      agency_account_id: null, // Make it global so all agencies can use it
      page_name: 'Membership Club Template',
      page_type: 'membership',
      page_slug: 'membership-club-template',
      page_title: 'Launch a Membership Your Customers Actually Use',
      page_subtitle: 'Turn Members into Regulars — Right on Their Lock Screen',
      target_audience: 'Businesses wanting to run exclusive membership clubs',
      hero_image_url: null,
      logo_url: '/images/walletpush-logo.png',
      favicon_url: null,
      headline: 'Launch a Membership Your Customers Actually Use',
      subheadline: 'We design and launch modern memberships your customers love — added to Apple Wallet in one tap, with lock-screen updates that bring them back again and again.',
      value_proposition: 'Memberships that live in Apple Wallet are the sweet spot: one tap to join, always visible, and easy to redeem in-store.',
      call_to_action: 'Book a Free Consult',
      features: [
        'More visits: gentle lock-screen nudges beat another ignored text',
        'Frictionless joining: link or QR → Add to Wallet → done',
        'Lower cost: no per-message fees or carrier hoops',
        'Higher repeat visits — members see you on their lock screen',
        'Bigger average order — perks nudge upgrades and add-ons',
        'Lower marketing cost — no per-text fees, no app to maintain',
        'Happier staff — show card, scan, done'
      ],
      testimonials: [
        {
          id: '1',
          name: 'Local Brand',
          company: 'Membership Business',
          quote: 'We launched in a week and saw 600 members join in month one.',
          rating: 5
        }
      ],
      selected_packages: [
        {
          id: '1',
          name: 'Club Starter',
          description: 'Perfect for boutique membership programs',
          price: 149,
          features: ['500 members/month', '1 membership program', '3 staff accounts', 'Membership tools', 'Lock screen updates'],
          isPopular: false
        },
        {
          id: '2',
          name: 'Club Professional',
          description: 'Ideal for growing membership businesses',
          price: 299,
          features: ['2,000 members/month', '3 membership programs', '10 staff accounts', 'Advanced analytics', 'Tier management', 'Automated perks'],
          isPopular: true
        },
        {
          id: '3',
          name: 'Club Enterprise',
          description: 'Full-featured solution for premium membership clubs',
          price: 599,
          features: ['10,000 members/month', 'Unlimited programs', 'Unlimited staff', 'Concierge setup', 'Custom integrations'],
          isPopular: false
        }
      ],
      template_style: 'membership-premium',
      primary_color: '#7c3aed', // Purple
      secondary_color: '#ec4899', // Pink
      accent_color: '#10b981', // Green
      font_family: 'Inter',
      meta_title: 'Membership Club Template - Apple Wallet Memberships',
      meta_description: 'Launch a membership your customers actually use. Modern memberships in Apple Wallet with lock-screen updates that bring members back.',
      meta_keywords: 'membership club, apple wallet membership, exclusive membership, member retention, lock screen updates',
      is_published: false,
      custom_domain: null,
      analytics_code: null,
      is_template: true,
      template_category: 'membership',
      template_description: 'Premium membership club template with purple/pink gradient design. Perfect for agencies targeting businesses that want to run exclusive membership programs like wine clubs, gyms, salons, and hospitality venues.'
    }

    // Save the template to the database
    const { data: savedTemplate, error: saveError } = await supabase
      .from('agency_sales_pages')
      .insert([membershipClubTemplate])
      .select('*')
      .single()

    if (saveError) {
      console.error('❌ Error saving membership club template:', saveError)
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
    }

    console.log('✅ Successfully saved membership club template:', savedTemplate.id)

    return NextResponse.json({
      success: true,
      message: 'Membership club template saved successfully',
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
    console.error('❌ Save membership club template API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
