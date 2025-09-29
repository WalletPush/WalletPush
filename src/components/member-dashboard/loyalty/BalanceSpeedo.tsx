'use client'

import React from 'react'
import { Star, TrendingUp, Award, Zap } from 'lucide-react'

interface BalanceSpeedoProps {
  points_balance?: number  // Changed to match bindProps output
  pointsBalance?: number   // Keep for backward compatibility
  pointsToNextTier?: number
  tier?: {
    name: string
    threshold: number
    color?: string
  }
  tiers?: Array<{
    id: string
    name: string
    pointsRequired: number
    color: string
  }>
  variant?: 'ring' | 'half' | 'bar' | 'minimal'
  showTier?: boolean
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
  accent?: 'primary' | 'accent' | 'success' | 'warning' | 'error'
}

export function BalanceSpeedo({
  points_balance,
  pointsBalance,
  pointsToNextTier,
  tier,
  tiers,
  variant = 'ring',
  showTier = true,
  showProgress = true,
  size = 'md',
  accent = 'primary'
}: BalanceSpeedoProps) {
  // Use points_balance (from bindProps) or pointsBalance (backward compatibility)
  const actualPointsBalance = points_balance ?? pointsBalance ?? 0;
  
  // Debug logging
  console.log('🔍 BalanceSpeedo received props:', {
    points_balance,
    pointsBalance,
    actualPointsBalance,
    allProps: { points_balance, pointsBalance, tier, tiers, variant, showTier, showProgress, size, accent }
  });
  
  const formatPoints = (points: number) => {
    if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`
    if (points >= 1000) return `${(points / 1000).toFixed(1)}K`
    return points.toLocaleString()
  }

  // Calculate current tier and progress based on configured tiers
  const getCurrentTierInfo = () => {
    if (!tiers || tiers.length === 0) {
      return {
        currentTier: tier || { name: 'Member', threshold: 0, color: '#6366f1' },
        nextTier: null,
        pointsToNextTier: 0,
        progressPercentage: 0
      }
    }

    // Sort tiers by points required
    const sortedTiers = [...tiers].sort((a, b) => a.pointsRequired - b.pointsRequired)
    
    // Find current tier (highest tier the user has achieved)
    let currentTier = sortedTiers[0]
    for (const tierConfig of sortedTiers) {
      if (actualPointsBalance >= tierConfig.pointsRequired) {
        currentTier = tierConfig
      } else {
        break
      }
    }
    
    // Find next tier
    const nextTier = sortedTiers.find(t => t.pointsRequired > actualPointsBalance)
    const pointsToNext = nextTier ? nextTier.pointsRequired - actualPointsBalance : 0
    
    // Calculate progress percentage
    let progressPercentage = 0
    if (nextTier && currentTier) {
      const tierRange = nextTier.pointsRequired - currentTier.pointsRequired
      const currentProgress = actualPointsBalance - currentTier.pointsRequired
      progressPercentage = tierRange > 0 ? (currentProgress / tierRange) * 100 : 100
    } else if (!nextTier) {
      progressPercentage = 100 // Max tier achieved
    }
    
    return {
      currentTier: {
        name: currentTier.name,
        threshold: currentTier.pointsRequired,
        color: currentTier.color
      },
      nextTier,
      pointsToNextTier: pointsToNext,
      progressPercentage: Math.min(progressPercentage, 100)
    }
  }

  const getProgressPercentage = () => {
    if (tiers && tiers.length > 0) {
      return getCurrentTierInfo().progressPercentage
    }
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

  const tierInfo = getCurrentTierInfo()
  const progressPercentage = getProgressPercentage()
  const displayTier = tierInfo.currentTier
  const TierIcon = getTierIcon(displayTier?.name)

  if (variant === 'minimal') {
    return (
      <div className="wp-card p-4" data-wp-section-accent={accent}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`font-bold wp-text-primary ${textSizeClasses[size].main}`}>
              {formatPoints(actualPointsBalance)}
            </div>
            <div className={`wp-text-secondary ${textSizeClasses[size].label}`}>
              points
            </div>
          </div>
          
          {showTier && displayTier && (
            <div className="flex items-center gap-2">
              <TierIcon className="w-4 h-4 wp-text-primary" style={{ color: displayTier.color }} />
              <span className={`wp-text-secondary ${textSizeClasses[size].tier}`}>
                {displayTier.name}
              </span>
            </div>
          )}
        </div>
        
        {showProgress && tierInfo.pointsToNextTier > 0 && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-xs wp-text-muted">
                Progress to next tier
              </span>
              <span className="text-xs wp-text-muted">
                {formatPoints(tierInfo.pointsToNextTier)} to go
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
    // Debug logging for bar variant specifically
    console.log('🎯 BAR VARIANT DEBUG:', {
      tiers,
      tierInfo,
      pointsToNextTier,
      progressPercentage,
      showProgress,
      actualPointsBalance,
      shouldShowProgress: showProgress && (
        (tierInfo.pointsToNextTier !== null && tierInfo.pointsToNextTier > 0) ||
        (pointsToNextTier !== undefined && pointsToNextTier > 0)
      )
    });
    
    return (
      <div className="wp-card p-6" data-wp-section-accent={accent}>
        <div className="flex items-center gap-4">
          <div className="wp-gradient p-4 rounded-lg">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          
          <div className="flex-1">
            <div className={`font-bold wp-text-primary ${textSizeClasses[size].main}`}>
              {formatPoints(actualPointsBalance)}
            </div>
            <div className={`wp-text-secondary ${textSizeClasses[size].label} mb-2`}>
              points available
            </div>
            
            {showProgress && (
              (tierInfo.pointsToNextTier !== null && tierInfo.pointsToNextTier > 0) ||
              (pointsToNextTier !== undefined && pointsToNextTier > 0)
            ) && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs wp-text-muted">
                    {tierInfo.nextTier ? `Progress to ${tierInfo.nextTier.name}` : 
                     (tier?.name ? `Progress to ${tier.name}` : 'Progress to next tier')}
                  </span>
                  <span className="text-xs wp-text-muted">
                    {formatPoints(tierInfo.pointsToNextTier || pointsToNextTier || 0)} to go
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${tierInfo.progressPercentage || progressPercentage}%`,
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
              {formatPoints(actualPointsBalance)}
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
            {formatPoints(actualPointsBalance)}
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
