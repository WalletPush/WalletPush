'use client'

import React, { useState, useEffect } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'

interface GlobalPassTypeID {
  id: string
  label: string
  pass_type_identifier: string
  team_id: string
  p12_path: string
  is_validated: boolean
  created_at: string
  updated_at: string
}

interface GlobalCertificateUpload {
  file: File | null
  password: string
  description: string
  pass_type_identifier: string
  team_id: string
}

interface WWDRCertificateUpload {
  file: File | null
  description: string
}

export default function GlobalPassTypeIDAdmin() {
  const [globalPassTypeIDs, setGlobalPassTypeIDs] = useState<GlobalPassTypeID[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadForm, setUploadForm] = useState<GlobalCertificateUpload>({
    file: null,
    password: '',
    description: '',
    pass_type_identifier: '',
    team_id: ''
  })
  const [isUploading, setIsUploading] = useState(false)
  const [showWWDRUploadForm, setShowWWDRUploadForm] = useState(false)
  const [wwdrUploadForm, setWWDRUploadForm] = useState<WWDRCertificateUpload>({
    file: null,
    description: 'Apple WWDR G4 Certificate (exported from Keychain)'
  })
  const [isUploadingWWDR, setIsUploadingWWDR] = useState(false)

  // Load Global Pass Type IDs from API
  const loadGlobalPassTypeIDs = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      console.log('🔍 Loading Global Pass Type IDs...')
      const response = await fetch('/api/admin/global-pass-type-id?t=' + Date.now())
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📋 API Response:', data)
      
      if (data.globalPassTypeIds && Array.isArray(data.globalPassTypeIds)) {
        setGlobalPassTypeIDs(data.globalPassTypeIds)
        console.log(`✅ Loaded ${data.globalPassTypeIds.length} Global Pass Type IDs`)
      } else {
        console.warn('⚠️ Invalid response structure:', data)
        setGlobalPassTypeIDs([])
      }
      
    } catch (error) {
      console.error('❌ Failed to load Global Pass Type IDs:', error)
      setError(`Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setGlobalPassTypeIDs([])
    } finally {
      setIsLoading(false)
    }
  }

  // Upload new global certificate
  const handleUploadGlobalCertificate = async () => {
    if (!uploadForm.file || !uploadForm.password || !uploadForm.pass_type_identifier || !uploadForm.team_id) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setIsUploading(true)
      setError('')
      
      console.log('📤 Uploading global certificate:', uploadForm.file.name)
      
      const formData = new FormData()
      formData.append('certificate', uploadForm.file)
      formData.append('password', uploadForm.password)
      formData.append('description', uploadForm.description || 'Global WalletPush Certificate')
      formData.append('pass_type_identifier', uploadForm.pass_type_identifier)
      formData.append('team_id', uploadForm.team_id)
      
      const response = await fetch('/api/admin/global-pass-type-id', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Upload failed: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ Global certificate uploaded successfully:', result)
      
      // Reset form and close modal
      setUploadForm({ 
        file: null, 
        password: '', 
        description: '',
        pass_type_identifier: '',
        team_id: '' 
      })
      setShowUploadForm(false)
      
      // Reload Global Pass Type IDs
      await loadGlobalPassTypeIDs()
      
    } catch (error) {
      console.error('❌ Global certificate upload failed:', error)
      setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Handle WWDR Certificate Upload
  const handleWWDRUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!wwdrUploadForm.file) {
      setError('Please select a WWDR certificate file (.cer)')
      return
    }

    try {
      setIsUploadingWWDR(true)
      setError('')

      const formData = new FormData()
      formData.append('wwdr_certificate', wwdrUploadForm.file)
      formData.append('description', wwdrUploadForm.description)

      console.log('🚀 Uploading WWDR certificate...')
      const response = await fetch('/api/admin/wwdr-certificate', {
        method: 'POST',
        body: formData
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const responseText = await response.text()
        console.log('❌ Error response text:', responseText)
        
        try {
          const errorData = JSON.parse(responseText)
          throw new Error(errorData.error || 'WWDR upload failed')
        } catch (parseError) {
          console.error('❌ Failed to parse error response as JSON:', parseError)
          throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Response: ${responseText.substring(0, 200)}...`)
        }
      }

      const responseText = await response.text()
      console.log('✅ Success response text:', responseText)
      
      try {
        const result = JSON.parse(responseText)
        console.log('✅ WWDR certificate uploaded:', result)
        
        // Reset form and close
        setWWDRUploadForm({
          file: null,
          description: 'Apple WWDR G4 Certificate (exported from Keychain)'
        })
        setShowWWDRUploadForm(false)
        
        // Show success message
        alert('✅ WWDR Certificate uploaded successfully!')
      } catch (parseError) {
        console.error('❌ Failed to parse success response as JSON:', parseError)
        throw new Error(`Server returned invalid JSON. Response: ${responseText.substring(0, 200)}...`)
      }
      
    } catch (error) {
      console.error('❌ WWDR certificate upload failed:', error)
      setError(`WWDR Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploadingWWDR(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    loadGlobalPassTypeIDs()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🔐 Admin: Global Pass Type IDs</h1>
          <p className="text-slate-600 mt-1">Manage global Apple PassKit certificates that all WalletPush accounts can use</p>
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              ⚠️ <strong>Admin Only:</strong> These certificates are shared across all WalletPush accounts. Only upload trusted, production-ready certificates.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadGlobalPassTypeIDs}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            🔄 Refresh Data
          </button>
          <button
            onClick={() => setShowWWDRUploadForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            🔐 Upload WWDR Certificate
          </button>
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <PlusIcon className="w-4 h-4" />
            Upload Global Certificate
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="text-slate-600 mt-4">Loading Global Pass Type IDs...</p>
        </div>
      ) : globalPassTypeIDs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Global Pass Type IDs</h3>
          <p className="text-slate-600 mb-4">Upload the first global Apple PassKit certificate for all WalletPush accounts</p>
          <button
            onClick={() => setShowUploadForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <PlusIcon className="w-4 h-4" />
            Upload Global Certificate
          </button>
        </div>
      ) : (
        /* Global Pass Type IDs Table */
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pass Type Identifier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {globalPassTypeIDs.map((passType) => (
                <tr key={passType.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{passType.pass_type_identifier}</div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Global
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{passType.label}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{passType.team_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{passType.p12_path?.split('/').pop() || 'Not uploaded'}</div>
                    <div className="text-xs text-green-600">✅ Stored</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      passType.is_validated 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {passType.is_validated ? 'active' : 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(passType.created_at).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Global Certificate Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Global Certificate</h3>
              
              <div className="space-y-4">
                {/* Certificate File */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate File (.p12) *
                  </label>
                  <input
                    type="file"
                    accept=".p12,.pfx"
                    onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Password *
                  </label>
                  <input
                    type="password"
                    value={uploadForm.password}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, password: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Enter certificate password"
                  />
                </div>

                {/* Pass Type Identifier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pass Type Identifier *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.pass_type_identifier}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, pass_type_identifier: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="e.g., pass.com.walletpush.global"
                  />
                </div>

                {/* Team ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apple Team ID *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.team_id}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, team_id: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="e.g., ABC123DEF4"
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
                    placeholder="e.g., Global Production Certificate"
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
                  onClick={handleUploadGlobalCertificate}
                  disabled={isUploading || !uploadForm.file || !uploadForm.password || !uploadForm.pass_type_identifier || !uploadForm.team_id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload Global'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WWDR Certificate Upload Form */}
      {showWWDRUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🔐 Upload Apple WWDR Certificate
              </h3>
              
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-800 text-sm">
                  <strong>Important:</strong> Export the Apple Worldwide Developer Relations Certificate from your Keychain Access as a .cer file. This must be the certificate from YOUR keychain, not downloaded from Apple.
                </p>
              </div>

              <form onSubmit={handleWWDRUpload} className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WWDR Certificate File (.cer) *
                  </label>
                  <input
                    type="file"
                    accept=".cer,.crt"
                    onChange={(e) => setWWDRUploadForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={wwdrUploadForm.description}
                    onChange={(e) => setWWDRUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="e.g., Apple WWDR G4 Certificate"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowWWDRUploadForm(false)}
                    disabled={isUploadingWWDR}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingWWDR || !wwdrUploadForm.file}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    {isUploadingWWDR ? 'Uploading...' : 'Upload WWDR Certificate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
