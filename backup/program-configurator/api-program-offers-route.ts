import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const programId = searchParams.get('programId');
    
    if (!businessId || !programId) {
      return NextResponse.json({ 
        error: 'businessId and programId are required' 
      }, { status: 400 });
    }

    const supabase = await createClient();
    
    // For MVP, return mock offers data
    // In production, this would query offers table with availability filtering
    
    const mockOffers = {
      active: [
        {
          id: 'birthday_special',
          title: 'Birthday Treat',
          description: 'Free drink on your birthday month!',
          cost_type: 'free',
          cost_value: 0
        },
        {
          id: 'double_points',
          title: 'Double Points Weekend',
          description: 'Earn 2x points on all purchases this weekend',
          cost_type: 'free',
          cost_value: 0
        },
        {
          id: 'loyalty_bonus',
          title: '20% Off Premium Items',
          description: 'Exclusive discount for loyalty members',
          cost_type: 'points',
          cost_value: 50
        }
      ]
    };
    
    return NextResponse.json(mockOffers);
    
  } catch (error) {
    console.error('Program offers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
