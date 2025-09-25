import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentBusinessId } from '@/lib/business-context'

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

    // Get business ID dynamically
    const businessId = await getCurrentBusinessId(request)
    
    if (!businessId) {
      return NextResponse.json({ error: 'No business found for current user' }, { status: 404 })
    }
    
    console.log('🔍 Fetching business profile for:', businessId)

    // Fetch business profile data
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()

    if (businessError) {
      console.error('❌ Error loading business profile:', businessError)
      return NextResponse.json({ 
        error: 'Failed to load business profile',
        debug: businessError.message
      }, { status: 500 })
    }

    if (!businessData) {
      return NextResponse.json({ 
        error: 'Business profile not found' 
      }, { status: 404 })
    }

    // Transform the data to match frontend expectations
    const profile = {
      id: businessData.id,
      name: businessData.name,
      slug: businessData.slug,
      contact_email: businessData.contact_email,
      contact_phone: businessData.contact_phone,
      address: businessData.address,
      city: businessData.city,
      state: businessData.state,
      zip_code: businessData.zip_code,
      country: businessData.country,
      subscription_status: businessData.subscription_status,
      subscription_plan: businessData.subscription_plan,
      monthly_cost: businessData.monthly_cost,
      max_passes: businessData.max_passes,
      max_members: businessData.max_members,
      total_passes_created: businessData.total_passes_created,
      total_members: businessData.total_members,
      custom_domain: businessData.custom_domain,
      trial_ends_at: businessData.trial_ends_at,
      next_billing_date: businessData.next_billing_date,
      created_at: businessData.created_at,
      updated_at: businessData.updated_at
    }

    return NextResponse.json({ 
      success: true,
      profile 
    })

  } catch (error) {
    console.error('❌ Business profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { field, value } = body

    if (!field || value === undefined) {
      return NextResponse.json({ error: 'Field and value are required' }, { status: 400 })
    }

    // Get business ID dynamically
    const businessId = await getCurrentBusinessId(request)

    if (!businessId) {
      return NextResponse.json({ error: 'No business found for current user' }, { status: 404 })
    }

    // Update the business profile
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ [field]: value })
      .eq('id', businessId)

    if (updateError) {
      console.error('❌ Error updating business profile:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update profile',
        debug: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('❌ Business profile update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
