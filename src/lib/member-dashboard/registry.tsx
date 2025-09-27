import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QrCheckInButton as QRCheckInButton } from '@/components/member-dashboard/shared/QrCheckInButton';
import { BalanceSpeedo } from '@/components/member-dashboard/loyalty/BalanceSpeedo';
import { HowToEarn as HowToEarnWidget } from '@/components/member-dashboard/universal/HowToEarn';
// import { WPThemeProvider } from '@/components/member-dashboard/WPThemeProvider';
import { RewardsGrid as WPRewardsGrid } from '@/components/member-dashboard/loyalty/RewardsGrid';
import { OffersStrip as WPOffersStrip } from '@/components/member-dashboard/shared/OffersStrip';
import { ActivityFeed as WPActivityFeed } from '@/components/member-dashboard/shared/ActivityFeed';
import { 
  Star, 
  Gift, 
  CreditCard, 
  Clock, 
  Trophy, 
  Users, 
  Wallet,
  QrCode,
  Share2,
  Activity,
  Calendar,
  CheckCircle
} from 'lucide-react';

// WP-Themed Components with proper theming
const BalanceHeader = ({ member, variant, showTier, showProgress, size, ...props }: any) => {
  console.log('🔍 BalanceHeader wrapper props:', { member, variant, showTier, showProgress, size, props });
  
  return (
    <BalanceSpeedo 
      pointsBalance={member?.points_balance || 0}
      pointsToNextTier={member?.points_to_next_tier}
      tier={member?.tier}
      tiers={props.tiers}
      variant={variant || "ring"}
      size={size || "md"}
      showTier={showTier !== undefined ? showTier : true}
      showProgress={showProgress !== undefined ? showProgress : true}
      accent="primary"
    />
  );
};

// Alternative Balance Speedo variants for the configurator
const BalanceSpeedo_Ring = ({ member, ...props }: any) => (
  <BalanceSpeedo 
    pointsBalance={member?.points_balance || 0}
    pointsToNextTier={member?.points_to_next_tier}
    tier={member?.tier}
    tiers={props.settings?.tiers}
    variant="ring"
    size="md"
    showTier={true}
    showProgress={true}
    accent="primary"
  />
);

const BalanceSpeedo_Half = ({ member, ...props }: any) => (
  <BalanceSpeedo 
    pointsBalance={member?.points_balance || 0}
    pointsToNextTier={member?.points_to_next_tier}
    tier={member?.tier}
    tiers={props.settings?.tiers}
    variant="half"
    size="md"
    showTier={true}
    showProgress={true}
    accent="primary"
  />
);

const BalanceSpeedo_Bar = ({ member, ...props }: any) => (
  <BalanceSpeedo 
    pointsBalance={member?.points_balance || 0}
    pointsToNextTier={member?.points_to_next_tier}
    tier={member?.tier}
    tiers={props.settings?.tiers}
    variant="bar"
    size="md"
    showTier={true}
    showProgress={true}
    accent="primary"
  />
);

const BalanceSpeedo_Minimal = ({ member, ...props }: any) => (
  <BalanceSpeedo 
    pointsBalance={member?.points_balance || 0}
    pointsToNextTier={member?.points_to_next_tier}
    tier={member?.tier}
    tiers={props.settings?.tiers}
    variant="minimal"
    size="md"
    showTier={true}
    showProgress={true}
    accent="primary"
  />
);

const ProgressNextTier = ({ current_points, next_tier_points, next_tier_name }: any) => {
  const progress = next_tier_points ? (current_points / next_tier_points) * 100 : 0;
  const pointsNeeded = next_tier_points ? next_tier_points - current_points : 0;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium">Progress to {next_tier_name || 'Next Tier'}</p>
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>
        <Progress value={Math.min(progress, 100)} className="mb-2" />
        <p className="text-sm text-gray-600">
          {pointsNeeded > 0 ? `${pointsNeeded.toLocaleString()} points to go` : 'Tier achieved!'}
        </p>
      </CardContent>
    </Card>
  );
};

