'use client'

import React from 'react';
import { formatCurrency } from '@/components/member-dashboard/utils';
import { WalletIcon } from '@heroicons/react/24/outline';

interface CreditWalletProps {
  credit_balance?: number;
  catalog?: Array<{
    id: string;
    title: string;
    cost_credit: number;
  }>;
}

export function CreditWallet({ credit_balance = 0, catalog }: CreditWalletProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <WalletIcon className="w-5 h-5" />
        Credit Wallet
      </h3>
      
      <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-white/20 rounded-lg p-4 mb-4">
        <div className="text-center">
          <p className="text-[#C6C8CC] text-sm mb-1">Available Credit</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(credit_balance)}</p>
        </div>
      </div>
      
      {catalog && catalog.length > 0 && (
        <div>
          <h4 className="text-white font-medium mb-3">Available with Credit:</h4>
          <div className="space-y-2">
            {catalog.slice(0, 3).map((item) => {
              const canAfford = credit_balance >= item.cost_credit;
              
              return (
                <div key={item.id} className={`p-3 rounded-lg border transition-colors ${
                  canAfford 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm">{item.title}</span>
                    <span className={`text-sm font-medium ${
                      canAfford ? 'text-green-400' : 'text-[#C6C8CC]'
                    }`}>
                      {formatCurrency(item.cost_credit)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
