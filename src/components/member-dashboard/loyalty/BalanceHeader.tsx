'use client'

import React from 'react';
import { formatPoints } from '@/lib/member-dashboard/utils';
import { StarIcon } from '@heroicons/react/24/solid';

interface BalanceHeaderProps {
  points_balance?: number;
  name?: string; // tier name
}

export function BalanceHeader({ points_balance = 0, name }: BalanceHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/20 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">
            {formatPoints(points_balance)}
          </h2>
          <p className="text-[#C6C8CC]">Points Available</p>
        </div>
        
        {name && (
          <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium">{name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
