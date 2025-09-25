'use client'

import { useState, useEffect } from 'react'
import { 
  UserIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  CreditCardIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface BusinessProfile {
  id: string
  name: string
  slug?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  subscription_status?: string
  subscription_plan?: string
  monthly_cost?: number
  max_passes?: number
  max_members?: number
  total_passes_created?: number
  total_members?: number
  custom_domain?: string
  trial_ends_at?: string
  next_billing_date?: string
  created_at: string
  updated_at: string
}

interface ProfileStats {
  subscriptionStatus: string
  passesCreated: number
  totalMembers: number
  monthlyRevenue: number
}

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      loadStats()
    }
  }, [profile])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/business/profile')
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/business/auth/login')
          return
        }
        console.error('Error loading profile:', data.error)
        return
      }

      setProfile(data.profile)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      if (!profile) return

      setStats({
        subscriptionStatus: profile.subscription_status || 'active',
        passesCreated: profile.total_passes_created || 0,
        totalMembers: profile.total_members || 0,
        monthlyRevenue: profile.monthly_cost || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValue(currentValue || '')
  }

  const handleSave = async (field: string) => {
    setSaving(true)
    try {
      const response = await fetch('/api/business/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value: editValue }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error updating profile:', data.error)
        return
      }

      setProfile(prev => prev ? { ...prev, [field]: editValue } : null)
      setEditingField(null)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValue('')
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const renderEditableField = (
    fieldName: string,
    label: string,
    value: string,
    icon: React.ReactNode,
    placeholder: string
  ) => {
    const isEditing = editingField === fieldName

    return (
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center space-x-3 flex-1">
          {icon}
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700">{label}</p>
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={placeholder}
                className="mt-1 w-full px-2 py-1 text-slate-900 bg-white border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            ) : (
              <p className="text-slate-900">{value || 'Not set'}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={() => handleSave(fieldName)}
                disabled={saving}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => handleEdit(fieldName, value)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Unable to load profile information.</p>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <BuildingOfficeIcon className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              <p className="text-indigo-100 mt-1">Business Profile</p>
              <div className="flex items-center space-x-4 mt-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.subscription_status === 'active' 
                    ? 'bg-green-500/20 text-green-100 border border-green-400/30'
                    : profile.subscription_status === 'trial'
                    ? 'bg-yellow-500/20 text-yellow-100 border border-yellow-400/30'
                    : 'bg-red-500/20 text-red-100 border border-red-400/30'
                }`}>
                  {profile.subscription_status === 'active' ? 'Active' : 
                   profile.subscription_status === 'trial' ? 'Trial' : 'Inactive'}
                </span>
                <span className="text-indigo-100">
                  {profile.subscription_plan ? 
                    profile.subscription_plan.charAt(0).toUpperCase() + profile.subscription_plan.slice(1) : 
                    'Unknown'} Plan
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Business Information</h2>
              <div className="space-y-4">
                {renderEditableField(
                  'name',
                  'Business Name',
                  profile.name,
                  <BuildingOfficeIcon className="w-5 h-5 text-slate-400" />,
                  'Enter business name'
                )}
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Business ID</p>
                      <p className="text-slate-900 font-mono text-sm">{profile.id}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">Read only</span>
                </div>

                {renderEditableField(
                  'contact_email',
                  'Contact Email',
                  profile.contact_email || '',
                  <UserIcon className="w-5 h-5 text-slate-400" />,
                  'Enter contact email'
                )}

                {renderEditableField(
                  'contact_phone',
                  'Phone Number',
                  profile.contact_phone || '',
                  <PhoneIcon className="w-5 h-5 text-slate-400" />,
                  '+1 (555) 123-4567'
                )}

                {renderEditableField(
                  'custom_domain',
                  'Custom Domain',
                  profile.custom_domain || '',
                  <GlobeAltIcon className="w-5 h-5 text-slate-400" />,
                  'mydomain.com'
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Address Information</h2>
              <div className="space-y-4">
                {renderEditableField(
                  'address',
                  'Street Address',
                  profile.address || '',
                  <MapPinIcon className="w-5 h-5 text-slate-400" />,
                  '123 Main Street'
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    {renderEditableField(
                      'city',
                      'City',
                      profile.city || '',
                      <MapPinIcon className="w-5 h-5 text-slate-400" />,
                      'City'
                    )}
                  </div>
                  <div className="md:col-span-1">
                    {renderEditableField(
                      'state',
                      'State',
                      profile.state || '',
                      <MapPinIcon className="w-5 h-5 text-slate-400" />,
                      'State'
                    )}
                  </div>
                  <div className="md:col-span-1">
                    {renderEditableField(
                      'zip_code',
                      'ZIP Code',
                      profile.zip_code || '',
                      <MapPinIcon className="w-5 h-5 text-slate-400" />,
                      '12345'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Overview</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCardIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600">Plan</span>
                  </div>
                  <span className="font-medium text-slate-900">
                    {profile.subscription_plan?.charAt(0).toUpperCase() + profile.subscription_plan?.slice(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ChartBarIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600">Monthly Cost</span>
                  </div>
                  <span className="font-medium text-slate-900">
                    ${profile.monthly_cost || 0}/month
                  </span>
                </div>

                {profile.trial_ends_at && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCardIcon className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-600">Trial Ends</span>
                    </div>
                    <span className="font-medium text-slate-900">
                      {new Date(profile.trial_ends_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {stats && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Usage Stats</h2>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">
                      {stats.passesCreated}
                    </div>
                    <div className="text-sm text-slate-600">Passes Created</div>
                    <div className="text-xs text-slate-500">
                      of {profile.max_passes || 'unlimited'} limit
                    </div>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.totalMembers}
                    </div>
                    <div className="text-sm text-slate-600">Total Members</div>
                    <div className="text-xs text-slate-500">
                      of {profile.max_members || 'unlimited'} limit
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Created</span>
                  <span className="text-slate-900">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Last Updated</span>
                  <span className="text-slate-900">
                    {new Date(profile.updated_at).toLocaleDateString()}
                  </span>
                </div>
                {profile.next_billing_date && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Next Billing</span>
                    <span className="text-slate-900">
                      {new Date(profile.next_billing_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
