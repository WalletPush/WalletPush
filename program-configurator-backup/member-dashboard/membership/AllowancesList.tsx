'use client'

import React from 'react';

interface AllowancesListProps {
  allowances?: Array<{
    id: string;
    label: string;
    qty: number;
  }>;
  usage?: Array<{
    id: string;
    used: number;
    quota: number;
  }>;
}

export function AllowancesList({ allowances, usage }: AllowancesListProps) {
  if (!allowances || allowances.length === 0) {
    return null;
  }

  const getUsage = (allowanceId: string) => {
    return usage?.find(u => u.id === allowanceId) || { used: 0, quota: 0 };
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Monthly Allowances</h3>
      
      <div className="space-y-4">
        {allowances.map((allowance) => {
          const usage_data = getUsage(allowance.id);
          const used = usage_data.used;
          const quota = allowance.qty;
          const remaining = Math.max(0, quota - used);
          const progressPercent = quota > 0 ? (used / quota) * 100 : 0;
          
          return (
            <div key={allowance.id} className="p-4 bg-white/5 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">{allowance.label}</span>
                <span className="text-[#C6C8CC] text-sm">
                  {used} / {quota} used
                </span>
              </div>
              
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>
              
              <p className="text-[#C6C8CC] text-sm">
                {remaining > 0 ? (
                  `${remaining} remaining this month`
                ) : (
                  'Allowance used up for this month'
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
