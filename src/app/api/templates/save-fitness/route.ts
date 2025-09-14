import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Save the fitness template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('💪 Saving fitness template for user:', user.email)

    // Define the fitness template data
    const fitnessTemplate = {
      agency_account_id: null, // Make it global so all agencies can use it
      page_name: 'Fitness & Gym Template',
      page_type: 'membership',
      page_slug: 'fitness-gym-template',
      page_title: 'Keep Members Motivated Beyond the Gym',
      page_subtitle: 'Digital membership cards that live in Apple Wallet',
      target_audience: 'Gyms, fitness centers, yoga studios, boxing gyms, and fitness businesses',
      hero_image_url: null,
      logo_url: '/images/walletpush-logo.png',
      favicon_url: null,
      headline: 'Keep Members Motivated Beyond the Gym',
      subheadline: 'Digital membership cards that live in Apple Wallet. Track workouts, book classes, and stay motivated with progress updates right on the Lock Screen.',
      value_proposition: 'Your members add their gym pass to Apple Wallet in one tap. You send motivational updates, class reminders, and achievement celebrations straight to their Lock Screen.',
      call_to_action: 'Start Your Journey',
      features: [
        'Always accessible - Digital membership cards can\'t be forgotten at home',
        'Motivational reminders - Lock Screen updates keep fitness goals top of mind',
        'Track progress - Celebrate milestones and achievements instantly',
        '35% Higher retention - Members stay engaged longer with Lock Screen reminders',
        '50% More class bookings - Easy booking increases class participation',
        '28% Increased check-ins - Digital passes make gym visits more convenient',
        '85% Member satisfaction - Members love the convenience and motivation'
      ],
      testimonials: [
        {
          id: '1',
          name: 'FitLife Gym',
          company: 'Portland',
          quote: 'Our member retention improved by 35% after implementing Apple Wallet passes. The Lock Screen reminders keep fitness top of mind!',
          rating: 5
        }
      ],
      selected_packages: [
        {
          id: '1',
          name: 'Studio',
          description: 'Perfect for boutique fitness studios and personal trainers',
          price: 99,
          features: ['500 member passes', '3 programs', '5 staff accounts', 'Class booking system', 'Membership tracking', 'Workout reminders'],
          isPopular: false
        },
        {
          id: '2',
          name: 'Gym Pro',
          description: 'Ideal for gyms and fitness centers with multiple programs',
          price: 199,
          features: ['2,500 member passes', '10 programs', '15 staff accounts', 'Advanced analytics', 'Progress tracking', 'Personal training tools'],
          isPopular: true
        },
        {
          id: '3',
          name: 'Fitness Chain',
          description: 'Full-featured solution for fitness chains and franchises',
          price: 399,
          features: ['10,000 member passes', 'Unlimited programs', 'Unlimited staff', 'Multi-location support', 'Franchise management'],
          isPopular: false
        }
      ],
      template_style: 'fitness-energy',
      primary_color: '#059669', // Green
      secondary_color: '#2563eb', // Blue
      accent_color: '#0d9488', // Teal
      font_family: 'Inter',
      meta_title: 'Fitness & Gym Template - Apple Wallet Memberships',
      meta_description: 'Keep members motivated beyond the gym with digital membership cards that live in Apple Wallet. Perfect for gyms, fitness centers, and studios.',
      meta_keywords: 'fitness membership, gym membership, apple wallet fitness, digital gym pass, member retention, fitness tracking',
      is_published: false,
      custom_domain: null,
      analytics_code: null,
      is_template: true,
      template_category: 'fitness',
      template_description: 'Energetic green/blue gradient template perfect for gyms, fitness centers, yoga studios, and fitness businesses. Features fitness-specific copy, membership tracking examples, and health industry testimonials.'
    }

    // Save the template to the database
    const { data: savedTemplate, error: saveError } = await supabase
      .from('agency_sales_pages')
      .insert([fitnessTemplate])
      .select('*')
      .single()

    if (saveError) {
      console.error('❌ Error saving fitness template:', saveError)
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
    }

    console.log('✅ Successfully saved fitness template:', savedTemplate.id)

    return NextResponse.json({
      success: true,
      message: 'Fitness template saved successfully',
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
    console.error('❌ Save fitness template API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
