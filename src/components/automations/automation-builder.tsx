'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { 
  XMarkIcon,
  PlusIcon,
  SparklesIcon,
  BellIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
  PencilSquareIcon,
  CheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface Automation {
  id: string
  name: string
  description?: string
  status: 'draft' | 'published' | 'paused'
  trigger_type: string
  trigger_config: any
  conditions: any[]
  actions: any[]
  template_id?: string
  total_enrolled: number
  active_enrolled: number
  total_executions: number
  created_at: string
  updated_at: string
  last_executed_at?: string
}

interface Template {
  id: string
  program_id: string
  version: number
  template_json: any
  pass_type_identifier: string
  programs: {
    id: string
    name: string
  }
}

interface AutomationBuilderProps {
  isOpen: boolean
  onClose: () => void
  automation?: Automation | null
  onSave: (automation: Automation) => void
}

const TRIGGER_TYPES = [
  { value: 'pass.created', label: 'Pass Created', description: 'When a new pass is generated' },
  { value: 'pass.downloaded', label: 'Pass Downloaded', description: 'When pass is added to wallet' },
  { value: 'registration.created', label: 'Registration Created', description: 'When device registers for updates' },
  { value: 'scan.performed', label: 'Scan Performed', description: 'When barcode/QR is scanned' },
  { value: 'custom_field_updated', label: 'Custom Field Updated', description: 'When custom field changes' },
]

const ACTION_TYPES = [
  { 
    value: 'send_push_notification', 
    label: 'Send Push Notification', 
    icon: BellIcon,
    color: 'bg-blue-100 text-blue-600'
  },
  { 
    value: 'send_email', 
    label: 'Send Email', 
    icon: EnvelopeIcon,
    color: 'bg-green-100 text-green-600'
  },
  { 
    value: 'update_custom_field', 
    label: 'Update Custom Field', 
    icon: PencilSquareIcon,
    color: 'bg-purple-100 text-purple-600'
  },
  { 
    value: 'add_points', 
    label: 'Add Points', 
    icon: CurrencyDollarIcon,
    color: 'bg-yellow-100 text-yellow-600'
  },
]

