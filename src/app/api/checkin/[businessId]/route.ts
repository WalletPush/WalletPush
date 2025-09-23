import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/checkin/[businessId]
 * Customer check-in endpoint - uses universal ledger to record events
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params
    const body = await request.json()
    
    console.log('📱 Customer check-in for business:', businessId)
    
    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get current user (customer)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    console.log(`✅ Check-in attempt by ${user.email} for business ${businessId}`)

    // Get the program for this business
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name, current_version_id')
      .eq('business_id', businessId)
      .limit(1)
      .single()

    if (programError || !program) {
      console.error('❌ Error fetching program:', programError)
      return NextResponse.json({ error: 'Program not found for this business' }, { status: 404 })
    }

    console.log('🎯 Found program:', program.name, 'ID:', program.id)

    // Use universal ledger to record check-in
    const ledgerResponse = await fetch(`${request.nextUrl.origin}/api/ledger/append`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id: user.id,
        program_id: program.id,
        type: 'check_in',
        amounts_json: {}, // No points/credits for basic check-in
        source: 'member_scanner',
        idempotency_key: `checkin_${user.id}_${businessId}_${Date.now()}`,
        observed_at: new Date().toISOString(),
        meta_json: {
          device: body.device || 'customer_scanner',
          location_id: businessId,
          user_agent: request.headers.get('user-agent'),
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          ...body // Include any additional data from the request
        }
      })
    })

    const ledgerResult = await ledgerResponse.json()

    if (!ledgerResponse.ok) {
      console.error('❌ Error recording check-in via ledger:', ledgerResult)
      return NextResponse.json({ 
        error: 'Failed to record check-in', 
        details: ledgerResult.error 
      }, { status: 500 })
    }

    console.log('✅ Check-in recorded via universal ledger:', ledgerResult.event_id)

    // TODO: Award bonus points based on program rules (auto_reward)
    // TODO: Send push notification to wallet pass
    // TODO: Update customer summary/cache

    return NextResponse.json({
      success: true,
      event_id: ledgerResult.event_id,
      message: 'Check-in successful!',
      timestamp: ledgerResult.observed_at,
      duplicate: ledgerResult.duplicate || false,
      program: {
        id: program.id,
        name: program.name
      }
    })

  } catch (error) {
    console.error('❌ Error in check-in API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
