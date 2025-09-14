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
  SparklesIcon
} from '@heroicons/react/24/outline'

interface Business {
  id: string
  name: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  member_count?: number
  pass_count?: number
  revenue?: number
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
      
      // Set mock data for development/demo
      setBusinesses([
        { id: '1', name: 'Coffee Shop Pro', status: 'active', created_at: '2024-01-15', member_count: 245, pass_count: 1200, revenue: 2400 },
        { id: '2', name: 'Fitness First', status: 'active', created_at: '2024-02-01', member_count: 189, pass_count: 890, revenue: 1800 },
        { id: '3', name: 'Restaurant Deluxe', status: 'pending', created_at: '2024-03-10', member_count: 67, pass_count: 340, revenue: 680 }
      ])
      setPassTypeIDs([
        { id: '1', label: 'Agency Master Certificate', pass_type_identifier: 'pass.com.agency.master', team_id: 'ABC123', is_validated: true, created_at: '2024-01-01' },
        { id: '2', label: 'Premium Business Certificate', pass_type_identifier: 'pass.com.agency.premium', team_id: 'ABC123', is_validated: true, created_at: '2024-01-15' }
      ])
      setStats({
        totalBusinesses: 3,
        activeBusinesses: 2,
        totalRevenue: 4880,
        monthlyRevenue: 1627,
        totalMembers: 501,
        totalPasses: 2430
      })
    } finally {
      setIsLoading(false)
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
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Total Businesses</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.totalBusinesses}</p>
                      <p className="text-sm text-green-600">{stats.activeBusinesses} active</p>
                    </div>
                    <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Monthly Revenue</p>
                      <p className="text-3xl font-bold text-slate-900">${stats.monthlyRevenue.toLocaleString()}</p>
                      <p className="text-sm text-slate-500">from {stats.activeBusinesses} businesses</p>
                    </div>
                    <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Total Members</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.totalMembers.toLocaleString()}</p>
                      <p className="text-sm text-slate-500">across all businesses</p>
                    </div>
                    <UserGroupIcon className="w-8 h-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Pass Type IDs</p>
                      <p className="text-3xl font-bold text-slate-900">{passTypeIDs.length}</p>
                      <p className="text-sm text-slate-500">available to assign</p>
                    </div>
                    <KeyIcon className="w-8 h-8 text-orange-600" />
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
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <PlusIcon className="w-4 h-4" />
                    Add Business
                  </button>
                </div>

                {businesses.length === 0 ? (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                    <BuildingOfficeIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Businesses Yet</h3>
                    <p className="text-slate-600 mb-4">Start by adding your first business to manage their Pass Type IDs and analytics.</p>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <PlusIcon className="w-4 h-4" />
                      Add First Business
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {businesses.map(business => (
                      <div key={business.id} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">{business.name}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              business.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : business.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {business.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Members:</span>
                            <span className="text-slate-900 font-medium">{business.member_count?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Passes:</span>
                            <span className="text-slate-900 font-medium">{business.pass_count?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Revenue:</span>
                            <span className="text-slate-900 font-medium">${business.revenue?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Created:</span>
                            <span className="text-slate-900">{new Date(business.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            Manage
                          </button>
                          <button className="text-sm text-green-600 hover:text-green-800 font-medium">
                            Assign Pass Type IDs
                          </button>
                        </div>
                      </div>
                    ))}
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
        </div>
    </div>
  )
}
