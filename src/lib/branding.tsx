// Legacy branding compatibility layer
// This file provides backward compatibility for the old branding system
// while using the new dynamic branding system under the hood

'use client'

import { useBranding as useNewBranding, useBrandColors } from '@/contexts/BrandingContext'

interface BrandingConfig {
  primaryColor: string
  secondaryColor: string
  logoUrl: string
  companyName: string
}

interface BrandingContextType {
  branding: BrandingConfig
  updateBranding: (config: Partial<BrandingConfig>) => void
}

// Re-export the new BrandingProvider
export { BrandingProvider } from '@/contexts/BrandingContext'

// Legacy useBranding hook that maps to the new system
export function useBranding(): BrandingContextType {
  const { branding } = useNewBranding()
  const colors = useBrandColors()
  
  // Map new branding format to legacy format
  const legacyBranding: BrandingConfig = {
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    logoUrl: branding?.logo_url || '/images/walletpush-logo.png',
    companyName: branding?.agency_name || 'WalletPush'
  }
  
  // Legacy update function (no-op since new system is read-only from API)
  const updateBranding = (config: Partial<BrandingConfig>) => {
    console.warn('updateBranding is deprecated. Branding is now managed through the database.')
  }
  
  return {
    branding: legacyBranding,
    updateBranding
  }
}