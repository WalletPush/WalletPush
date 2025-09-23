'use client'

import React from 'react';
import { formatCurrency } from '@/lib/member-dashboard/utils';
import { StarIcon } from '@heroicons/react/24/solid';

interface MembershipHeaderProps {
  program_name?: string;
  price_monthly?: number;
  tagline?: string;
}

export function MembershipHeader({ program_name, price_monthly, tagline }: MembershipHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/20 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <StarIcon className="w-8 h-8 text-yellow-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">
            {program_name || 'Membership Program'}
          </h2>
          {tagline && (
            <p className="text-[#C6C8CC]">{tagline}</p>
          )}
        </div>
      </div>
      
      {price_monthly && (
        <div className="flex items-center justify-between">
          <span className="text-[#C6C8CC]">Monthly Membership</span>
          <span className="text-2xl font-bold text-white">
            {formatCurrency(price_monthly)}/month
          </span>
        </div>
      )}
    </div>
  );
}
