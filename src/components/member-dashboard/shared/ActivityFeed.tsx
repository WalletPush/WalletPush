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
      <div className="wp-card p-6">
        <h3 className="text-lg font-semibold wp-text-primary mb-4">Recent Activity</h3>
        <p className="wp-text-muted">No recent activity</p>
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
    <div className="wp-card p-6">
      <h3 className="text-lg font-semibold wp-text-primary mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {recent_activity.map((activity, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b border-slate-600/20 last:border-b-0">
            <span>{formatActivityLine(activity)}</span>
            <span className="wp-text-muted text-sm">
              {formatRelativeTime(activity.ts)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
