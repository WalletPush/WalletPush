'use client'

import React from 'react';
import { CreditCardIcon } from '@heroicons/react/24/outline';

interface StoreCardHeaderProps {
  program_name?: string;
}

export function StoreCardHeader({ program_name }: StoreCardHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-green-600/20 to-teal-600/20 border border-white/20 rounded-lg p-6">
      <div className="flex items-center gap-3">
        <CreditCardIcon className="w-8 h-8 text-green-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">
            {program_name || 'Store Card'}
          </h2>
          <p className="text-[#C6C8CC]">Stored value card for purchases</p>
        </div>
      </div>
    </div>
  );
}
