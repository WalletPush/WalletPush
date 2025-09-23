'use client'

import React from 'react'
import { Star, TrendingUp, Award, Zap } from 'lucide-react'

interface BalanceSpeedoProps {
  pointsBalance: number
  pointsToNextTier?: number
  tier?: {
    name: string
    threshold: number
    color?: string
  }
  variant?: 'ring' | 'half' | 'bar' | 'minimal'
  showTier?: boolean
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
  accent?: 'primary' | 'accent' | 'success' | 'warning' | 'error'
}

export function BalanceSpeedo({
  pointsBalance,
  pointsToNextTier,
  tier,
  variant = 'ring',
  showTier = true,
  showProgress = true,
  size = 'md',
  accent = 'primary'
}: BalanceSpeedoProps) {
  const formatPoints = (points: number) => {
    if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`
    if (points >= 1000) return `${(points / 1000).toFixed(1)}K`
    return points.toLocaleString()
  }

  const getProgressPercentage = () => {
    if (!pointsToNextTier || !tier) return 0
    const currentTierProgress = tier.threshold - pointsToNextTier
    return Math.min((currentTierProgress / tier.threshold) * 100, 100)
  }

  const getTierIcon = (tierName?: string) => {
    if (!tierName) return Star
    const tierLower = tierName.toLowerCase()
    if (tierLower.includes('gold') || tierLower.includes('premium')) return Award
    if (tierLower.includes('silver') || tierLower.includes('plus')) return Star
    if (tierLower.includes('platinum') || tierLower.includes('elite')) return Zap
    return Star
  }

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40'
  }

  const textSizeClasses = {
    sm: { main: 'text-lg', label: 'text-xs', tier: 'text-xs' },
    md: { main: 'text-2xl', label: 'text-sm', tier: 'text-sm' },
    lg: { main: 'text-3xl', label: 'text-base', tier: 'text-base' }
  }

  const progressPercentage = getProgressPercentage()
  const TierIcon = getTierIcon(tier?.name)

  if (variant === 'minimal') {
    return (
      <div className="wp-card p-4" data-wp-section-accent={accent}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`font-bold wp-text-primary ${textSizeClasses[size].main}`}>
              {formatPoints(pointsBalance)}
            </div>
            <div className={`wp-text-secondary ${textSizeClasses[size].label}`}>
              points
            </div>
          </div>
          
          {showTier && tier && (
            <div className="flex items-center gap-2">
              <TierIcon className="w-4 h-4 wp-text-primary" />
              <span className={`wp-text-secondary ${textSizeClasses[size].tier}`}>
                {tier.name}
              </span>
            </div>
          )}
        </div>
        
        {showProgress && pointsToNextTier !== undefined && pointsToNextTier > 0 && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-xs wp-text-muted">
                Progress to next tier
              </span>
              <span className="text-xs wp-text-muted">
                {formatPoints(pointsToNextTier)} to go
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${progressPercentage}%`,
                  background: `var(--wp-${accent})`
                }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'bar') {
    return (
      <div className="wp-card p-6" data-wp-section-accent={accent}>
        <div className="flex items-center gap-4">
          <div className="wp-gradient p-4 rounded-lg">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          
          <div className="flex-1">
            <div className={`font-bold wp-text-primary ${textSizeClasses[size].main}`}>
              {formatPoints(pointsBalance)}
            </div>
            <div className={`wp-text-secondary ${textSizeClasses[size].label} mb-2`}>
              points available
            </div>
            
            {showProgress && pointsToNextTier !== undefined && pointsToNextTier > 0 && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs wp-text-muted">
                    {tier?.name && `Progress to ${tier.name}`}
                  </span>
                  <span className="text-xs wp-text-muted">
                    {formatPoints(pointsToNextTier)} to go
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${progressPercentage}%`,
                      background: `var(--wp-${accent})`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {showTier && tier && (
            <div className="text-center">
              <div className="wp-card p-3 mb-2">
                <TierIcon className="w-6 h-6 wp-text-primary mx-auto" />
              </div>
              <div className={`wp-text-secondary ${textSizeClasses[size].tier}`}>
                {tier.name}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'half') {
    const radius = size === 'lg' ? 70 : size === 'md' ? 50 : 40
    const strokeWidth = size === 'lg' ? 8 : size === 'md' ? 6 : 4
    const circumference = Math.PI * radius
    const strokeDashoffset = circumference - (progressPercentage / 100) * circumference

    return (
      <div className="wp-card p-6 text-center" data-wp-section-accent={accent}>
        <div className="relative inline-block">
          <svg 
            className={sizeClasses[size]}
            viewBox={`0 0 ${radius * 2 + strokeWidth * 2} ${radius + strokeWidth * 2}`}
          >
            {/* Background arc */}
            <path
              d={`M ${strokeWidth} ${radius + strokeWidth} A ${radius} ${radius} 0 0 1 ${radius * 2 + strokeWidth} ${radius + strokeWidth}`}
              fill="none"
              stroke="var(--wp-border)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Progress arc */}
            {showProgress && progressPercentage > 0 && (
              <path
                d={`M ${strokeWidth} ${radius + strokeWidth} A ${radius} ${radius} 0 0 1 ${radius * 2 + strokeWidth} ${radius + strokeWidth}`}
                fill="none"
                stroke={`var(--wp-${accent})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            )}
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`font-bold wp-text-primary ${textSizeClasses[size].main}`}>
              {formatPoints(pointsBalance)}
            </div>
            <div className={`wp-text-secondary ${textSizeClasses[size].label}`}>
              points
            </div>
          </div>
        </div>
        
        {showTier && tier && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <TierIcon className="w-4 h-4 wp-text-primary" />
            <span className={`wp-text-secondary ${textSizeClasses[size].tier}`}>
              {tier.name}
            </span>
          </div>
        )}
        
        {showProgress && pointsToNextTier !== undefined && pointsToNextTier > 0 && (
          <div className="mt-3 text-center">
            <div className={`wp-text-muted ${textSizeClasses[size].label}`}>
              {formatPoints(pointsToNextTier)} points to {tier?.name || 'next tier'}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default 'ring' variant
  const radius = size === 'lg' ? 60 : size === 'md' ? 45 : 35
  const strokeWidth = size === 'lg' ? 6 : size === 'md' ? 5 : 4
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference

  return (
    <div className="wp-card p-6 text-center" data-wp-section-accent={accent}>
      <div className="relative inline-block">
        <svg 
          className={sizeClasses[size]}
          viewBox={`0 0 ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`}
        >
          {/* Background circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke="var(--wp-border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          {showProgress && progressPercentage > 0 && (
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              stroke={`var(--wp-${accent})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
            />
          )}
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-bold wp-text-primary ${textSizeClasses[size].main}`}>
            {formatPoints(pointsBalance)}
          </div>
          <div className={`wp-text-secondary ${textSizeClasses[size].label}`}>
            points
          </div>
        </div>
      </div>
      
      {showTier && tier && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <TierIcon className="w-4 h-4 wp-text-primary" />
          <span className={`wp-text-secondary ${textSizeClasses[size].tier}`}>
            {tier.name}
          </span>
        </div>
      )}
      
      {showProgress && pointsToNextTier !== undefined && pointsToNextTier > 0 && (
        <div className="mt-3 text-center">
          <div className={`wp-text-muted ${textSizeClasses[size].label}`}>
            {formatPoints(pointsToNextTier)} to {tier?.name || 'next tier'}
          </div>
        </div>
      )}
    </div>
  )
}
