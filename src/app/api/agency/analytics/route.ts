import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch comprehensive analytics data for agency

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    console.log('📊 Fetching analytics for user:', user.email, 'timeRange:', timeRange)

    // Get current active account (should be agency or platform)
    const { data: activeAccount } = await supabase
      .from('user_active_account')
      .select('active_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    // If no active account, get user's first agency account
    let agencyAccountId = activeAccount?.active_account_id
    
    if (!agencyAccountId) {
      const { data: userAccounts } = await supabase
        .from('account_members')
        .select(`
          account_id,
          role,
          accounts!inner (
            id,
            type
          )
        `)
        .eq('user_id', user.id)
        .in('accounts.type', ['agency', 'platform'])
        .in('role', ['owner', 'admin'])
        .limit(1)
        .single()

      agencyAccountId = userAccounts?.account_id
    }

    if (!agencyAccountId) {
      return NextResponse.json({ error: 'No agency account found' }, { status: 404 })
    }

    console.log('🏢 Generating analytics for agency:', agencyAccountId)

    // TODO: Replace with actual database queries once schema is applied
    // This would involve complex aggregations across:
    // - Revenue data from subscriptions and payments
    // - Pass usage data from pass generation logs
    // - Business performance metrics
    // - Geographic and demographic analysis
    // - Predictive analytics and insights
    
    // For now, return spectacular mock data that adapts to time range
    const getTimeRangeMultiplier = (range: string) => {
      switch (range) {
        case '7d': return 0.25
        case '30d': return 1
        case '90d': return 2.8
        case '1y': return 12
        default: return 1
      }
    }

    const multiplier = getTimeRangeMultiplier(timeRange)
    const baseRevenue = 3850
    const baseBusinesses = 47
    const basePasses = 67420

    const analyticsData = {
      // Revenue Metrics
      mrr: Math.round(baseRevenue * multiplier),
      arr: Math.round(baseRevenue * 12 * multiplier),
      potentialRevenue: Math.round(75000 * multiplier),
      revenueGrowth: timeRange === '7d' ? 5.2 : timeRange === '1y' ? 45.8 : 23.5,
      
      // Business Metrics
      totalBusinesses: Math.round(baseBusinesses * (multiplier > 1 ? Math.sqrt(multiplier) : multiplier)),
      activeBusinesses: Math.round(42 * (multiplier > 1 ? Math.sqrt(multiplier) : multiplier)),
      trialBusinesses: Math.round(8 * (multiplier > 1 ? Math.sqrt(multiplier) : multiplier)),
      churnRate: timeRange === '7d' ? 1.1 : timeRange === '1y' ? 8.7 : 3.2,
      
      // Pass Metrics
      totalPassesUsed: Math.round(basePasses * multiplier),
      passesRemaining: Math.round((100000 - basePasses) * multiplier),
      passUtilization: timeRange === '7d' ? 15.2 : timeRange === '1y' ? 89.4 : 67.4,
      passGrowthRate: timeRange === '7d' ? 3.1 : timeRange === '1y' ? 78.9 : 18.7,
      
      // Performance Metrics
      avgRevenuePerBusiness: Math.round(82 * multiplier),
      customerLifetimeValue: Math.round(1240 * (multiplier > 1 ? Math.sqrt(multiplier) : multiplier)),
      conversionRate: timeRange === '7d' ? 85.2 : timeRange === '1y' ? 72.1 : 78.3,
      
      // Trending Data - Adapts to time range
      revenueChart: timeRange === '7d' ? [
        { month: 'Mon', revenue: 520, businesses: 42 },
        { month: 'Tue', revenue: 560, businesses: 42 },
        { month: 'Wed', revenue: 510, businesses: 43 },
        { month: 'Thu', revenue: 620, businesses: 43 },
        { month: 'Fri', revenue: 680, businesses: 44 },
        { month: 'Sat', revenue: 630, businesses: 44 },
        { month: 'Sun', revenue: 660, businesses: 45 }
      ] : timeRange === '1y' ? [
        { month: 'Q1', revenue: 9500, businesses: 28 },
        { month: 'Q2', revenue: 12200, businesses: 35 },
        { month: 'Q3', revenue: 14800, businesses: 41 },
        { month: 'Q4', revenue: 16800, businesses: 47 }
      ] : [
        { month: 'Jan', revenue: 2890, businesses: 32 },
        { month: 'Feb', revenue: 3120, businesses: 35 },
        { month: 'Mar', revenue: 3340, businesses: 38 },
        { month: 'Apr', revenue: 3520, businesses: 40 },
        { month: 'May', revenue: 3680, businesses: 43 },
        { month: 'Jun', revenue: 3850, businesses: 47 }
      ],
      
      passUsageChart: timeRange === '7d' ? [
        { date: 'Mon', passes: 1200, businesses: 38 },
        { date: 'Tue', passes: 1450, businesses: 39 },
        { date: 'Wed', passes: 1680, businesses: 41 },
        { date: 'Thu', passes: 1520, businesses: 42 },
        { date: 'Fri', passes: 1890, businesses: 43 },
        { date: 'Sat', passes: 1750, businesses: 45 },
        { date: 'Sun', passes: 1650, businesses: 47 }
      ] : [
        { date: '1w ago', passes: 8420, businesses: 38 },
        { date: '6d ago', passes: 9150, businesses: 39 },
        { date: '5d ago', passes: 9890, businesses: 41 },
        { date: '4d ago', passes: 10200, businesses: 42 },
        { date: '3d ago', passes: 10850, businesses: 43 },
        { date: '2d ago', passes: 11200, businesses: 45 },
        { date: 'Yesterday', passes: 11750, businesses: 47 }
      ],
      
      businessGrowthChart: timeRange === '1y' ? [
        { month: 'Q1', new: 18, churned: 4, net: 14 },
        { month: 'Q2', new: 22, churned: 3, net: 19 },
        { month: 'Q3', new: 15, churned: 5, net: 10 },
        { month: 'Q4', new: 28, churned: 2, net: 26 }
      ] : [
        { month: 'Jan', new: 8, churned: 2, net: 6 },
        { month: 'Feb', new: 6, churned: 1, net: 5 },
        { month: 'Mar', new: 7, churned: 2, net: 5 },
        { month: 'Apr', new: 5, churned: 1, net: 4 },
        { month: 'May', new: 9, churned: 2, net: 7 },
        { month: 'Jun', new: 8, churned: 1, net: 7 }
      ],
      
      // Top Performers - Dynamic based on time range
      topBusinesses: [
        { 
          name: 'Premium Coffee Co.', 
          revenue: Math.round(450 * multiplier), 
          passes: Math.round(8420 * multiplier), 
          growth: timeRange === '7d' ? 8.2 : timeRange === '1y' ? 156.7 : 34.2 
        },
        { 
          name: 'Elite Fitness Club', 
          revenue: Math.round(380 * multiplier), 
          passes: Math.round(6890 * multiplier), 
          growth: timeRange === '7d' ? 6.1 : timeRange === '1y' ? 142.3 : 28.7 
        },
        { 
          name: 'Luxury Spa Resort', 
          revenue: Math.round(320 * multiplier), 
          passes: Math.round(5240 * multiplier), 
          growth: timeRange === '7d' ? 4.8 : timeRange === '1y' ? 128.9 : 22.1 
        },
        { 
          name: 'Gourmet Restaurant', 
          revenue: Math.round(280 * multiplier), 
          passes: Math.round(4120 * multiplier), 
          growth: timeRange === '7d' ? 3.9 : timeRange === '1y' ? 115.4 : 19.8 
        },
        { 
          name: 'Fashion Boutique', 
          revenue: Math.round(240 * multiplier), 
          passes: Math.round(3890 * multiplier), 
          growth: timeRange === '7d' ? 2.7 : timeRange === '1y' ? 98.7 : 15.3 
        }
      ],
      
      topPrograms: [
        { name: 'VIP Loyalty Program', business: 'Premium Coffee Co.', installs: Math.round(12400 * multiplier), engagement: 89.2 },
        { name: 'Fitness Membership', business: 'Elite Fitness Club', installs: Math.round(9800 * multiplier), engagement: 84.7 },
        { name: 'Spa Rewards', business: 'Luxury Spa Resort', installs: Math.round(7600 * multiplier), engagement: 91.5 },
        { name: 'Dining Club', business: 'Gourmet Restaurant', installs: Math.round(6200 * multiplier), engagement: 76.3 },
        { name: 'Style Points', business: 'Fashion Boutique', installs: Math.round(4800 * multiplier), engagement: 82.1 }
      ],
      
      // Insights & Alerts - Dynamic based on performance
      insights: [
        {
          type: 'success',
          title: timeRange === '1y' ? 'Annual Revenue Target Exceeded! 🎉' : 'Revenue Milestone Achieved! 🎉',
          description: timeRange === '1y' 
            ? `Your ARR has reached $${Math.round(baseRevenue * 12 * multiplier / 1000)}K! You've exceeded your annual target by 23%.`
            : `Your MRR has crossed $${baseRevenue * multiplier}! You're on track to hit $5K by Q4.`,
          action: 'View Revenue Forecast'
        },
        {
          type: 'warning',
          title: 'Pass Utilization Alert',
          description: timeRange === '1y' 
            ? 'Annual pass allocation is 89% utilized. Consider upgrading your plan or optimizing usage.'
            : '3 businesses are approaching their pass limits. Consider upselling to higher tiers.',
          action: 'Contact High-Usage Clients'
        },
        {
          type: 'success',
          title: 'Conversion Rate Excellence',
          description: `Your trial-to-paid conversion rate of ${timeRange === '7d' ? '85.2' : timeRange === '1y' ? '72.1' : '78.3'}% is ${timeRange === '1y' ? '15' : '23'}% above industry average!`,
          action: 'Analyze Success Factors'
        },
        {
          type: timeRange === '1y' ? 'warning' : 'danger',
          title: timeRange === '1y' ? 'Seasonal Churn Pattern' : 'Churn Risk Detected',
          description: timeRange === '1y' 
            ? 'Q3 showed higher churn (8.7%). Implement retention strategies for summer months.'
            : '2 businesses haven\'t logged in for 14+ days. Proactive outreach recommended.',
          action: timeRange === '1y' ? 'Plan Retention Campaign' : 'View At-Risk Accounts'
        }
      ],
      
      // Geographic Data
      revenueByRegion: [
        { region: 'North America', revenue: Math.round(2310 * multiplier), businesses: Math.round(28 * (multiplier > 1 ? Math.sqrt(multiplier) : multiplier)) },
        { region: 'Europe', revenue: Math.round(1000 * multiplier), businesses: Math.round(12 * (multiplier > 1 ? Math.sqrt(multiplier) : multiplier)) },
        { region: 'Asia Pacific', revenue: Math.round(450 * multiplier), businesses: Math.round(5 * (multiplier > 1 ? Math.sqrt(multiplier) : multiplier)) },
        { region: 'Latin America', revenue: Math.round(90 * multiplier), businesses: Math.round(2 * (multiplier > 1 ? Math.sqrt(multiplier) : multiplier)) }
      ],
      
      // Package Performance
      packagePerformance: [
        { 
          package: 'Starter ($29)', 
          businesses: Math.round(18 * (multiplier > 1 ? Math.sqrt(multiplier) : multiplier)), 
          revenue: Math.round(522 * multiplier), 
          satisfaction: timeRange === '1y' ? 4.4 : 4.2 
        },
        { 
          package: 'Business ($69)', 
          businesses: Math.round(21 * (multiplier > 1 ? Math.sqrt(multiplier) : multiplier)), 
          revenue: Math.round(1449 * multiplier), 
          satisfaction: timeRange === '1y' ? 4.7 : 4.6 
        },
        { 
          package: 'Pro ($97)', 
          businesses: Math.round(8 * (multiplier > 1 ? Math.sqrt(multiplier) : multiplier)), 
          revenue: Math.round(776 * multiplier), 
          satisfaction: timeRange === '1y' ? 4.9 : 4.8 
        }
      ]
    }

    console.log(`✅ Generated comprehensive analytics for ${timeRange} period`)

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('❌ Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
