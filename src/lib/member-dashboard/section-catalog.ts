/**
 * Component Catalog for JSON-Driven Member Dashboard
 * Single source of truth for all available dashboard components
 */

export type ProgramType = 'loyalty' | 'membership' | 'store_card';

export type SectionKey =
  | 'balanceHeader' | 'progressNextTier' | 'rewardsGrid' | 'howToEarn'
  | 'membershipHeader' | 'renewalCard' | 'allowancesList' | 'creditWallet' | 'perksGrid'
  | 'storeCardHeader' | 'balanceCard' | 'redeemGrid'
  | 'offersStrip' | 'qrCheckInButton' | 'activityFeed' | 'guideSteps';

export type CatalogItem = {
  key: SectionKey;
  label: string;
  description: string;
  programTypes: ProgramType[];      // where this section is legal
  requiredCapabilities?: string[];  // e.g. ['points'], ['credit'], etc.
  defaultProps: string[];           // dot-paths for bindProps
  insertAfter?: SectionKey | 'top'; // suggested placement
  conflictsWith?: SectionKey[];     // optional
  category: 'core' | 'optional' | 'advanced';
};

export const SECTION_CATALOG: CatalogItem[] = [
  // === LOYALTY COMPONENTS ===
  {
    key: 'balanceHeader',
    label: 'Points Balance',
    description: 'Display member\'s current points and tier status',
    programTypes: ['loyalty'],
    requiredCapabilities: ['points'],
    defaultProps: ['member.points_balance', 'member.tier.name'],
    insertAfter: 'top',
    category: 'core'
  },
  {
    key: 'progressNextTier',
    label: 'Progress to Next Tier',
    description: 'Show progress bar towards next loyalty tier',
    programTypes: ['loyalty'],
    requiredCapabilities: ['points', 'tiers'],
    defaultProps: ['member.points_to_next_tier', 'program.tiers.levels'],
    category: 'core'
  },
  {
    key: 'rewardsGrid',
    label: 'Rewards Grid',
    description: 'Grid of available rewards to redeem',
    programTypes: ['loyalty', 'store_card', 'membership'],
    requiredCapabilities: [],
    defaultProps: ['program.redemption.catalog', 'member.claimables'],
    category: 'core'
  },
  {
    key: 'howToEarn',
    label: 'How to Earn Points',
    description: 'Explain earning rules and multipliers',
    programTypes: ['loyalty'],
    requiredCapabilities: ['points'],
    defaultProps: ['program.earning', 'program.multipliers'],
    category: 'optional'
  },

  // === MEMBERSHIP COMPONENTS ===
  {
    key: 'membershipHeader',
    label: 'Membership Status',
    description: 'Display membership tier and billing information',
    programTypes: ['membership'],
    requiredCapabilities: ['membership'],
    defaultProps: ['copy.program_name', 'billing.price_monthly', 'copy.tagline'],
    insertAfter: 'top',
    category: 'core'
  },
  {
    key: 'renewalCard',
    label: 'Renewal Information',
    description: 'Show next billing date and renewal options',
    programTypes: ['membership'],
    requiredCapabilities: ['membership'],
    defaultProps: ['billing.billing_day', 'member.next_invoice'],
    category: 'core'
  },
  {
    key: 'allowancesList',
    label: 'Member Allowances',
    description: 'List of included benefits and usage limits',
    programTypes: ['membership'],
    requiredCapabilities: ['allowances'],
    defaultProps: ['membership.allowances', 'member.allowances'],
    category: 'optional'
  },
  {
    key: 'creditWallet',
    label: 'Credit Balance',
    description: 'Show available credit balance and spending options',
    programTypes: ['membership', 'store_card'],
    requiredCapabilities: ['credit'],
    defaultProps: ['member.credit_balance', 'program.redemption.catalog'],
    category: 'optional'
  },
  {
    key: 'perksGrid',
    label: 'Member Perks',
    description: 'Grid of exclusive member benefits and perks',
    programTypes: ['membership'],
    requiredCapabilities: ['membership'],
    defaultProps: ['membership.perks'],
    category: 'optional'
  },

  // === STORE CARD COMPONENTS ===
  {
    key: 'storeCardHeader',
    label: 'Store Card Header',
    description: 'Display store card program name and branding',
    programTypes: ['store_card'],
    requiredCapabilities: ['stored_value'],
    defaultProps: ['copy.program_name'],
    insertAfter: 'top',
    category: 'core'
  },
  {
    key: 'balanceCard',
    label: 'Stored Value Balance',
    description: 'Show current balance and top-up options',
    programTypes: ['store_card'],
    requiredCapabilities: ['stored_value'],
    defaultProps: ['member.stored_value_balance'],
    category: 'core'
  },
  {
    key: 'redeemGrid',
    label: 'Spend Options',
    description: 'Grid of ways to spend stored value',
    programTypes: ['store_card', 'membership', 'loyalty'],
    requiredCapabilities: [],
    defaultProps: ['program.redemption.catalog'],
    category: 'optional'
  },

  // === SHARED COMPONENTS ===
  {
    key: 'offersStrip',
    label: 'Active Offers',
    description: 'Horizontal strip of available offers and promotions',
    programTypes: ['loyalty', 'membership', 'store_card'],
    defaultProps: ['offers.active'],
    category: 'optional'
  },
  {
    key: 'qrCheckInButton',
    label: 'QR Check-In',
    description: 'Button for members to check in at your location',
    programTypes: ['loyalty', 'membership', 'store_card'],
    requiredCapabilities: [], // No capabilities required - universal feature
    defaultProps: ['business.check_in_endpoint'],
    category: 'core'
  },
  {
    key: 'activityFeed',
    label: 'Recent Activity',
    description: 'Timeline of recent member activity and transactions',
    programTypes: ['loyalty', 'membership', 'store_card'],
    defaultProps: ['member.recent_activity'],
    category: 'optional'
  },
  {
    key: 'guideSteps',
    label: 'Getting Started Guide',
    description: 'Step-by-step guide for new members',
    programTypes: ['loyalty', 'membership', 'store_card'],
    defaultProps: ['program.guide', 'member.guide_progress'],
    insertAfter: 'top',
    category: 'advanced'
  },
];

