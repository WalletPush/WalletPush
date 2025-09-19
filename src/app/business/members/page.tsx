'use client'

import React, { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, EllipsisVerticalIcon, UserPlusIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  passTypeId: string
  passUrl: string
  device: string
  serialNumber: string
  amountSpent: number
  amountSpentTotal: number
  points: number
  pointsRedeemed: number
  lastOrder: string
  pointsTotal: number
  lastPointsRedeemed: string
  lastVisit: string
  numberOfVisits: number
  lastDateOfRedemption: string
  numberOfRedemptions: number
  memberSince: string
  cardBalance: number
  membershipPlan: string
  loyaltyTier: string
  createdAt: string
  lastActivity: string
  averageOrderValue: number
  customerLifetimeValue: number
  notes: string
  tags: string[]
}

// Mock data - replace with API call later
const mockMembers: Member[] = [
  {
    id: '1',
    firstName: 'David',
    lastName: 'Sambor',
    email: 'david.sambor@icloud.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-05-15',
    passTypeId: 'pass.com.teamloyalty.MW',
    passUrl: 'https://app2.walletpush.io/p/_I6XArgsQ3mpYT2qfOthKA?t=BeT8pW4',
    device: 'iPhone',
    serialNumber: 'fc8e9702-b82c-4379-a961-3daa7ceb6128',
    amountSpent: 125.50,
    amountSpentTotal: 1247.75,
    points: 100,
    pointsRedeemed: 25,
    lastOrder: '2024-03-10',
    pointsTotal: 125,
    lastPointsRedeemed: '2024-03-08',
    lastVisit: '2024-03-11',
    numberOfVisits: 24,
    lastDateOfRedemption: '2024-03-08',
    numberOfRedemptions: 5,
    memberSince: '2024-01-15',
    cardBalance: 87.25,
    membershipPlan: 'Gold',
    loyaltyTier: 'Premium',
    createdAt: '2024-01-15',
    lastActivity: '2 hours ago',
    averageOrderValue: 52.15,
    customerLifetimeValue: 1875.50,
    notes: 'VIP customer, prefers morning appointments',
    tags: ['VIP', 'High Value', 'Coffee Lover']
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 987-6543',
    dateOfBirth: '1985-09-22',
    passTypeId: 'pass.com.teamloyalty.MW',
    passUrl: 'https://app2.walletpush.io/p/_I6XArgsQ3mpYT2qfOthKA?t=BeT8pW5',
    device: 'Android',
    serialNumber: 'ab1d2345-c67e-8901-f234-56789abcdef0',
    amountSpent: 65.00,
    amountSpentTotal: 542.30,
    points: 45,
    pointsRedeemed: 10,
    lastOrder: '2024-03-09',
    pointsTotal: 55,
    lastPointsRedeemed: '2024-02-28',
    lastVisit: '2024-03-09',
    numberOfVisits: 12,
    lastDateOfRedemption: '2024-02-28',
    numberOfRedemptions: 2,
    memberSince: '2024-02-20',
    cardBalance: 23.50,
    membershipPlan: 'Silver',
    loyaltyTier: 'Standard',
    createdAt: '2024-02-20',
    lastActivity: '1 day ago',
    averageOrderValue: 45.19,
    customerLifetimeValue: 865.75,
    notes: 'Frequent lunch visits, likes promotions',
    tags: ['Regular', 'Lunch Customer']
  }
]

