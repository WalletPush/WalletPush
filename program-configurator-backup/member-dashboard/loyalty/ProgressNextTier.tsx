'use client'

import React from 'react';
import { formatPoints } from '@/components/member-dashboard/utils';

interface ProgressNextTierProps {
  points_to_next_tier?: number;
  levels?: Array<{
    name: string;
    threshold: number;
  }>;
}

export function ProgressNextTier({ points_to_next_tier, levels }: ProgressNextTierProps) {
  if (!points_to_next_tier || !levels || levels.length === 0) {
    return null; // Don't render if no tier system
  }

  // Find next tier (simplified logic)
  const nextTier = levels.find(level => level.threshold > 0);
  
  if (!nextTier) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Tier Progress</h3>
        <p className="text-green-400 font-medium">You've reached the highest tier! 🎆</p>
      </div>
    );
  }

  const progressPercent = Math.max(0, 100 - ((points_to_next_tier / nextTier.threshold) * 100));

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Progress to {nextTier.name}</h3>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#C6C8CC]">Progress</span>
          <span className="text-white">
            {formatPoints(points_to_next_tier)} points to go
          </span>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
      </div>
      
      <p className="text-[#C6C8CC] text-sm">
        Earn {formatPoints(points_to_next_tier)} more points to reach <span className="text-white font-medium">{nextTier.name}</span> tier
      </p>
    </div>
  );
}
