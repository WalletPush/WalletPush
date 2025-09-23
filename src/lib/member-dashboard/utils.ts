// Types for the member dashboard system
export interface ProgramSpecResponse {
  program_id: string;
  business_id: string;
  program_type: 'loyalty' | 'membership' | 'store_card';
  spec: {
    copy: {
      program_name?: string;
      tagline?: string;
      welcome_message?: string;
    };
    ui_contract: {
      sections: UISection[];
    };
  };
}

export interface UISection {
  type: string;
  props: Record<string, any>;
}

export interface CustomerSummary {
  customer_id: string;
  member_name: string;
  member_since: string;
  profile_image?: string;
  
  // Loyalty-specific fields
  points?: number;
  tier?: string;
  current_points?: number;
  next_tier_points?: number;
  next_tier_name?: string;
  earning_rules?: Array<{
    description: string;
    points: number;
  }>;
  available_rewards?: Array<{
    name: string;
    description: string;
    cost: number;
  }>;
  
  // Membership-specific fields
  membership_status?: string;
  expiry_date?: string;
  member_id?: string;
  membership_perks?: Array<{
    name: string;
    description: string;
  }>;
  auto_renewal?: boolean;
  next_billing_date?: string;
  monthly_fee?: number;
  
  // Store card-specific fields
  balance?: number;
  current_balance?: number;
  currency?: string;
  recent_transactions?: Array<{
    description: string;
    amount: number;
    date: string;
  }>;
  
  // Shared fields
  referral_code?: string;
  referrals_count?: number;
  referral_bonus?: number;
  recent_activity?: Array<{
    description: string;
    timestamp: string;
  }>;
}

export interface OffersResponse {
  active: Array<{
    title: string;
    description: string;
    expires_at?: string;
  }>;
}

/**
 * Binds data context to component props using template strings
 * Supports nested object access like {{member.points}} and {{program.copy.program_name}}
 */
export function bindProps(props: Record<string, any>, dataContext: any): Record<string, any> {
  const boundProps: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(props)) {
    boundProps[key] = bindValue(value, dataContext);
  }
  
  return boundProps;
}

function bindValue(value: any, dataContext: any): any {
  if (typeof value === 'string') {
    // Handle template strings like {{member.points}} or {{program.copy.program_name}}
    return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const resolvedValue = resolvePath(path.trim(), dataContext);
      return resolvedValue !== undefined ? resolvedValue : match;
    });
  } else if (Array.isArray(value)) {
    return value.map(item => bindValue(item, dataContext));
  } else if (value && typeof value === 'object') {
    const boundObject: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      boundObject[k] = bindValue(v, dataContext);
    }
    return boundObject;
  }
  
  return value;
}

function resolvePath(path: string, data: any): any {
  const keys = path.split('.');
  let current = data;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Utility functions
 */
export function formatPoints(points: number): string {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  } else if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toLocaleString();
}

/**
 * Mock data generators for testing
 */
export function generateMockProgramSpec(type: 'loyalty' | 'membership' | 'store_card'): ProgramSpecResponse {
  const baseSpec = {
    program_id: 'demo-program-123',
    business_id: 'demo-business-123',
    program_type: type,
    spec: {
      copy: {
        program_name: getDefaultProgramName(type),
        tagline: getDefaultTagline(type),
        welcome_message: getDefaultWelcomeMessage(type)
      },
      ui_contract: {
        sections: getDefaultSections(type)
      }
    }
  };
  
  return baseSpec;
}

export function generateMockCustomerSummary(type: 'loyalty' | 'membership' | 'store_card'): CustomerSummary {
  const baseSummary: CustomerSummary = {
    customer_id: 'demo-customer-123',
    member_name: 'John Doe',
    member_since: '2023-01-15T00:00:00Z',
    profile_image: '/images/profilepic.png',
    referral_code: 'JOHN2024',
    referrals_count: 3,
    referral_bonus: 100,
    recent_activity: [
      {
        description: 'Earned 50 points for visit',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        description: 'Redeemed reward: Free Coffee',
        timestamp: new Date(Date.now() - 172800000).toISOString()
      }
    ]
  };
  
  if (type === 'loyalty') {
    return {
      ...baseSummary,
      points: 1250,
      tier: 'Gold',
      current_points: 1250,
      next_tier_points: 2000,
      next_tier_name: 'Platinum',
      earning_rules: [
        { description: 'Visit restaurant', points: 50 },
        { description: 'Refer a friend', points: 100 },
        { description: 'Leave a review', points: 25 }
      ],
      available_rewards: [
        { name: 'Free Coffee', description: 'Any size coffee drink', cost: 200 },
        { name: 'Free Appetizer', description: 'Choice of starter', cost: 500 },
        { name: '20% Off Meal', description: 'Discount on entire meal', cost: 750 }
      ]
    };
  } else if (type === 'membership') {
    return {
      ...baseSummary,
      membership_status: 'active',
      expiry_date: '2024-12-31T23:59:59Z',
      member_id: 'BK-2024-001',
      membership_perks: [
        { name: 'Priority Booking', description: 'Skip the waitlist' },
        { name: 'Free Guest Pass', description: 'Bring a friend monthly' },
        { name: 'Member Events', description: 'Exclusive member-only events' },
        { name: '15% Member Discount', description: 'On all food and beverage' }
      ],
      auto_renewal: true,
      next_billing_date: '2024-10-15T00:00:00Z',
      monthly_fee: 49.99
    };
  } else if (type === 'store_card') {
    return {
      ...baseSummary,
      balance: 125.50,
      current_balance: 125.50,
      currency: 'USD',
      recent_transactions: [
        { description: 'Top-up via credit card', amount: 50.00, date: '2024-09-20T10:30:00Z' },
        { description: 'Purchase: Lunch special', amount: -12.99, date: '2024-09-19T12:15:00Z' },
        { description: 'Purchase: Coffee & pastry', amount: -8.50, date: '2024-09-18T08:45:00Z' }
      ]
    };
  }
  
  return baseSummary;
}