export default function AutomationBuilder({ isOpen, onClose, automation, onSave }: AutomationBuilderProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: '',
    trigger_config: {},
    conditions: [] as any[],
    actions: [] as any[],
    template_id: '',
    status: 'draft' as 'draft' | 'published' | 'paused'
  })

  const [isLoading, setIsLoading] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Fetch templates when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen])

  useEffect(() => {
    if (automation) {
      setFormData({
        name: automation.name || '',
        description: automation.description || '',
        trigger_type: automation.trigger_type || '',
        trigger_config: automation.trigger_config || {},
        conditions: automation.conditions || [] as any[],
        actions: automation.actions || [] as any[],
        template_id: automation.template_id || '',
        status: automation.status || 'draft'
      })
    } else {
      setFormData({
        name: '',
        description: '',
        trigger_type: '',
        trigger_config: {},
        conditions: [] as any[],
        actions: [] as any[],
        template_id: '',
        status: 'draft'
      })
    }
  }, [automation])

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const response = await fetch('/api/templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.trigger_type || !formData.template_id) return

    setIsLoading(true)
    try {
      const url = automation 
        ? `/api/business/automations/${automation.id}`
        : '/api/business/automations'
      
      const method = automation ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save automation')
      }

      const { automation: savedAutomation } = await response.json()
      toast.success(`Automation ${automation ? 'updated' : 'created'} successfully!`)
      onSave(savedAutomation)
      onClose()
    } catch (error) {
      console.error('Error saving automation:', error)
      toast.error('Failed to save automation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const addAction = (actionType: string) => {
    const newAction = {
      type: actionType,
      config: getDefaultActionConfig(actionType)
    }
    setFormData({
      ...formData,
      actions: [...formData.actions, newAction] as any[]
    })
  }

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    })
  }

  const updateAction = (index: number, config: any) => {
    const updatedActions = [...formData.actions]
    updatedActions[index] = { ...updatedActions[index], config }
    setFormData({
      ...formData,
      actions: updatedActions as any[]
    })
  }

  const getDefaultActionConfig = (actionType: string) => {
    switch (actionType) {
      case 'send_push_notification':
        return {
          field_key: '',
          message: 'Your pass is ready for use',
          delay: 0
        }
      case 'send_email':
        return {
          subject: 'Welcome!',
          template: 'welcome_email',
          delay: 0
        }
      case 'update_custom_field':
        return {
          field_key: '',
          value: '',
          operation: 'set'
        }
      case 'add_points':
        return {
          points: 100,
          reason: 'Welcome bonus'
        }
      default:
        return {}
    }
  }

  const renderActionConfig = (action: any, index: number) => {
    const { type, config } = action

    switch (type) {
      case 'send_push_notification':
        const selectedTemplate = templates.find(t => t.id === formData.template_id)
        
        // Extract fields from template_json or passkit_json
        const getTemplatePlaceholders = (template: any) => {
          const placeholders: Array<{key: string, label: string, type: string}> = []
          
          if (!template) return placeholders
          
          // Try passkit_json first (this is what Apple Wallet uses)
          if (template.passkit_json) {
            const passkitJson = template.passkit_json
            
            // Check for storeCard structure
            if (passkitJson.storeCard) {
              const sections = ['headerFields', 'primaryFields', 'secondaryFields', 'auxiliaryFields', 'backFields']
              sections.forEach(section => {
                if (passkitJson.storeCard[section]) {
                  passkitJson.storeCard[section].forEach((field: any) => {
                    if (field.key && field.label) {
                      placeholders.push({
                        key: field.key,
                        label: field.label,
                        type: 'text'
                      })
                    }
                  })
                }
              })
            }
          }
          
          // Fallback to template_json if no passkit_json fields found
          if (placeholders.length === 0 && template.template_json) {
            const templateJson = template.template_json
            
            // Check for storeCard structure in template_json
            if (templateJson.storeCard) {
              const sections = ['headerFields', 'primaryFields', 'secondaryFields', 'auxiliaryFields', 'backFields']
              sections.forEach(section => {
                if (templateJson.storeCard[section]) {
                  templateJson.storeCard[section].forEach((field: any) => {
                    if (field.key && field.label) {
                      placeholders.push({
                        key: field.key,
                        label: field.label,
                        type: 'text'
                      })
                    }
                  })
                }
              })
            }
          }
          
          return placeholders
        }
        
        const templateFields = getTemplatePlaceholders(selectedTemplate)
        
        return (
          <div className="space-y-4">
            {/* Pass Field Update - MANDATORY */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Pass Field <span className="text-red-500">*</span>
              </label>
              <div className="text-xs text-gray-500 mb-2">
                Select which pass field to update and the message to send
              </div>
              
              {!selectedTemplate ? (
                <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
                  Select a template above to see available pass fields
                </div>
              ) : templateFields.length === 0 ? (
                <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded-md">
                  No fields available in selected template
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pass Field</label>
                    <select
                      value={config.field_key || ''}
                      onChange={(e) => updateAction(index, { ...config, field_key: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select field to update</option>
                      {templateFields.map((field: any) => (
                        <option key={field.key} value={field.key}>
                          {field.label || field.key} ({field.key})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={config.message || ''}
                      onChange={(e) => updateAction(index, { ...config, message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Message to send with the field update"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'send_email':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={config.subject || ''}
                onChange={(e) => updateAction(index, { ...config, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
              <select
                value={config.template || ''}
                onChange={(e) => updateAction(index, { ...config, template: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select email template</option>
                <option value="welcome_email">Welcome Email</option>
                <option value="points_earned">Points Earned</option>
                <option value="special_offer">Special Offer</option>
              </select>
            </div>
          </div>
        )

      case 'update_custom_field':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field Key</label>
              <input
                type="text"
                value={config.field_key || ''}
                onChange={(e) => updateAction(index, { ...config, field_key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., favorite_wine"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <input
                type="text"
                value={config.value || ''}
                onChange={(e) => updateAction(index, { ...config, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="New field value"
              />
            </div>
          </div>
        )

      case 'add_points':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
              <input
                type="number"
                value={config.points || ''}
                onChange={(e) => updateAction(index, { ...config, points: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input
                type="text"
                value={config.reason || ''}
                onChange={(e) => updateAction(index, { ...config, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Welcome bonus"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {automation ? 'Edit Automation' : 'Create New Automation'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Automation Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Welcome New Members"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what this automation does..."
                  rows={2}
                />
              </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Pass Template</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which pass template should this automation apply to?
                </label>
                {loadingTemplates ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    <span>Loading templates...</span>
                  </div>
                ) : (
                  <select
                    value={formData.template_id}
                    onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.programs?.name || 'Unnamed Program'} - v{template.version}
                      </option>
                    ))}
                  </select>
                )}
                {templates.length === 0 && !loadingTemplates && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md mt-2">
                    No templates found. Create a pass template first in the Pass Designer.
                  </div>
                )}
              </div>
            </div>

            {/* Trigger */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Trigger</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">When should this automation run?</label>
                <select
                  value={formData.trigger_type}
                  onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a trigger</option>
                  {TRIGGER_TYPES.map((trigger) => (
                    <option key={trigger.value} value={trigger.value}>
                      {trigger.label} - {trigger.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Actions</h3>
              
              {formData.actions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No actions yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Add actions that will run when this automation triggers.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.actions.map((action, index) => {
                    const actionType = ACTION_TYPES.find(t => t.value === action.type)
                    const Icon = actionType?.icon || SparklesIcon
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${actionType?.color}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <h4 className="font-medium text-gray-900">{actionType?.label}</h4>
                          </div>
                          <button
                            onClick={() => removeAction(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                        {renderActionConfig(action, index)}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {ACTION_TYPES.map((actionType) => {
                  const Icon = actionType.icon
                  return (
                    <button
                      key={actionType.value}
                      onClick={() => addAction(actionType.value)}
                      className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${actionType.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{actionType.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.status === 'published'}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  status: e.target.checked ? 'published' : 'draft' 
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Publish immediately</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name || !formData.trigger_type || !formData.template_id || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{automation ? 'Update' : 'Create'} Automation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
