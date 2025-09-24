'use client'

import React from 'react';
import { formatCurrency } from '@/components/member-dashboard/utils';
import { PlusIcon } from '@heroicons/react/24/outline';

interface BalanceCardProps {
  stored_value_balance?: number;
}

export function BalanceCard({ stored_value_balance = 0 }: BalanceCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Card Balance</h3>
      
      <div className="bg-gradient-to-r from-green-600/20 to-teal-600/20 border border-white/20 rounded-lg p-6 mb-4">
        <div className="text-center">
          <p className="text-[#C6C8CC] text-sm mb-1">Available Balance</p>
          <p className="text-4xl font-bold text-white">{formatCurrency(stored_value_balance)}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <button className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Money
        </button>
        
        <button className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-lg transition-colors">
          Transaction History
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-blue-200 text-sm">
          💳 Use your card balance for in-store and online purchases
        </p>
      </div>
    </div>
  );
}
