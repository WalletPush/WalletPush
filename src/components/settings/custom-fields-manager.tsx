'use client'

import React, { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface CustomField {
  id: string
  field_key: string
  field_label: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea' | 'email' | 'phone'
  applies_to: 'customer' | 'member' | 'pass'
  is_required: boolean
  created_at: string
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'boolean', label: 'Boolean' }
]

const APPLIES_TO_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'member', label: 'Member' },
  { value: 'pass', label: 'Pass' }
]

export default function CustomFieldsManager() {
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'customer' | 'member' | 'pass'>('customer')

  const [formData, setFormData] = useState({
    field_label: '',
    field_type: 'text' as const,
    applies_to: 'customer' as const,
    is_required: false
  })

  const loadCustomFields = async () => {
    try {
      const response = await fetch(`/api/business/custom-fields?applies_to=${selectedTab}`)
      if (response.ok) {
        const data = await response.json()
        setCustomFields(data.data || [])
      }
    } catch (error) {
      console.error('Error loading custom fields:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      field_label: '',
      field_type: 'text',
      applies_to: selectedTab as "customer",
      is_required: false
    })
  }

  const generateFieldKey = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)
  }

  const handleCreateField = async () => {
    if (!formData.field_label.trim()) {
      alert('Field label is required')
      return
    }

    setIsCreating(true)
    
    try {
      const field_key = generateFieldKey(formData.field_label)
      
      const payload = {
        field_key,
        field_label: formData.field_label,
        field_type: formData.field_type,
        applies_to: formData.applies_to,
        is_required: formData.is_required,
        field_options: [],
        help_text: '',
        placeholder_text: '',
        default_value: '',
        is_searchable: false
      }

      const response = await fetch('/api/business/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await loadCustomFields()
        setShowCreateModal(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create custom field')
      }
    } catch (error: any) {
      console.error('Error creating custom field:', error)
      alert(error.message || 'Failed to create custom field')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteField = async (field: CustomField) => {
    if (!confirm(`Are you sure you want to delete "${field.field_label}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/business/custom-fields/${field.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadCustomFields()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete custom field')
      }
    } catch (error: any) {
      console.error('Error deleting custom field:', error)
      alert(error.message || 'Failed to delete custom field')
    }
  }

  useEffect(() => {
    loadCustomFields()
  }, [selectedTab])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Custom Fields</h2>
          <p className="text-slate-600 mt-1">
            Create custom fields to collect additional information from your customers
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowCreateModal(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          New Field
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        {APPLIES_TO_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedTab(option.value as 'customer' | 'member' | 'pass')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === option.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Custom Fields List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-500 mt-2">Loading custom fields...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {customFields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No custom fields yet</h3>
              <p className="text-slate-500 mb-4">
                Create your first custom field to collect additional information from your {selectedTab}s.
              </p>
              <button
                onClick={() => {
                  resetForm()
                  setShowCreateModal(true)
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create First Field
              </button>
            </div>
          ) : (
            customFields.map((field) => (
              <div key={field.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Field Header */}
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-slate-900 text-lg">{field.field_label}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {field.field_type}
                      </span>
                      {field.is_required && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          Required
                        </span>
                      )}
                    </div>

                    {/* Field Details */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4 text-sm">
                        <div>
                          <span className="text-slate-500">Key:</span>
                          <code className="ml-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-mono">
                            {field.field_key}
                          </code>
                        </div>
                        <div>
                          <span className="text-slate-500">Applies to:</span>
                          <span className="ml-1 capitalize font-medium text-slate-700">{field.applies_to}</span>
                        </div>
                      </div>

                      {/* Field Type Description */}
                      <div className="text-sm text-slate-600">
                        {field.field_type === 'text' && (
                          <span>📝 Single line text input</span>
                        )}
                        {field.field_type === 'textarea' && (
                          <span>📄 Multi-line text input</span>
                        )}
                        {field.field_type === 'number' && (
                          <span>🔢 Numeric input only</span>
                        )}
                        {field.field_type === 'email' && (
                          <span>📧 Email address validation</span>
                        )}
                        {field.field_type === 'phone' && (
                          <span>📞 Phone number input</span>
                        )}
                        {field.field_type === 'date' && (
                          <span>📅 Date picker</span>
                        )}
                        {field.field_type === 'select' && (
                          <span>📋 Dropdown selection</span>
                        )}
                        {field.field_type === 'boolean' && (
                          <span>☑️ Checkbox (yes/no)</span>
                        )}
                      </div>

                      {/* Created Date */}
                      <div className="text-xs text-slate-400">
                        Created on {new Date(field.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleDeleteField(field)}
                      className="text-slate-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
                      title="Delete field"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Field Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all scale-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Create Custom Field</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-4 py-4 space-y-3">
              {/* Field Label */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Field Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.field_label}
                  onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                  placeholder="e.g., Membership Tier"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Field Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Field Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.field_type}
                  onChange={(e) => setFormData({ ...formData, field_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Applies To */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Applies To <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.applies_to}
                  onChange={(e) => setFormData({ ...formData, applies_to: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {APPLIES_TO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Required Field */}
              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="mr-2 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_required" className="text-sm text-slate-700">
                  Required field
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-2 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
                className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateField}
                disabled={isCreating || !formData.field_label.trim()}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create Field'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
