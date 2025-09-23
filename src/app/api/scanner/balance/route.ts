import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/scanner/balance
 * Staff scanner endpoint to check customer balance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customer_id = searchParams.get('customer_id')
    const business_id = searchParams.get('business_id')

    console.log('💰 Staff scanner balance check:', { customer_id, business_id })

    if (!customer_id || !business_id) {
      return NextResponse.json({ 
        error: 'Missing required parameters: customer_id, business_id' 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the program for this business
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name, modes, currency')
      .eq('business_id', business_id)
      .limit(1)
      .single()

    if (programError || !program) {
      console.error('❌ Error fetching program:', programError)
      return NextResponse.json({ error: 'Program not found for this business' }, { status: 404 })
    }

    // Get customer info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('first_name, last_name, email, phone')
      .eq('id', customer_id)
      .single()

    if (customerError) {
      console.error('❌ Error fetching customer:', customerError)
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get all customer events for this program to calculate balances
    const { data: events, error: eventsError } = await supabase
      .from('customer_events')
      .select('type, amounts_json, recorded_at, meta_json')
      .eq('customer_id', customer_id)
      .eq('program_id', program.id)
      .order('recorded_at', { ascending: false })

    if (eventsError) {
      console.log('⚠️ Error fetching customer events (will use defaults):', eventsError)
    }

    // Calculate balances from events
    let points_balance = 0
    let credit_balance = 0
    let stored_value_balance = 0
    let recent_activity = []

    if (events && events.length > 0) {
      for (const event of events) {
        const amounts = event.amounts_json || {}
        
        // Sum up balances
        if (amounts.points_delta) {
          points_balance += amounts.points_delta
        }
        if (amounts.credit_delta) {
          credit_balance += amounts.credit_delta
        }
        if (amounts.stored_value_delta) {
          stored_value_balance += amounts.stored_value_delta
        }

        // Add to recent activity (last 10 events)
        if (recent_activity.length < 10) {
          recent_activity.push({
            type: event.type,
            timestamp: event.recorded_at,
            amounts: amounts,
            meta: event.meta_json || {}
          })
        }
      }
    }

    console.log('✅ Balance calculated:', {
      customer: `${customer.first_name} ${customer.last_name}`,
      points_balance,
      credit_balance,
      stored_value_balance,
      events_count: events?.length || 0
    })

    return NextResponse.json({
      success: true,
      customer: {
        id: customer_id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        phone: customer.phone
      },
      program: {
        id: program.id,
        name: program.name,
        modes: program.modes,
        currency: program.currency
      },
      balances: {
        points: points_balance,
        credit: credit_balance,
        stored_value: stored_value_balance
      },
      recent_activity,
      last_updated: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error in staff scanner balance API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
