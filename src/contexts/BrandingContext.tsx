'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface BrandingData {
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  agency_name?: string
  custom_domain?: string
}

interface BrandingContextType {
  branding: BrandingData | null
  isLoading: boolean
  error: string | null
}

const BrandingContext = createContext<BrandingContextType>({
  branding: null,
  isLoading: true,
  error: null
})

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark as client-side to prevent hydration mismatch
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return // Don't fetch on server-side

    const fetchBranding = async () => {
      try {
        // Keep loading state but make it faster
        setError(null)
        
        // Check if we're on a custom domain by looking at the hostname
        const hostname = window.location.hostname
        
        // Skip branding fetch for main platform domains only
        // Allow custom domains even if they point to localhost via hosts file
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'walletpush.io' || hostname === 'www.walletpush.io') {
          console.log('🏠 Skipping branding for main platform domain:', hostname)
          setBranding(null)
          setIsLoading(false)
          return
        }
        
        console.log('🎨 Fetching branding for domain:', hostname)
        
        // Fetch branding data for this domain with aggressive caching
        const response = await fetch(`/api/branding?domain=${encodeURIComponent(hostname)}`, {
          cache: 'force-cache',
          next: { revalidate: 300 } // Cache for 5 minutes
        })
        
        if (response.ok) {
          const brandingData = await response.json()
          console.log('✅ Branding data loaded:', brandingData)
          setBranding(brandingData)
        } else if (response.status === 404) {
          // No custom branding found, use default
          console.log('📝 No custom branding found for domain:', hostname)
          setBranding(null)
        } else {
          throw new Error(`Failed to fetch branding: ${response.status}`)
        }
      } catch (err) {
        console.error('❌ Branding fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load branding')
        setBranding(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBranding()
  }, [isClient])

  return (
    <BrandingContext.Provider value={{ branding, isLoading, error }}>
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

// Helper hook for getting the logo URL
export function useLogo() {
  const { branding } = useBranding()
  
  // Return agency logo if available, otherwise default WalletPush logo
  return branding?.logo_url || '/images/walletpush-logo.png'
}

// Helper hook for getting brand colors
export function useBrandColors() {
  const { branding } = useBranding()
  
  return {
    primary: branding?.primary_color || '#3B82F6',
    secondary: branding?.secondary_color || '#1E40AF'
  }
}
