'use client'

import React, { createContext, useContext, ReactNode } from 'react'

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

const defaultBranding: BrandingConfig = {
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF', 
  logoUrl: '/images/walletpush-logo.png',
  companyName: 'WalletPush'
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

interface BrandingProviderProps {
  children: ReactNode
}

export function BrandingProvider({ children }: BrandingProviderProps) {
  const [branding, setBranding] = React.useState<BrandingConfig>(defaultBranding)

  const updateBranding = (config: Partial<BrandingConfig>) => {
    setBranding(prev => ({ ...prev, ...config }))
  }

  return (
    <BrandingContext.Provider value={{ branding, updateBranding }}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  const context = useContext(BrandingContext)
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider')
  }
  return context
}