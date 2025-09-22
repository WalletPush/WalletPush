import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;
    const body = await request.json();
    
    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Get current user (customer)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.log(`Check-in attempt by ${user.email} for business ${businessId}`);
    
    // For MVP, we'll just log the check-in and return success
    // In production, this would:
    // 1. Create customer_events record
    // 2. Award points based on program rules
    // 3. Update customer summary
    // 4. Send push notification to wallet pass
    
    const checkInEvent = {
      business_id: businessId,
      customer_id: user.id,
      type: 'check_in',
      timestamp: new Date().toISOString(),
      device: body.device || 'customer_scanner',
      meta: body
    };
    
    console.log('Check-in event:', checkInEvent);
    
    // Mock successful check-in response
    return NextResponse.json({
      success: true,
      message: 'Check-in successful!',
      points_earned: 10, // Mock points for check-in
      timestamp: checkInEvent.timestamp
    });
    
  } catch (error) {
    console.error('Check-in API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
