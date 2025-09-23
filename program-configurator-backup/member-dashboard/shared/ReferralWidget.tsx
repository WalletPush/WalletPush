'use client'

import React, { useState } from 'react';
import { UserPlusIcon, GiftIcon, ShareIcon, CheckCircleIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

interface ReferralWidgetProps {
  referral_code?: string;
  referral_link?: string;
  referrals_count?: number;
  referral_reward?: {
    friend_gets: string;
    you_get: string;
  };
}

export function ReferralWidget({ 
  referral_code = 'WELLNESS50', 
  referral_link = 'https://app.example.com/join/WELLNESS50',
  referrals_count = 3,
  referral_reward = {
    friend_gets: '50 bonus points',
    you_get: '100 bonus points'
  }
}: ReferralWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [shareMethod, setShareMethod] = useState<'link' | 'code'>('link');

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on this amazing wellness journey!',
          text: `Use my referral code ${referral_code} and get ${referral_reward.friend_gets}!`,
          url: referral_link,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback to copy
      handleCopy(referral_link);
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-teal-400/10 to-emerald-400/10 rounded-full blur-lg"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
            <UserPlusIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Refer Friends</h3>
            <p className="text-white text-sm">Share the wellness, earn rewards</p>
          </div>
        </div>

        {/* Rewards Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <GiftIcon className="w-5 h-5 text-emerald-400" />
            Referral Rewards
          </h4>
          
          <div className="space-y-3">
            <div className="text-center">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <SparklesIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs text-white mb-1">Your friend gets</div>
              <div className="text-sm font-semibold text-emerald-400">{referral_reward?.friend_gets}</div>
            </div>
            
            <div className="text-center">
              <div className="w-8 h-8 bg-teal-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <SparklesIcon className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-xs text-white mb-1">You get</div>
              <div className="text-sm font-semibold text-teal-400">{referral_reward?.you_get}</div>
            </div>
          </div>
        </div>

        {/* Share Method Toggle */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-4">
          <button
            onClick={() => setShareMethod('link')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              shareMethod === 'link' 
                ? 'bg-emerald-600 text-white' 
                : 'text-white hover:text-white'
            }`}
          >
            Share Link
          </button>
          <button
            onClick={() => setShareMethod('code')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              shareMethod === 'code' 
                ? 'bg-emerald-600 text-white' 
                : 'text-white hover:text-white'
            }`}
          >
            Share Code
          </button>
        </div>

        {/* Share Content */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-3">
              <div className="text-xs text-white mb-1">
                {shareMethod === 'link' ? 'Referral Link' : 'Referral Code'}
              </div>
              <div className="text-sm text-white font-mono break-all">
                {shareMethod === 'link' ? referral_link : referral_code}
              </div>
            </div>
            
            <button
              onClick={() => handleCopy(shareMethod === 'link' ? referral_link : referral_code)}
              className="w-8 h-8 bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center transition-colors"
            >
              {copied ? (
                <CheckCircleIcon className="w-4 h-4 text-white" />
              ) : (
                <ClipboardDocumentIcon className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
          >
            <ShareIcon className="w-5 h-5" />
            Share Now
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-white">
            <UserPlusIcon className="w-4 h-4" />
            <span>{referrals_count} friends referred</span>
          </div>
          
          <div className="text-emerald-400 font-medium">
            +{referrals_count * parseInt(referral_reward?.you_get || '0')} points earned
          </div>
        </div>

        {/* Copy confirmation */}
        {copied && (
          <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs px-3 py-1 rounded-full">
            Copied!
          </div>
        )}
      </div>
    </div>
  );
}
