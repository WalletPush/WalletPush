import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { request_id } = await request.json();

    if (!request_id) {
      return NextResponse.json({ error: 'Missing request_id' }, { status: 400 });
    }

    console.log('🔍 Approving action request:', request_id);

    // Get the request
    const { data: actionRequest, error: requestError } = await supabase
      .from('action_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (requestError || !actionRequest) {
      console.error('❌ Request not found:', requestError);
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (actionRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request is not pending' }, { status: 400 });
    }

    // Get the current program version for the event
    const { data: programVersion } = await supabase
      .from('program_versions')
      .select('id')
      .eq('program_id', actionRequest.program_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Create customer event (the ledger entry)
    const eventData = {
      business_id: actionRequest.business_id,
      program_id: actionRequest.program_id,
      program_version_id: programVersion?.id,
      customer_id: actionRequest.customer_id,
      type: mapActionTypeToEventType(actionRequest.type),
      amounts_json: buildAmountsJson(actionRequest.type, actionRequest.payload),
      source: 'staff_approval',
      meta_json: {
        action_request_id: actionRequest.id,
        approved_by: 'staff', // TODO: Get actual user ID from auth
        ...actionRequest.payload
      },
      idempotency_key: `approved_${actionRequest.idempotency_key}`,
      observed_at: new Date().toISOString()
    };

    const { data: event, error: eventError } = await supabase
      .from('customer_events')
      .insert(eventData)
      .select()
      .single();

    if (eventError) {
      console.error('❌ Error creating customer event:', eventError);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('action_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        reviewer_user_id: 'staff', // TODO: Get actual user ID from auth
        resulting_event_id: event.id
      })
      .eq('id', request_id);

    if (updateError) {
      console.error('❌ Error updating request:', updateError);
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }

    console.log('✅ Action request approved and event created:', event.id);

    // Update customer balance
    const pointsDelta = eventData.amounts_json.points_delta || 0;
    await updateCustomerBalance(supabase, actionRequest.customer_id, pointsDelta);
    
    return NextResponse.json({
      success: true,
      event_id: event.id,
      message: 'Request approved successfully'
    });

  } catch (error) {
    console.error('❌ Error approving request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function mapActionTypeToEventType(actionType: string): string {
  const mapping: Record<string, string> = {
    check_in: 'check_in',
    earn_points: 'earn',
    redeem_offer: 'redeem',
    spend_value: 'spend',
    ticket_use: 'ticket_use',
    receipt_credit: 'earn',
    adjust: 'adjust'
  };
  return mapping[actionType] || actionType;
}

function buildAmountsJson(actionType: string, payload: any): any {
  switch (actionType) {
    case 'earn_points':
    case 'receipt_credit':
      return {
        points_delta: payload.points || 0
      };
    case 'redeem_offer':
      return {
        points_delta: -(payload.points_cost || 0)
      };
    case 'spend_value':
      return {
        stored_value_delta: -(payload.amount || 0)
      };
    case 'adjust':
      return {
        points_delta: payload.points_delta || 0,
        stored_value_delta: payload.stored_value_delta || 0
      };
    default:
      return {};
  }
}

async function updateCustomerBalance(supabase: any, customer_id: string, pointsDelta: number) {
  if (pointsDelta === 0) return; // No balance change needed
  
  try {
    console.log(`🔄 Updating customer balance: ${customer_id} by ${pointsDelta} points`);
    
    // Get current balance
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('points_balance, points_earned, points_redeemed')
      .eq('id', customer_id)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching customer for balance update:', fetchError);
      return;
    }
    
    const currentBalance = customer.points_balance || 0;
    const currentEarned = customer.points_earned || 0;
    const currentRedeemed = customer.points_redeemed || 0;
    
    const newBalance = currentBalance + pointsDelta;
    const newEarned = pointsDelta > 0 ? currentEarned + pointsDelta : currentEarned;
    const newRedeemed = pointsDelta < 0 ? currentRedeemed + Math.abs(pointsDelta) : currentRedeemed;
    
    // Update customer balance
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        points_balance: newBalance,
        points_earned: newEarned,
        points_redeemed: newRedeemed,
        updated_at: new Date().toISOString()
      })
      .eq('id', customer_id);
    
    if (updateError) {
      console.error('❌ Error updating customer balance:', updateError);
    } else {
      console.log(`✅ Customer balance updated: ${currentBalance} → ${newBalance} points`);
    }
  } catch (error) {
    console.error('❌ Error in updateCustomerBalance:', error);
  }
}
