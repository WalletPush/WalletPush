'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  KeyIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  UserIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface PassTypeID {
  id: string
  label: string
  passTypeIdentifier: string
  teamId: string
  isValidated: boolean
  isGlobal: boolean
  source: 'owned' | 'global' | 'platform'
  createdAt: string
  assignedTo?: {
    businessId: string
    businessName: string
    assignedAt: string
  }
  certificateInfo?: {
    fileName: string
    expiresAt: string
    uploadedAt: string
  }
}

interface Business {
  id: string
  name: string
  email: string
  status: 'active' | 'suspended' | 'trial'
  hasPassTypeId: boolean
}

export default function AgencyPassTypeIDsPage() {
  const [passTypeIDs, setPassTypeIDs] = useState<PassTypeID[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedPassTypeId, setSelectedPassTypeId] = useState<PassTypeID | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  // Create Pass Type ID form state
  const [newPassTypeData, setNewPassTypeData] = useState({
    label: '',
    passTypeIdentifier: '',
    teamId: '',
    certificateFile: null as File | null,
    keyFile: null as File | null
  })

  const certificateInputRef = useRef<HTMLInputElement>(null)
  const keyInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPassTypeIDs()
    loadBusinesses()
  }, [])

  const loadPassTypeIDs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/agency/pass-type-ids')
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      setPassTypeIDs(data.passTypeIds || [])
      
    } catch (error) {
      console.error('❌ Failed to load Pass Type IDs:', error)
      // Show empty state instead of dummy data
      setPassTypeIDs([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadBusinesses = async () => {
    try {
      const response = await fetch('/api/agency/businesses')
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      const businessesData = data.businesses || []
      
      // Transform businesses data and check Pass Type ID assignments
      setBusinesses(businessesData.map((b: any) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        status: b.status,
        hasPassTypeId: false // Will be updated based on assignments
      })))
      
    } catch (error) {
      console.error('❌ Failed to load businesses:', error)
      // Show empty state instead of dummy data
      setBusinesses([])
    }
  }

  const filteredPassTypeIDs = passTypeIDs.filter(passType => {
    const matchesSearch = passType.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         passType.passTypeIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         passType.assignedTo?.businessName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'validated' && passType.isValidated) ||
                         (statusFilter === 'pending' && !passType.isValidated) ||
                         (statusFilter === 'assigned' && passType.assignedTo) ||
                         (statusFilter === 'unassigned' && !passType.assignedTo)
    
    const matchesSource = sourceFilter === 'all' || passType.source === sourceFilter
    
    return matchesSearch && matchesStatus && matchesSource
  })

  const getStatusBadge = (passType: PassTypeID) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full flex items-center"
    
    if (passType.isGlobal) {
      return `${baseClasses} bg-purple-100 text-purple-800`
    }
    
    if (passType.isValidated) {
      return `${baseClasses} bg-green-100 text-green-800`
    } else {
      return `${baseClasses} bg-yellow-100 text-yellow-800`
    }
  }

  const getSourceBadge = (source: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    
    switch (source) {
      case 'owned':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'global':
        return `${baseClasses} bg-purple-100 text-purple-800`
      case 'platform':
        return `${baseClasses} bg-slate-100 text-slate-800`
      default:
        return `${baseClasses} bg-slate-100 text-slate-800`
    }
  }

  const createPassTypeID = async () => {
    if (!newPassTypeData.label || !newPassTypeData.passTypeIdentifier || !newPassTypeData.teamId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setIsCreating(true)
      
      const formData = new FormData()
      formData.append('label', newPassTypeData.label)
      formData.append('passTypeIdentifier', newPassTypeData.passTypeIdentifier)
      formData.append('teamId', newPassTypeData.teamId)
      
      if (newPassTypeData.certificateFile) {
        formData.append('certificate', newPassTypeData.certificateFile)
      }
      if (newPassTypeData.keyFile) {
        formData.append('key', newPassTypeData.keyFile)
      }

      const response = await fetch('/api/agency/pass-type-ids', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await loadPassTypeIDs()
        setShowCreateModal(false)
        setNewPassTypeData({
          label: '',
          passTypeIdentifier: '',
          teamId: '',
          certificateFile: null,
          keyFile: null
        })
        alert('Pass Type ID created successfully!')
      } else {
        alert('Failed to create Pass Type ID')
      }
    } catch (error) {
      console.error('Failed to create Pass Type ID:', error)
      alert('Failed to create Pass Type ID')
    } finally {
      setIsCreating(false)
    }
  }

  const assignPassTypeID = async (businessId: string) => {
    if (!selectedPassTypeId) return

    // Check if business already has a Pass Type ID (enforce 1:1 rule)
    const businessHasPassType = passTypeIDs.some(pt => pt.assignedTo?.businessId === businessId)
    if (businessHasPassType) {
      alert('This business already has a Pass Type ID assigned. Each business can only have one Pass Type ID.')
      return
    }

    try {
      setIsAssigning(true)
      
      const response = await fetch('/api/agency/pass-type-ids/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passTypeId: selectedPassTypeId.id,
          businessId: businessId
        })
      })

      if (response.ok) {
        await loadPassTypeIDs()
        setShowAssignModal(false)
        setSelectedPassTypeId(null)
        alert('Pass Type ID assigned successfully!')
      } else {
        alert('Failed to assign Pass Type ID')
      }
    } catch (error) {
      console.error('Failed to assign Pass Type ID:', error)
      alert('Failed to assign Pass Type ID')
    } finally {
      setIsAssigning(false)
    }
  }

  const unassignPassTypeID = async (passTypeId: string) => {
    if (!confirm('Are you sure you want to unassign this Pass Type ID?')) return

    try {
      const response = await fetch('/api/agency/pass-type-ids/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passTypeId })
      })

      if (response.ok) {
        await loadPassTypeIDs()
        alert('Pass Type ID unassigned successfully!')
      } else {
        alert('Failed to unassign Pass Type ID')
      }
    } catch (error) {
      console.error('Failed to unassign Pass Type ID:', error)
      alert('Failed to unassign Pass Type ID')
    }
  }

  const deletePassTypeID = async (passTypeId: string) => {
    if (!confirm('Are you sure you want to delete this Pass Type ID? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/agency/pass-type-ids/${passTypeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadPassTypeIDs()
        alert('Pass Type ID deleted successfully!')
      } else {
        alert('Failed to delete Pass Type ID')
      }
    } catch (error) {
      console.error('Failed to delete Pass Type ID:', error)
      alert('Failed to delete Pass Type ID')
    }
  }

  const availableBusinesses = businesses.filter(business => 
    business.status === 'active' && !business.hasPassTypeId
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Pass Type IDs...</p>
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
              <div className="bg-green-100 p-2 rounded-lg">
                <KeyIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Pass Type ID Management</h1>
                <p className="text-slate-600">Create and assign Apple Wallet certificates to your businesses</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Pass Type ID
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center">
              <KeyIcon className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total Certificates</p>
                <p className="text-2xl font-bold text-slate-900">{passTypeIDs.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-slate-600">Validated</p>
                <p className="text-2xl font-bold text-slate-900">
                  {passTypeIDs.filter(pt => pt.isValidated).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center">
              <BuildingOfficeIcon className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-slate-600">Assigned</p>
                <p className="text-2xl font-bold text-slate-900">
                  {passTypeIDs.filter(pt => pt.assignedTo).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center">
              <GlobeAltIcon className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-slate-600">Global</p>
                <p className="text-2xl font-bold text-slate-900">
                  {passTypeIDs.filter(pt => pt.isGlobal).length}
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
                  placeholder="Search certificates..."
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
                <option value="validated">Validated</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sources</option>
                <option value="owned">Agency Owned</option>
                <option value="global">Global</option>
                <option value="platform">Platform</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pass Type IDs Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Certificate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredPassTypeIDs.map((passType) => (
                  <tr key={passType.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <KeyIcon className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{passType.label}</div>
                          <div className="text-sm text-slate-500">{passType.passTypeIdentifier}</div>
                          <div className="text-xs text-slate-400">Team: {passType.teamId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(passType)}>
                        {passType.isGlobal ? (
                          <>
                            <GlobeAltIcon className="w-3 h-3 mr-1" />
                            Global
                          </>
                        ) : passType.isValidated ? (
                          <>
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            Validated
                          </>
                        ) : (
                          <>
                            <ClockIcon className="w-3 h-3 mr-1" />
                            Pending
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {passType.assignedTo ? (
                        <div>
                          <div className="text-sm font-medium text-slate-900">{passType.assignedTo.businessName}</div>
                          <div className="text-xs text-slate-500">Assigned {passType.assignedTo.assignedAt}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getSourceBadge(passType.source)}>
                        {passType.source === 'owned' ? 'Agency' : passType.source === 'global' ? 'Global' : 'Platform'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {passType.certificateInfo ? (
                        <div>
                          <div className="text-sm text-slate-900">{passType.certificateInfo.expiresAt}</div>
                          <div className="text-xs text-slate-500">{passType.certificateInfo.fileName}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">No certificate</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {!passType.isGlobal && (
                          <>
                            {passType.assignedTo ? (
                              <button
                                onClick={() => unassignPassTypeID(passType.id)}
                                className="text-red-600 hover:text-red-900 flex items-center"
                                title="Unassign"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedPassTypeId(passType)
                                  setShowAssignModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900 flex items-center"
                                title="Assign to Business"
                              >
                                <UserIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deletePassTypeID(passType.id)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPassTypeIDs.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <KeyIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Pass Type IDs found</h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first Pass Type ID'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && sourceFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create First Pass Type ID
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Pass Type ID Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Pass Type ID</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Label</label>
                <input
                  type="text"
                  value={newPassTypeData.label}
                  onChange={(e) => setNewPassTypeData({...newPassTypeData, label: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Loyalty Program Certificate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pass Type Identifier</label>
                <input
                  type="text"
                  value={newPassTypeData.passTypeIdentifier}
                  onChange={(e) => setNewPassTypeData({...newPassTypeData, passTypeIdentifier: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., pass.com.myagency.loyalty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Team ID</label>
                <input
                  type="text"
                  value={newPassTypeData.teamId}
                  onChange={(e) => setNewPassTypeData({...newPassTypeData, teamId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., ABC123DEF4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Certificate File (.p12)</label>
                <input
                  ref={certificateInputRef}
                  type="file"
                  accept=".p12,.pfx"
                  onChange={(e) => setNewPassTypeData({...newPassTypeData, certificateFile: e.target.files?.[0] || null})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewPassTypeData({
                    label: '',
                    passTypeIdentifier: '',
                    teamId: '',
                    certificateFile: null,
                    keyFile: null
                  })
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={createPassTypeID}
                disabled={isCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Pass Type ID'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Pass Type ID Modal */}
      {showAssignModal && selectedPassTypeId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Assign "{selectedPassTypeId.label}" to Business
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Select a business to assign this Pass Type ID. Remember: each business can only have one Pass Type ID.
            </p>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availableBusinesses.length === 0 ? (
                <p className="text-slate-500 text-center py-4">
                  No available businesses. All active businesses already have Pass Type IDs assigned.
                </p>
              ) : (
                availableBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className="p-3 border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50"
                    onClick={() => assignPassTypeID(business.id)}
                  >
                    <div className="font-medium text-slate-900">{business.name}</div>
                    <div className="text-sm text-slate-500">{business.email}</div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedPassTypeId(null)
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
