'use client'

import React from 'react';
import { formatCurrency } from '@/components/member-dashboard/utils';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface RedeemGridProps {
  catalog?: Array<{
    id: string;
    title: string;
    cost_credit?: number;
    value_currency?: number;
  }>;
}

export function RedeemGrid({ catalog }: RedeemGridProps) {
  if (!catalog || catalog.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Store Purchases</h3>
        <p className="text-[#C6C8CC]">Use your card balance for any store purchase</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Quick Purchase Options</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {catalog.map((item) => (
          <div key={item.id} className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCartIcon className="w-5 h-5 text-green-400" />
                  <h4 className="text-white font-medium">{item.title}</h4>
                </div>
                {item.cost_credit && (
                  <p className="text-[#C6C8CC] text-sm">
                    {formatCurrency(item.cost_credit)} from card balance
                  </p>
                )}
                {item.value_currency && (
                  <p className="text-green-400 text-sm">
                    Worth {formatCurrency(item.value_currency)}
                  </p>
                )}
              </div>
            </div>
            
            <button className="w-full py-2 px-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium rounded-lg transition-all duration-200">
              Purchase
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
