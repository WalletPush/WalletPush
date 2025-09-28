import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Loading business action requests...')

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

    // Get action requests for this business
    const { data: actionRequests, error } = await supabase
      .from('action_requests')
      .select(`
        id,
        business_id,
        program_id,
        customer_id,
        type,
        payload,
        status,
        source,
        policy_applied,
        risk_score,
        reviewer_user_id,
        approved_at,
        resulting_event_id,
        idempotency_key,
        created_at,
        updated_at,
        customers!customer_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('business_id', membership.account_id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('❌ Error loading action requests:', error)
      return NextResponse.json({ error: 'Failed to load action requests' }, { status: 500 })
    }

    console.log('✅ Loaded action requests:', actionRequests?.length || 0)
    
    // Debug: Log the first request to see the customer data structure
    if (actionRequests && actionRequests.length > 0) {
      console.log('🔍 First action request structure:', JSON.stringify(actionRequests[0], null, 2));
    }

    return NextResponse.json(actionRequests || [])

  } catch (error) {
    console.error('❌ Action requests API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
