import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/customer/summary
 * Returns a summary of customer data based on events
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const programId = searchParams.get('programId')
    const customerId = searchParams.get('customerId')
    
    console.log('📊 Customer summary API called')
    console.log('🔍 Fetching summary for customer:', customerId, 'program:', programId)
    
    if (!businessId || !programId || !customerId) {
      return NextResponse.json({ error: 'businessId, programId, and customerId are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get program type first
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, current_version_id')
      .eq('id', programId)
      .eq('business_id', businessId)
      .limit(1)
      .single()

    if (programError || !program) {
      console.error('❌ Error fetching program:', programError)
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Get program spec
    const { data: programVersion, error: versionError } = await supabase
      .from('program_versions')
      .select('spec_json')
      .eq('id', program.current_version_id)
      .limit(1)
      .single()

    if (versionError || !programVersion) {
      console.error('❌ Error fetching program version:', versionError)
      return NextResponse.json({ error: 'Program version not found' }, { status: 404 })
    }

    const programType = programVersion.spec_json?.program_type || 'loyalty'

    // Get customer events to compute summary
    const { data: events, error: eventsError } = await supabase
      .from('customer_events')
      .select('type, amounts_json, observed_at, meta_json')
      .eq('customer_id', customerId)
      .eq('program_id', programId)
      .order('observed_at', { ascending: false })
      .limit(50)

    if (eventsError) {
      console.log('⚠️ No customer events found, using default values:', eventsError)
    }

    // Compute summary based on program type
    let summary: any = {
      program_type: programType,
      recent_activity: (events || []).slice(0, 10).map(event => ({
        ts: event.observed_at,
        type: event.type,
        points: event.amounts_json?.points_delta || 0,
        credit: event.amounts_json?.credit_delta || 0,
        meta: event.meta_json || {}
      }))
    }

    if (programType === 'loyalty') {
      // Calculate points balance
      const pointsBalance = (events || []).reduce((total, event) => {
        return total + (event.amounts_json?.points_delta || 0)
      }, 0)

      summary = {
        ...summary,
        points_balance: pointsBalance,
        tier: { name: 'Silver', threshold: 1000 },
        points_to_next_tier: Math.max(0, 1000 - pointsBalance),
        claimables: []
      }
    } else if (programType === 'membership') {
      // Calculate credit balance
      const creditBalance = (events || []).reduce((total, event) => {
        return total + (event.amounts_json?.credit_delta || 0)
      }, 0)

      summary = {
        ...summary,
        credit_balance: creditBalance,
        allowances: [
          { id: 'tasting_flights', used: 1, quota: 2 }
        ],
        next_invoice: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        claimables: []
      }
    } else if (programType === 'store_card') {
      // Calculate stored value balance
      const storedValueBalance = (events || []).reduce((total, event) => {
        return total + (event.amounts_json?.stored_value_delta || 0)
      }, 0)

      summary = {
        ...summary,
        stored_value_balance: storedValueBalance
      }
    }

    console.log('✅ Customer summary computed:', programType, 'events:', events?.length || 0)

    return NextResponse.json(summary)

  } catch (error) {
    console.error('❌ Error in customer summary API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}