/**
 * JSON-Driven Member Dashboard Utilities
 * For WalletPush's Benefits Spec system
 */

/**
 * Safely gets a nested property value using dot notation
 * Returns null for any missing/undefined values
 */
export function getPath(obj: any, path: string): any {
  if (!obj || !path) return null;
  
  return path.split('.').reduce((acc, key) => {
    return (acc && acc[key] !== undefined) ? acc[key] : null;
  }, obj);
}

/**
 * Binds UI contract props to live data context
 * Converts dot-path strings to actual values from the data context
 */
export function bindProps(paths: string[], ctx: {
  program: any;
  member: any;
  offers: any;
  business: any;
  copy: any;
}): Record<string, any> {
  if (!paths || !Array.isArray(paths)) return {};
  
  const boundProps: Record<string, any> = {};
  
  paths.forEach((path, index) => {
    let value = null;
    
    if (path.startsWith('program.')) {
      value = getPath(ctx.program, path.slice(8));
    } else if (path.startsWith('member.')) {
      value = getPath(ctx.member, path.slice(7));
    } else if (path.startsWith('offers.')) {
      value = getPath(ctx.offers, path.slice(7));
    } else if (path.startsWith('business.')) {
      value = getPath(ctx.business, path.slice(9));
    } else if (path.startsWith('copy.')) {
      value = getPath(ctx.copy, path.slice(5));
    } else {
      // If no prefix, try to find it in any context
      value = getPath(ctx.program, path) || 
              getPath(ctx.member, path) || 
              getPath(ctx.offers, path) || 
              getPath(ctx.business, path) || 
              getPath(ctx.copy, path);
    }
    
    // Use the path as the key, or create a clean key
    const propKey = path.includes('.') ? path.split('.').pop() || `prop_${index}` : path;
    boundProps[propKey] = value;
  });
  
  return boundProps;
}

/**
 * Formats currency values for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Formats points/credits for display
 */
export function formatPoints(points: number): string {
  return points.toLocaleString();
}

/**
 * Calculates days since a date
 */
export function daysSince(date: string | Date): number {
  const past = new Date(date);
  const now = new Date();
  const diffTime = now.getTime() - past.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formats relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const days = daysSince(date);
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * Type definitions for the member dashboard system
 */
export interface ProgramSpec {
  version: string;
  program_id: string;
  program_type: 'loyalty' | 'membership' | 'store_card';
  currency?: string;
  earning?: any;
  tiers?: any;
  membership?: any;
  billing?: any;
  redemption?: any;
  copy?: any;
  ui_contract: {
    layout: string;
    sections: Array<{
      type: string;
      props: string[];
    }>;
    kpis?: string[];
  };
}

/**
 * API Response wrapper for program spec
 */
export interface ProgramSpecResponse {
  program_id: string;
  program_type: string;
  spec: ProgramSpec;
}

export interface CustomerSummary {
  program_type: string;
  points_balance?: number;
  tier?: {
    name: string;
    threshold: number;
  };
  points_to_next_tier?: number;
  credit_balance?: number;
  stored_value_balance?: number;
  allowances?: Array<{
    id: string;
    used: number;
    quota: number;
  }>;
  next_invoice?: string;
  claimables?: Array<{
    id: string;
    title: string;
  }>;
  recent_activity?: Array<{
    ts: string;
    type: string;
    points?: number;
    meta?: any;
  }>;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  cost_type: 'points' | 'credit' | 'free';
  cost_value?: number;
  availability: any;
  limits?: any;
}

/**
 * Default UI contract sections for different program types
 */
export const DEFAULT_SECTIONS = {
  loyalty: [
    { type: 'balanceHeader', props: ['member.points_balance', 'member.tier.name'] },
    { type: 'progressNextTier', props: ['member.points_to_next_tier', 'program.tiers.levels'] },
    { type: 'rewardsGrid', props: ['program.redemption.catalog', 'member.claimables'] }
  ],
  membership: [
    { type: 'membershipHeader', props: ['copy.program_name', 'billing.price_monthly', 'copy.tagline'] },
    { type: 'renewalCard', props: ['billing.billing_day', 'member.next_invoice'] },
    { type: 'allowancesList', props: ['membership.allowances', 'member.allowances'] },
    { type: 'creditWallet', props: ['member.credit_balance', 'program.redemption.catalog'] }
  ],
  store_card: [
    { type: 'storeCardHeader', props: ['copy.program_name'] },
    { type: 'balanceCard', props: ['member.stored_value_balance'] },
    { type: 'redeemGrid', props: ['program.redemption.catalog'] }
  ],
  shared: [
    { type: 'offersStrip', props: ['offers.active'] },
    { type: 'qrCheckInButton', props: ['business.check_in_endpoint'] },
    { type: 'activityFeed', props: ['member.recent_activity'] }
  ]
};


