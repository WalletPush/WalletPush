import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    
    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // For MVP, we'll return a mock loyalty program spec
    // In production, this would fetch from program_versions table
    const mockLoyaltySpec = {
      version: '1.0',
      program_id: businessId, // Using businessId as program_id for now
      program_type: 'loyalty',
      currency: 'USD',
      earning: {
        basis: 'spend',
        rate_per_currency: 1
      },
      tiers: {
        enabled: true,
        levels: [
          { name: 'Bronze', threshold: 0 },
          { name: 'Silver', threshold: 1000 },
          { name: 'Gold', threshold: 3000 }
        ]
      },
      redemption: {
        catalog: [
          { id: 'free_coffee', title: 'Free Coffee', cost_points: 100 },
          { id: 'pastry_discount', title: '50% Off Pastry', cost_points: 200 },
          { id: 'free_meal', title: 'Free Meal', cost_points: 500 }
        ]
      },
      copy: {
        program_name: 'Daily Rewards',
        tagline: 'Sip. Earn. Repeat.',
        how_it_works: 'Earn 1 point for every $1 spent. Redeem points for amazing rewards!',
        fine_print: 'Points never expire. Valid at all locations.'
      },
      ui_contract: {
        layout: 'loyalty_dashboard_v1',
        sections: [
          { type: 'balanceHeader', props: ['member.points_balance', 'member.tier.name'] },
          { type: 'progressNextTier', props: ['member.points_to_next_tier', 'program.tiers.levels'] },
          { type: 'rewardsGrid', props: ['program.redemption.catalog', 'member.claimables'] },
          { type: 'howToEarn', props: ['program.earning', 'program.multipliers'] },
          { type: 'offersStrip', props: ['offers.active'] },
          { type: 'qrCheckInButton', props: ['business.check_in_endpoint'] },
          { type: 'activityFeed', props: ['member.recent_activity'] }
        ],
        kpis: ['points_balance', 'points_to_next_tier']
      }
    };

    return NextResponse.json({
      program_id: mockLoyaltySpec.program_id,
      program_type: mockLoyaltySpec.program_type,
      spec: mockLoyaltySpec
    });
    
  } catch (error) {
    console.error('Program spec API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
