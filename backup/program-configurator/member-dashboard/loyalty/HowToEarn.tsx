'use client'

import React from 'react';
import { CurrencyDollarIcon, StarIcon } from '@heroicons/react/24/outline';

interface HowToEarnProps {
  earning?: {
    basis: string;
    rate_per_currency: number;
  };
  multipliers?: Array<{
    name: string;
    type: string;
    multiplier: number;
  }>;
}

export function HowToEarn({ earning, multipliers }: HowToEarnProps) {
  if (!earning) {
    return null;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">How to Earn Points</h3>
      
      <div className="space-y-4">
        {/* Base earning rule */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
          <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
          <div>
            <p className="text-white font-medium">
              Earn {earning.rate_per_currency} point{earning.rate_per_currency !== 1 ? 's' : ''} per $1 spent
            </p>
            <p className="text-[#C6C8CC] text-sm">Base earning rate</p>
          </div>
        </div>
        
        {/* Multipliers */}
        {multipliers && multipliers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-white font-medium text-sm">Bonus Multipliers:</h4>
            {multipliers.map((multiplier, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <StarIcon className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-white font-medium">
                    {multiplier.name} - {multiplier.multiplier}x points
                  </p>
                  <p className="text-[#C6C8CC] text-sm capitalize">{multiplier.type} bonus</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-200 text-sm">
            💳 Make purchases to start earning points immediately!
          </p>
        </div>
      </div>
    </div>
  );
}
