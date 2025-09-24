'use client'

import React from 'react';
import { formatPoints, formatCurrency } from '@/components/member-dashboard/utils';

interface OffersStripProps {
  active?: Array<{
    id: string;
    title: string;
    description: string;
    cost_type: 'points' | 'credit' | 'free';
    cost_value?: number;
  }>;
}

export function OffersStrip({ active }: OffersStripProps) {
  if (!active || active.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Special Offers</h3>
        <p className="text-[#C6C8CC]">No offers available right now</p>
      </div>
    );
  }

  const formatCost = (offer: any) => {
    if (offer.cost_type === 'free') return 'Free';
    if (offer.cost_type === 'points') return `${formatPoints(offer.cost_value || 0)} points`;
    if (offer.cost_type === 'credit') return formatCurrency(offer.cost_value || 0);
    return 'Special Price';
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Special Offers</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {active.map((offer) => (
          <div key={offer.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
            <h4 className="text-white font-semibold mb-2">{offer.title}</h4>
            <p className="text-[#C6C8CC] text-sm mb-3">{offer.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-green-400 font-medium">{formatCost(offer)}</span>
              <button className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm rounded-lg transition-all duration-200">
                Claim
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
