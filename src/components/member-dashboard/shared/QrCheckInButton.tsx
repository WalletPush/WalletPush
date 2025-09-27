'use client'

import React, { useState } from 'react';
import { QrCodeIcon, CameraIcon } from '@heroicons/react/24/outline';

interface QrCheckInButtonProps {
  check_in_endpoint?: string;
}

export function QrCheckInButton({ check_in_endpoint }: QrCheckInButtonProps) {
  console.log('🔍 QrCheckInButton component rendered with endpoint:', check_in_endpoint);
  
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState('');

  const handleCheckIn = async () => {
    if (!check_in_endpoint) {
      setMessage('Check-in not available');
      return;
    }

    setIsScanning(true);
    setMessage('');

    try {
      // In a real implementation, this would open camera and scan QR
      // For now, we'll simulate a check-in
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch(check_in_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          device: 'customer_scanner'
        })
      });

      if (response.ok) {
        setMessage('✅ Checked in successfully!');
      } else {
        setMessage('❌ Check-in failed. Please try again.');
      }
    } catch (error) {
      setMessage('❌ Check-in failed. Please try again.');
    } finally {
      setIsScanning(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!check_in_endpoint) {
    return null; // Don't render if check-in is not available
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Quick Check-In</h3>
      <p className="text-[#C6C8CC] mb-4">Scan the business QR code to check in and earn rewards</p>
      
      <button
        onClick={handleCheckIn}
        disabled={isScanning}
        className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isScanning ? (
          <>
            <CameraIcon className="w-5 h-5 animate-pulse" />
            Scanning...
          </>
        ) : (
          <>
            <QrCodeIcon className="w-5 h-5" />
            Check In
          </>
        )}
      </button>
      
      {message && (
        <div className="mt-3 p-2 text-center text-sm">
          <span className={message.includes('✅') ? 'text-green-400' : 'text-red-400'}>
            {message}
          </span>
        </div>
      )}
    </div>
  );
}
