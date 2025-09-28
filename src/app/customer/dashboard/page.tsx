'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBranding } from '@/lib/branding'
import { SECTION_REGISTRY } from '@/lib/member-dashboard/registry'
import { bindProps, ProgramSpecResponse, CustomerSummary } from '@/lib/member-dashboard/utils'
import { BrandedHeader } from '@/components/branding/BrandedHeader'
import '@/components/member-dashboard/wp-themes.css'

function CustomerDashboardContent() {
  const searchParams = useSearchParams()
  const businessId = searchParams.get('businessId')
  
  const [user, setUser] = useState<any>(null)
  const [programSpec, setProgramSpec] = useState<ProgramSpecResponse | null>(null)
  const [customerSummary, setCustomerSummary] = useState<CustomerSummary | null>(null)
  const [offers, setOffers] = useState<any>(null)
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

        // Get businessId from URL parameter or resolve from customer record
        console.log('Loading dashboard for user:', user.email, 'businessId:', businessId)
        
        // If no businessId in URL, resolve it from customer record
        let resolvedBusinessId = businessId;
        if (!resolvedBusinessId && user?.email) {
          console.log('🔍 No businessId in URL, resolving from customer email...');
          try {
            const customerLookupResponse = await fetch(`/api/customer/lookup?email=${encodeURIComponent(user.email)}`);
            if (customerLookupResponse.ok) {
              const customerData = await customerLookupResponse.json();
              resolvedBusinessId = customerData.business_id;
              console.log('✅ Resolved businessId from customer:', resolvedBusinessId);
            } else {
              console.error('❌ Failed to resolve businessId from customer email');
            }
          } catch (error) {
            console.error('❌ Error resolving businessId:', error);
          }
        }
        
        // Load program spec (pass businessId if available) - add aggressive cache busting
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const specUrl = resolvedBusinessId 
          ? `/api/program/spec?businessId=${resolvedBusinessId}&t=${timestamp}&r=${random}` 
          : `/api/program/spec?t=${timestamp}&r=${random}`
        
        console.log('🔍 CALLING PROGRAM SPEC API:', specUrl)
        const specResponse = await fetch(specUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        if (specResponse.ok) {
          const specData = await specResponse.json()
          console.log('Program spec loaded:', specData.program_type)
          console.log('🔍 FULL SPEC DATA:', JSON.stringify(specData, null, 2))
          console.log('🔍 UI CONTRACT SECTIONS:', specData.spec?.ui_contract?.sections)
          setProgramSpec(specData)
          
          // Load customer summary (pass businessId if available)
          const summaryUrl = resolvedBusinessId 
            ? `/api/customer/summary?programId=${specData.program_id}&customerId=${user.id}&businessId=${resolvedBusinessId}`
            : `/api/customer/summary?programId=${specData.program_id}&customerId=${user.id}`
          const summaryResponse = await fetch(summaryUrl)
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json()
            console.log('Customer summary loaded:', summaryData)
            setCustomerSummary(summaryData)
          } else {
            console.error('Failed to load customer summary')
          }
          
          // Load offers (pass businessId if available)
          const offersUrl = resolvedBusinessId
            ? `/api/program/offers?programId=${specData.program_id}&businessId=${resolvedBusinessId}`
            : `/api/program/offers?programId=${specData.program_id}`
          const offersResponse = await fetch(offersUrl)
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
  }, [businessId])

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
    program: {
      ...programSpec.spec,
      // Add actions_config for Member Actions component
      actions_config: (programSpec.spec as any)?.actions_config || {}
    },
    member: customerSummary,
    offers: offers || { active: [] },
    business: { 
      check_in_endpoint: `/api/checkin/${resolvedBusinessId || 'demo-business-123'}`,
      // Add business_id for Member Actions component
      business_id: resolvedBusinessId,
      program_id: programSpec.program_id,
      customer_id: user?.id
    },
    copy: programSpec.spec.copy || {}
  }

  return (
    <div className="wp-root min-h-screen" data-wp-theme={(programSpec.spec as any)?.branding?.theme || "dark-midnight"}>
      {/* Use proper three-column branded header component */}
      <BrandedHeader 
        businessLogo={(programSpec.spec as any)?.branding?.businessLogo || branding?.logoUrl}
        businessName={programSpec.spec.copy?.program_name || branding?.companyName}
        businessTagline={programSpec.spec.copy?.tagline}
        profilePicture={user?.user_metadata?.avatar_url || '/default-avatar.png'}
        customerName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'}
        showProfile={true}
        theme={(programSpec.spec as any)?.branding?.theme || "dark-midnight"}
      />
      
      <div className="container mx-auto px-4 py-8">

        {/* JSON-Driven Dashboard Sections */}
        <main className="space-y-6">
          {programSpec.spec.ui_contract.sections.map((section, index) => {
            const Component = SECTION_REGISTRY[section.type as keyof typeof SECTION_REGISTRY]
            
            if (!Component) {
              console.warn(`Unknown section type: ${section.type}`)
              return null
            }
            
            const boundProps = bindProps(section.props, dataContext)
            
            // Merge bound props with section settings (e.g., variant, showTier, etc.)
            let componentProps = {
              ...boundProps,
              ...(section as any).settings
            }
            
        // Special props for MemberActions component
        if (section.type === 'memberActions') {
          componentProps = {
            ...componentProps,
            program_id: programSpec.program_id,
            business_id: resolvedBusinessId,
            customer_id: customerSummary?.customer_id || user?.id,
                actions_config: (section as any).settings || (programSpec.spec as any)?.actions_config || boundProps.actions_config || {},
                pending_requests: []
              }
            }
            
            // Special props for QR Check-In component  
            if (section.type === 'qrCheckInButton') {
              componentProps = {
                ...componentProps,
                check_in_endpoint: `/api/checkin/${resolvedBusinessId || 'demo-business-123'}`
              }
            }
            
            // Debug logging for components
            if (section.type === 'balanceHeader') {
              console.log('🔍 BalanceHeader props:', componentProps)
            }
            if (section.type === 'qrCheckInButton') {
              console.log('🔍 QrCheckInButton section found!')
              console.log('🔍 QrCheckInButton boundProps:', boundProps)
              console.log('🔍 QrCheckInButton final componentProps:', componentProps)
            }
            if (section.type === 'memberActions') {
              console.log('🔍 MemberActions section found!')
              console.log('🔍 MemberActions boundProps:', boundProps)
              console.log('🔍 MemberActions settings:', (section as any).settings)
              console.log('🔍 MemberActions final componentProps:', componentProps)
            }
            
            return <Component key={index} {...componentProps} />
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

export default function CustomerDashboard() {
  return (
    <Suspense fallback={
      <div className="wp-root min-h-screen" data-wp-theme="dark-midnight">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading dashboard...</div>
        </div>
      </div>
    }>
      <CustomerDashboardContent />
    </Suspense>
  )
}