const HowToEarn_Component = ({ business, ...props }: any) => (
  <HowToEarnWidget 
    title={props.settings?.title || 'How to Earn Points'}
    subtitle={props.settings?.subtitle || 'Multiple ways to earn and unlock rewards'}
    style={props.settings?.style || 'card'}
    showIcons={props.settings?.showIcons !== undefined ? props.settings.showIcons : true}
    showPoints={props.settings?.showPoints !== undefined ? props.settings.showPoints : true}
    earningMethods={props.settings?.earningMethods || business?.earning_methods || undefined}
  />
);

const RewardsGrid = ({ available_rewards }: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Gift className="w-5 h-5" />
        Available Rewards
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {available_rewards?.map((reward: any, index: number) => (
          <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <h4 className="font-medium mb-1">{reward.name}</h4>
            <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
            <div className="flex justify-between items-center">
              <Badge variant="outline">{reward.cost} points</Badge>
              <Button size="sm" variant="outline">Redeem</Button>
            </div>
          </div>
        )) || (
          <p className="text-gray-500 text-sm col-span-2">No rewards available</p>
        )}
      </div>
    </CardContent>
  </Card>
);

// Membership Components
const MembershipHeader = ({ membership_status, expiry_date, member_id }: any) => (
  <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Premium Member</h2>
          <p className="text-emerald-100">#{member_id || 'N/A'}</p>
        </div>
        <div className="text-right">
          <Badge 
            variant="secondary" 
            className={`border-0 ${
              membership_status === 'active' 
                ? 'bg-green-500 text-white' 
                : 'bg-yellow-500 text-white'
            }`}
          >
            {membership_status || 'Active'}
          </Badge>
          {expiry_date && (
            <p className="text-emerald-100 text-sm mt-1">
              Expires: {new Date(expiry_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const PerksGrid = ({ membership_perks }: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Star className="w-5 h-5" />
        Your Perks
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {membership_perks?.map((perk: any, index: number) => (
          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium">{perk.name}</h4>
              <p className="text-sm text-gray-600">{perk.description}</p>
            </div>
          </div>
        )) || (
          <p className="text-gray-500 text-sm col-span-2">No perks configured</p>
        )}
      </div>
    </CardContent>
  </Card>
);

const RenewalCard = ({ auto_renewal, next_billing_date, monthly_fee }: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Billing & Renewal
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span>Auto-renewal</span>
          <Badge variant={auto_renewal ? "default" : "outline"}>
            {auto_renewal ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        {next_billing_date && (
          <div className="flex justify-between items-center">
            <span>Next billing</span>
            <span className="text-sm">{new Date(next_billing_date).toLocaleDateString()}</span>
          </div>
        )}
        {monthly_fee && (
          <div className="flex justify-between items-center">
            <span>Monthly fee</span>
            <span className="font-medium">${monthly_fee}</span>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// Store Card Components
const StoreCardHeader = ({ balance, currency }: any) => (
  <Card className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-orange-100 text-sm">Store Credit</p>
          <p className="text-3xl font-bold">${balance?.toFixed(2) || '0.00'}</p>
          <p className="text-orange-100 text-sm">{currency || 'USD'}</p>
        </div>
        <Wallet className="w-12 h-12 text-orange-200" />
      </div>
    </CardContent>
  </Card>
);

const BalanceCard = ({ current_balance, recent_transactions }: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Recent Activity
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {recent_transactions?.slice(0, 3).map((transaction: any, index: number) => (
          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-sm">{transaction.description}</p>
              <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
            </div>
            <span className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.amount > 0 ? '+' : ''}${transaction.amount?.toFixed(2)}
            </span>
          </div>
        )) || (
          <p className="text-gray-500 text-sm">No recent transactions</p>
        )}
      </div>
    </CardContent>
  </Card>
);

// Shared Components
const DashboardHeader = ({ member_name, member_since, profile_image }: any) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {profile_image ? (
            <img src={profile_image} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            member_name?.charAt(0) || 'M'
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{member_name || 'Member'}</h1>
          {member_since && (
            <p className="text-gray-600">Member since {new Date(member_since).getFullYear()}</p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const QrCheckInButton = ({ business, ...props }: any) => (
  <QRCheckInButton 
    check_in_endpoint={business?.check_in_endpoint}
  />
);

const ReferralWidget = ({ referral_code, referrals_count, referral_bonus }: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Share2 className="w-5 h-5" />
        Refer Friends
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-center space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Your referral code</p>
          <div className="bg-gray-100 rounded-lg p-3 font-mono text-lg">
            {referral_code || 'N/A'}
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span>Referrals made</span>
          <span className="font-medium">{referrals_count || 0}</span>
        </div>
        {referral_bonus && (
          <p className="text-sm text-green-600">
            Earn {referral_bonus} points per referral!
          </p>
        )}
        <Button variant="outline" className="w-full">
          <Share2 className="w-4 h-4 mr-2" />
          Share Code
        </Button>
      </div>
    </CardContent>
  </Card>
);

const OffersStrip = ({ active_offers }: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Gift className="w-5 h-5" />
        Special Offers
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {active_offers?.map((offer: any, index: number) => (
          <div key={index} className="border border-dashed border-orange-300 rounded-lg p-4 bg-orange-50">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-orange-900">{offer.title}</h4>
                <p className="text-sm text-orange-700">{offer.description}</p>
                {offer.expires_at && (
                  <p className="text-xs text-orange-600 mt-1">
                    Expires: {new Date(offer.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                Claim
              </Button>
            </div>
          </div>
        )) || (
          <p className="text-gray-500 text-sm">No active offers</p>
        )}
      </div>
    </CardContent>
  </Card>
);

const ActivityFeed = ({ recent_activity }: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Recent Activity
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {recent_activity?.slice(0, 5).map((activity: any, index: number) => (
          <div key={index} className="flex items-center gap-3 p-3 border-l-4 border-blue-200 bg-blue-50">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium">{activity.description}</p>
              <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )) || (
          <p className="text-gray-500 text-sm">No recent activity</p>
        )}
      </div>
    </CardContent>
  </Card>
);

// Component Registry
export const SECTION_REGISTRY = {
  // Loyalty components (with both old and new naming)
  balanceHeader: BalanceHeader, // Maps to the spec names
  BalanceHeader,
  balanceSpeedo: BalanceSpeedo_Ring,
  balanceSpeedoRing: BalanceSpeedo_Ring,
  balanceSpeedoHalf: BalanceSpeedo_Half,
  balanceSpeedoBar: BalanceSpeedo_Bar,
  balanceSpeedoMinimal: BalanceSpeedo_Minimal,
  progressNextTier: ProgressNextTier,
  ProgressNextTier,
  howToEarn: HowToEarn_Component,
  rewardsGrid: WPRewardsGrid,
  RewardsGrid: WPRewardsGrid,

  // Membership components  
  membershipHeader: MembershipHeader,
  MembershipHeader,
  perksGrid: PerksGrid,
  PerksGrid,
  renewalCard: RenewalCard,
  RenewalCard,

  // Store card components
  storeCardHeader: StoreCardHeader,
  StoreCardHeader,
  balanceCard: BalanceCard,
  BalanceCard,

  // Universal/Shared components
  dashboardHeader: DashboardHeader,
  DashboardHeader,
  qrCheckInButton: QrCheckInButton,
  QrCheckInButton,
  referralWidget: ReferralWidget,
  ReferralWidget,
  offersStrip: WPOffersStrip,
  OffersStrip: WPOffersStrip,
  activityFeed: WPActivityFeed,
  ActivityFeed: WPActivityFeed
};

export default SECTION_REGISTRY;
