'use client'

import React from 'react';
import { formatPoints } from '@/lib/member-dashboard/utils';
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
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Rewards</h3>
        <p className="text-[#C6C8CC]">No rewards available yet</p>
      </div>
    );
  }

  const isClaimable = (rewardId: string) => {
    return claimables?.some(c => c.id === rewardId) || false;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Available Rewards</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {catalog.map((reward) => {
          const canClaim = isClaimable(reward.id);
          
          return (
            <div 
              key={reward.id} 
              className={`p-4 rounded-lg border transition-all duration-200 ${
                canClaim 
                  ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <GiftIcon className="w-5 h-5 text-purple-400" />
                    <h4 className="text-white font-medium">{reward.title}</h4>
                  </div>
                  <p className="text-[#C6C8CC] text-sm mb-3">
                    {formatPoints(reward.cost_points)} points
                  </p>
                </div>
              </div>
              
              <button 
                disabled={!canClaim}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  canClaim
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                    : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
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
