import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const programId = searchParams.get('programId');
    const customerId = searchParams.get('customerId');
    
    if (!businessId || !programId || !customerId) {
      return NextResponse.json({ 
        error: 'businessId, programId, and customerId are required' 
      }, { status: 400 });
    }

    const supabase = await createClient();
    
    // For MVP, we'll return mock customer data
    // In production, this would compute from customer_events table
    
    // Check if customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name')
      .eq('id', customerId)
      .single();
    
    if (customerError) {
      console.log('Customer not found, using mock data');
    }
    
    // Mock customer summary data for testing
    const mockSummary = {
      program_type: 'loyalty',
      points_balance: 850,
      tier: {
        name: 'Silver',
        threshold: 1000
      },
      points_to_next_tier: 150,
      credit_balance: 0,
      stored_value_balance: 0,
      claimables: [
        { id: 'free_coffee', title: 'Free Coffee' },
        { id: 'pastry_discount', title: '50% Off Pastry' }
      ],
      recent_activity: [
        {
          ts: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          type: 'earn',
          points: 25,
          meta: { location: 'Downtown Store' }
        },
        {
          ts: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          type: 'redeem',
          points: -100,
          meta: { reward_title: 'Free Coffee' }
        },
        {
          ts: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
          type: 'check_in',
          points: 0,
          meta: {}
        }
      ]
    };
    
    console.log('Returning customer summary for:', customer?.email || customerId);
    
    return NextResponse.json(mockSummary);
    
  } catch (error) {
    console.error('Customer summary API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
