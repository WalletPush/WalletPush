'use client'

import React, { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, EllipsisVerticalIcon, UserPlusIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  passTypeId: string
  passUrl: string
  device: string
  serialNumber: string
  amountSpent: number
  totalAmountSpent: number
  averageOrderValue: number
  customerLifetimeValue: number
  points: number
  pointsRedeemed: number
  lastOrderPoints: number
  totalPoints: number
  lastPointsRedeemed?: string
  lastVisit?: string
  numberOfVisits: number
  lastDateOfRedemption?: string
  numberOfRedemptions: number
  memberSince: string
  cardBalance: number
  membershipPlan: string
  loyaltyTier: string
  notes?: string
  tags?: string[]
  createdAt: string
  lastActivity: string
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
    passTypeId: 'pass.com.teamloyalty',
    passUrl: 'https://app2.walletpush.io/p/_I6XArgsQ3mpYT2qfOthKA?t=BeT8pW4',
    device: 'desktop',
    serialNumber: 'fc8e9702-b82c-4379-a961-3daa7ceb6128',
    amountSpent: 250.00,
    totalAmountSpent: 750.00,
    averageOrderValue: 125.00,
    customerLifetimeValue: 1200.00,
    points: 100,
    pointsRedeemed: 50,
    lastOrderPoints: 25,
    totalPoints: 100,
    numberOfVisits: 5,
    numberOfRedemptions: 2,
    memberSince: '2024-01-15',
    cardBalance: 45.50,
    membershipPlan: 'Gold',
    loyaltyTier: 'Premium',
    notes: 'VIP customer, prefers weekend appointments',
    tags: ['VIP', 'High Value', 'Loyal'],
    createdAt: '2024-01-15',
    lastActivity: '2 hours ago'
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 987-6543',
    passTypeId: 'pass.com.teamloyalty',
    passUrl: 'https://app2.walletpush.io/p/_I6XArgsQ3mpYT2qfOthKB?t=BeT8pW5',
    device: 'mobile',
    serialNumber: 'ab1c2d3e-4f5g-6h7i-8j9k-0l1m2n3o4p5q',
    amountSpent: 125.00,
    totalAmountSpent: 325.00,
    averageOrderValue: 81.25,
    customerLifetimeValue: 650.00,
    points: 75,
    pointsRedeemed: 25,
    lastOrderPoints: 15,
    totalPoints: 75,
    numberOfVisits: 3,
    numberOfRedemptions: 1,
    memberSince: '2024-02-20',
    cardBalance: 22.75,
    membershipPlan: 'Silver',
    loyaltyTier: 'Standard',
    notes: 'Regular customer, shops monthly',
    tags: ['Regular', 'Mobile User'],
    createdAt: '2024-02-20',
    lastActivity: '1 day ago'
  }
]

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(mockMembers)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  const handleEditMember = (member: Member) => {
    setEditingMember({ ...member })
  }
  
  const handleSaveMember = () => {
    if (editingMember) {
      setMembers(prev => prev.map(m => m.id === editingMember.id ? editingMember : m))
      if (selectedMember?.id === editingMember.id) {
        setSelectedMember(editingMember)
      }
      setEditingMember(null)
    }
  }
  
  const handleCancelEdit = () => {
    setEditingMember(null)
  }
  
  const updateEditingField = (field: keyof Member, value: any) => {
    if (editingMember) {
      setEditingMember(prev => prev ? { ...prev, [field]: value } : null)
    }
  }

  // EditableField Component
  const EditableField = ({ 
    label, 
    value, 
    field, 
    type = 'text',
    isEditing = false,
    options = undefined
  }: {
    label: string
    value: any
    field: keyof Member
    type?: 'text' | 'number' | 'email' | 'tel' | 'date' | 'select' | 'textarea'
    isEditing: boolean
    options?: string[]
  }) => {
    if (!isEditing) {
      return (
        <div>
          <label className="text-sm font-medium text-slate-700">{label}</label>
          <p className="text-slate-900">{
            type === 'number' && typeof value === 'number' 
              ? (field.includes('Amount') || field.includes('Value') || field.includes('Balance') ? `C$${value.toFixed(2)}` : value)
              : Array.isArray(value) 
                ? value.join(', ')
                : value || 'N/A'
          }</p>
        </div>
      )
    }

    return (
      <div>
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {type === 'select' && options ? (
          <select
            value={value || ''}
            onChange={(e) => updateEditingField(field, e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={(e) => updateEditingField(field, e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => updateEditingField(field, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )}
      </div>
    )
  }

  const filteredMembers = members.filter(member =>
    member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm)
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          {/* Members Table */}
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
                  <React.Fragment key={member.id}>
                    <tr
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        selectedMember?.id === member.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-medium text-sm">
                              {member.firstName[0]}{member.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {member.firstName} {member.lastName}
                            </div>
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
                    
                    {/* Expanded Member Details */}
                    {selectedMember?.id === member.id && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 bg-slate-50 border-t border-slate-200">
                          {/* Edit Controls */}
                          <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-slate-900">Member Details</h2>
                            <div className="flex gap-2">
                              {editingMember?.id === member.id ? (
                                <>
                                  <button
                                    onClick={handleSaveMember}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                  >
                                    <CheckIcon className="w-4 h-4" />
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                  >
                                    <XMarkIcon className="w-4 h-4" />
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleEditMember(member)}
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                  Edit Member
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Personal Information */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-2">Personal Information</h3>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-slate-700">First Name</label>
                                  <p className="text-slate-900">{member.firstName}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Last Name</label>
                                  <p className="text-slate-900">{member.lastName}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Email</label>
                                  <p className="text-slate-900">{member.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Phone</label>
                                  <p className="text-slate-900">{member.phone}</p>
                                </div>
                                {member.dateOfBirth && (
                                  <div>
                                    <label className="text-sm font-medium text-slate-700">Date Of Birth</label>
                                    <p className="text-slate-900">{new Date(member.dateOfBirth).toLocaleDateString()}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Wallet Pass Information */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-2">Wallet Pass</h3>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-slate-700">MW - PassTypeId</label>
                                  <p className="text-slate-900 text-sm break-all">{member.passTypeId}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700">MW - PassUrl</label>
                                  <p className="text-blue-600 text-sm break-all">
                                    <a href={member.passUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                      {member.passUrl}
                                    </a>
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700">MW - Device</label>
                                  <p className="text-slate-900 capitalize">{member.device}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700">MW - SerialNumber</label>
                                  <p className="text-slate-900 text-sm break-all">{member.serialNumber}</p>
                                </div>
                              </div>
                            </div>

                            {/* Financial Information */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-2">Financial & Points</h3>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Amount Spent</label>
                                  <p className="text-slate-900">C${member.amountSpent.toFixed(2)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Total Amount Spent</label>
                                  <p className="text-slate-900">C${member.totalAmountSpent.toFixed(2)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Points</label>
                                  <p className="text-slate-900">{member.points}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Points Redeemed</label>
                                  <p className="text-slate-900">{member.pointsRedeemed}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Last Order Points</label>
                                  <p className="text-slate-900">{member.lastOrderPoints}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Total Points</label>
                                  <p className="text-slate-900">{member.totalPoints}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Card Balance</label>
                                  <p className="text-slate-900">C${member.cardBalance.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>

                            {/* Activity Information */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-2">Activity</h3>
                              <div className="space-y-3">
                                {member.lastPointsRedeemed && (
                                  <div>
                                    <label className="text-sm font-medium text-slate-700">Last Points Redeemed</label>
                                    <p className="text-slate-900">{member.lastPointsRedeemed}</p>
                                  </div>
                                )}
                                {member.lastVisit && (
                                  <div>
                                    <label className="text-sm font-medium text-slate-700">Last Visit</label>
                                    <p className="text-slate-900">{member.lastVisit}</p>
                                  </div>
                                )}
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Number of Visits</label>
                                  <p className="text-slate-900">{member.numberOfVisits}</p>
                                </div>
                                {member.lastDateOfRedemption && (
                                  <div>
                                    <label className="text-sm font-medium text-slate-700">Last Date of Redemption</label>
                                    <p className="text-slate-900">{member.lastDateOfRedemption}</p>
                                  </div>
                                )}
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Number of Redemptions</label>
                                  <p className="text-slate-900">{member.numberOfRedemptions}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Member since</label>
                                  <p className="text-slate-900">{new Date(member.memberSince).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </div>

                            {/* Membership Information */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-2">Membership</h3>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Membership Plan</label>
                                  <p className="text-slate-900">{member.membershipPlan}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700">Loyalty Tier</label>
                                  <p className="text-slate-900">{member.loyaltyTier}</p>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-2">Actions</h3>
                              <div className="space-y-2">
                                <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                  MW - Send Push To All Users
                                </button>
                                <button className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded transition-colors">
                                  Send Email
                                </button>
                                <button className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded transition-colors">
                                  Update Points
                                </button>
                                <button className="w-full text-left px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded transition-colors">
                                  Edit Member
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No members found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
