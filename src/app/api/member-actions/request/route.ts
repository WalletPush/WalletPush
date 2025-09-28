import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
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
    console.log('🔍 Actions config from program_versions.actions_config:', actionsConfig);
    
    // Handle both old and new config structures
    let actionConfig;
    if (actionsConfig[type]) {
      // Old structure: actions_config.check_in.enabled
      actionConfig = actionsConfig[type];
    } else {
      // New structure: actions_config.enableCheckIn
      const enabledKey = getEnabledKey(type);
      const autoApproveKey = getAutoApproveKey(type);
      
      actionConfig = {
        enabled: actionsConfig[enabledKey],
        auto_approve: actionsConfig[autoApproveKey],
        cooldown: actionsConfig[getCooldownKey(type)],
        points: actionsConfig[getPointsKey(type)]
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

    // Create action request
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

    console.log('✅ Action request created:', actionRequest.id);

    // Check if auto-approve
    if (actionConfig.auto_approve && shouldAutoApprove(type, payload, actionConfig)) {
      console.log('🚀 Auto-approving request:', actionRequest.id);
      const approvalResult = await approveActionRequest(supabase, actionRequest.id, 'system');
      
      if (approvalResult.success) {
        return NextResponse.json({
          success: true,
          status: 'auto_approved',
          request_id: actionRequest.id,
          event_id: approvalResult.event_id,
          message: 'Action completed successfully!'
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: 'pending',
      request_id: actionRequest.id,
      message: 'Request submitted for approval'
    });

  } catch (error) {
    console.error('❌ Error creating action request:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    
    // More specific error logging for production debugging
    if (error instanceof Error) {
      console.error('❌ PRODUCTION ERROR DETAILS:', {
        errorMessage: error.message,
        errorName: error.name,
        stackTrace: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: error instanceof Error ? error.message : 'Unknown error', // Always include debug info for now
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function checkCooldowns(supabase: any, customer_id: string, business_id: string, type: string, config: any) {
  // Check recent requests for this action type
  const cooldownMinutes = config.cooldown_minutes || 0;
  if (cooldownMinutes > 0) {
    const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000);
    
    const { data: recentRequests } = await supabase
      .from('action_requests')
      .select('id')
      .eq('customer_id', customer_id)
      .eq('business_id', business_id)
      .eq('type', type)
      .gte('created_at', cutoff.toISOString())
      .limit(1);

    if (recentRequests && recentRequests.length > 0) {
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
    
    const { data: todayRequests } = await supabase
      .from('action_requests')
      .select('id')
      .eq('customer_id', customer_id)
      .eq('business_id', business_id)
      .eq('type', type)
      .gte('created_at', today.toISOString());

    if (todayRequests && todayRequests.length >= maxPerDay) {
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

    // TODO: Trigger side effects (balance updates, pass updates, etc.)
    
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

