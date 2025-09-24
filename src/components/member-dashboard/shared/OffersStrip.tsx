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
      <div className="wp-card p-6">
        <h3 className="text-lg font-semibold wp-text-primary mb-4">Special Offers</h3>
        <p className="wp-text-muted">No offers available right now</p>
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
    <div className="wp-card p-6">
      <h3 className="text-lg font-semibold wp-text-primary mb-4">Special Offers</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {active.map((offer) => (
          <div key={offer.id} className="wp-card p-4 hover:bg-slate-700/30 transition-colors">
            <h4 className="font-semibold mb-2">{offer.title}</h4>
            <p className="wp-text-muted text-sm mb-3">{offer.description}</p>
            <div className="flex justify-between items-center">
              <span className="wp-text-primary font-medium">{formatCost(offer)}</span>
              <button className="wp-cta px-3 py-1 text-sm">
                Claim
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
