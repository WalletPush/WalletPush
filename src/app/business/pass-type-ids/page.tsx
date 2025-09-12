'use client'

import React, { useState, useEffect, useRef } from 'react'
import { PlusIcon, DocumentIcon, TrashIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline'

interface PassTypeID {
  id: string
  identifier: string // e.g., pass.com.walletpush.loyalty
  description: string
  team_identifier: string // Apple Developer Team ID
  certificate_file_name: string
  certificate_expiry: string
  status: 'active' | 'expired' | 'pending'
  is_default: boolean
  created_at: string
  updated_at: string
}

interface CertificateUpload {
  file: File | null
  password: string
  identifier: string
  description: string
  teamIdentifier: string
}

export default function PassTypeIDsPage() {
  const [passTypeIDs, setPassTypeIDs] = useState<PassTypeID[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState<CertificateUpload>({
    file: null,
    password: '',
    identifier: '',
    description: '',
    teamIdentifier: ''
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing Pass Type IDs
  useEffect(() => {
    loadPassTypeIDs()
  }, [])

  const loadPassTypeIDs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pass-type-ids')
      const data = await response.json()
      
      if (data.success) {
        setPassTypeIDs(data.passTypeIDs || [])
      }
    } catch (error) {
      console.error('Error loading Pass Type IDs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.name.endsWith('.p12') || file.name.endsWith('.pfx')) {
        setUploadData(prev => ({ ...prev, file }))
        setUploadError('')
      } else {
        setUploadError('Please select a valid .p12 or .pfx certificate file')
        event.target.value = ''
      }
    }
  }

  const handleUpload = async () => {
    if (!uploadData.file) {
      setUploadError('Please select a certificate file')
      return
    }
    
    if (!uploadData.password) {
      setUploadError('Please enter the certificate password')
      return
    }

    if (!uploadData.identifier) {
      setUploadError('Please enter the Pass Type Identifier')
      return
    }

    if (!uploadData.description) {
      setUploadError('Please enter a description')
      return
    }

    if (!uploadData.teamIdentifier) {
      setUploadError('Please enter your Apple Team Identifier')
      return
    }

    setIsUploading(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('certificate', uploadData.file)
      formData.append('password', uploadData.password)
      formData.append('identifier', uploadData.identifier)
      formData.append('description', uploadData.description)
      formData.append('teamIdentifier', uploadData.teamIdentifier)

      const response = await fetch('/api/pass-type-ids', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        await loadPassTypeIDs() // Reload the list
        setShowUploadModal(false)
        setUploadData({
          file: null,
          password: '',
          identifier: '',
          description: '',
          teamIdentifier: ''
        })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setUploadError(result.error || 'Failed to upload certificate')
      }
    } catch (error) {
      console.error('Error uploading certificate:', error)
      setUploadError('Failed to upload certificate. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Pass Type ID? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/pass-type-ids/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        await loadPassTypeIDs() // Reload the list
      } else {
        alert(result.error || 'Failed to delete Pass Type ID')
      }
    } catch (error) {
      console.error('Error deleting Pass Type ID:', error)
      alert('Failed to delete Pass Type ID. Please try again.')
    }
  }

  const setAsDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/pass-type-ids/${id}/set-default`, {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        await loadPassTypeIDs() // Reload the list
      } else {
        alert(result.error || 'Failed to set as default')
      }
    } catch (error) {
      console.error('Error setting default:', error)
      alert('Failed to set as default. Please try again.')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'expired':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'expired':
        return 'Expired'
      case 'pending':
        return 'Pending'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pass Type IDs</h1>
          <p className="text-slate-600 mt-1">
            Manage your Apple PassKit certificates for pass creation and distribution
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4" />
          New Pass Type ID
        </button>
      </div>

      {/* Warning Message */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">Important Notice</h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>For production use, you are strongly encouraged to use your own Pass Type ID. You need an iOS Developer Account.</p>
              <p className="mt-1">
                <strong>You have reached the maximum amount of pass type ids you can manage.</strong> Please contact support if you need to manage more certificates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pass Type IDs Table */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Your Pass Type IDs</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Pass Type ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Team Identifier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Certificate Expiration
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Loading Pass Type IDs...
                  </td>
                </tr>
              ) : passTypeIDs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <DocumentIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Pass Type IDs</h3>
                    <p className="text-slate-500 mb-4">
                      Upload your first Apple PassKit certificate to start creating passes
                    </p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Upload Certificate
                    </button>
                  </td>
                </tr>
              ) : (
                passTypeIDs.map((passTypeID) => (
                  <tr key={passTypeID.id} className={passTypeID.is_default ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {passTypeID.identifier}
                            {passTypeID.is_default && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500">{passTypeID.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      WalletPush
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {passTypeID.team_identifier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {new Date(passTypeID.certificate_expiry).toLocaleDateString()} 
                      <div className="text-xs text-slate-500">
                        in {Math.ceil((new Date(passTypeID.certificate_expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(passTypeID.status)}
                        <span className={`text-sm font-medium ${
                          passTypeID.status === 'active' ? 'text-green-700' :
                          passTypeID.status === 'expired' ? 'text-red-700' :
                          'text-yellow-700'
                        }`}>
                          {getStatusText(passTypeID.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {!passTypeID.is_default && (
                          <button
                            onClick={() => setAsDefault(passTypeID.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(passTypeID.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Upload New Pass Type ID</h2>
            
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Certificate File (.p12)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".p12,.pfx"
                  onChange={handleFileSelect}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {uploadData.file && (
                  <p className="text-sm text-green-600 mt-1">
                    Selected: {uploadData.file.name}
                  </p>
                )}
              </div>

              {/* Certificate Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Keychain Password
                </label>
                <input
                  type="password"
                  value={uploadData.password}
                  onChange={(e) => setUploadData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter certificate password"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Pass Type Identifier */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Pass Type Identifier
                </label>
                <input
                  type="text"
                  value={uploadData.identifier}
                  onChange={(e) => setUploadData(prev => ({ ...prev, identifier: e.target.value }))}
                  placeholder="pass.com.yourcompany.yourpass"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Loyalty Program Pass"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Team Identifier */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Apple Team Identifier
                </label>
                <input
                  type="text"
                  value={uploadData.teamIdentifier}
                  onChange={(e) => setUploadData(prev => ({ ...prev, teamIdentifier: e.target.value }))}
                  placeholder="ABC123DEF4"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Find this in your Apple Developer account under Membership
                </p>
              </div>

              {/* Error Message */}
              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
