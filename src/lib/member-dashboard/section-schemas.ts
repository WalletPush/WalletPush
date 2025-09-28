/**
 * Configuration schemas for dashboard sections
 * Used to auto-generate form controls in the Program Configurator
 */

export interface FieldSchema {
  key: string;
  type: 'select' | 'switch' | 'number' | 'text' | 'color' | 'earning_methods' | 'tier_config';
  label: string;
  options?: (string | number)[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  help?: string;
}

export interface SectionSchema {
  appearance?: FieldSchema[];
  behavior?: FieldSchema[];
}

export const SECTION_SCHEMAS: Record<string, SectionSchema> = {
  memberActions: {
    behavior: [
      {
        key: 'settings.buttonText',
        type: 'text',
        label: 'Button Text',
        placeholder: 'Request Action',
        help: 'Text displayed on the main action button'
      },
      {
        key: 'settings.enableCheckIn',
        type: 'switch',
        label: 'Enable Check-In',
        help: 'Allow members to check in at your location'
      },
      {
        key: 'settings.checkInAutoApprove',
        type: 'switch',
        label: 'Auto Approve Check-Ins',
        help: 'Automatically approve check-in requests'
      },
      {
        key: 'settings.checkInCooldown',
        type: 'number',
        label: 'Check-In Cooldown (hours)',
        min: 0,
        max: 24,
        help: 'Time between check-ins (0 = no cooldown)'
      },
      {
        key: 'settings.checkInPoints',
        type: 'number',
        label: 'Points for Check-In',
        min: 0,
        max: 1000,
        help: 'How many points to award for each check-in'
      },
      {
        key: 'settings.enableEarnPoints',
        type: 'switch',
        label: 'Enable Earn Points',
        help: 'Allow members to request points for activities'
      },
      {
        key: 'settings.earnPointsAutoApprove',
        type: 'switch',
        label: 'Auto Approve Points',
        help: 'Automatically approve point requests'
      },
      {
        key: 'settings.earnPointsMaxPerDay',
        type: 'number',
        label: 'Max Points Requests/Day',
        min: 0,
        max: 50,
        help: 'Maximum point requests per day'
      },
      {
        key: 'settings.enableRedeemOffer',
        type: 'switch',
        label: 'Enable Redeem Offers',
        help: 'Allow members to redeem available offers'
      },
      {
        key: 'settings.redeemOfferAutoApprove',
        type: 'switch',
        label: 'Auto Approve Redemptions',
        help: 'Automatically approve offer redemptions'
      },
      {
        key: 'settings.enableReceiptCredit',
        type: 'switch',
        label: 'Enable Receipt Credit',
        help: 'Allow members to submit receipts for credit'
      },
      {
        key: 'settings.receiptCreditAutoApprove',
        type: 'switch',
        label: 'Auto Approve Receipts',
        help: 'Automatically approve receipt submissions'
      }
    ],
    appearance: [
      {
        key: 'settings.variant',
        type: 'select',
        label: 'Button Style',
        options: ['primary', 'secondary', 'outline'],
        help: 'Visual style of the action button'
      },
      {
        key: 'settings.size',
        type: 'select',
        label: 'Button Size',
        options: ['sm', 'md', 'lg'],
        help: 'Size of the action button'
      }
    ]
  },
  balanceHeader: {
    appearance: [
      { 
        key: 'settings.variant', 
        type: 'select', 
        label: 'Gauge style', 
        options: ['ring', 'half', 'bar', 'minimal'],
        help: 'Visual style of the points balance display'
      },
      { 
        key: 'settings.showTier', 
        type: 'switch', 
        label: 'Show tier badge',
        help: 'Display the member\'s current tier level'
      },
      {
        key: 'settings.showProgress',
        type: 'switch',
        label: 'Show progress to next tier',
        help: 'Display progress towards the next tier level'
      },
      {
        key: 'settings.size',
        type: 'select',
        label: 'Size',
        options: ['sm', 'md', 'lg'],
        help: 'Size of the balance display'
      }
    ],
    behavior: [
      {
        key: 'settings.tiers',
        type: 'tier_config',
        label: 'Loyalty Tiers',
        help: 'Configure up to 3 tiers with names and point requirements'
      }
    ]
  },

  qrCheckInButton: {
    appearance: [
      { 
        key: 'settings.style', 
        type: 'select', 
        label: 'Style', 
        options: ['button', 'card'],
        help: 'How the check-in button appears to members'
      },
      { 
        key: 'settings.showCooldown', 
        type: 'switch', 
        label: 'Show cooldown timer',
        help: 'Display remaining cooldown time to prevent spam check-ins'
      }
    ],
    behavior: [
      { 
        key: 'rules.loyalty.check_in.points', 
        type: 'number', 
        label: 'Points per check-in', 
        min: 0, 
        max: 1000, 
        step: 1,
        help: 'How many points members earn for each check-in'
      },
      { 
        key: 'rules.loyalty.check_in.cooldown_hours', 
        type: 'number', 
        label: 'Cooldown (hours)', 
        min: 0, 
        max: 24, 
        step: 0.5,
        help: 'Minimum time between check-ins for the same member'
      }
    ]
  },


  rewardsGrid: {
    appearance: [
      { 
        key: 'settings.columns', 
        type: 'select', 
        label: 'Columns', 
        options: [2, 3, 4],
        help: 'Number of reward columns to display'
      },
      { 
        key: 'settings.showPrices', 
        type: 'switch', 
        label: 'Show point prices',
        help: 'Display the point cost for each reward'
      }
    ],
    behavior: [
      { 
        key: 'rules.loyalty.redemption.enabled', 
        type: 'switch', 
        label: 'Allow redemption in app',
        help: 'Let members redeem rewards directly from the dashboard'
      }
    ]
  },

  offersStrip: {
    appearance: [
      {
        key: 'settings.layout',
        type: 'select',
        label: 'Layout',
        options: ['horizontal', 'vertical'],
        help: 'How offers are arranged'
      },
      {
        key: 'settings.showExpiry',
        type: 'switch',
        label: 'Show expiry dates',
        help: 'Display when offers expire'
      }
    ],
    behavior: [
      {
        key: 'rules.offers.auto_claim',
        type: 'switch',
        label: 'Auto-claim eligible offers',
        help: 'Automatically claim offers when member qualifies'
      }
    ]
  },

  activityFeed: {
    appearance: [
      {
        key: 'settings.maxItems',
        type: 'number',
        label: 'Max items to show',
        min: 3,
        max: 20,
        step: 1,
        help: 'Maximum number of recent activities to display'
      },
      {
        key: 'settings.showAvatars',
        type: 'switch',
        label: 'Show activity icons',
        help: 'Display icons for different activity types'
      }
    ]
  },

  membershipHeader: {
    appearance: [
      {
        key: 'settings.showRenewalDate',
        type: 'switch',
        label: 'Show renewal date',
        help: 'Display when membership renews'
      },
      {
        key: 'settings.showBenefits',
        type: 'switch',
        label: 'Show benefits summary',
        help: 'Display key membership benefits'
      }
    ]
  },

  storeCardHeader: {
    appearance: [
      {
        key: 'settings.showLastTopup',
        type: 'switch',
        label: 'Show last top-up',
        help: 'Display when card was last topped up'
      }
    ],
    behavior: [
      {
        key: 'rules.store_card.topup_bonus.threshold',
        type: 'number',
        label: 'Bonus threshold ($)',
        min: 0,
        max: 500,
        step: 5,
        help: 'Minimum top-up amount to earn bonus'
      },
      {
        key: 'rules.store_card.topup_bonus.amount',
        type: 'number',
        label: 'Bonus amount ($)',
        min: 0,
        max: 100,
        step: 1,
        help: 'Bonus amount for qualifying top-ups'
      }
    ]
  },

  howToEarn: {
    appearance: [
      {
        key: 'settings.style',
        type: 'select',
        label: 'Layout style',
        options: ['card', 'list', 'grid'],
        help: 'How the earning methods are displayed'
      },
      {
        key: 'settings.showIcons',
        type: 'switch',
        label: 'Show icons',
        help: 'Display icons for each earning method'
      },
      {
        key: 'settings.showPoints',
        type: 'switch',
        label: 'Show point values',
        help: 'Display point amounts for each method'
      }
    ],
    behavior: [
      {
        key: 'settings.title',
        type: 'text',
        label: 'Section title',
        placeholder: 'How to Earn Points',
        help: 'Custom title for this section'
      },
      {
        key: 'settings.subtitle',
        type: 'text',
        label: 'Subtitle',
        placeholder: 'Multiple ways to earn and unlock rewards',
        help: 'Description text below the title'
      },
      {
        key: 'settings.earningMethods',
        type: 'earning_methods',
        label: 'Earning Methods',
        help: 'Configure how customers can earn points in your program'
      }
    ]
  }
};

/**
 * Get the schema for a specific section
 */
export function getSectionSchema(sectionType: string): SectionSchema | undefined {
  return SECTION_SCHEMAS[sectionType];
}

/**
 * Get all field schemas for a section (appearance + behavior)
 */
export function getAllFieldsForSection(sectionType: string): FieldSchema[] {
  const schema = getSectionSchema(sectionType);
  if (!schema) return [];
  
  return [
    ...(schema.appearance || []),
    ...(schema.behavior || [])
  ];
}

/**
 * Check if a section has configurable fields
 */
export function sectionHasConfig(sectionType: string): boolean {
  const schema = getSectionSchema(sectionType);
  return !!(schema?.appearance?.length || schema?.behavior?.length);
}
