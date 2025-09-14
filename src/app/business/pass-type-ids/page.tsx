'use client'

import React, { useState, useEffect } from 'react'
import { PlusIcon, ShieldCheckIcon, BuildingOfficeIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

interface PassTypeID {
  id: string
  label?: string
  pass_type_identifier?: string
  identifier?: string
  description?: string
  team_id?: string
  team_identifier?: string
  organization_name?: string
  certificate_file_name?: string
  certificate_file_path?: string
  certificate_password?: string
  certificate_expiry?: string
  status?: 'active' | 'expired' | 'pending'
  is_default?: boolean
  is_global?: boolean
  is_validated?: boolean
  created_at: string
  updated_at?: string
  source: 'assigned' | 'owned' | 'global'
  assigned_by?: string
  assigned_by_type?: string
  assignment_id?: string
  assignment_date?: string
}

interface PassTypeIDResponse {
  assigned: PassTypeID[]
  owned: PassTypeID[]
  global: PassTypeID[]
  passTypeIds: PassTypeID[]
}

interface CertificateUpload {
  file: File | null
  password: string
  description: string
}

export default function PassTypeIDsPage() {
  const [assignedPassTypes, setAssignedPassTypes] = useState<PassTypeID[]>([])
  const [ownedPassTypes, setOwnedPassTypes] = useState<PassTypeID[]>([])
  const [globalPassTypes, setGlobalPassTypes] = useState<PassTypeID[]>([])
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
      const response = await fetch('/api/business/pass-type-ids?t=' + Date.now())
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data: PassTypeIDResponse = await response.json()
      console.log('📋 API Response:', data)
      
      setAssignedPassTypes(data.assigned || [])
      setOwnedPassTypes(data.owned || [])
      setGlobalPassTypes(data.global || [])
      
      console.log(`✅ Loaded Pass Type IDs - Assigned: ${data.assigned?.length || 0}, Owned: ${data.owned?.length || 0}, Global: ${data.global?.length || 0}`)
      
    } catch (error) {
      console.error('❌ Failed to load Pass Type IDs:', error)
      setError(`Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setAssignedPassTypes([])
      setOwnedPassTypes([])
      setGlobalPassTypes([])
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

  // Helper function to render a Pass Type ID card
  const renderPassTypeCard = (passType: PassTypeID, canEdit: boolean = false) => {
    const identifier = passType.pass_type_identifier || passType.identifier || 'Unknown'
    const label = passType.label || passType.description || 'Unnamed Certificate'
    const teamId = passType.team_id || passType.team_identifier || 'Unknown'
    
    return (
      <div key={passType.id} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{label}</h3>
            <p className="text-sm text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded">{identifier}</p>
          </div>
          {passType.is_validated && (
            <ShieldCheckIcon className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" title="Validated Certificate" />
          )}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Team ID:</span>
            <span className="text-slate-900 font-mono">{teamId}</span>
          </div>
          
          {passType.source === 'assigned' && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-500">Provided by:</span>
                <span className="text-slate-900">{passType.assigned_by}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assignment Date:</span>
                <span className="text-slate-900">{new Date(passType.assignment_date!).toLocaleDateString()}</span>
              </div>
            </>
          )}
          
          <div className="flex justify-between">
            <span className="text-slate-500">Created:</span>
            <span className="text-slate-900">{new Date(passType.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Edit
            </button>
            <button className="text-sm text-red-600 hover:text-red-800 font-medium">
              Delete
            </button>
          </div>
        )}
      </div>
    )
  }

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
            Upload Certificate
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
      ) : (
        <div className="space-y-8">
          {/* Assigned Pass Type IDs */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">Assigned Certificates</h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {assignedPassTypes.length}
              </span>
            </div>
            <p className="text-slate-600 mb-6">
              These Pass Type IDs have been assigned to your business. You can use them to create passes but cannot modify or delete them.
            </p>
            
            {assignedPassTypes.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                <BuildingOfficeIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Assigned Certificates</h3>
                <p className="text-slate-600">No Pass Type IDs have been assigned to your business yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedPassTypes.map(passType => renderPassTypeCard(passType, false))}
              </div>
            )}
          </section>

          {/* Owned Pass Type IDs */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheckIcon className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-slate-900">Your Certificates</h2>
              <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {ownedPassTypes.length}
              </span>
            </div>
            <p className="text-slate-600 mb-6">
              These are Pass Type IDs that you've uploaded yourself. You have full control to edit, delete, or manage these certificates.
            </p>
            
            {ownedPassTypes.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                <ShieldCheckIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Personal Certificates</h3>
                <p className="text-slate-600 mb-4">Upload your own Apple PassKit certificate for custom branding and full control.</p>
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Upload Certificate
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedPassTypes.map(passType => renderPassTypeCard(passType, true))}
              </div>
            )}
          </section>

          {/* Global Pass Type IDs */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <GlobeAltIcon className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-slate-900">Global Certificates</h2>
              <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {globalPassTypes.length}
              </span>
            </div>
            <p className="text-slate-600 mb-6">
              These are global Pass Type IDs provided by the platform. Perfect for getting started quickly without needing your own Apple Developer certificate.
            </p>
            
            {globalPassTypes.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                <GlobeAltIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Global Certificates</h3>
                <p className="text-slate-600">No global certificates are currently available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {globalPassTypes.map(passType => renderPassTypeCard(passType, false))}
              </div>
            )}
          </section>
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