'use client'

import React, { useState } from 'react';
import { SwatchIcon } from '@heroicons/react/24/outline';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}

export function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Predefined color presets
  const colorPresets = [
    '#1e293b', '#374151', '#1f2937', '#18181b', '#0f172a', // Dark variants
    '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', // Blues
    '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', // Purples
    '#10b981', '#059669', '#047857', '#065f46', '#064e3b', // Greens
    '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f', // Ambers
    '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', // Reds
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 w-full p-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div 
            className="w-6 h-6 rounded-md border border-slate-300 shadow-sm"
            style={{ backgroundColor: value }}
          />
          <span className="flex-1 text-left text-sm text-slate-900 font-mono uppercase">
            {value}
          </span>
          <SwatchIcon className="w-5 h-5 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white border border-slate-300 rounded-lg shadow-lg z-50">
            {/* Custom Color Input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Custom Color (Hex)
              </label>
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 border border-slate-300 rounded cursor-pointer"
              />
            </div>

            {/* Color Presets */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-600">
                Quick Presets
              </label>
              <div className="grid grid-cols-10 gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      onChange(color);
                      setIsOpen(false);
                    }}
                    className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                      value === color 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full px-3 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
}




