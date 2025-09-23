'use client'

import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface PerksGridProps {
  perks?: string[];
  discounts?: Array<{
    scope: string;
    percent: number;
  }>;
}

export function PerksGrid({ perks, discounts }: PerksGridProps) {
  const allPerks = [...(perks || []), ...(discounts?.map(d => `${d.percent}% off ${d.scope}`) || [])];
  
  if (allPerks.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <SparklesIcon className="w-5 h-5" />
        Member Perks
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {allPerks.map((perk, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0" />
            <span className="text-white text-sm">{perk}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
