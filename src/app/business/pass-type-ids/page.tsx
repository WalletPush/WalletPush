'use client'

import React, { useState, useEffect } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'

interface PassTypeID {
  id: string
  identifier: string
  description: string
  team_identifier: string
  organization_name: string
  certificate_file_name: string
  certificate_file_path?: string
  certificate_password?: string
  certificate_expiry: string
  status: 'active' | 'expired' | 'pending'
  is_default: boolean
  is_global?: boolean
  created_at: string
  updated_at: string
}

interface CertificateUpload {
  file: File | null
  password: string
  description: string
}

export default function PassTypeIDsPage() {
  const [passTypeIDs, setPassTypeIDs] = useState<PassTypeID[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadForm, setUploadForm] = useState<CertificateUpload>({
    file: null,
    password: '',
    description: ''
  })
  const [isUploading, setIsUploading] = useState(false)

  // Load Pass Type IDs from API
  const loadPassTypeIDs = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      console.log('🔍 Loading Pass Type IDs...')
      const response = await fetch('/api/pass-type-ids?t=' + Date.now())
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📋 API Response:', data)
      
      if (data.passTypeIds && Array.isArray(data.passTypeIds)) {
        // Filter out global Pass Type IDs from dashboard display
        const businessPassTypeIds = data.passTypeIds.filter(passType => !passType.is_global)
        setPassTypeIDs(businessPassTypeIds)
        console.log(`✅ Loaded ${businessPassTypeIds.length} business Pass Type IDs (hiding ${data.passTypeIds.length - businessPassTypeIds.length} global)`)
      } else {
        console.warn('⚠️ Invalid response structure:', data)
        setPassTypeIDs([])
      }
      
    } catch (error) {
      console.error('❌ Failed to load Pass Type IDs:', error)
      setError(`Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setPassTypeIDs([])
    } finally {
      setIsLoading(false)
    }
  }

  // Upload new certificate
  const handleUploadCertificate = async () => {
    if (!uploadForm.file || !uploadForm.password) {
      setError('Please select a certificate file and enter the password')
      return
    }

    try {
      setIsUploading(true)
      setError('')
      
      console.log('📤 Uploading certificate:', uploadForm.file.name)
      
      const formData = new FormData()
      formData.append('certificate', uploadForm.file)
      formData.append('password', uploadForm.password)
      formData.append('description', uploadForm.description || 'Uploaded Certificate')
      
      const response = await fetch('/api/pass-type-ids', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Upload failed: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ Certificate uploaded successfully:', result)
      
      // Reset form and close modal
      setUploadForm({ file: null, password: '', description: '' })
      setShowUploadForm(false)
      
      // Reload Pass Type IDs
      await loadPassTypeIDs()
      
    } catch (error) {
      console.error('❌ Certificate upload failed:', error)
      setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    loadPassTypeIDs()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pass Type IDs</h1>
          <p className="text-slate-600 mt-1">Manage your Apple PassKit certificates for pass creation and distribution</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadPassTypeIDs}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            🔄 Refresh Data
          </button>
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            New Pass Type ID
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
          <p className="text-slate-600 mt-4">Loading Pass Type IDs...</p>
        </div>
      ) : passTypeIDs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Business Pass Type IDs</h3>
          <p className="text-slate-600 mb-4">You can create passes using the global WalletPush certificate, or upload your own Apple PassKit certificate for custom branding</p>
          <button
            onClick={() => setShowUploadForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            Upload Certificate
          </button>
        </div>
      ) : (
        /* Pass Type IDs Table */
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pass Type ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {passTypeIDs.map((passType) => (
                <tr key={passType.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{passType.identifier}</div>
                        {passType.is_default && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{passType.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{passType.organization_name || 'Not Set'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{passType.team_identifier}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{passType.certificate_file_name}</div>
                    {passType.certificate_file_path && (
                      <div className="text-xs text-green-600">✅ Stored</div>
                    )}
                    {!passType.certificate_file_path && (
                      <div className="text-xs text-red-600">❌ Missing</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{passType.certificate_expiry}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      passType.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : passType.status === 'expired'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {passType.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newDescription = prompt('Edit description:', passType.description)
                          if (newDescription && newDescription !== passType.description) {
                            // Update description locally (real API update would go here)
                            setPassTypeIDs(prev => prev.map(p => 
                              p.id === passType.id 
                                ? { ...p, description: newDescription }
                                : p
                            ))
                            console.log(`✏️ Updated description for ${passType.id}:`, newDescription)
                          }
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Pass Type ID"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete "${passType.description}"?\n\nThis action cannot be undone.`)) {
                            try {
                              const response = await fetch(`/api/pass-type-ids/${passType.id}`, {
                                method: 'DELETE',
                              })

                              if (response.ok) {
                                // Remove from local state
                                setPassTypeIDs(prev => prev.filter(p => p.id !== passType.id))
                                console.log(`✅ Deleted Pass Type ID from database:`, passType.id)
                              } else {
                                const error = await response.json()
                                console.error('❌ Delete failed:', error)
                                alert(`Failed to delete: ${error.error || 'Unknown error'}`)
                              }
                            } catch (error) {
                              console.error('❌ Delete error:', error)
                              alert('Failed to delete Pass Type ID')
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Pass Type ID"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Certificate Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Certificate</h3>
              
              <div className="space-y-4">
                {/* Certificate File */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate File (.p12)
                  </label>
                  <input
                    type="file"
                    accept=".p12,.pfx"
                    onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Password
                  </label>
                  <input
                    type="password"
                    value={uploadForm.password}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, password: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Enter certificate password"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="e.g., Production Certificate"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUploadForm(false)}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadCertificate}
                  disabled={isUploading || !uploadForm.file || !uploadForm.password}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
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