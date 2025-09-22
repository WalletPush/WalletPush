'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBranding } from '@/lib/branding'
import { SECTION_REGISTRY } from '@/lib/member-dashboard/registry'
import { bindProps, ProgramSpecResponse, CustomerSummary } from '@/lib/member-dashboard/utils'

export default function CustomerDashboard() {
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

        // For MVP testing, use a mock businessId
        // In production, this would be resolved from custom domain or user context
        const businessId = 'demo-business-123'
        
        console.log('Loading dashboard for user:', user.email, 'business:', businessId)
        
        // Load program spec
        const specResponse = await fetch(`/api/program/spec?businessId=${businessId}`)
        if (specResponse.ok) {
          const specData = await specResponse.json()
          console.log('Program spec loaded:', specData.program_type)
          setProgramSpec(specData)
          
          // Load customer summary  
          const summaryResponse = await fetch(
            `/api/customer/summary?businessId=${businessId}&programId=${specData.program_id}&customerId=${user.id}`
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
            `/api/program/offers?businessId=${businessId}&programId=${specData.program_id}`
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
    business: { check_in_endpoint: `/api/checkin/demo-business-123` },
    copy: programSpec.spec.copy || {}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#2E3748] to-[#1a1f2e]">
      <div className="container mx-auto px-4 py-8">
        {/* Header with branding */}
        <div className="mb-8 text-center">
          {branding?.logoUrl && (
            <img 
              src={branding.logoUrl} 
              alt={branding.companyName || 'Logo'} 
              className="h-16 w-auto mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold text-white">
            {programSpec.spec.copy?.program_name || branding?.companyName || 'Your Dashboard'}
          </h1>
          {programSpec.spec.copy?.tagline && (
            <p className="text-[#C6C8CC] mt-2">{programSpec.spec.copy.tagline}</p>
          )}
          <p className="text-[#C6C8CC] text-sm mt-1">{user?.email}</p>
        </div>

        {/* JSON-Driven Dashboard Sections */}
        <main className="space-y-6">
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
