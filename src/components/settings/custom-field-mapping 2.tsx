'use client'

import React, { useState, useEffect } from 'react'
import { 
  ArrowRightIcon, 
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'

interface CustomField {
  id: string
  field_key: string
  field_label: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea' | 'email' | 'phone'
  applies_to: 'customer' | 'member' | 'pass'
  is_required: boolean
  created_at: string
}

interface PassTemplate {
  id: string
  program_id?: string
  template_json: any
  passkit_json?: any
  pass_type_identifier?: string
  created_at: string
  fields?: PassField[]
  name?: string // Computed from template_json
  style?: string // Computed from template_json
}

interface PassField {
  id: string
  type: 'headerFields' | 'primaryFields' | 'secondaryFields' | 'auxiliaryFields' | 'backFields'
  label: string
  value: string
  key: string
}

interface FieldMapping {
  passFieldId: string
  customFieldId: string
  passFieldLabel: string
  customFieldLabel: string
  transformType?: 'direct' | 'format' | 'conditional'
  formatPattern?: string
}

export default function CustomFieldMapping() {
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [passTemplates, setPassTemplates] = useState<PassTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<PassTemplate | null>(null)
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedField, setDraggedField] = useState<CustomField | null>(null)
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    customer: true,
    member: true,
    pass: true
  })

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load custom fields
      const [customerFields, memberFields, passFields] = await Promise.all([
        fetch('/api/business/custom-fields?applies_to=customer').then(r => r.json()),
        fetch('/api/business/custom-fields?applies_to=member').then(r => r.json()),
        fetch('/api/business/custom-fields?applies_to=pass').then(r => r.json())
      ])

      const allFields = [
        ...(customerFields.data || []),
        ...(memberFields.data || []),
        ...(passFields.data || [])
      ]
      setCustomFields(allFields)

      // Load pass templates
      const templatesResponse = await fetch('/api/templates')
      const templatesData = await templatesResponse.json()
      setPassTemplates(templatesData.data || [])

      // Load existing mappings
      await loadMappings()

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMappings = async () => {
    try {
      const response = await fetch('/api/business/field-mappings')
      if (response.ok) {
        const data = await response.json()
        setMappings(data.mappings || [])
      }
    } catch (error) {
      console.error('Error loading mappings:', error)
    }
  }

  const saveMappings = async () => {
    try {
      const response = await fetch('/api/business/field-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate?.id,
          mappings
        })
      })

      if (response.ok) {
        console.log('✅ Field mappings saved successfully')
      }
    } catch (error) {
      console.error('Error saving mappings:', error)
    }
  }

  const createMapping = async (passField: PassField, customField: CustomField) => {
    if (!selectedTemplate) return

    const newMapping: FieldMapping = {
      passFieldId: passField.id,
      customFieldId: customField.id,
      passFieldLabel: passField.label,
      customFieldLabel: customField.field_label,
      transformType: 'direct'
    }

    try {
      console.log('🔗 Creating field mapping:', newMapping)
      
      // Save to backend
      const response = await fetch('/api/business/field-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          pass_field_id: passField.id,
          pass_field_key: passField.key,
          pass_field_label: passField.label,
          custom_field_id: customField.id,
          transform_type: 'direct'
        }),
      })

      if (response.ok) {
        // Update local state
        setMappings(prev => {
          const filtered = prev.filter(m => m.passFieldId !== passField.id)
          return [...filtered, newMapping]
        })
        console.log('✅ Field mapping created successfully')
      } else {
        console.error('❌ Failed to create field mapping')
      }
    } catch (error) {
      console.error('❌ Error creating field mapping:', error)
    }
  }

  const removeMapping = async (passFieldId: string) => {
    try {
      console.log('🗑️ Removing field mapping for pass field:', passFieldId)
      
      const response = await fetch(`/api/business/field-mappings?passFieldId=${passFieldId}&templateId=${selectedTemplate?.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMappings(prev => prev.filter(m => m.passFieldId !== passFieldId))
        console.log('✅ Field mapping removed successfully')
      } else {
        console.error('❌ Failed to remove field mapping')
      }
    } catch (error) {
      console.error('❌ Error removing field mapping:', error)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, customField: CustomField) => {
    setDraggedField(customField)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify(customField))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, passField: PassField) => {
    e.preventDefault()
    if (draggedField) {
      createMapping(passField, draggedField)
      setDraggedField(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedField(null)
  }

  const getMappingForPassField = (passFieldId: string) => {
    return mappings.find(m => m.passFieldId === passFieldId)
  }

  const getCustomFieldsByType = (type: 'customer' | 'member' | 'pass') => {
    return customFields.filter(field => field.applies_to === type)
  }

  const getPassFieldsByType = (type: string) => {
    if (!selectedTemplate) return []
    
    // Extract fields from passkit_json or template_json
    let fields: PassField[] = []
    
    try {
      const passkitJson = selectedTemplate.passkit_json || selectedTemplate.template_json
      if (passkitJson) {
        // Find the pass style section (storeCard, coupon, etc.)
        const styleKey = Object.keys(passkitJson).find(key => 
          ['storeCard', 'coupon', 'eventTicket', 'boardingPass', 'generic'].includes(key)
        )
        
        if (styleKey && passkitJson[styleKey] && passkitJson[styleKey][type]) {
          fields = passkitJson[styleKey][type].map((field: any, index: number) => ({
            id: field.id || `${type}_${index}`,
            type: type as any,
            label: field.label || field.key || 'Unnamed Field',
            value: field.value || '',
            key: field.key || `${type}_${index}`
          }))
        }
      }
    } catch (error) {
      console.error('Error parsing template fields:', error)
    }
    
    return fields
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-slate-600">Loading field mapping...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Custom Field Mapping</h2>
        <p className="text-slate-600 mt-1">
          Map your custom fields to pass template fields for dynamic content
        </p>
      </div>

      {/* Template Selection */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Pass Template</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {passTemplates.map((template) => {
            // Extract template info from template_json
            const templateName = template.name || 
              (template.template_json?.templateName) || 
              (template.passkit_json?.organizationName) ||
              `Template ${template.id.slice(0, 8)}`
            
            const templateStyle = template.style || 
              (template.template_json?.passType) ||
              (template.passkit_json && Object.keys(template.passkit_json).find(key => 
                ['storeCard', 'coupon', 'eventTicket', 'boardingPass', 'generic'].includes(key)
              )) ||
              'unknown'
            
            // Calculate total field count from all field types
            let fieldCount = 0
            try {
              const passkitJson = template.passkit_json || template.template_json
              if (passkitJson) {
                const styleKey = Object.keys(passkitJson).find(key => 
                  ['storeCard', 'coupon', 'eventTicket', 'boardingPass', 'generic'].includes(key)
                )
                if (styleKey && passkitJson[styleKey]) {
                  const style = passkitJson[styleKey]
                  fieldCount = (style.headerFields?.length || 0) +
                              (style.primaryFields?.length || 0) +
                              (style.secondaryFields?.length || 0) +
                              (style.auxiliaryFields?.length || 0) +
                              (style.backFields?.length || 0)
                }
              }
            } catch (error) {
              console.error('Error calculating field count:', error)
            }
            
            return (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate({...template, name: templateName, style: templateStyle})}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">{templateName}</h4>
                    <p className="text-sm text-slate-500 capitalize">{templateStyle} Style</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {fieldCount} fields
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-slate-300'
                  }`} />
                </div>
              </div>
            )
          })}
        </div>

        {passTemplates.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <p>No pass templates found.</p>
            <p className="text-sm mt-1">Create a template in the Pass Designer first.</p>
          </div>
        )}
      </div>

      {/* Field Mapping Interface */}
      {selectedTemplate && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Field Mappings for "{selectedTemplate.name}"
            </h3>
            <button
              onClick={saveMappings}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Save Mappings
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pass Template Fields */}
            <div>
              <h4 className="font-medium text-slate-900 mb-4 flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                Pass Template Fields
              </h4>
              
              <div className="space-y-4">
                {['headerFields', 'primaryFields', 'secondaryFields', 'auxiliaryFields', 'backFields'].map((fieldType) => {
                  const fields = getPassFieldsByType(fieldType)
                  if (fields.length === 0) return null

                  return (
                    <div key={fieldType} className="border border-slate-200 rounded-lg">
                      <button
                        onClick={() => toggleSection(fieldType)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-700 capitalize">
                          {fieldType.replace('Fields', ' Fields')}
                        </span>
                        {expandedSections[fieldType] ? (
                          <ChevronUpIcon className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      
                      {expandedSections[fieldType] && (
                        <div className="px-4 pb-4 space-y-3">
                          {fields.map((field) => {
                            const mapping = getMappingForPassField(field.id)
                            return (
                              <div
                                key={field.id}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, field)}
                                className={`p-3 rounded border-2 transition-colors cursor-pointer ${
                                  mapping
                                    ? 'border-green-200 bg-green-50'
                                    : draggedField
                                    ? 'border-blue-300 bg-blue-50 border-dashed'
                                    : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-25'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-slate-900">{field.label}</p>
                                    <p className="text-sm text-slate-500">Key: {field.key}</p>
                                    {mapping && (
                                      <p className="text-xs text-green-600 mt-1">
                                        → Mapped to: {mapping.customFieldLabel}
                                      </p>
                                    )}
                                  </div>
                                  {mapping && (
                                    <button
                                      onClick={() => removeMapping(field.id)}
                                      className="text-red-500 hover:text-red-700 text-xs"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Custom Fields */}
            <div>
              <h4 className="font-medium text-slate-900 mb-4 flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                Custom Fields
              </h4>
              
              <div className="space-y-4">
                {['customer', 'member', 'pass'].map((appliesTo) => {
                  const fields = getCustomFieldsByType(appliesTo as any)
                  if (fields.length === 0) return null

                  return (
                    <div key={appliesTo} className="border border-slate-200 rounded-lg">
                      <button
                        onClick={() => toggleSection(appliesTo)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-700 capitalize">
                          {appliesTo} Fields
                        </span>
                        {expandedSections[appliesTo] ? (
                          <ChevronUpIcon className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      
                      {expandedSections[appliesTo] && (
                        <div className="px-4 pb-4 space-y-3">
                          {fields.map((field) => (
                            <div
                              key={field.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, field)}
                              onDragEnd={handleDragEnd}
                              className={`p-3 rounded border border-slate-200 bg-slate-50 cursor-move transition-all ${
                                draggedField?.id === field.id
                                  ? 'opacity-50 scale-95'
                                  : 'hover:border-purple-300 hover:bg-purple-25'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-slate-900">{field.field_label}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                      {field.field_type}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      Key: {field.field_key}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-slate-400">
                                    Drag to map →
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Mapping Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">How Field Mapping Works</h5>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Customer Fields:</strong> Collected during signup (name, email, preferences)</p>
              <p>• <strong>Member Fields:</strong> Updated during program participation (points, tier, status)</p>
              <p>• <strong>Pass Fields:</strong> Dynamic data displayed on the wallet pass (QR codes, balances)</p>
              <p>• Drag a custom field from the right and drop it on a pass field on the left</p>
              <p>• Mapped fields will automatically populate with real customer data</p>
            </div>
          </div>

          {/* Current Mappings Summary */}
          {mappings.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h5 className="font-medium text-green-900 mb-3">Active Mappings ({mappings.length})</h5>
              <div className="space-y-2">
                {mappings.map((mapping, index) => (
                  <div key={index} className="flex items-center text-sm text-green-800">
                    <span className="font-medium">{mapping.passFieldLabel}</span>
                    <ArrowRightIcon className="w-3 h-3 mx-2 text-green-600" />
                    <span>{mapping.customFieldLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
