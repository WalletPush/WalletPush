'use client';

import React from 'react';
import { DollarSign, Star, Gift, Clock, Users, Zap } from 'lucide-react';

interface EarningMethod {
  id: string;
  title: string;
  description: string;
  points: string;
  icon: string;
  color?: string;
}

interface HowToEarnProps {
  title?: string;
  subtitle?: string;
  earningMethods?: EarningMethod[];
  style?: 'card' | 'list' | 'grid';
  showIcons?: boolean;
  showPoints?: boolean;
}

const ICON_MAP = {
  'dollar': DollarSign,
  'star': Star,
  'gift': Gift,
  'clock': Clock,
  'users': Users,
  'zap': Zap
};

const DEFAULT_EARNING_METHODS: EarningMethod[] = [
  {
    id: 'purchase',
    title: 'Make Purchases',
    description: 'Earn points with every dollar spent',
    points: '1 point per $1',
    icon: 'dollar',
    color: 'var(--wp-success)'
  },
  {
    id: 'checkin',
    title: 'Check In',
    description: 'Visit our location and check in',
    points: '50 points',
    icon: 'clock',
    color: 'var(--wp-primary)'
  },
  {
    id: 'referral',
    title: 'Refer Friends',
    description: 'Invite friends to join our program',
    points: '500 points',
    icon: 'users',
    color: 'var(--wp-accent)'
  },
  {
    id: 'bonus',
    title: 'Special Offers',
    description: 'Complete special challenges and promotions',
    points: 'Varies',
    icon: 'gift',
    color: 'var(--wp-warning)'
  }
];

export function HowToEarn({
  title = 'How to Earn Points',
  subtitle = 'Multiple ways to earn and unlock rewards',
  earningMethods = DEFAULT_EARNING_METHODS,
  style = 'card',
  showIcons = true,
  showPoints = true
}: HowToEarnProps) {
  const getIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP] || DollarSign;
    return IconComponent;
  };

  if (style === 'list') {
    return (
      <div className="wp-card p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold wp-text-primary mb-2">{title}</h3>
          <p className="wp-text-secondary text-sm">{subtitle}</p>
        </div>
        
        <div className="space-y-4">
          {earningMethods.map((method, index) => {
            const IconComponent = getIcon(method.icon);
            return (
              <div key={method.id} className="flex items-center gap-4 p-3 wp-surface rounded-lg border border-wp-border">
                {showIcons && (
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${method.color}20`, color: method.color }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium wp-text-primary">{method.title}</h4>
                  <p className="text-sm wp-text-secondary">{method.description}</p>
                </div>
                {showPoints && (
                  <div className="text-right">
                    <span className="font-semibold wp-text-primary">{method.points}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (style === 'grid') {
    return (
      <div className="wp-card p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold wp-text-primary mb-2">{title}</h3>
          <p className="wp-text-secondary text-sm">{subtitle}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {earningMethods.map((method, index) => {
            const IconComponent = getIcon(method.icon);
            return (
              <div key={method.id} className="p-4 wp-surface rounded-lg border border-wp-border text-center">
                {showIcons && (
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: `${method.color}20`, color: method.color }}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                )}
                <h4 className="font-medium wp-text-primary mb-2">{method.title}</h4>
                <p className="text-sm wp-text-secondary mb-2">{method.description}</p>
                {showPoints && (
                  <div className="font-semibold wp-text-primary">{method.points}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default card style
  return (
    <div className="wp-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold wp-text-primary mb-2">{title}</h3>
        <p className="wp-text-secondary text-sm">{subtitle}</p>
      </div>
      
      <div className="space-y-4">
        {earningMethods.map((method, index) => {
          const IconComponent = getIcon(method.icon);
          return (
            <div key={method.id} className="relative">
              <div className="flex items-start gap-4 p-4 wp-surface rounded-lg border border-wp-border hover:border-wp-border-hover transition-colors">
                {showIcons && (
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${method.color}20`, color: method.color }}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium wp-text-primary">{method.title}</h4>
                    {showPoints && (
                      <span className="font-semibold wp-text-primary text-sm whitespace-nowrap">
                        {method.points}
                      </span>
                    )}
                  </div>
                  <p className="text-sm wp-text-secondary mt-1">{method.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <p className="text-sm wp-text-primary font-medium">
            Start earning today! Every action brings you closer to amazing rewards.
          </p>
        </div>
      </div>
    </div>
  );
}
