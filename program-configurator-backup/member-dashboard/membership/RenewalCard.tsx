'use client'

import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface RenewalCardProps {
  billing_day?: number;
  next_invoice?: string;
}

export function RenewalCard({ billing_day, next_invoice }: RenewalCardProps) {
  const formatNextInvoice = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const daysUntilRenewal = next_invoice ? 
    Math.ceil((new Date(next_invoice).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5" />
        Membership Renewal
      </h3>
      
      <div className="space-y-3">
        {next_invoice && (
          <div className="flex justify-between items-center">
            <span className="text-[#C6C8CC]">Next billing date:</span>
            <span className="text-white font-medium">{formatNextInvoice(next_invoice)}</span>
          </div>
        )}
        
        {daysUntilRenewal !== null && (
          <div className="flex justify-between items-center">
            <span className="text-[#C6C8CC]">Days until renewal:</span>
            <span className={`font-medium ${
              daysUntilRenewal <= 7 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {daysUntilRenewal} days
            </span>
          </div>
        )}
        
        {billing_day && (
          <div className="flex justify-between items-center">
            <span className="text-[#C6C8CC]">Billing day:</span>
            <span className="text-white font-medium">{billing_day}{getOrdinalSuffix(billing_day)} of each month</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex gap-2">
          <button className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-colors">
            Manage Billing
          </button>
          <button className="flex-1 py-2 px-4 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/30 rounded-lg text-yellow-200 font-medium transition-colors">
            Pause Membership
          </button>
        </div>
      </div>
    </div>
  );
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
