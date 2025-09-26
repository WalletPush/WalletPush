'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBranding } from '@/lib/branding'
import { BrandedHeader } from '@/components/branding/BrandedHeader'
import { SECTION_REGISTRY } from '@/lib/member-dashboard/registry'
import { bindProps, ProgramSpecResponse, CustomerSummary } from '@/lib/member-dashboard/utils'
import '@/components/member-dashboard/wp-themes.css'

export default function CustomerDashboard() {
  const [user, setUser] = useState<any>(null)
  const [programSpec, setProgramSpec] = useState<ProgramSpecResponse | null>(null)
  const [customerSummary, setCustomerSummary] = useState<CustomerSummary | null>(null)
  const [offers, setOffers] = useState<any>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { branding } = useBranding()

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (!user) {
          setError('Please log in to view your dashboard')
          return
        }

        // Let the API resolve businessId from domain (no hardcoding needed)
        console.log('Loading dashboard for user:', user.email)
        
        // Load program spec (API will resolve businessId from domain)
        const specResponse = await fetch(`/api/program/spec`)
        if (specResponse.ok) {
          const specData = await specResponse.json()
          console.log('Program spec loaded:', specData.program_type)
          setProgramSpec(specData)
          if (specData.business_id) {
            setBusinessId(specData.business_id)
          }
          
          // Load customer summary (API will resolve businessId from domain)
          const summaryResponse = await fetch(
            `/api/customer/summary?programId=${specData.program_id}&customerId=${user.id}`
          )
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json()
            console.log('Customer summary loaded:', summaryData)
            setCustomerSummary(summaryData)
          } else {
            console.error('Failed to load customer summary')
          }
          
          // Load offers
          const offersResponse = await fetch(
            `/api/program/offers?programId=${specData.program_id}&businessId=${specData.business_id}`
          )
          if (offersResponse.ok) {
            const offersData = await offersResponse.json()
            console.log('Offers loaded:', offersData)
            setOffers(offersData)
          } else {
            console.error('Failed to load offers')
          }
        } else {
          setError('Failed to load program configuration')
        }
        
      } catch (err) {
        console.error('Dashboard load error:', err)
        setError('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#2E3748] to-[#1a1f2e] flex items-center justify-center">
        <div className="text-white">Loading your dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#2E3748] to-[#1a1f2e] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!programSpec || !customerSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#2E3748] to-[#1a1f2e]">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome to {branding?.companyName || 'Your Account'}
                </h1>
                <p className="text-[#C6C8CC]">{user?.email}</p>
              </div>
              {branding?.logoUrl && (
                <img 
                  src={branding.logoUrl} 
                  alt={branding.companyName || 'Logo'} 
                  className="h-12 w-auto"
                />
              )}
            </div>
            <p className="text-[#C6C8CC]">
              No active program found. Please contact support.
            </p>
            
            {/* Sign Out */}
            <div className="mt-8 text-center">
              <button
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  window.location.href = '/customer/auth/login'
                }}
                className="text-[#C6C8CC] hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 🎯 JSON-DRIVEN DASHBOARD RENDERING
  // This is the core of our new system - render sections from UI contract
  const dataContext = {
    program: programSpec.spec,
    member: customerSummary,
    offers: offers || { active: [] },
    business: { check_in_endpoint: `/api/checkin/${businessId || 'unknown'}` },
    copy: programSpec.spec.copy || {}
  }

  // Get customer display name
  const customerDisplayName = user?.user_metadata?.full_name || 
    `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() ||
    user?.email?.split('@')[0] || 'Customer'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#2E3748] to-[#1a1f2e]">
      {/* 3-Column Header */}
      <div className="wp-root" data-wp-theme={(programSpec.spec as any).branding?.theme || 'dark-midnight'}>
        <BrandedHeader
          businessLogo={(programSpec.spec as any).branding?.businessLogo || branding?.logoUrl}
          businessName={programSpec.spec.copy?.program_name || branding?.companyName || 'Your Business'}
          businessTagline={programSpec.spec.copy?.tagline || 'Your rewards await!'}
          profilePicture={(customerSummary as any)?.profile_photo_url}
          customerName={customerDisplayName}
          showProfile={true}
          theme={(programSpec.spec as any).branding?.theme || 'dark-midnight'}
        />
      </div>
      
      <div className="container mx-auto px-4 py-8">

        {/* JSON-Driven Dashboard Sections */}
        <main className="wp-root space-y-6" data-wp-theme="dark-midnight">
          {programSpec.spec.ui_contract.sections.map((section, index) => {
            const Component = SECTION_REGISTRY[section.type as keyof typeof SECTION_REGISTRY]
            
            if (!Component) {
              console.warn(`Unknown section type: ${section.type}`)
              return null
            }
            
            const boundProps = bindProps(section.props, dataContext)
            
            return <Component key={index} {...boundProps} />
          })}
        </main>

        {/* Footer with sign out */}
        <div className="mt-12 text-center">
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = '/customer/auth/login'
            }}
            className="text-[#C6C8CC] hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
