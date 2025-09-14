'use client'

import React, { useState, useEffect } from 'react'
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Business {
  id: string
  name: string
  email: string
  status: 'active' | 'suspended' | 'pending' | 'trial'
  package: {
    id: string
    name: string
    price: number
    passLimit: number
    programLimit: number
    staffLimit: number
  }
  usage: {
    passesUsed: number
    programsCreated: number
    staffAccounts: number
    monthlyRevenue: number
  }
  createdAt: string
  lastActive: string
  domain?: string
  trialEndsAt?: string
}

interface SaasPackage {
  id: string
  name: string
  price: number
  passLimit: number
  programLimit: number
  staffLimit: number
}

export default function AgencyBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [packages, setPackages] = useState<SaasPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [packageFilter, setPackageFilter] = useState<string>('all')
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [showAddBusinessModal, setShowAddBusinessModal] = useState(false)

  useEffect(() => {
    loadBusinesses()
    loadPackages()
  }, [])

  const loadBusinesses = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/agency/businesses')
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      setBusinesses(data.businesses || [])
      
    } catch (error) {
      console.error('❌ Failed to load businesses:', error)
      // Fallback to mock data for development
      setBusinesses([
        {
          id: '1',
          name: 'Coffee Shop Pro',
          email: 'admin@coffeeshoppro.com',
          status: 'active',
          package: {
            id: '2',
            name: 'Business',
            price: 69,
            passLimit: 5000,
            programLimit: 10,
            staffLimit: 5
          },
          usage: {
            passesUsed: 2450,
            programsCreated: 3,
            staffAccounts: 2,
            monthlyRevenue: 69
          },
          createdAt: '2024-01-15',
          lastActive: '2024-01-25',
          domain: 'loyalty.coffeeshoppro.com'
        },
        {
          id: '2',
          name: 'Fitness First',
          email: 'owner@fitnessfirst.com',
          status: 'trial',
          package: {
            id: '1',
            name: 'Starter',
            price: 29,
            passLimit: 1000,
            programLimit: 3,
            staffLimit: 2
          },
          usage: {
            passesUsed: 156,
            programsCreated: 1,
            staffAccounts: 1,
            monthlyRevenue: 0
          },
          createdAt: '2024-01-20',
          lastActive: '2024-01-24',
          trialEndsAt: '2024-02-04'
        },
        {
          id: '3',
          name: 'Restaurant Deluxe',
          email: 'manager@restaurantdeluxe.com',
          status: 'active',
          package: {
            id: '3',
            name: 'Pro',
            price: 97,
            passLimit: 10000,
            programLimit: 20,
            staffLimit: -1
          },
          usage: {
            passesUsed: 7890,
            programsCreated: 8,
            staffAccounts: 12,
            monthlyRevenue: 97
          },
          createdAt: '2024-01-10',
          lastActive: '2024-01-25',
          domain: 'members.restaurantdeluxe.com'
        },
        {
          id: '4',
          name: 'Beauty Salon Elite',
          email: 'info@beautysalonelite.com',
          status: 'suspended',
          package: {
            id: '2',
            name: 'Business',
            price: 69,
            programLimit: 10,
            passLimit: 5000,
            staffLimit: 5
          },
          usage: {
            passesUsed: 4890,
            programsCreated: 9,
            staffAccounts: 4,
            monthlyRevenue: 0
          },
          createdAt: '2024-01-05',
          lastActive: '2024-01-18'
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const loadPackages = async () => {
    try {
      const response = await fetch('/api/agency/saas-packages')
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      setPackages(data.packages || [])
      
    } catch (error) {
      console.error('❌ Failed to load packages:', error)
      // Fallback to mock data
      setPackages([
        { id: '1', name: 'Starter', price: 29, passLimit: 1000, programLimit: 3, staffLimit: 2 },
        { id: '2', name: 'Business', price: 69, passLimit: 5000, programLimit: 10, staffLimit: 5 },
        { id: '3', name: 'Pro', price: 97, passLimit: 10000, programLimit: 20, staffLimit: -1 }
      ])
    }
  }

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || business.status === statusFilter
    const matchesPackage = packageFilter === 'all' || business.package.id === packageFilter
    
    return matchesSearch && matchesStatus && matchesPackage
  })

  const getStatusBadge = (status: string, trialEndsAt?: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'trial':
        const daysLeft = trialEndsAt ? Math.ceil((new Date(trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'suspended':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      default:
        return `${baseClasses} bg-slate-100 text-slate-800`
    }
  }

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100'
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const loginAsBusiness = async (businessId: string) => {
    try {
      const response = await fetch('/api/agency/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.redirectUrl) {
          window.open(data.redirectUrl, '_blank')
        }
      } else {
        alert('Failed to login as business')
      }
    } catch (error) {
      console.error('Failed to impersonate business:', error)
      alert('Failed to login as business')
    }
  }

  const changeBusinessPackage = async (businessId: string, packageId: string) => {
    try {
      const response = await fetch('/api/agency/businesses/change-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, packageId })
      })

      if (response.ok) {
        await loadBusinesses() // Reload data
        setShowPackageModal(false)
        setSelectedBusiness(null)
        alert('Package changed successfully!')
      } else {
        alert('Failed to change package')
      }
    } catch (error) {
      console.error('Failed to change package:', error)
      alert('Failed to change package')
    }
  }

  const toggleBusinessStatus = async (businessId: string, newStatus: 'active' | 'suspended') => {
    try {
      const response = await fetch('/api/agency/businesses/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, status: newStatus })
      })

      if (response.ok) {
        await loadBusinesses() // Reload data
        alert(`Business ${newStatus === 'active' ? 'activated' : 'suspended'} successfully!`)
      } else {
        alert('Failed to update business status')
      }
    } catch (error) {
      console.error('Failed to toggle business status:', error)
      alert('Failed to update business status')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading businesses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Business Management</h1>
                <p className="text-slate-600">Manage your business clients and their packages</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddBusinessModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Business
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center">
              <BuildingOfficeIcon className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total Businesses</p>
                <p className="text-2xl font-bold text-slate-900">{businesses.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-slate-600">Active</p>
                <p className="text-2xl font-bold text-slate-900">
                  {businesses.filter(b => b.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-slate-600">Trial</p>
                <p className="text-2xl font-bold text-slate-900">
                  {businesses.filter(b => b.status === 'trial').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-slate-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${businesses.reduce((sum, b) => sum + b.usage.monthlyRevenue, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search businesses..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
              <select
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Packages</option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Businesses Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredBusinesses.map((business) => (
                  <tr key={business.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{business.name}</div>
                          <div className="text-sm text-slate-500">{business.email}</div>
                          {business.domain && (
                            <div className="text-xs text-blue-600">{business.domain}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{business.package.name}</div>
                      <div className="text-sm text-slate-500">${business.package.price}/month</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-xs">
                          <span className="w-12 text-slate-500">Passes:</span>
                          <span className={`px-2 py-1 rounded-full ${getUsageColor(getUsagePercentage(business.usage.passesUsed, business.package.passLimit))}`}>
                            {business.usage.passesUsed.toLocaleString()}/{business.package.passLimit === -1 ? '∞' : business.package.passLimit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center text-xs">
                          <span className="w-12 text-slate-500">Programs:</span>
                          <span className="text-slate-900">
                            {business.usage.programsCreated}/{business.package.programLimit === -1 ? '∞' : business.package.programLimit}
                          </span>
                        </div>
                        <div className="flex items-center text-xs">
                          <span className="w-12 text-slate-500">Staff:</span>
                          <span className="text-slate-900">
                            {business.usage.staffAccounts}/{business.package.staffLimit === -1 ? '∞' : business.package.staffLimit}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        ${business.usage.monthlyRevenue}/month
                      </div>
                      <div className="text-xs text-slate-500">
                        Since {business.createdAt}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(business.status, business.trialEndsAt)}>
                        {business.status === 'trial' && business.trialEndsAt ? (
                          `Trial (${Math.ceil((new Date(business.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d left)`
                        ) : (
                          business.status.charAt(0).toUpperCase() + business.status.slice(1)
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => loginAsBusiness(business.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                          title="Login as Business"
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBusiness(business)
                            setShowPackageModal(true)
                          }}
                          className="text-green-600 hover:text-green-900 flex items-center"
                          title="Change Package"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleBusinessStatus(business.id, business.status === 'active' ? 'suspended' : 'active')}
                          className={`${business.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} flex items-center`}
                          title={business.status === 'active' ? 'Suspend' : 'Activate'}
                        >
                          {business.status === 'active' ? (
                            <PauseIcon className="w-4 h-4" />
                          ) : (
                            <PlayIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredBusinesses.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <BuildingOfficeIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No businesses found</h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || statusFilter !== 'all' || packageFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first business client'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && packageFilter === 'all' && (
              <button
                onClick={() => setShowAddBusinessModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add First Business
              </button>
            )}
          </div>
        )}
      </div>

      {/* Change Package Modal */}
      {showPackageModal && selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Change Package for {selectedBusiness.name}
            </h3>
            <div className="space-y-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    pkg.id === selectedBusiness.package.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => changeBusinessPackage(selectedBusiness.id, pkg.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-slate-900">{pkg.name}</h4>
                      <p className="text-sm text-slate-600">
                        {pkg.passLimit.toLocaleString()} passes • {pkg.programLimit} programs • {pkg.staffLimit === -1 ? 'Unlimited' : pkg.staffLimit} staff
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">${pkg.price}</p>
                      <p className="text-xs text-slate-500">/month</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPackageModal(false)
                  setSelectedBusiness(null)
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Business Modal */}
      {showAddBusinessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Business</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Business Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Coffee Shop Pro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@business.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Initial Package</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name} - ${pkg.price}/month</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddBusinessModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Business
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
