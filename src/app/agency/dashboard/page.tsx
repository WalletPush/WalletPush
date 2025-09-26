'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  PlusIcon, 
  BuildingOfficeIcon, 
  ShieldCheckIcon, 
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  KeyIcon,
  CogIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  ClockIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

interface Business {
  id: string
  name: string
  status: 'active' | 'inactive' | 'pending' | 'trial' | 'past_due' | 'cancelled'
  created_at: string
  member_count?: number
  pass_count?: number
  revenue?: number
  assigned_pass_type?: {
    id: string
    label: string
    is_global: boolean
  }
}

interface PassTypeID {
  id: string
  label: string
  pass_type_identifier: string
  team_id: string
  is_validated: boolean
  created_at: string
}

interface AgencyStats {
  totalBusinesses: number
  activeBusinesses: number
  totalRevenue: number
  monthlyRevenue: number
  totalMembers: number
  totalPasses: number
}

interface NewBusinessForm {
  name: string
  slug: string
  contact_email: string
  contact_phone: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  subscription_plan: 'starter' | 'business' | 'enterprise'
  custom_domain: string
}

export default function AgencyDashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [passTypeIDs, setPassTypeIDs] = useState<PassTypeID[]>([])
  const [stats, setStats] = useState<AgencyStats>({
    totalBusinesses: 0,
    activeBusinesses: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalMembers: 0,
    totalPasses: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddBusinessModal, setShowAddBusinessModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availablePassTypes, setAvailablePassTypes] = useState<Array<{
    id: string
    label: string
    pass_type_identifier: string
    is_global: boolean
  }>>([])
  const [selectedPassTypeId, setSelectedPassTypeId] = useState('')
  const [newBusiness, setNewBusiness] = useState<NewBusinessForm>({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    },
    subscription_plan: 'starter',
    custom_domain: ''
  })

  // Helper functions for business insights
  const getBusinessAge = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffMonths = Math.floor(diffDays / 30)
    
    if (diffMonths >= 12) {
      return { label: `${Math.floor(diffMonths / 12)}y`, isVeteran: true, isEstablished: true }
    } else if (diffMonths >= 6) {
      return { label: `${diffMonths}m`, isVeteran: false, isEstablished: true }
    } else {
      return { label: `${diffMonths}m`, isVeteran: false, isEstablished: false }
    }
  }

  const getCustomerLifetimeValue = (business: Business) => {
    const monthlyRevenue = business.revenue || 0
    const createdDate = new Date(business.created_at)
    const now = new Date()
    
    // Calculate how many months they've been paying
    const diffTime = Math.abs(now.getTime() - createdDate.getTime())
    const monthsPaying = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))) // At least 1 month
    
    // Total lifetime value = monthly cost × months they've been paying
    return Math.round(monthlyRevenue * monthsPaying)
  }

  const getPerformanceTier = (business: Business) => {
    const passes = business.pass_count || 0
    const members = business.member_count || 0
    const revenue = business.revenue || 0
    
    // Calculate performance score based on multiple factors
    const score = (passes * 0.1) + (members * 0.5) + (revenue * 0.01)
    
    if (score >= 1000) return { tier: 'elite', color: 'purple', icon: StarIcon }
    if (score >= 500) return { tier: 'premium', color: 'blue', icon: ArrowTrendingUpIcon }
    if (score >= 100) return { tier: 'growing', color: 'green', icon: RocketLaunchIcon }
    return { tier: 'starter', color: 'gray', icon: ClockIcon }
  }

  // Generate slug from business name
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  // Handle form field changes
  const handleBusinessFormChange = (field: string, value: string) => {
    if (field === 'name') {
      setNewBusiness(prev => ({
        ...prev,
        name: value,
        slug: generateSlug(value)
      }))
    } else if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setNewBusiness(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setNewBusiness(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  // Reset form
  const resetForm = () => {
    setNewBusiness({
      name: '',
      slug: '',
      contact_email: '',
      contact_phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip: ''
      },
      subscription_plan: 'starter',
      custom_domain: ''
    })
  }

  // Handle form submission
  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/agency/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBusiness)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ API Error:', error)
        alert(`❌ API Error: ${error.error || 'Failed to create business'}\n🔍 Debug: ${error.debug || 'No debug info'}`)
        throw new Error(error.error || 'Failed to create business')
      }

      // Success - refresh data and close modal
      await loadAgencyData()
      setShowAddBusinessModal(false)
      resetForm()
      alert('Business created successfully!')

    } catch (error) {
      console.error('Failed to create business:', error)
      alert(`Failed to create business: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load agency data
  const loadAgencyData = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // This would call the agency manageable resources API
      const response = await fetch('/api/agency/manageable-resources?t=' + Date.now())
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📋 Agency Data:', data)
      
      setBusinesses(data.businesses || [])
      setPassTypeIDs(data.passTypeIds || [])
      
      // Calculate stats
      const activeBusinesses = (data.businesses || []).filter((b: Business) => b.status === 'active')
      setStats({
        totalBusinesses: data.businesses?.length || 0,
        activeBusinesses: activeBusinesses.length,
        totalRevenue: data.totalRevenue || 0,
        monthlyRevenue: data.monthlyRevenue || 0,
        totalMembers: data.totalMembers || 0,
        totalPasses: data.totalPasses || 0
      })
      
    } catch (error) {
      console.error('❌ Failed to load agency data:', error)
      
      // Check if it's a 404 (no agency account)
      if (error instanceof Error && error.message.includes('404')) {
        setError('No agency account found. You need to be part of an agency to access this dashboard.')
      } else {
        setError(`Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      
      // Show empty state instead of dummy data
      setBusinesses([])
      setPassTypeIDs([])
      setStats({
        totalBusinesses: 0,
        activeBusinesses: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalMembers: 0,
        totalPasses: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailablePassTypes = async () => {
    try {
      console.log('🎫 Loading available Pass Type IDs...')
      const response = await fetch('/api/agency/pass-type-assignments')
      console.log('📡 API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Pass Type IDs loaded:', data)
        setAvailablePassTypes(data.passTypeIds || [])
      } else {
        const errorData = await response.json()
        console.error('❌ API Error Response:', errorData)
        alert(`❌ Failed to load Pass Type IDs: ${errorData.error || 'Unknown error'}\n\nDetails: ${errorData.details || 'No details'}\n\nCheck browser console for more info.`)
      }
    } catch (error) {
      console.error('💥 Frontend Error loading Pass Type IDs:', error)
      alert(`❌ Failed to load Pass Type IDs: ${error}\n\nCheck browser console for more info.`)
    }
  }

  const handleAssignPassType = async () => {
    if (!selectedBusiness || !selectedPassTypeId) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/agency/pass-type-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          businessId: selectedBusiness.id,
          passTypeId: selectedPassTypeId
        })
      })

      if (response.ok) {
        alert('✅ Pass Type ID assigned successfully!')
        setShowAssignModal(false)
        setSelectedBusiness(null)
        setSelectedPassTypeId('')
        await loadAgencyData() // Refresh the data
      } else {
        const errorData = await response.json()
        alert(`❌ Assignment failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Assignment failed:', error)
      alert(`❌ Assignment failed: ${error}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnassignPassType = async () => {
    if (!selectedBusiness) return

    if (!confirm('⚠️ WARNING: This will make ALL existing passes NON-FUNCTIONAL. Are you absolutely sure?')) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/agency/pass-type-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unassign',
          businessId: selectedBusiness.id
        })
      })

      if (response.ok) {
        alert('✅ Pass Type ID unassigned successfully!')
        setShowAssignModal(false)
        setSelectedBusiness(null)
        await loadAgencyData() // Refresh the data
      } else {
        const errorData = await response.json()
        alert(`❌ Unassignment failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Unassignment failed:', error)
      alert(`❌ Unassignment failed: ${error}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    loadAgencyData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Agency Dashboard</h1>
              <p className="text-slate-600 mt-1">Manage your business portfolio and Pass Type ID assignments</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadAgencyData}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800 font-medium">Error</div>
              <div className="text-red-700 text-sm mt-1">{error}</div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 mt-4">Loading agency data...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Businesses</p>
                      <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalBusinesses}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm text-green-700 font-medium">{stats.activeBusinesses} active</p>
                      </div>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Monthly Revenue</p>
                      <p className="text-3xl font-bold text-green-900 mt-1">${stats.monthlyRevenue.toLocaleString()}</p>
                      <p className="text-sm text-green-600 mt-2">from {stats.activeBusinesses} businesses</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-xl">
                      <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Total Members</p>
                      <p className="text-3xl font-bold text-purple-900 mt-1">{stats.totalMembers.toLocaleString()}</p>
                      <p className="text-sm text-purple-600 mt-2">across all businesses</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-xl">
                      <UserGroupIcon className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">Total Passes</p>
                      <p className="text-3xl font-bold text-orange-900 mt-1">{stats.totalPasses.toLocaleString()}</p>
                      <p className="text-sm text-orange-600 mt-2">distributed to members</p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-xl">
                      <KeyIcon className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Businesses Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-slate-900">Your Businesses</h2>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                      {businesses.length}
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowAddBusinessModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Business
                  </button>
                </div>

                {businesses.length === 0 ? (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                    <BuildingOfficeIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Businesses Yet</h3>
                    <p className="text-slate-600 mb-4">Start by adding your first business to manage their Pass Type IDs and analytics.</p>
                    <button 
                      onClick={() => setShowAddBusinessModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add First Business
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {businesses.map(business => {
                      const age = getBusinessAge(business.created_at)
                      const clv = getCustomerLifetimeValue(business)
                      const performance = getPerformanceTier(business)
                      const PerformanceIcon = performance.icon
                      
                      return (
                        <div key={business.id} className={`bg-white border rounded-xl p-6 hover:shadow-lg transition-all duration-200 ${
                          age.isVeteran ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-white' :
                          age.isEstablished ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white' :
                          'border-slate-200 hover:border-slate-300'
                        }`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-slate-900">{business.name}</h3>
                                {age.isVeteran && (
                                  <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                    <StarIcon className="w-3 h-3" />
                                    Veteran
                                  </div>
                                )}
                                {age.isEstablished && !age.isVeteran && (
                                  <div className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                    Established
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  business.status === 'active' 
                                    ? 'bg-green-100 text-green-800'
                                    : business.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : business.status === 'trial'
                                    ? 'bg-blue-100 text-blue-800'
                                    : business.status === 'past_due'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {business.status}
                                </span>
                                
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  performance.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                                  performance.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                  performance.color === 'green' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  <PerformanceIcon className="w-3 h-3" />
                                  {performance.tier}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-xs text-slate-500 mb-1">Age</div>
                              <div className="text-sm font-semibold text-slate-700">{age.label}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-slate-50 rounded-lg p-3">
                              <div className="text-xs text-slate-500 mb-1">Members</div>
                              <div className="text-lg font-bold text-slate-900">{business.member_count?.toLocaleString() || 0}</div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                              <div className="text-xs text-slate-500 mb-1">Passes</div>
                              <div className="text-lg font-bold text-slate-900">{business.pass_count?.toLocaleString() || 0}</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Monthly Revenue:</span>
                              <span className="text-slate-900 font-semibold">${business.revenue?.toLocaleString() || 0}</span>
                            </div>
                            {clv > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500">CLV (Total):</span>
                                <span className="text-green-700 font-semibold">${clv.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Created:</span>
                              <span className="text-slate-700">{new Date(business.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-4 border-t border-slate-100">
                            <button 
                              onClick={() => window.open(`/business/dashboard?business_id=${business.id}`, '_blank')}
                              className="flex-1 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium py-2 px-3 rounded-lg transition-colors"
                            >
                              Manage
                            </button>
                            {business.assigned_pass_type ? (
                              <button 
                                onClick={async () => {
                                  setSelectedBusiness(business)
                                  setShowAssignModal(true)
                                  await loadAvailablePassTypes()
                                }}
                                className="flex-1 text-sm bg-red-50 text-red-700 hover:bg-red-100 font-medium py-2 px-3 rounded-lg transition-colors"
                                title={`Assigned: ${business.assigned_pass_type.label}${business.assigned_pass_type.is_global ? ' (Global)' : ''}`}
                              >
                                ID Assigned
                              </button>
                            ) : (
                              <button 
                                onClick={async () => {
                                  setSelectedBusiness(business)
                                  setShowAssignModal(true)
                                  await loadAvailablePassTypes()
                                }}
                                className="flex-1 text-sm bg-green-50 text-green-700 hover:bg-green-100 font-medium py-2 px-3 rounded-lg transition-colors"
                              >
                                Assign IDs
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Pass Type IDs Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <KeyIcon className="w-6 h-6 text-orange-600" />
                    <h2 className="text-xl font-semibold text-slate-900">Your Pass Type IDs</h2>
                    <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                      {passTypeIDs.length}
                    </span>
                  </div>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View All →
                  </a>
                </div>

                {passTypeIDs.length === 0 ? (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                    <KeyIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Pass Type IDs</h3>
                    <p className="text-slate-600">Upload your Apple PassKit certificates to start assigning them to businesses.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {passTypeIDs.slice(0, 4).map(passType => (
                      <div key={passType.id} className="bg-white border border-slate-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">{passType.label}</h3>
                            <p className="text-sm text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded">{passType.pass_type_identifier}</p>
                          </div>
                          {passType.is_validated && (
                            <ShieldCheckIcon className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" title="Validated Certificate" />
                          )}
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Team ID:</span>
                            <span className="text-slate-900 font-mono">{passType.team_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Created:</span>
                            <span className="text-slate-900">{new Date(passType.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Add Business Modal */}
          {showAddBusinessModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">Add New Business</h2>
                    <button
                      onClick={() => {
                        setShowAddBusinessModal(false)
                        resetForm()
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddBusiness} className="p-6 space-y-6">
                  {/* Business Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={newBusiness.name}
                      onChange={(e) => handleBusinessFormChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter business name"
                    />
                    {newBusiness.slug && (
                      <p className="text-xs text-slate-500 mt-1">
                        URL slug: <span className="font-mono">{newBusiness.slug}</span>
                      </p>
                    )}
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact_email" className="block text-sm font-medium text-slate-700 mb-2">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        id="contact_email"
                        required
                        value={newBusiness.contact_email}
                        onChange={(e) => handleBusinessFormChange('contact_email', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="admin@business.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact_phone" className="block text-sm font-medium text-slate-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        id="contact_phone"
                        value={newBusiness.contact_phone}
                        onChange={(e) => handleBusinessFormChange('contact_phone', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+1-555-0123"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Business Address</label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newBusiness.address.street}
                        onChange={(e) => handleBusinessFormChange('address.street', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Street address"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={newBusiness.address.city}
                          onChange={(e) => handleBusinessFormChange('address.city', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          value={newBusiness.address.state}
                          onChange={(e) => handleBusinessFormChange('address.state', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="State"
                        />
                        <input
                          type="text"
                          value={newBusiness.address.zip}
                          onChange={(e) => handleBusinessFormChange('address.zip', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ZIP"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subscription Package */}
                  <div>
                    <label htmlFor="subscription_plan" className="block text-sm font-medium text-slate-700 mb-2">
                      Subscription Package *
                    </label>
                    <select
                      id="subscription_plan"
                      required
                      value={newBusiness.subscription_plan}
                      onChange={(e) => handleBusinessFormChange('subscription_plan', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="starter">Starter - $19.99/month (1,000 passes, 500 members)</option>
                      <option value="business">Business - $49.99/month (5,000 passes, 2,000 members)</option>
                      <option value="enterprise">Enterprise - $149.99/month (25,000 passes, 10,000 members)</option>
                    </select>
                  </div>

                  {/* Custom Domain */}
                  <div>
                    <label htmlFor="custom_domain" className="block text-sm font-medium text-slate-700 mb-2">
                      Custom Domain (Optional)
                    </label>
                    <input
                      type="text"
                      id="custom_domain"
                      value={newBusiness.custom_domain}
                      onChange={(e) => handleBusinessFormChange('custom_domain', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="loyalty.yourbusiness.com"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Leave empty to use default: loyalty.{newBusiness.slug}.com
                    </p>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddBusinessModal(false)
                        resetForm()
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Business'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Pass Type ID Assignment Modal */}
          {showAssignModal && selectedBusiness && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">
                      Pass Type ID Assignment
                    </h2>
                    <button
                      onClick={() => {
                        setShowAssignModal(false)
                        setSelectedBusiness(null)
                        setSelectedPassTypeId('')
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      {selectedBusiness.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {selectedBusiness.assigned_pass_type 
                        ? 'This business currently has a Pass Type ID assigned.'
                        : 'This business does not have a Pass Type ID assigned yet.'
                      }
                    </p>
                  </div>

                  {selectedBusiness.assigned_pass_type && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-slate-900 mb-2">Currently Assigned:</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">
                            {selectedBusiness.assigned_pass_type.label}
                          </p>
                          <p className="text-sm text-slate-600">
                            {selectedBusiness.assigned_pass_type.is_global ? 'Global Pass Type ID' : 'Exclusive Pass Type ID'}
                          </p>
                        </div>
                        {selectedBusiness.assigned_pass_type.is_global && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            Global
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {!selectedBusiness.assigned_pass_type && (
                    <div className="mb-4">
                      <label htmlFor="passTypeSelect" className="block text-sm font-medium text-slate-900 mb-2">
                        Select Pass Type ID to Assign:
                      </label>
                      <select
                        id="passTypeSelect"
                        value={selectedPassTypeId}
                        onChange={(e) => setSelectedPassTypeId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Choose a Pass Type ID...</option>
                        {availablePassTypes.map((passType) => (
                          <option key={passType.id} value={passType.id}>
                            {passType.label} {passType.is_global ? '(Global)' : '(Exclusive)'}
                          </option>
                        ))}
                      </select>
                      {selectedPassTypeId && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          {(() => {
                            const selectedPassType = availablePassTypes.find(pt => pt.id === selectedPassTypeId)
                            return selectedPassType ? (
                              <div>
                                <p className="text-sm font-medium text-blue-900">{selectedPassType.label}</p>
                                <p className="text-sm text-blue-700">Identifier: {selectedPassType.pass_type_identifier}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                  {selectedPassType.is_global 
                                    ? '🌐 This Global Pass Type ID can be assigned to multiple businesses'
                                    : '🔒 This Exclusive Pass Type ID can only be assigned to one business'
                                  }
                                </p>
                              </div>
                            ) : null
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800">Important Warning</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          🚨 <strong>Deleting or changing a Pass Type ID will make ALL existing passes using it NON-FUNCTIONAL.</strong> 
                          This action cannot be undone and will break customer wallet passes immediately.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAssignModal(false)
                        setSelectedBusiness(null)
                        setSelectedPassTypeId('')
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                      Close
                    </button>
                    {selectedBusiness.assigned_pass_type ? (
                      <button
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        onClick={handleUnassignPassType}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Unassigning...' : 'Unassign ID'}
                      </button>
                    ) : (
                      <button
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                        onClick={handleAssignPassType}
                        disabled={isSubmitting || !selectedPassTypeId}
                      >
                        {isSubmitting ? 'Assigning...' : 'Assign Selected ID'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  )
}
