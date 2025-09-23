'use client'

import React, { useState } from 'react'
import { QrCode, MapPin, Clock, CheckCircle } from 'lucide-react'

interface QRCheckInButtonProps {
  businessId: string
  businessName?: string
  location?: string
  style?: 'button' | 'card'
  showCooldown?: boolean
  disabled?: boolean
  lastCheckIn?: string // ISO timestamp
  cooldownMinutes?: number
  accentColor?: string
  onCheckIn?: (result: { success: boolean; message: string; eventId?: string }) => void
}

export function QRCheckInButton({
  businessId,
  businessName = 'Business',
  location,
  style = 'card',
  showCooldown = true,
  disabled = false,
  lastCheckIn,
  cooldownMinutes = 60,
  accentColor = '#3b82f6',
  onCheckIn
}: QRCheckInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastCheckInResult, setLastCheckInResult] = useState<{
    success: boolean
    message: string
    timestamp: string
  } | null>(null)

  // Calculate if user is in cooldown period
  const isInCooldown = () => {
    if (!lastCheckIn || !showCooldown) return false
    const lastCheckInTime = new Date(lastCheckIn).getTime()
    const now = Date.now()
    const cooldownMs = cooldownMinutes * 60 * 1000
    return (now - lastCheckInTime) < cooldownMs
  }

  const getCooldownRemaining = () => {
    if (!lastCheckIn || !isInCooldown()) return 0
    const lastCheckInTime = new Date(lastCheckIn).getTime()
    const now = Date.now()
    const cooldownMs = cooldownMinutes * 60 * 1000
    const remaining = cooldownMs - (now - lastCheckInTime)
    return Math.ceil(remaining / (60 * 1000)) // Return minutes remaining
  }

  const handleCheckIn = async () => {
    if (disabled || isInCooldown() || isLoading) return

    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/checkin/${businessId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device: 'member_scanner',
          location: location || 'unknown',
          timestamp: new Date().toISOString()
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        const checkInResult = {
          success: true,
          message: result.message || 'Check-in successful!',
          timestamp: new Date().toISOString()
        }
        setLastCheckInResult(checkInResult)
        onCheckIn?.({
          success: true,
          message: checkInResult.message,
          eventId: result.event_id
        })
      } else {
        const errorResult = {
          success: false,
          message: result.error || 'Check-in failed'
        }
        onCheckIn?.(errorResult)
      }
    } catch (error) {
      console.error('Check-in error:', error)
      const errorResult = {
        success: false,
        message: 'Network error. Please try again.'
      }
      onCheckIn?.(errorResult)
    } finally {
      setIsLoading(false)
    }
  }

  const cooldownMinutesRemaining = getCooldownRemaining()
  const inCooldown = isInCooldown()

  if (style === 'button') {
    return (
      <button
        onClick={handleCheckIn}
        disabled={disabled || inCooldown || isLoading}
        className={`
          wp-button relative overflow-hidden group
          ${inCooldown ? 'opacity-50 cursor-not-allowed' : ''}
          ${isLoading ? 'opacity-75' : ''}
        `}
        style={{ backgroundColor: accentColor }}
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : lastCheckInResult?.success ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <QrCode className="w-4 h-4" />
          )}
          <span>
            {isLoading ? 'Checking in...' : 
             lastCheckInResult?.success ? 'Checked In!' :
             inCooldown ? `Check In (${cooldownMinutesRemaining}m)` : 
             'Check In'}
          </span>
        </div>
        
        {inCooldown && showCooldown && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
            <div 
              className="h-full bg-white/40 transition-all duration-1000"
              style={{ 
                width: `${100 - (cooldownMinutesRemaining / cooldownMinutes) * 100}%` 
              }}
            />
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="wp-card p-6 relative">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold wp-text-primary mb-1">
            Quick Check-In
          </h3>
          <p className="wp-text-secondary text-sm">
            {businessName}
          </p>
          {location && (
            <div className="flex items-center gap-1 mt-1 text-xs wp-force-white">
              <MapPin className="w-3 h-3" />
              <span>{location}</span>
            </div>
          )}
        </div>
        
        <div className="wp-gradient p-3 rounded-lg">
          <QrCode className="w-6 h-6 text-white" />
        </div>
      </div>

      {lastCheckInResult?.success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>{lastCheckInResult.message}</span>
          </div>
        </div>
      )}

      {inCooldown && showCooldown && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Next check-in in {cooldownMinutesRemaining} minutes</span>
          </div>
          <div className="mt-2 bg-yellow-500/20 rounded-full h-2">
            <div 
              className="h-full bg-yellow-400 rounded-full transition-all duration-1000"
              style={{ 
                width: `${100 - (cooldownMinutesRemaining / cooldownMinutes) * 100}%` 
              }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleCheckIn}
        disabled={disabled || inCooldown || isLoading}
        className={`
          w-full wp-button justify-center
          ${inCooldown ? 'opacity-50 cursor-not-allowed' : ''}
          ${isLoading ? 'opacity-75' : ''}
        `}
        style={{ backgroundColor: accentColor }}
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : lastCheckInResult?.success ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <QrCode className="w-4 h-4" />
          )}
          <span>
            {isLoading ? 'Checking in...' : 
             lastCheckInResult?.success ? 'Checked In!' :
             inCooldown ? `Check In (${cooldownMinutesRemaining}m)` : 
             'Tap to Check In'}
          </span>
        </div>
      </button>
    </div>
  )
}