function getDefaultProgramName(type: string): string {
  switch (type) {
    case 'loyalty': return 'Loyalty Rewards';
    case 'membership': return 'Premium Membership';
    case 'store_card': return 'Store Card';
    default: return 'Customer Program';
  }
}

function getDefaultTagline(type: string): string {
  switch (type) {
    case 'loyalty': return 'Earn points with every visit';
    case 'membership': return 'Exclusive benefits for our valued members';
    case 'store_card': return 'Your convenient payment solution';
    default: return 'Welcome to our program';
  }
}

function getDefaultWelcomeMessage(type: string): string {
  switch (type) {
    case 'loyalty': return 'Welcome to our loyalty program! Start earning points today.';
    case 'membership': return 'Welcome to premium membership! Enjoy exclusive perks and benefits.';
    case 'store_card': return 'Welcome to your store card! Top up and pay with ease.';
    default: return 'Welcome to our program!';
  }
}

function getDefaultSections(type: string): UISection[] {
  switch (type) {
    case 'loyalty':
      return [
        {
          type: 'DashboardHeader',
          props: {
            member_name: '{{member.member_name}}',
            member_since: '{{member.member_since}}',
            profile_image: '{{member.profile_image}}'
          }
        },
        {
          type: 'BalanceHeader',
          props: {
            points: '{{member.points}}',
            currency: 'points',
            tier: '{{member.tier}}'
          }
        },
        {
          type: 'ProgressNextTier',
          props: {
            current_points: '{{member.current_points}}',
            next_tier_points: '{{member.next_tier_points}}',
            next_tier_name: '{{member.next_tier_name}}'
          }
        },
        {
          type: 'QrCheckInButton',
          props: {
            check_in_endpoint: '{{business.check_in_endpoint}}'
          }
        },
        {
          type: 'HowToEarn',
          props: {
            earning_rules: '{{member.earning_rules}}'
          }
        },
        {
          type: 'RewardsGrid',
          props: {
            available_rewards: '{{member.available_rewards}}'
          }
        },
        {
          type: 'OffersStrip',
          props: {
            active_offers: '{{offers.active}}'
          }
        },
        {
          type: 'ReferralWidget',
          props: {
            referral_code: '{{member.referral_code}}',
            referrals_count: '{{member.referrals_count}}',
            referral_bonus: '{{member.referral_bonus}}'
          }
        },
        {
          type: 'ActivityFeed',
          props: {
            recent_activity: '{{member.recent_activity}}'
          }
        }
      ];
    
    case 'membership':
      return [
        {
          type: 'DashboardHeader',
          props: {
            member_name: '{{member.member_name}}',
            member_since: '{{member.member_since}}',
            profile_image: '{{member.profile_image}}'
          }
        },
        {
          type: 'MembershipHeader',
          props: {
            membership_status: '{{member.membership_status}}',
            expiry_date: '{{member.expiry_date}}',
            member_id: '{{member.member_id}}'
          }
        },
        {
          type: 'PerksGrid',
          props: {
            membership_perks: '{{member.membership_perks}}'
          }
        },
        {
          type: 'QrCheckInButton',
          props: {
            check_in_endpoint: '{{business.check_in_endpoint}}'
          }
        },
        {
          type: 'RenewalCard',
          props: {
            auto_renewal: '{{member.auto_renewal}}',
            next_billing_date: '{{member.next_billing_date}}',
            monthly_fee: '{{member.monthly_fee}}'
          }
        },
        {
          type: 'OffersStrip',
          props: {
            active_offers: '{{offers.active}}'
          }
        },
        {
          type: 'ReferralWidget',
          props: {
            referral_code: '{{member.referral_code}}',
            referrals_count: '{{member.referrals_count}}',
            referral_bonus: '{{member.referral_bonus}}'
          }
        },
        {
          type: 'ActivityFeed',
          props: {
            recent_activity: '{{member.recent_activity}}'
          }
        }
      ];
    
    case 'store_card':
      return [
        {
          type: 'DashboardHeader',
          props: {
            member_name: '{{member.member_name}}',
            member_since: '{{member.member_since}}',
            profile_image: '{{member.profile_image}}'
          }
        },
        {
          type: 'StoreCardHeader',
          props: {
            balance: '{{member.balance}}',
            currency: '{{member.currency}}'
          }
        },
        {
          type: 'BalanceCard',
          props: {
            current_balance: '{{member.current_balance}}',
            recent_transactions: '{{member.recent_transactions}}'
          }
        },
        {
          type: 'QrCheckInButton',
          props: {
            check_in_endpoint: '{{business.check_in_endpoint}}'
          }
        },
        {
          type: 'OffersStrip',
          props: {
            active_offers: '{{offers.active}}'
          }
        },
        {
          type: 'ReferralWidget',
          props: {
            referral_code: '{{member.referral_code}}',
            referrals_count: '{{member.referrals_count}}',
            referral_bonus: '{{member.referral_bonus}}'
          }
        },
        {
          type: 'ActivityFeed',
          props: {
            recent_activity: '{{member.recent_activity}}'
          }
        }
      ];
    
    default:
      return [];
  }
}
