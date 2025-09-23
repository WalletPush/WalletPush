import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/scanner/earn
 * Staff scanner endpoint for awarding points to customers
 */
export async function POST(request: NextRequest) {
  try {
    const {
      customer_id,
      business_id,
      points_amount,
      staff_id,
      location_id,
      subtotal,
      meta
    } = await request.json()

    console.log('📈 Staff scanner earn points:', { customer_id, business_id, points_amount })

    if (!customer_id || !business_id || !points_amount) {
      return NextResponse.json({ 
        error: 'Missing required fields: customer_id, business_id, points_amount' 
      }, { status: 400 })
    }

    if (typeof points_amount !== 'number' || points_amount <= 0) {
      return NextResponse.json({ 
        error: 'points_amount must be a positive number' 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the program for this business
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name')
      .eq('business_id', business_id)
      .limit(1)
      .single()

    if (programError || !program) {
      console.error('❌ Error fetching program:', programError)
      return NextResponse.json({ error: 'Program not found for this business' }, { status: 404 })
    }

    // Use universal ledger to record points earning
    const ledgerResponse = await fetch(`${request.nextUrl.origin}/api/ledger/append`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id,
        program_id: program.id,
        type: 'earn',
        amounts_json: {
          points_delta: points_amount
        },
        source: 'staff_scanner',
        idempotency_key: `earn_${customer_id}_${staff_id || 'unknown'}_${Date.now()}`,
        observed_at: new Date().toISOString(),
        meta_json: {
          staff_id: staff_id || null,
          location_id: location_id || null,
          subtotal: subtotal || null,
          device: 'staff_scanner',
          scan_type: 'earn_points',
          ...meta
        }
      })
    })

    const ledgerResult = await ledgerResponse.json()

    if (!ledgerResponse.ok) {
      console.error('❌ Error recording earn via ledger:', ledgerResult)
      return NextResponse.json({ 
        error: 'Failed to record points earning', 
        details: ledgerResult.error 
      }, { status: 500 })
    }

    console.log('✅ Points earned recorded via universal ledger:', ledgerResult.event_id)

    return NextResponse.json({
      success: true,
      event_id: ledgerResult.event_id,
      message: `Awarded ${points_amount} points!`,
      points_awarded: points_amount,
      timestamp: ledgerResult.observed_at,
      program: {
        id: program.id,
        name: program.name
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error in staff scanner earn API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
