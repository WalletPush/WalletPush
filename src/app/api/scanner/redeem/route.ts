import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/scanner/redeem
 * Staff scanner endpoint for redeeming points or offers
 */
export async function POST(request: NextRequest) {
  try {
    const {
      customer_id,
      business_id,
      redemption_type, // 'points' | 'offer' | 'credit' | 'stored_value'
      amount,
      offer_id,
      staff_id,
      location_id,
      meta
    } = await request.json()

    console.log('🎁 Staff scanner redeem:', { customer_id, business_id, redemption_type, amount, offer_id })

    if (!customer_id || !business_id || !redemption_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: customer_id, business_id, redemption_type' 
      }, { status: 400 })
    }

    if (redemption_type === 'points' && (!amount || amount <= 0)) {
      return NextResponse.json({ 
        error: 'points redemption requires positive amount' 
      }, { status: 400 })
    }

    if (redemption_type === 'offer' && !offer_id) {
      return NextResponse.json({ 
        error: 'offer redemption requires offer_id' 
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

    // Prepare amounts_json based on redemption type
    let amounts_json = {}
    let meta_json = {
      staff_id: staff_id || null,
      location_id: location_id || null,
      device: 'staff_scanner',
      scan_type: 'redeem',
      redemption_type,
      ...meta
    }

    switch (redemption_type) {
      case 'points':
        amounts_json = { points_delta: -Math.abs(amount) } // Ensure negative for redemption
        meta_json.points_redeemed = Math.abs(amount)
        break
      
      case 'credit':
        amounts_json = { credit_delta: -Math.abs(amount) }
        meta_json.credit_redeemed = Math.abs(amount)
        break
      
      case 'stored_value':
        amounts_json = { stored_value_delta: -Math.abs(amount) }
        meta_json.stored_value_redeemed = Math.abs(amount)
        break
      
      case 'offer':
        // For offers, the points/credit cost should be looked up from the offer
        if (offer_id) {
          const { data: offer, error: offerError } = await supabase
            .from('offers')
            .select('title, cost_type, cost_value')
            .eq('id', offer_id)
            .single()
          
          if (offer) {
            meta_json.offer_id = offer_id
            meta_json.offer_title = offer.title
            
            if (offer.cost_type === 'points' && offer.cost_value > 0) {
              amounts_json = { points_delta: -offer.cost_value }
            } else if (offer.cost_type === 'credit' && offer.cost_value > 0) {
              amounts_json = { credit_delta: -offer.cost_value }
            }
            // Free offers have no cost deduction
          }
        }
        break
      
      default:
        return NextResponse.json({ 
          error: `Invalid redemption_type: ${redemption_type}. Must be points, credit, stored_value, or offer` 
        }, { status: 400 })
    }

    // Use universal ledger to record redemption
    const ledgerResponse = await fetch(`${request.nextUrl.origin}/api/ledger/append`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id,
        program_id: program.id,
        type: 'redeem',
        amounts_json,
        source: 'staff_scanner',
        idempotency_key: `redeem_${customer_id}_${staff_id || 'unknown'}_${Date.now()}`,
        observed_at: new Date().toISOString(),
        meta_json
      })
    })

    const ledgerResult = await ledgerResponse.json()

    if (!ledgerResponse.ok) {
      console.error('❌ Error recording redemption via ledger:', ledgerResult)
      return NextResponse.json({ 
        error: 'Failed to record redemption', 
        details: ledgerResult.error 
      }, { status: 500 })
    }

    console.log('✅ Redemption recorded via universal ledger:', ledgerResult.event_id)

    return NextResponse.json({
      success: true,
      event_id: ledgerResult.event_id,
      message: `Redemption successful!`,
      redemption_type,
      amount_redeemed: amount,
      offer_id,
      timestamp: ledgerResult.observed_at,
      program: {
        id: program.id,
        name: program.name
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error in staff scanner redeem API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