// Inline editing component
const EditableField: React.FC<{
  value: string | number
  onSave: (value: string | number) => void
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea'
  className?: string
}> = ({ value, onSave, type = 'text', className = '' }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value.toString())

  const handleSave = () => {
    const finalValue = type === 'number' ? parseFloat(editValue) : editValue
    onSave(finalValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value.toString())
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        {type === 'textarea' ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            autoFocus
            rows={2}
          />
        ) : (
          <input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            autoFocus
          />
        )}
        <button
          onClick={handleSave}
          className="p-1 text-green-600 hover:text-green-700"
        >
          <CheckIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-red-600 hover:text-red-700"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2">
      <span className={className}>{type === 'number' && typeof value === 'number' ? value.toFixed(2) : value}</span>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-opacity"
      >
        <PencilIcon className="w-3 h-3" />
      </button>
    </div>
  )
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch real customers from the database
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/business/customers')
        const result = await response.json()
        
        if (response.ok) {
          setMembers(result.data || [])
          console.log('✅ Loaded', result.data?.length || 0, 'customers')
        } else {
          setError(result.error || 'Failed to load customers')
          console.error('❌ Failed to fetch customers:', result.error)
          // Fallback to mock data for development
          setMembers(mockMembers)
        }
      } catch (err: any) {
        setError('Failed to connect to server')
        console.error('❌ Network error:', err)
        // Fallback to mock data for development
        setMembers(mockMembers)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const handleEditMember = (member: Member) => {
    setEditingMember({ ...member })
  }

  const handleSaveMember = () => {
    if (editingMember) {
      setMembers(prev => prev.map(member => 
        member.id === editingMember.id ? editingMember : member
      ))
      setSelectedMember(editingMember)
      setEditingMember(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingMember(null)
  }

  const updateEditingField = (field: keyof Member, value: string | number) => {
    if (editingMember) {
      if (field === 'tags' && typeof value === 'string') {
        // Handle tags as comma-separated string
        const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        setEditingMember({ ...editingMember, [field]: tagsArray })
      } else {
        setEditingMember({ ...editingMember, [field]: value })
      }
    }
  }

  const filteredMembers = members.filter(member =>
    (member.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.phone || '').includes(searchTerm)
  )

  return (
    <>
      <div className="dashboard-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Members</h1>
            <p className="text-slate-600 mt-1">Manage your program members and their wallet passes</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <UserPlusIcon className="w-5 h-5" />
            Add Member
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          {/* Search and Filters */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <FunnelIcon className="w-5 h-5" />
                Filters
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading customers...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
              <div className="text-red-600 mb-2">⚠️ Error loading customers</div>
              <p className="text-slate-600 text-sm">{error}</p>
              <p className="text-slate-500 text-xs mt-2">Showing sample data for development</p>
            </div>
          )}

          {/* Members Table */}
          {!loading && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Phone</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Created At</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Last Activity</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-medium text-sm">
                            {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{member.firstName} {member.lastName}</div>
                          <div className="text-sm text-slate-500">{member.membershipPlan} • {member.loyaltyTier}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{member.email}</td>
                    <td className="px-4 py-3 text-slate-700">{member.phone}</td>
                    <td className="px-4 py-3 text-slate-700">{new Date(member.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-700">{member.lastActivity}</td>
                    <td className="px-4 py-3">
                      <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                        <EllipsisVerticalIcon className="w-5 h-5 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">No members found matching your search.</p>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Selected Member Details */}
        {selectedMember && (
          <div className="mt-6 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">Member Details</h2>
              <div className="flex gap-2">
                {editingMember ? (
                  <>
                    <button
                      onClick={handleSaveMember}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-slate-300 text-slate-700 text-sm rounded hover:bg-slate-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEditMember(selectedMember)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit Member
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-slate-800">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-md border border-slate-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">First Name</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.firstName}
                        onSave={(value) => updateEditingField('firstName', value)}
                        className="text-slate-900 font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{selectedMember.firstName}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-slate-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Last Name</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.lastName}
                        onSave={(value) => updateEditingField('lastName', value)}
                        className="text-slate-900 font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{selectedMember.lastName}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-slate-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Date of Birth</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.dateOfBirth}
                        onSave={(value) => updateEditingField('dateOfBirth', value)}
                        type="date"
                        className="text-slate-900 font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{selectedMember.dateOfBirth}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-slate-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Email</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.email}
                        onSave={(value) => updateEditingField('email', value)}
                        type="email"
                        className="text-slate-900 font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium break-all">{selectedMember.email}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-slate-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Phone</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.phone}
                        onSave={(value) => updateEditingField('phone', value)}
                        type="tel"
                        className="text-slate-900 font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{selectedMember.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Wallet Pass Information */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-slate-800">Wallet Pass Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-md border border-purple-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">PassTypeId</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.passTypeId}
                        onSave={(value) => updateEditingField('passTypeId', value)}
                        className="text-slate-900 font-mono text-xs font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-mono text-xs font-medium">{selectedMember.passTypeId}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-purple-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Device</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.device}
                        onSave={(value) => updateEditingField('device', value)}
                        className="text-slate-900 font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{selectedMember.device}</p>
                    )}
                  </div>
                  <div className="md:col-span-2 bg-white p-4 rounded-md border border-purple-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Pass URL</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.passUrl}
                        onSave={(value) => updateEditingField('passUrl', value)}
                        className="text-slate-900 font-mono text-xs break-all font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-mono text-xs break-all font-medium">{selectedMember.passUrl}</p>
                    )}
                  </div>
                  <div className="md:col-span-2 bg-white p-4 rounded-md border border-purple-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Serial Number</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.serialNumber}
                        onSave={(value) => updateEditingField('serialNumber', value)}
                        className="text-slate-900 font-mono text-sm font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-mono text-sm font-medium">{selectedMember.serialNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-slate-800">Financial Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-4 rounded-md border border-green-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Amount Spent (Last)</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.amountSpent}
                        onSave={(value) => updateEditingField('amountSpent', value)}
                        type="number"
                        className="text-slate-900 font-semibold text-lg"
                      />
                    ) : (
                      <p className="text-slate-900 font-semibold text-lg">${selectedMember.amountSpent.toFixed(2)}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-green-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Total Amount Spent</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.amountSpentTotal}
                        onSave={(value) => updateEditingField('amountSpentTotal', value)}
                        type="number"
                        className="text-slate-900 font-semibold text-lg"
                      />
                    ) : (
                      <p className="text-slate-900 font-semibold text-lg">${selectedMember.amountSpentTotal.toFixed(2)}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-green-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Card Balance</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.cardBalance}
                        onSave={(value) => updateEditingField('cardBalance', value)}
                        type="number"
                        className="text-slate-900 font-semibold text-lg"
                      />
                    ) : (
                      <p className="text-slate-900 font-semibold text-lg">${selectedMember.cardBalance.toFixed(2)}</p>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-6 rounded-lg border-2 border-green-300 shadow-sm">
                    <label className="text-sm font-medium text-green-700 block mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Average Order Value
                    </label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.averageOrderValue}
                        onSave={(value) => updateEditingField('averageOrderValue', value)}
                        type="number"
                        className="text-green-800 font-bold text-2xl"
                      />
                    ) : (
                      <p className="text-green-800 font-bold text-2xl">${selectedMember.averageOrderValue.toFixed(2)}</p>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-lg border-2 border-blue-300 shadow-sm lg:col-span-3">
                    <label className="text-sm font-medium text-blue-700 block mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Customer Lifetime Value
                    </label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.customerLifetimeValue}
                        onSave={(value) => updateEditingField('customerLifetimeValue', value)}
                        type="number"
                        className="text-blue-800 font-bold text-3xl"
                      />
                    ) : (
                      <p className="text-blue-800 font-bold text-3xl">${selectedMember.customerLifetimeValue.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Points & Activity */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-slate-800">Points & Activity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="bg-white p-4 rounded-md border border-yellow-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Current Points</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.points}
                        onSave={(value) => updateEditingField('points', value)}
                        type="number"
                        className="text-yellow-700 font-bold text-xl"
                      />
                    ) : (
                      <p className="text-yellow-700 font-bold text-xl">{selectedMember.points}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-yellow-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Points Redeemed</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.pointsRedeemed}
                        onSave={(value) => updateEditingField('pointsRedeemed', value)}
                        type="number"
                        className="text-slate-900 font-semibold text-lg"
                      />
                    ) : (
                      <p className="text-slate-900 font-semibold text-lg">{selectedMember.pointsRedeemed}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-yellow-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Total Points Earned</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.pointsTotal}
                        onSave={(value) => updateEditingField('pointsTotal', value)}
                        type="number"
                        className="text-slate-900 font-semibold text-lg"
                      />
                    ) : (
                      <p className="text-slate-900 font-semibold text-lg">{selectedMember.pointsTotal}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-yellow-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Number of Visits</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.numberOfVisits}
                        onSave={(value) => updateEditingField('numberOfVisits', value)}
                        type="number"
                        className="text-slate-900 font-semibold text-lg"
                      />
                    ) : (
                      <p className="text-slate-900 font-semibold text-lg">{selectedMember.numberOfVisits}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-yellow-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Number of Redemptions</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.numberOfRedemptions}
                        onSave={(value) => updateEditingField('numberOfRedemptions', value)}
                        type="number"
                        className="text-slate-900 font-semibold text-lg"
                      />
                    ) : (
                      <p className="text-slate-900 font-semibold text-lg">{selectedMember.numberOfRedemptions}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Membership & Dates */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-lg p-6 border border-slate-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-slate-800">Membership & Timeline</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-md border border-slate-200">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Membership Plan</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.membershipPlan}
                        onSave={(value) => updateEditingField('membershipPlan', value)}
                        className="text-slate-900 font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{selectedMember.membershipPlan}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-slate-200">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Loyalty Tier</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.loyaltyTier}
                        onSave={(value) => updateEditingField('loyaltyTier', value)}
                        className="text-slate-900 font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{selectedMember.loyaltyTier}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-slate-200">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Member Since</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.memberSince}
                        onSave={(value) => updateEditingField('memberSince', value)}
                        type="date"
                        className="text-slate-900 font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{selectedMember.memberSince}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-slate-200">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Last Order</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.lastOrder}
                        onSave={(value) => updateEditingField('lastOrder', value)}
                        type="date"
                        className="text-slate-900 font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{selectedMember.lastOrder}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-slate-200">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Last Visit</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.lastVisit}
                        onSave={(value) => updateEditingField('lastVisit', value)}
                        type="date"
                        className="text-slate-900 font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{selectedMember.lastVisit}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-slate-200">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Last Points Redeemed</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.lastPointsRedeemed}
                        onSave={(value) => updateEditingField('lastPointsRedeemed', value)}
                        type="date"
                        className="text-slate-900 font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{selectedMember.lastPointsRedeemed}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-slate-200">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Last Date of Redemption</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.lastDateOfRedemption}
                        onSave={(value) => updateEditingField('lastDateOfRedemption', value)}
                        type="date"
                        className="text-slate-900 font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{selectedMember.lastDateOfRedemption}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes & Tags */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-slate-800">Notes & Tags</h3>
                </div>
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-md border border-indigo-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Notes</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.notes}
                        onSave={(value) => updateEditingField('notes', value)}
                        type="textarea"
                        className="text-slate-900 w-full font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium italic">{selectedMember.notes}</p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md border border-indigo-100">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Tags</label>
                    {editingMember ? (
                      <EditableField
                        value={editingMember.tags.join(', ')}
                        onSave={(value) => updateEditingField('tags', value)}
                        className="text-slate-900 font-medium"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedMember.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 text-sm rounded-full font-medium border border-indigo-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