// Default presets for different program types
export const DEFAULT_PRESETS = {
  loyalty: {
    minimal: ['balanceHeader', 'activityFeed'],
    standard: ['balanceHeader', 'rewardsGrid', 'offersStrip', 'activityFeed'],
    full: ['balanceHeader', 'progressNextTier', 'rewardsGrid', 'howToEarn', 'offersStrip', 'qrCheckInButton', 'activityFeed']
  },
  membership: {
    minimal: ['membershipHeader', 'renewalCard'],
    standard: ['membershipHeader', 'renewalCard', 'perksGrid', 'offersStrip'],
    full: ['membershipHeader', 'renewalCard', 'allowancesList', 'creditWallet', 'perksGrid', 'offersStrip', 'qrCheckInButton', 'activityFeed']
  },
  store_card: {
    minimal: ['storeCardHeader', 'balanceCard'],
    standard: ['storeCardHeader', 'balanceCard', 'redeemGrid'],
    full: ['storeCardHeader', 'balanceCard', 'redeemGrid', 'offersStrip', 'qrCheckInButton', 'activityFeed']
  }
} as const;

// Helper functions
export function getSectionsForProgramType(programType: ProgramType, capabilities: string[] = []): CatalogItem[] {
  return SECTION_CATALOG.filter(item => {
    // Must support this program type
    if (!item.programTypes.includes(programType)) return false;
    
    // Must have required capabilities
    if (item.requiredCapabilities) {
      return item.requiredCapabilities.every(cap => capabilities.includes(cap));
    }
    
    return true;
  });
}

export function getCatalogItem(sectionKey: SectionKey): CatalogItem | undefined {
  return SECTION_CATALOG.find(item => item.key === sectionKey);
}

export function getDefaultSections(programType: ProgramType, preset: 'minimal' | 'standard' | 'full' = 'standard'): SectionKey[] {
  return DEFAULT_PRESETS[programType][preset] as SectionKey[];
}
