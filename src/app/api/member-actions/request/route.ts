import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting member action request processing...');
    
    // Create Supabase client with error handling
    let supabase;
    try {
      supabase = await createClient();
      console.log('✅ Supabase client created successfully');
    } catch (clientError) {
      console.error('❌ Failed to create Supabase client:', clientError);
      throw new Error(`Supabase client creation failed: ${clientError instanceof Error ? clientError.message : 'Unknown client error'}`);
    }
    
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
      console.log('✅ Request body parsed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      throw new Error(`Request body parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
    }
    
    const { 
      business_id, 
      program_id, 
      customer_id, 
      type, 
      payload, 
      idempotency_key 
    } = body;

    console.log('🔍 Member action request:', { business_id, program_id, customer_id, type });
    console.log('🔍 Full request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!business_id || !program_id || !customer_id || !type || !idempotency_key) {
      console.error('❌ Missing required fields:', { business_id, program_id, customer_id, type, idempotency_key });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get program configuration
    console.log('🔍 Querying program_versions for program_id:', program_id);
    const { data: programVersion, error: programError } = await supabase
      .from('program_versions')
      .select('spec_json, actions_config')
      .eq('program_id', program_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('🔍 Program version query result:', { programVersion: !!programVersion, programError });
    if (programError) {
      console.error('❌ Program version query error:', programError);
    }

    if (programError || !programVersion) {
      console.error('❌ Program not found:', programError);
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Use actions_config column as the source of truth (populated during publish)
    const actionsConfig = programVersion.actions_config || {};
    console.log('🔍 Actions config from program_versions.actions_config:', JSON.stringify(actionsConfig, null, 2));
    console.log('🔍 Actions config keys:', Object.keys(actionsConfig));
    console.log('🔍 Looking for type:', type);
    console.log('🔍 actionsConfig[type]:', actionsConfig[type]);
    
    // Handle both old and new config structures
    let actionConfig;
    if (actionsConfig[type]) {
      // Old structure: actions_config.check_in.enabled
      actionConfig = actionsConfig[type];
    } else {
      // New structure: actions_config.enableCheckIn
      const enabledKey = getEnabledKey(type);
      const autoApproveKey = getAutoApproveKey(type);
      const cooldownKey = getCooldownKey(type);
      const pointsKey = getPointsKey(type);
      
      console.log('🔍 Helper function results:', {
        enabledKey,
        autoApproveKey,
        cooldownKey,
        pointsKey,
        enabledValue: actionsConfig[enabledKey],
        autoApproveValue: actionsConfig[autoApproveKey],
        cooldownValue: actionsConfig[cooldownKey],
        pointsValue: actionsConfig[pointsKey]
      });
      
      actionConfig = {
        enabled: actionsConfig[enabledKey],
        auto_approve: actionsConfig[autoApproveKey],
        cooldown: actionsConfig[cooldownKey],
        points: actionsConfig[pointsKey]
      };
    }

    console.log('🔍 Action config for', type, ':', actionConfig);

    if (!actionConfig?.enabled) {
      return NextResponse.json({ error: 'Action not enabled' }, { status: 403 });
    }

    // Check cooldowns and limits
    const cooldownCheck = await checkCooldowns(supabase, customer_id, business_id, type, actionConfig);
    if (!cooldownCheck.allowed) {
      return NextResponse.json({ 
        error: 'Action not allowed', 
        reason: cooldownCheck.reason 
      }, { status: 429 });
    }

    // Check if this should be auto-approved
    const shouldAutoApproveAction = actionConfig.auto_approve && shouldAutoApprove(type, payload, actionConfig);

    if (shouldAutoApproveAction) {
      console.log('🚀 Auto-approving action directly to ledger');
      
      // Get the current program version for the event
      const { data: programVersion } = await supabase
        .from('program_versions')
        .select('id')
        .eq('program_id', program_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Create customer event directly (skip action_requests for auto-approve)
      const amountsJson = buildAmountsJson(type, payload);
      const pointsDelta = amountsJson.points_delta || 0;
      
      const eventData = {
        business_id,
        program_id,
        program_version_id: programVersion?.id,
        customer_id,
        type: mapActionTypeToEventType(type),
        amounts_json: amountsJson,
        source: 'member_scanner', // Changed from 'api' to 'member_scanner' for member-initiated actions
        meta_json: {
          auto_approved: true,
          policy_applied: {
            config: actionConfig,
            cooldown_check: cooldownCheck
          },
          ...payload
        },
        idempotency_key: `auto_${idempotency_key}`,
        observed_at: new Date().toISOString()
      };

      const { data: event, error: eventError } = await supabase
        .from('customer_events')
        .insert(eventData)
        .select()
        .single();

      if (eventError) {
        console.error('❌ Error creating customer event:', eventError);
        if (eventError.code === '23505') { // Unique constraint violation
          return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
        }
        throw eventError;
      }

      console.log('✅ Auto-approved action created directly in ledger:', event.id);

      // Update customer balance
      await updateCustomerBalance(supabase, customer_id, pointsDelta);

      return NextResponse.json({
        success: true,
        status: 'auto_approved',
        event_id: event.id,
        message: 'Action completed successfully!'
      });
    }

    // For manual approval actions, create action request
    const { data: actionRequest, error: insertError } = await supabase
      .from('action_requests')
      .insert({
        business_id,
        program_id,
        customer_id,
        type,
        payload,
        idempotency_key,
        source: 'member_dashboard',
        policy_applied: {
          config: actionConfig,
          cooldown_check: cooldownCheck
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting action request:', insertError);
      if (insertError.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
      }
      throw insertError;
    }

    console.log('✅ Action request created for manual approval:', actionRequest.id);

    return NextResponse.json({
      success: true,
      status: 'pending',
      request_id: actionRequest.id,
      message: 'Request submitted for approval'
    });

  } catch (error) {
    console.error('❌ Error creating action request:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error constructor:', error?.constructor?.name);
    
    // Handle different error types
    let errorMessage = 'Unknown error';
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    } else if (typeof error === 'string') {
      errorMessage = error;
      errorDetails = { message: error };
    } else if (error && typeof error === 'object') {
      errorMessage = (error as any).message || error.toString() || 'Object error';
      errorDetails = { ...error };
    }
    
    console.error('❌ PRODUCTION ERROR DETAILS:', {
      errorMessage,
      errorDetails,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: errorMessage,
      errorType: typeof error,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function checkCooldowns(supabase: any, customer_id: string, business_id: string, type: string, config: any) {
  // Check recent requests for this action type
  const cooldownMinutes = config.cooldown_minutes || 0;
  if (cooldownMinutes > 0) {
    const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000);
    
    // Check both action_requests AND customer_events for cooldowns
    const [actionRequestsResult, customerEventsResult] = await Promise.all([
      supabase
        .from('action_requests')
        .select('id')
        .eq('customer_id', customer_id)
        .eq('business_id', business_id)
        .eq('type', type)
        .gte('created_at', cutoff.toISOString())
        .limit(1),
      supabase
        .from('customer_events')
        .select('id')
        .eq('customer_id', customer_id)
        .eq('business_id', business_id)
        .eq('type', mapActionTypeToEventType(type))
        .gte('recorded_at', cutoff.toISOString())
        .limit(1)
    ]);

    if ((actionRequestsResult.data && actionRequestsResult.data.length > 0) ||
        (customerEventsResult.data && customerEventsResult.data.length > 0)) {
      return {
        allowed: false,
        reason: `Cooldown active. Try again in ${cooldownMinutes} minutes.`
      };
    }
  }

  // Check daily limits
  const maxPerDay = config.max_per_day || 0;
  if (maxPerDay > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check both action_requests AND customer_events for daily limits
    const [actionRequestsResult, customerEventsResult] = await Promise.all([
      supabase
        .from('action_requests')
        .select('id')
        .eq('customer_id', customer_id)
        .eq('business_id', business_id)
        .eq('type', type)
        .gte('created_at', today.toISOString()),
      supabase
        .from('customer_events')
        .select('id')
        .eq('customer_id', customer_id)
        .eq('business_id', business_id)
        .eq('type', mapActionTypeToEventType(type))
        .gte('recorded_at', today.toISOString())
    ]);

    const totalToday = (actionRequestsResult.data?.length || 0) + (customerEventsResult.data?.length || 0);
    
    if (totalToday >= maxPerDay) {
      return {
        allowed: false,
        reason: `Daily limit reached (${maxPerDay} per day)`
      };
    }
  }

  return { allowed: true };
}

function shouldAutoApprove(type: string, payload: any, config: any): boolean {
  // Basic auto-approval logic
  switch (type) {
    case 'check_in':
      return true; // Check-ins are usually safe to auto-approve
    
    case 'earn_points':
      const maxPoints = config.max_amount || 50;
      return payload.points <= maxPoints;
    
    case 'spend_value':
      const maxAmount = config.max_amount || 100;
      return payload.amount <= maxAmount;
    
    default:
      return false;
  }
}

async function approveActionRequest(supabase: any, requestId: string, reviewerId: string) {
  try {
    // Get the request
    const { data: request, error: requestError } = await supabase
      .from('action_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return { success: false, error: 'Request not found' };
    }

    // Get the current program version for the event
    const { data: programVersion } = await supabase
      .from('program_versions')
      .select('id')
      .eq('program_id', request.program_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Create customer event (the ledger entry)
    const eventData = {
      business_id: request.business_id,
      program_id: request.program_id,
      program_version_id: programVersion?.id,
      customer_id: request.customer_id,
      type: mapActionTypeToEventType(request.type),
      amounts_json: buildAmountsJson(request.type, request.payload),
        source: 'api',
        meta_json: {
          action_request_id: request.id,
          ...request.payload
        },
      idempotency_key: `approved_${request.idempotency_key}`,
      observed_at: new Date().toISOString()
    };

    const { data: event, error: eventError } = await supabase
      .from('customer_events')
      .insert(eventData)
      .select()
      .single();

    if (eventError) {
      console.error('❌ Error creating customer event:', eventError);
      return { success: false, error: 'Failed to create event' };
    }

    // Update request status
    await supabase
      .from('action_requests')
      .update({
        status: 'auto_approved',
        approved_at: new Date().toISOString(),
        resulting_event_id: event.id
      })
      .eq('id', requestId);

    console.log('✅ Action request approved and event created:', event.id);

    // Update customer balance
    const pointsDelta = eventData.amounts_json.points_delta || 0;
    await updateCustomerBalance(supabase, request.customer_id, pointsDelta);
    
    return { success: true, event_id: event.id };

  } catch (error) {
    console.error('❌ Error approving request:', error);
    return { success: false, error: 'Approval failed' };
  }
}

function mapActionTypeToEventType(actionType: string): string {
  switch (actionType) {
    case 'check_in':
      return 'check_in';
    case 'earn_points':
      return 'earn';
    case 'redeem_offer':
      return 'redeem';
    case 'spend_value':
      return 'redeem';
    default:
      return 'adjust';
  }
}

function buildAmountsJson(type: string, payload: any) {
  switch (type) {
    case 'check_in':
      return { points_delta: payload.points || 0 };
      
    case 'earn_points':
      return { points_delta: payload.points || 0 };
    
    case 'spend_value':
      return { stored_value_delta: -(payload.amount * 100) }; // Convert to cents
    
    case 'redeem_offer':
      return { points_delta: -(payload.points_cost || 0) };
    
    default:
      return {};
  }
}

// Helper functions to map action types to config keys
function getEnabledKey(actionType: string): string {
  switch (actionType) {
    case 'check_in': return 'enableCheckIn';
    case 'earn_points': return 'enableEarnPoints';
    case 'redeem_offer': return 'enableRedeemOffer';
    case 'receipt_credit': return 'enableReceiptCredit';
    default: return `enable${actionType}`;
  }
}

function getAutoApproveKey(actionType: string): string {
  switch (actionType) {
    case 'check_in': return 'checkInAutoApprove';
    case 'earn_points': return 'earnPointsAutoApprove';
    case 'redeem_offer': return 'redeemOfferAutoApprove';
    case 'receipt_credit': return 'receiptCreditAutoApprove';
    default: return `${actionType}AutoApprove`;
  }
}

function getCooldownKey(actionType: string): string {
  switch (actionType) {
    case 'check_in': return 'checkInCooldown';
    case 'earn_points': return 'earnPointsCooldown';
    case 'redeem_offer': return 'redeemOfferCooldown';
    case 'receipt_credit': return 'receiptCreditCooldown';
    default: return `${actionType}Cooldown`;
  }
}

function getPointsKey(actionType: string): string {
  switch (actionType) {
    case 'check_in': return 'checkInPoints';
    case 'earn_points': return 'earnPointsAmount';
    default: return `${actionType}Points`;
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

