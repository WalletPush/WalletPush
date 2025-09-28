import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Loading business customer events...')

    const supabase = await createClient()

    // Get current user and their business
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's business membership
    const { data: membership } = await supabase
      .from('account_members')
      .select('account_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No business access' }, { status: 403 })
    }

    // Get customer events for this business
    const { data: customerEvents, error } = await supabase
      .from('customer_events')
      .select(`
        id,
        business_id,
        program_id,
        program_version_id,
        customer_id,
        type,
        amounts_json,
        source,
        meta_json,
        idempotency_key,
        observed_at,
        recorded_at,
        customers (
          first_name,
          last_name,
          email
        )
      `)
      .eq('business_id', membership.account_id)
      .order('observed_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('❌ Error loading customer events:', error)
      return NextResponse.json({ error: 'Failed to load customer events' }, { status: 500 })
    }

    console.log('✅ Loaded customer events:', customerEvents?.length || 0)

    return NextResponse.json(customerEvents || [])

  } catch (error) {
    console.error('❌ Customer events API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
