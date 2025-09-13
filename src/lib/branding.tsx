'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface BrandingConfig {
  logo_url?: string
  primary_color: string
  secondary_color: string
  background_color: string
  text_color: string
  company_name: string
  welcome_message: string
  tagline?: string
  custom_css?: string
  account_name?: string
  account_type?: string
}

interface BrandingContextType {
  branding: BrandingConfig
  updateBranding: (newBranding: Partial<BrandingConfig>) => Promise<void>
  isLoading: boolean
  error: string | null
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>({
    logo_url: '/images/walletpush-logo.png',
    primary_color: '#2E3748',
    secondary_color: '#4F46E5',
    background_color: '#1a1f2e',
    text_color: '#ffffff',
    company_name: 'WalletPush',
    welcome_message: 'Welcome to WalletPush',
    tagline: 'Digital Wallet Solutions'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load branding on mount
  useEffect(() => {
    loadBranding()
  }, [])

  // Apply custom CSS when branding changes
  useEffect(() => {
    applyCustomStyles()
  }, [branding])

  const loadBranding = async (domain?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const url = domain 
        ? `/api/branding?domain=${encodeURIComponent(domain)}`
        : '/api/branding'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.branding) {
        setBranding(data.branding)
      }
    } catch (err) {
      console.error('Failed to load branding:', err)
      setError('Failed to load branding')
    } finally {
      setIsLoading(false)
    }
  }

  const updateBranding = async (newBranding: Partial<BrandingConfig>) => {
    try {
      setError(null)
      
      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBranding),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update branding')
      }
      
      if (data.branding) {
        setBranding(data.branding)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update branding'
      setError(errorMessage)
      throw err
    }
  }

  const applyCustomStyles = () => {
    // Remove existing custom styles
    const existingStyle = document.getElementById('custom-branding-styles')
    if (existingStyle) {
      existingStyle.remove()
    }

    // Apply CSS custom properties for colors
    document.documentElement.style.setProperty('--brand-primary', branding.primary_color)
    document.documentElement.style.setProperty('--brand-secondary', branding.secondary_color)
    document.documentElement.style.setProperty('--brand-background', branding.background_color)
    document.documentElement.style.setProperty('--brand-text', branding.text_color)

    // Apply custom CSS if provided
    if (branding.custom_css) {
      const styleElement = document.createElement('style')
      styleElement.id = 'custom-branding-styles'
      styleElement.textContent = branding.custom_css
      document.head.appendChild(styleElement)
    }
  }

  return (
    <BrandingContext.Provider value={{
      branding,
      updateBranding,
      isLoading,
      error
    }}>
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

// Utility function to load branding by domain (for server-side or initial load)
export async function loadBrandingByDomain(domain: string): Promise<BrandingConfig | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/branding?domain=${encodeURIComponent(domain)}`)
    const data = await response.json()
    return data.branding || null
  } catch (error) {
    console.error('Failed to load branding by domain:', error)
    return null
  }
}
