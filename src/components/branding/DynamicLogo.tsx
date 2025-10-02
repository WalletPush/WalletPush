'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useBranding } from '@/contexts/BrandingContext'

interface DynamicLogoProps {
  className?: string
  width?: number
  height?: number
  alt?: string
  variant?: 'default' | 'white' // For dark backgrounds
}

export function DynamicLogo({ 
  className = '', 
  width = 120, 
  height = 40, 
  alt,
  variant = 'default'
}: DynamicLogoProps) {
  const { branding, isLoading } = useBranding()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Show NOTHING until we're client-side AND branding is resolved
  if (!isClient || isLoading) {
    return (
      <div 
        className={className}
        style={{ width, height }}
      />
    )
  }
  
  // Determine logo URL based on branding and variant (client-side only)
  let logoUrl = '/images/walletpush-logo.png' // Default logo
  
  if (branding?.logo_url) {
    // Use agency logo if available
    logoUrl = branding.logo_url
  } else {
    // Use WalletPush logo based on variant
    logoUrl = variant === 'white' ? '/images/logowhite.png' : '/images/walletpush-logo.png'
  }
  
  // Determine alt text
  const logoAlt = alt || (branding?.agency_name ? `${branding.agency_name} Logo` : 'WalletPush Logo')
  
  
  return (
    <Image
      src={logoUrl}
      alt={logoAlt}
      width={width}
      height={height}
      className={className}
      priority
      onError={(e) => {
        // Fallback to appropriate WalletPush logo if agency logo fails to load
        console.warn('Failed to load logo:', logoUrl)
        const fallbackLogo = variant === 'white' ? '/images/logowhite.png' : '/images/walletpush-logo.png'
        e.currentTarget.src = fallbackLogo
      }}
    />
  )
}

// Simplified version for text-based logos
export function DynamicBrandName({ className = '' }: { className?: string }) {
  const { branding } = useBranding()
  
  return (
    <span className={className}>
      {branding?.agency_name || 'WalletPush'}
    </span>
  )
}
