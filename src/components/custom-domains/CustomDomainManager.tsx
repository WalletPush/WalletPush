'use client'

import React, { useState, useEffect } from 'react'
import { 
  GlobeAltIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { getDNSInstructions } from '@/lib/domain-resolver'

interface CustomDomain {
  id: string
  domain: string
  domain_type: 'agency' | 'business'
  status: 'pending' | 'active' | 'failed' | 'expired'
  ssl_status: 'pending' | 'active' | 'failed'
  dns_verification_record: string
  dns_verified_at: string | null
  created_at: string
  updated_at: string
  businesses?: { id: string; name: string; slug: string }
  agency_accounts?: { id: string; name: string }
}

interface CustomDomainManagerProps {
  domainType: 'agency' | 'business'
  ownerId: string // agency_id or business_id
  ownerName: string
}

export default function CustomDomainManager({ domainType, ownerId, ownerName }: CustomDomainManagerProps) {
  const [domains, setDomains] = useState<CustomDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [newDomain, setNewDomain] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<CustomDomain | null>(null)
  const [showDNSInstructions, setShowDNSInstructions] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)

  // Load domains
  useEffect(() => {
    loadDomains()
  }, [])

  const loadDomains = async () => {
    try {
      const response = await fetch('/api/custom-domains')
      const data = await response.json()
      
      if (response.ok) {
        // Filter domains by type and owner
        const filteredDomains = data.domains.filter((domain: CustomDomain) => {
          if (domainType === 'agency') {
            return domain.domain_type === 'agency' && domain.agency_accounts?.id === ownerId
          } else {
            return domain.domain_type === 'business' && domain.businesses?.id === ownerId
          }
        })
        setDomains(filteredDomains)
      } else {
        console.error('Failed to load domains:', data.error)
      }
    } catch (error) {
      console.error('Error loading domains:', error)
    } finally {
      setLoading(false)
    }
  }

  const addDomain = async () => {
    if (!newDomain.trim()) return

    try {
      const response = await fetch('/api/custom-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain.trim(),
          domain_type: domainType,
          [domainType === 'agency' ? 'agency_id' : 'business_id']: ownerId
        })
      })

      const data = await response.json()

      if (response.ok) {
        setDomains([...domains, data.domain])
        setNewDomain('')
        setShowAddForm(false)
        setSelectedDomain(data.domain)
        setShowDNSInstructions(true)
      } else {
        alert(data.error || 'Failed to add domain')
      }
    } catch (error) {
      console.error('Error adding domain:', error)
      alert('Failed to add domain')
    }
  }

  const deleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return

    try {
      const response = await fetch(`/api/custom-domains/${domainId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDomains(domains.filter(d => d.id !== domainId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete domain')
      }
    } catch (error) {
      console.error('Error deleting domain:', error)
      alert('Failed to delete domain')
    }
  }

  const verifyDomain = async (domainId: string) => {
    setVerifying(domainId)
    
    try {
      const response = await fetch(`/api/custom-domains/${domainId}/verify`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok && data.verified) {
        // Update the domain in our state
        setDomains(domains.map(d => 
          d.id === domainId 
            ? { ...d, status: 'active', dns_verified_at: new Date().toISOString() }
            : d
        ))
        alert('Domain verified successfully!')
      } else {
        alert(data.message || 'Domain verification failed. Please check your DNS settings.')
      }
    } catch (error) {
      console.error('Error verifying domain:', error)
      alert('Failed to verify domain')
    } finally {
      setVerifying(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'failed':
        return 'Failed'
      case 'expired':
        return 'Expired'
      default:
        return 'Pending'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {domainType === 'agency' ? 'Agency' : 'Business'} Custom Domains
          </h3>
          <p className="text-sm text-gray-500">
            Configure custom domains for your {domainType === 'agency' ? 'agency portal' : 'business'}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Domain
        </button>
      </div>

      {/* Add Domain Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Domain</h4>
          <div className="flex space-x-3">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
              className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              onClick={addDomain}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewDomain('')
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Domains List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {domains.length === 0 ? (
          <div className="text-center py-12">
            <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No custom domains</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a custom domain for your {domainType}.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {domains.map((domain) => (
              <li key={domain.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <GlobeAltIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{domain.domain}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center">
                          {getStatusIcon(domain.status)}
                          <span className="ml-1 text-xs text-gray-500">
                            {getStatusText(domain.status)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {getStatusIcon(domain.ssl_status)}
                          <span className="ml-1 text-xs text-gray-500">
                            SSL {getStatusText(domain.ssl_status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {domain.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedDomain(domain)
                            setShowDNSInstructions(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Setup DNS
                        </button>
                        <button
                          onClick={() => verifyDomain(domain.id)}
                          disabled={verifying === domain.id}
                          className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                        >
                          {verifying === domain.id ? 'Verifying...' : 'Verify'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteDomain(domain.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* DNS Instructions Modal */}
      {showDNSInstructions && selectedDomain && (
        <DNSInstructionsModal
          domain={selectedDomain}
          onClose={() => {
            setShowDNSInstructions(false)
            setSelectedDomain(null)
          }}
          onVerify={() => verifyDomain(selectedDomain.id)}
          verifying={verifying === selectedDomain.id}
        />
      )}
    </div>
  )
}

// DNS Instructions Modal Component
function DNSInstructionsModal({ 
  domain, 
  onClose, 
  onVerify, 
  verifying 
}: { 
  domain: CustomDomain
  onClose: () => void
  onVerify: () => void
  verifying: boolean
}) {
  const [showVerificationRecord, setShowVerificationRecord] = useState(false)
  const dnsInstructions = getDNSInstructions(domain.domain, domain.domain_type)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              DNS Setup for {domain.domain}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Steps */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Follow these steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                {dnsInstructions.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>

            {/* DNS Records */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">DNS Records to Add:</h4>
              <div className="space-y-3">
                {dnsInstructions.instructions.map((instruction, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {instruction.type} Record
                      </span>
                      <button
                        onClick={() => copyToClipboard(instruction.value)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div><strong>Name:</strong> {instruction.name}</div>
                      <div><strong>Value:</strong> 
                        <code className="ml-1 bg-gray-200 px-1 rounded">
                          {instruction.value}
                        </code>
                      </div>
                      <div className="text-gray-500">{instruction.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Record */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-yellow-800">Verification Record</h4>
                <button
                  onClick={() => setShowVerificationRecord(!showVerificationRecord)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  {showVerificationRecord ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
              {showVerificationRecord && (
                <div className="text-xs text-yellow-700">
                  <code className="bg-yellow-100 px-2 py-1 rounded">
                    {domain.dns_verification_record}
                  </code>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
              <button
                onClick={onVerify}
                disabled={verifying}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {verifying ? 'Verifying...' : 'Verify Domain'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}







