import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/ledger/append
 * Universal ledger endpoint for all customer events
 * 
 * Supports all event types: earn, redeem, check_in, adjust, auto_reward
 * Sources: member_scanner, staff_scanner, api, admin
 */
export async function POST(request: NextRequest) {
  try {
    const {
      customer_id,
      program_id,
      type,
      amounts_json,
      source,
      idempotency_key,
      observed_at,
      meta_json
    } = await request.json()

    console.log('🔗 Universal ledger append:', { type, source, customer_id, program_id })

    const supabase = await createClient()

    // 1. Validate required fields
    if (!customer_id || !program_id || !type || !source || !idempotency_key) {
      return NextResponse.json({ 
        error: 'Missing required fields: customer_id, program_id, type, source, idempotency_key' 
      }, { status: 400 })
    }

    // 2. Validate event type
    const validEventTypes = ['earn', 'redeem', 'check_in', 'adjust', 'auto_reward']
    if (!validEventTypes.includes(type)) {
      return NextResponse.json({ 
        error: `Invalid event type: ${type}. Must be one of: ${validEventTypes.join(', ')}` 
      }, { status: 400 })
    }

    // 3. Validate source
    const validSources = ['member_scanner', 'staff_scanner', 'api', 'admin']
    if (!validSources.includes(source)) {
      return NextResponse.json({ 
        error: `Invalid event source: ${source}. Must be one of: ${validSources.join(', ')}` 
      }, { status: 400 })
    }

    // 4. Validate amounts_json structure (if provided)
    if (amounts_json && typeof amounts_json !== 'object') {
      return NextResponse.json({ error: 'amounts_json must be an object' }, { status: 400 })
    }
    
    if (amounts_json) {
      const amountKeys = Object.keys(amounts_json)
      if (amountKeys.length > 1) {
        return NextResponse.json({ 
          error: 'amounts_json must contain exactly one amount key (e.g., points_delta, credit_delta, stored_value_delta)' 
        }, { status: 400 })
      }
      
      if (amountKeys.length === 1) {
        const key = amountKeys[0]
        const validAmountKeys = ['points_delta', 'credit_delta', 'stored_value_delta', 'allowance_id']
        
        if (!validAmountKeys.some(validKey => key.includes(validKey.replace('_delta', '')))) {
          console.log('⚠️ Warning: Unexpected amount key:', key, 'Expected one of:', validAmountKeys)
        }
        
        if (key.endsWith('_delta') && typeof amounts_json[key] !== 'number') {
          return NextResponse.json({ 
            error: `Amount for ${key} must be a number` 
          }, { status: 400 })
        }
      }
    }

    // 5. Check for idempotency (prevent duplicate events)
    const { data: existingEvent, error: existingEventError } = await supabase
      .from('customer_events')
      .select('id')
      .eq('idempotency_key', idempotency_key)
      .limit(1)
      .single()

    if (existingEventError && existingEventError.code !== 'PGRST116') { 
      // PGRST116 means no rows found, which is what we want
      console.error('❌ Error checking for existing event:', existingEventError)
      return NextResponse.json({ error: 'Failed to check for existing event' }, { status: 500 })
    }

    if (existingEvent) {
      console.log('⚠️ Duplicate event detected, returning existing event ID:', existingEvent.id)
      return NextResponse.json({
        success: true,
        event_id: existingEvent.id,
        message: 'Event already recorded (idempotent)',
        duplicate: true
      }, { status: 200 })
    }

    // 6. Get the current program version
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('current_version_id, business_id')
      .eq('id', program_id)
      .limit(1)
      .single()

    if (programError || !program) {
      console.error('❌ Error fetching program:', programError)
      return NextResponse.json({ error: 'Program not found or no current version' }, { status: 404 })
    }

    // 7. Insert the new event into customer_events table
    const eventId = uuidv4()
    const recordedAt = new Date().toISOString()
    const observedAt = observed_at || recordedAt

    const { data: newEvent, error: insertError } = await supabase
      .from('customer_events')
      .insert({
        id: eventId,
        business_id: program.business_id, // Link to business for multi-tenant
        customer_id,
        program_id,
        program_version_id: program.current_version_id,
        type,
        amounts_json: amounts_json || {},
        source,
        idempotency_key,
        observed_at: observedAt,
        recorded_at: recordedAt,
        meta_json: meta_json || {}
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating customer event:', insertError)
      return NextResponse.json({ 
        error: 'Failed to record event', 
        details: insertError.message 
      }, { status: 500 })
    }

    console.log('✅ Customer event recorded:', {
      event_id: eventId,
      type,
      source,
      customer_id,
      program_id,
      amounts: amounts_json
    })

    // 8. Return success response
    return NextResponse.json({
      success: true,
      event_id: eventId,
      message: 'Event recorded successfully',
      recorded_at: recordedAt,
      observed_at: observedAt
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error in universal ledger append:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
