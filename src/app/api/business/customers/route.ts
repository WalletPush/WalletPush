import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, use the Blue Karma business ID (in production, get from user context)
    const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    
    console.log('🔍 Fetching customers for business:', businessId)

    // Fetch customers for this business with all business intelligence columns
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        address,
        city,
        state,
        zip_code,
        company,
        total_spent,
        last_order_amount,
        average_order_value,
        customer_lifetime_value,
        points_balance,
        points_earned,
        points_redeemed,
        card_balance,
        visit_count,
        last_visit_date,
        redemption_count,
        last_redemption_date,
        last_order_date,
        order_count,
        membership_tier,
        membership_plan,
        current_offer,
        past_offers,
        offers_claimed_count,
        offers_redeemed_count,
        last_offer_claimed_date,
        notes,
        tags,
        pass_serial_number,
        pass_type_identifier,
        pass_url,
        form_data,
        is_active,
        signup_source,
        created_at,
        updated_at,
        template_id,
        templates (
          id,
          template_json,
          programs (
            name
          )
        )
      `)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (customersError) {
      console.error('❌ Error fetching customers:', customersError)
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${customers?.length || 0} customers for business`)

    // Transform the data to match the Members interface expected by the frontend
    const transformedMembers = customers?.map(customer => ({
      id: customer.id,
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      email: customer.email,
      phone: customer.phone || '',
      dateOfBirth: customer.date_of_birth || '',
      passTypeId: customer.pass_type_identifier || '',
      passUrl: customer.pass_url || '',
      device: 'web', // We don't track device yet, default to web
      serialNumber: customer.pass_serial_number || '',
      
      // 💰 Real financial data from database
      amountSpent: parseFloat(customer.last_order_amount || '0'),
      amountSpentTotal: parseFloat(customer.total_spent || '0'),
      averageOrderValue: parseFloat(customer.average_order_value || '0'),
      customerLifetimeValue: parseFloat(customer.customer_lifetime_value || '0'),
      
      // 🎯 Real loyalty points from database
      points: customer.points_balance || 0,
      pointsRedeemed: customer.points_redeemed || 0,
      pointsTotal: customer.points_earned || 0,
      
      // 🔄 Real visit tracking from database
      lastVisit: customer.last_visit_date || customer.updated_at,
      numberOfVisits: customer.visit_count || 1,
      
      // 🎁 Real redemption tracking from database
      lastDateOfRedemption: customer.last_redemption_date || '',
      numberOfRedemptions: customer.redemption_count || 0,
      lastPointsRedeemed: customer.last_redemption_date || '',
      
      // 📅 Real order tracking from database
      lastOrder: customer.last_order_date || '',
      orderCount: customer.order_count || 0,
      
      // 💳 Real store card balance from database
      cardBalance: parseFloat(customer.card_balance || '0'),
      
      // 🏆 Real membership info from database
      membershipPlan: customer.membership_plan || customer.form_data?.Tier || customer.form_data?.Member_Level || 'Basic',
      loyaltyTier: customer.membership_tier || customer.form_data?.Tier || customer.form_data?.Member_Level || 'Standard',
      
      // 🎁 Real offer tracking from database
      currentOffer: customer.current_offer || '',
      pastOffers: customer.past_offers || [],
      offersClaimedCount: customer.offers_claimed_count || 0,
      offersRedeemedCount: customer.offers_redeemed_count || 0,
      lastOfferClaimedDate: customer.last_offer_claimed_date || '',
      
      // 📝 Real customer management from database
      notes: customer.notes || '',
      tags: customer.tags || [],
      
      // 📊 Standard fields
      memberSince: customer.created_at,
      createdAt: customer.created_at,
      lastActivity: customer.updated_at,
      
      // Additional fields for debugging
      signupSource: customer.signup_source,
      templateName: (() => {
        if (Array.isArray(customer.templates) && customer.templates[0]) {
          const programs = customer.templates[0].programs
          if (Array.isArray(programs) && programs[0]) {
            return programs[0].name || 'Unknown Program'
          }
          return (programs as any)?.name || 'Unknown Program'
        }
        const templates = customer.templates as any
        if (templates?.programs) {
          if (Array.isArray(templates.programs) && templates.programs[0]) {
            return templates.programs[0].name || 'Unknown Program'
          }
          return templates.programs?.name || 'Unknown Program'
        }
        return 'Unknown Program'
      })()
    })) || []

    return NextResponse.json({ 
      data: transformedMembers,
      count: transformedMembers.length 
    })

  } catch (error: any) {
    console.error('❌ Business customers API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
