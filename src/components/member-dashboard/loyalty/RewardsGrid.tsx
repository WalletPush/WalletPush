'use client'

import React from 'react';
import { formatPoints } from '@/components/member-dashboard/utils';
import { GiftIcon } from '@heroicons/react/24/outline';

interface RewardsGridProps {
  catalog?: Array<{
    id: string;
    title: string;
    cost_points: number;
  }>;
  claimables?: Array<{
    id: string;
    title: string;
  }>;
}

export function RewardsGrid({ catalog, claimables }: RewardsGridProps) {
  if (!catalog || catalog.length === 0) {
    return (
      <div className="wp-card p-6">
        <h3 className="text-lg font-semibold wp-text-primary mb-4">Rewards</h3>
        <p className="wp-text-muted">No rewards available yet</p>
      </div>
    );
  }

  const isClaimable = (rewardId: string) => {
    return claimables?.some(c => c.id === rewardId) || false;
  };

  return (
    <div className="wp-card p-6">
      <h3 className="text-lg font-semibold wp-text-primary mb-4">Available Rewards</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {catalog.map((reward) => {
          const canClaim = isClaimable(reward.id);
          
          return (
            <div 
              key={reward.id} 
              className={`wp-card p-4 transition-all duration-200 ${
                canClaim ? 'border-green-500/30 bg-green-500/5' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <GiftIcon className="w-5 h-5 wp-text-primary" />
                    <h4 className="font-medium">{reward.title}</h4>
                  </div>
                  <p className="wp-text-muted text-sm mb-3">
                    {formatPoints(reward.cost_points)} points
                  </p>
                </div>
              </div>
              
              <button 
                disabled={!canClaim}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  canClaim
                    ? 'wp-cta'
                    : 'bg-slate-600/50 wp-text-muted cursor-not-allowed'
                }`}
              >
                {canClaim ? 'Redeem Now' : 'Not Enough Points'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
