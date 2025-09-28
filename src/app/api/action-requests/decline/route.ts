import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { request_id, reason } = await request.json();

    if (!request_id) {
      return NextResponse.json({ error: 'Missing request_id' }, { status: 400 });
    }

    console.log('🔍 Declining action request:', request_id);

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

    // Update request status to declined
    const { error: updateError } = await supabase
      .from('action_requests')
      .update({
        status: 'declined',
        reviewer_user_id: 'staff', // TODO: Get actual user ID from auth
        policy_applied: {
          ...actionRequest.policy_applied,
          decline_reason: reason || 'Declined by staff',
          declined_at: new Date().toISOString()
        }
      })
      .eq('id', request_id);

    if (updateError) {
      console.error('❌ Error updating request:', updateError);
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }

    console.log('✅ Action request declined:', request_id);

    return NextResponse.json({
      success: true,
      message: 'Request declined successfully'
    });

  } catch (error) {
    console.error('❌ Error declining request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
