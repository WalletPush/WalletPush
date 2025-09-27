'use client'

import React from 'react';

// Import dashboard section components
import { BalanceHeader } from '@/components/member-dashboard/loyalty/BalanceHeader';
import { BalanceSpeedo } from '@/components/member-dashboard/loyalty/BalanceSpeedo';
import { ProgressNextTier } from '@/components/member-dashboard/loyalty/ProgressNextTier';
import { RewardsGrid } from '@/components/member-dashboard/loyalty/RewardsGrid';
import { HowToEarn } from '@/components/member-dashboard/loyalty/HowToEarn';

import { MembershipHeader } from '@/components/member-dashboard/membership/MembershipHeader';
import { RenewalCard } from '@/components/member-dashboard/membership/RenewalCard';
import { AllowancesList } from '@/components/member-dashboard/membership/AllowancesList';
import { CreditWallet } from '@/components/member-dashboard/membership/CreditWallet';
import { PerksGrid } from '@/components/member-dashboard/membership/PerksGrid';

import { StoreCardHeader } from '@/components/member-dashboard/store-card/StoreCardHeader';
import { BalanceCard } from '@/components/member-dashboard/store-card/BalanceCard';
import { RedeemGrid } from '@/components/member-dashboard/store-card/RedeemGrid';

// Shared components
import { OffersStrip } from '@/components/member-dashboard/shared/OffersStrip';
import { QrCheckInButton } from '@/components/member-dashboard/shared/QrCheckInButton';
import { ActivityFeed } from '@/components/member-dashboard/shared/ActivityFeed';

export const SECTION_REGISTRY = {
  // Loyalty components
  balanceHeader: BalanceSpeedo,
  progressNextTier: ProgressNextTier,
  rewardsGrid: RewardsGrid,
  howToEarn: HowToEarn,

  // Membership components  
  membershipHeader: MembershipHeader,
  renewalCard: RenewalCard,
  allowancesList: AllowancesList,
  creditWallet: CreditWallet,
  perksGrid: PerksGrid,

  // Store card components
  storeCardHeader: StoreCardHeader,
  balanceCard: BalanceCard,
  redeemGrid: RedeemGrid,

  // Shared components
  offersStrip: OffersStrip,
  qrCheckInButton: QrCheckInButton,
  activityFeed: ActivityFeed,
} as const;

export type SectionType = keyof typeof SECTION_REGISTRY;

/**
 * Renders a dashboard section from the component registry
 * Returns null for unknown section types (graceful degradation)
 */
export function renderSection(
  sectionType: string, 
  props: Record<string, any>, 
  key?: string | number
): React.ReactElement | null {
  const Component = SECTION_REGISTRY[sectionType as SectionType];
  
  if (!Component) {
    console.warn(`Unknown section type: ${sectionType}`);
    return null;
  }
  
  // Use React.createElement with any type to avoid prop type conflicts
  return React.createElement(Component as React.ComponentType<any>, { key, ...props });
}
