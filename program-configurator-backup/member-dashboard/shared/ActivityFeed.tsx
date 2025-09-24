'use client'

import React from 'react';
import { formatRelativeTime } from '@/components/member-dashboard/utils';

interface ActivityFeedProps {
  recent_activity?: Array<{
    ts: string;
    type: string;
    points?: number;
    meta?: any;
  }>;
}

export function ActivityFeed({ recent_activity }: ActivityFeedProps) {
  if (!recent_activity || recent_activity.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <p className="text-[#C6C8CC]">No recent activity</p>
      </div>
    );
  }

  const formatActivityLine = (activity: any) => {
    switch (activity.type) {
      case 'earn':
        return `+${activity.points} points earned`;
      case 'redeem':
        return `Redeemed ${activity.meta?.reward_title || 'reward'}`;
      case 'check_in':
        return 'Checked in';
      case 'adjust':
        return `Adjustment: ${activity.points > 0 ? '+' : ''}${activity.points} points`;
      case 'auto_reward':
        return `Auto reward: ${activity.meta?.title || 'Special bonus'}`;
      default:
        return activity.type;
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {recent_activity.map((activity, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
            <span className="text-white">{formatActivityLine(activity)}</span>
            <span className="text-[#C6C8CC] text-sm">
              {formatRelativeTime(activity.ts)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
