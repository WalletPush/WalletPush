'use client'

import { useState, useEffect } from 'react'
import { 
  CogIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface PackageFeature {
  id: string
  name: string
  description: string
  enabled: boolean
}

interface SaasPackage {
  id: string
  name: string
  description: string
  price: number
  passLimit: number
  programLimit: number
  staffLimit: number
  features: PackageFeature[]
  isActive: boolean
}

const defaultFeatures: Omit<PackageFeature, 'id' | 'enabled'>[] = [
  { name: 'Custom Branding', description: 'Upload logo and customize colors' },
  { name: 'Advanced Analytics', description: 'Detailed insights and reporting' },
  { name: 'API Access', description: 'REST API for integrations' },
  { name: 'Priority Support', description: 'Faster response times' },
  { name: 'White-label Domain', description: 'Custom domain for customer portal' },
  { name: 'SMTP Configuration', description: 'Custom email sending' },
  { name: 'Webhook Support', description: 'Real-time event notifications' },
  { name: 'Multi-location Support', description: 'Multiple business locations' }
]

export default function SaasConfiguratorPage() {
  const [packages, setPackages] = useState<SaasPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Initialize with default packages
  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/agency/saas-packages')
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.packages && data.packages.length > 0) {
        setPackages(data.packages)
        return
      }
      
      // If no packages returned, show mock data as starting point
      setError('No packages found. Showing starter templates - edit and save to create your packages.')
      const mockPackages: SaasPackage[] = [
        {
          id: '1',
          name: 'Starter',
          description: 'Perfect for small businesses getting started',
          price: 29,
          passLimit: 1000,
          programLimit: 3,
          staffLimit: 2,
          features: defaultFeatures.map((f, i) => ({
            id: `starter-${i}`,
            ...f,
            enabled: i < 2 // Only first 2 features enabled
          })),
          isActive: true
        },
        {
          id: '2',
          name: 'Business',
          description: 'Ideal for growing businesses with multiple programs',
          price: 69,
          passLimit: 5000,
          programLimit: 10,
          staffLimit: 5,
          features: defaultFeatures.map((f, i) => ({
            id: `business-${i}`,
            ...f,
            enabled: i < 5 // First 5 features enabled
          })),
          isActive: true
        },
        {
          id: '3',
          name: 'Pro',
          description: 'Full-featured solution for enterprise businesses',
          price: 97,
          passLimit: 10000,
          programLimit: 20,
          staffLimit: -1, // Unlimited
          features: defaultFeatures.map((f, i) => ({
            id: `pro-${i}`,
            ...f,
            enabled: true // All features enabled
          })),
          isActive: true
        }
      ]
      
      setPackages(mockPackages)
    } catch (error) {
      setError(`Failed to load packages: ${error.message}`)
      setPackages([]) // Empty packages on error
    } finally {
      setIsLoading(false)
    }
  }

  const updatePackage = (packageId: string, updates: Partial<SaasPackage>) => {
    setPackages(prev => prev.map(pkg => 
      pkg.id === packageId ? { ...pkg, ...updates } : pkg
    ))
  }

  const toggleFeature = (packageId: string, featureId: string) => {
    setPackages(prev => prev.map(pkg => 
      pkg.id === packageId 
        ? {
            ...pkg,
            features: pkg.features.map(feature =>
              feature.id === featureId 
                ? { ...feature, enabled: !feature.enabled }
                : feature
            )
          }
        : pkg
    ))
  }

  const savePackages = async () => {
    try {
      setIsSaving(true)
      setError(null)
      
      const response = await fetch('/api/agency/saas-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setSuccessMessage('SAAS packages saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      
    } catch (error) {
      console.error('❌ Failed to save packages:', error)
      setError(`SAVE FAILED: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading SAAS Configurator...</p>
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
                <CogIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">SAAS Package Configurator</h1>
                <p className="text-slate-600">Design custom pricing packages for your businesses</p>
              </div>
            </div>
            <button
              onClick={savePackages}
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Packages'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckIcon className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Agency Allocation Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Agency Allocation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <DocumentTextIcon className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Pass Allocation</p>
                  <p className="text-2xl font-bold text-blue-600">100,000</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <UserGroupIcon className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-900">Businesses</p>
                  <p className="text-2xl font-bold text-green-600">Unlimited</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <CogIcon className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Pass Type IDs</p>
                  <p className="text-2xl font-bold text-purple-600">Unlimited</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Package Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <div key={pkg.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              {/* Package Header */}
              <div className={`p-6 ${index === 1 ? 'bg-green-50 border-b-2 border-green-200' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    value={pkg.name}
                    onChange={(e) => updatePackage(pkg.id, { name: e.target.value })}
                    className="text-xl font-bold bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-300 rounded px-2 py-1"
                  />
                  {index === 1 && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      POPULAR
                    </span>
                  )}
                </div>
                <textarea
                  value={pkg.description}
                  onChange={(e) => updatePackage(pkg.id, { description: e.target.value })}
                  className="w-full text-sm text-slate-600 bg-transparent border-none outline-none resize-none focus:bg-white focus:border focus:border-blue-300 rounded p-2"
                  rows={2}
                />
              </div>

              {/* Pricing */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center mb-4">
                  <CurrencyDollarIcon className="w-5 h-5 text-slate-400 mr-2" />
                  <span className="text-sm font-medium text-slate-700">Monthly Price</span>
                </div>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-slate-900">$</span>
                  <input
                    type="number"
                    value={pkg.price}
                    onChange={(e) => updatePackage(pkg.id, { price: parseInt(e.target.value) || 0 })}
                    className="text-3xl font-bold text-slate-900 bg-transparent border-none outline-none w-20 focus:bg-slate-50 focus:border focus:border-blue-300 rounded px-1"
                  />
                  <span className="text-slate-500 ml-1">/month</span>
                </div>
              </div>

              {/* Limits */}
              <div className="p-6 border-b border-slate-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pass Limit</label>
                  <input
                    type="number"
                    value={pkg.passLimit}
                    onChange={(e) => updatePackage(pkg.id, { passLimit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Program Limit</label>
                  <input
                    type="number"
                    value={pkg.programLimit}
                    onChange={(e) => updatePackage(pkg.id, { programLimit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Staff Limit</label>
                  <input
                    type="number"
                    value={pkg.staffLimit === -1 ? '' : pkg.staffLimit}
                    onChange={(e) => updatePackage(pkg.id, { staffLimit: e.target.value === '' ? -1 : parseInt(e.target.value) || 0 })}
                    placeholder="Leave empty for unlimited"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {pkg.staffLimit === -1 && (
                    <p className="text-xs text-green-600 mt-1">Unlimited staff accounts</p>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="p-6">
                <h4 className="text-sm font-medium text-slate-900 mb-4">Features</h4>
                <div className="space-y-3">
                  {pkg.features.map((feature) => (
                    <div key={feature.id} className="flex items-start">
                      <button
                        onClick={() => toggleFeature(pkg.id, feature.id)}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mr-3 mt-0.5 transition-colors ${
                          feature.enabled
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 hover:border-blue-400'
                        }`}
                      >
                        {feature.enabled && <CheckIcon className="w-3 h-3" />}
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${feature.enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                          {feature.name}
                        </p>
                        <p className={`text-xs ${feature.enabled ? 'text-slate-600' : 'text-slate-400'}`}>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Package Status */}
              <div className="p-6 bg-slate-50 border-t border-slate-200">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={pkg.isActive}
                    onChange={(e) => updatePackage(pkg.id, { isActive: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-slate-700">
                    Active Package
                  </span>
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  {pkg.isActive ? 'Available for businesses to purchase' : 'Hidden from customers'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Preview Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Package Preview</h2>
          <p className="text-slate-600 mb-6">This is how your packages will appear to businesses on your sales page:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.filter(pkg => pkg.isActive).map((pkg, index) => (
              <div key={pkg.id} className={`border rounded-lg p-6 ${index === 1 ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
                  <p className="text-slate-600 mt-2">{pkg.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900">${pkg.price}</span>
                    <span className="text-slate-500">/month</span>
                  </div>
                  <ul className="mt-6 space-y-2 text-sm text-slate-600">
                    <li>✓ {pkg.passLimit.toLocaleString()} passes/month</li>
                    <li>✓ {pkg.programLimit} programs</li>
                    <li>✓ {pkg.staffLimit === -1 ? 'Unlimited' : pkg.staffLimit} staff accounts</li>
                    {pkg.features.filter(f => f.enabled).slice(0, 3).map(feature => (
                      <li key={feature.id}>✓ {feature.name}</li>
                    ))}
                  </ul>
                  <button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium">
                    Choose {pkg.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
