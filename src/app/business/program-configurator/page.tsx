'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { CogIcon, ArrowRightIcon, ArrowLeftIcon, CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline'
import { analyzeTemplate, getRecommendations, type ProgramType, type TemplateCapabilities } from '@/lib/template-validation-system'
import { useConfiguratorState } from '@/lib/member-dashboard/use-configurator-state'
import { getSectionsForProgramType, SECTION_CATALOG } from '@/lib/member-dashboard/section-catalog'
import { SECTION_REGISTRY } from '@/lib/member-dashboard/registry'
import { bindProps } from '@/lib/member-dashboard/utils'
import { SECTION_SCHEMAS, sectionHasConfig } from '@/lib/member-dashboard/section-schemas'

export default function ProgramConfiguratorPage() {
  console.log('🎯 ProgramConfiguratorPage component mounted!')
  
  // Use configurator state hook
  const {
    currentStep,
    selectedTemplate,
    templateCapabilities,
    draftSpec,
    setSelectedTemplate,
    initializeDraftSpec,
    toggleSection,
    resetSections,
    updateProgramConfig,
    updateSectionConfig,
    goToStep,
    nextStep,
    prevStep,
    isSectionActive,
    getEnabledSections,
  } = useConfiguratorState()
  
  // Template loading state
  const [templates, setTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [mockData, setMockData] = useState<any>({})
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false)
  const [selectedSectionForConfig, setSelectedSectionForConfig] = useState<string | null>(null)
  
  // Legacy program config for form state
  const [programConfig, setProgramConfig] = useState({
    name: '',
    tagline: '',
    pointsPerDollar: 1,
    monthlyFee: 47,
    tiersEnabled: true
  })

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [])
  
  const loadTemplates = async () => {
    console.log('🚀 Starting template load...')
    try {
      setLoadingTemplates(true)
      console.log('📡 Fetching /api/templates...')
      const response = await fetch('/api/templates')
      console.log('📝 Response status:', response.status)
      const data = await response.json()
      console.log('📦 Raw response data:', data)
      
      if (data.templates) {
        setTemplates(data.templates)
        console.log('✅ Successfully loaded templates:', data.templates.length)
        console.log('🎨 Template details:', data.templates.map(t => ({ id: t.id, name: t.programs?.name || t.name })))
      } else {
        console.log('❌ No templates found in response')
      }
    } catch (error) {
      console.error('🔥 Failed to load templates:', error)
    } finally {
      console.log('🏁 Setting loadingTemplates to false')
      setLoadingTemplates(false)
    }
  }
  
  const selectTemplate = (template: any) => {
    setSelectedTemplate(template)
    
    // Analyze template capabilities
    const capabilities = analyzeTemplate(template)
    const capabilityList = capabilities.capabilities || []
    
    // Auto-select best program type
    const recommendations = getRecommendations(template)
    const recommendedType = recommendations.length > 0 ? recommendations[0].programType : 'loyalty'
    
    // Set default program name from template
    setProgramConfig(prev => ({
      ...prev,
      name: template.programs?.name || template.name || ''
    }))
    
    // Initialize draft spec with template and program type
    initializeDraftSpec(template, recommendedType, capabilityList)
    
    // Move to program type selection step
    goToStep('program-type')
    
    console.log('🎯 Template selected:', template.programs?.name)
    console.log('🔍 Capabilities:', capabilityList)
    console.log('💡 Recommendations:', recommendations)
  }

  // Mock customer data for preview
  const getMockCustomerData = useCallback(() => {
    if (!draftSpec) return {};
    
    const baseData = {
      program: draftSpec,
      member: {
        points_balance: 850,
        tier: { name: 'Silver', threshold: 1000 },
        points_to_next_tier: 150,
        credit_balance: 25.50,
        stored_value_balance: 47.25,
        allowances: [
          { name: 'Free tastings', used: 2, limit: 3 },
          { name: 'Exclusive events', used: 0, limit: 1 }
        ],
        next_invoice: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        claimables: [
          { id: 'free_coffee', title: 'Free Coffee' },
          { id: 'pastry_discount', title: '50% Off Pastry' },
        ],
        recent_activity: [
          { ts: new Date().toISOString(), type: 'earn', points: 25, meta: { location: 'Downtown Store' } },
          { ts: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'redeem', points: -100, meta: { reward_title: 'Free Coffee' } },
        ],
      },
      offers: {
        active: [
          {
            id: 'birthday_special',
            title: 'Birthday Treat',
            description: 'Free drink on your birthday month!',
            image_url: '/images/offers/birthday.png',
          },
          {
            id: 'double_points',
            title: 'Double Points Weekend',
            description: 'Earn 2x points this weekend',
            image_url: '/images/offers/double-points.png',
          }
        ]
      },
      business: { check_in_endpoint: '/api/checkin/demo-business-123' },
      copy: draftSpec.copy || {}
    };
    
    return baseData;
  }, [draftSpec]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'template':
        return renderTemplateStep()
      case 'program-type':
        return renderProgramTypeStep()
      case 'components':
        return renderComponentsStep()
      case 'branding':
        return renderBrandingStep()
      case 'preview':
        return renderPreviewStep()
      default:
        return renderTemplateStep()
    }
  }

  const renderTemplateStep = () => {
    if (loadingTemplates) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <CogIcon className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading your templates...</p>
          </div>
        </div>
      )
    }
    
    if (templates.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Templates Found</h3>
            <p className="text-slate-600 mb-4">You need to create a template in Pass Designer first.</p>
            <a 
              href="/business/pass-designer" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Template
            </a>
          </div>
        </div>
      )
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Select Template</h2>
          <p className="text-slate-600">Choose a template from Pass Designer to configure your program</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => {
            const capabilities = analyzeTemplate(template)
            const recommendations = getRecommendations(template)
            
            return (
              <div 
                key={template.id} 
                className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => selectTemplate(template)}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {template.programs?.name || template.name || 'Untitled Template'}
                  </h3>
                  
                  <div className="mb-4">
                    <p className="text-sm text-slate-600 mb-2">Detected Capabilities:</p>
                    <div className="flex flex-wrap gap-1">
                      {capabilities.capabilities.map((cap) => (
                        <span key={cap} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {cap.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-slate-600 mb-2">Recommended Program Types:</p>
                    <div className="space-y-1">
                      {recommendations.slice(0, 2).map((rec) => (
                        <div key={rec.programType} className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-slate-700 capitalize">{rec.programType.replace('_', ' ')}</span>
                          <span className="text-xs text-slate-500">({Math.round(rec.confidence * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-500">
                    Placeholders: {capabilities.placeholders.join(', ')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderProgramTypeStep = () => {
    if (!selectedTemplate || !draftSpec) return null;

    const capabilities = analyzeTemplate(selectedTemplate);
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Choose Program Type</h2>
          <p className="text-slate-600">
            Template: <span className="font-medium">{selectedTemplate?.programs?.name || 'Unknown'}</span>
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Program Type</h3>
          <p className="text-sm text-slate-600 mb-4">Based on your template's placeholders:</p>
          
          <div className="space-y-3">
            {[
              { type: 'loyalty' as const, title: 'Loyalty Program', desc: 'Points-based rewards system' },
              { type: 'membership' as const, title: 'Membership Program', desc: 'Subscription-based perks and benefits' },
              { type: 'store_card' as const, title: 'Store Card', desc: 'Stored value for purchases' }
            ].map(program => {
              const isAllowed = capabilities?.allowedProgramTypes?.includes(program.type)
              const recommendation = getRecommendations(selectedTemplate)?.find(r => r.programType === program.type)
              
              return (
                <label 
                  key={program.type} 
                  className={`flex items-center p-3 border rounded-lg transition-colors ${
                    isAllowed 
                      ? 'border-slate-200 hover:bg-slate-50 cursor-pointer' 
                      : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
                  }`}
                >
                  <input
                    type="radio"
                    name="programType"
                    value={program.type}
                    checked={draftSpec.program_type === program.type}
                    onChange={(e) => {
                      if (isAllowed) {
                        // Reinitialize with new program type
                        initializeDraftSpec(selectedTemplate, e.target.value as ProgramType, templateCapabilities)
                      }
                    }}
                    disabled={!isAllowed}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{program.title}</span>
                      {isAllowed && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                      {!isAllowed && <XCircleIcon className="w-4 h-4 text-slate-400" />}
                      {recommendation && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {Math.round(recommendation.confidence * 100)}% match
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600">{program.desc}</div>
                    {!isAllowed && (
                      <div className="text-xs text-red-600 mt-1">
                        Template missing required placeholders
                      </div>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
          
          {capabilities && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Template Capabilities:</strong> {capabilities.capabilities.join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderComponentsStep = () => {
    if (!draftSpec) return null;

    const availableSections = getSectionsForProgramType(draftSpec.program_type, templateCapabilities);
    const coreComponents = availableSections.filter(s => s.category === 'core');
    const optionalComponents = availableSections.filter(s => s.category === 'optional');
    const advancedComponents = availableSections.filter(s => s.category === 'advanced');

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Choose Components</h2>
          <p className="text-slate-600">Select which components to show on your member dashboard</p>
        </div>

        {/* Preset Buttons */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Presets</h3>
          <div className="flex gap-3">
            <button
              onClick={() => resetSections('minimal')}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Minimal
            </button>
            <button
              onClick={() => resetSections('standard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Standard
            </button>
            <button
              onClick={() => resetSections('full')}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Full Experience
            </button>
          </div>
        </div>

        {/* Core Components */}
        {coreComponents.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Core Components</h3>
            <div className="space-y-3">
              {coreComponents.map((section) => (
                <label 
                  key={section.key}
                  className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSectionActive(section.key)}
                    onChange={() => toggleSection(section.key)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{section.label}</div>
                    <div className="text-sm text-slate-600">{section.description}</div>
                  </div>
                  {sectionHasConfig(section.key) && (
                    <div className="relative group">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSelectedSectionForConfig(section.key)
                          setConfigDrawerOpen(true)
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                        title={`Configure ${section.label}`}
                      >
                        <CogIcon className="w-5 h-5" />
                      </button>
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Configure {section.label}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                      </div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Optional Components */}
        {optionalComponents.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Optional Components</h3>
            <div className="space-y-3">
              {optionalComponents.map((section) => (
                <label 
                  key={section.key}
                  className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSectionActive(section.key)}
                    onChange={() => toggleSection(section.key)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{section.label}</div>
                    <div className="text-sm text-slate-600">{section.description}</div>
                  </div>
                  {sectionHasConfig(section.key) && (
                    <div className="relative group">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSelectedSectionForConfig(section.key)
                          setConfigDrawerOpen(true)
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                        title={`Configure ${section.label}`}
                      >
                        <CogIcon className="w-5 h-5" />
                      </button>
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Configure {section.label}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                      </div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Components */}
        {advancedComponents.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Advanced Components</h3>
            <div className="space-y-3">
              {advancedComponents.map((section) => (
                <label 
                  key={section.key}
                  className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSectionActive(section.key)}
                    onChange={() => toggleSection(section.key)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{section.label}</div>
                    <div className="text-sm text-slate-600">{section.description}</div>
                  </div>
                  {sectionHasConfig(section.key) && (
                    <div className="relative group">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSelectedSectionForConfig(section.key)
                          setConfigDrawerOpen(true)
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                        title={`Configure ${section.label}`}
                      >
                        <CogIcon className="w-5 h-5" />
                      </button>
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Configure {section.label}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                      </div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderBrandingStep = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Branding & Settings</h2>
          <p className="text-slate-600">Customize your program's look and feel</p>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Program Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Program Name</label>
              <input
                type="text"
                value={programConfig.name}
                onChange={(e) => {
                  setProgramConfig(prev => ({ ...prev, name: e.target.value }));
                  if (draftSpec) {
                    updateProgramConfig({
                      copy: { ...draftSpec.copy, program_name: e.target.value }
                    });
                  }
                }}
                placeholder="e.g., Daily Rewards, VIP Club, Store Card"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tagline</label>
              <input
                type="text"
                value={programConfig.tagline}
                onChange={(e) => {
                  setProgramConfig(prev => ({ ...prev, tagline: e.target.value }));
                  if (draftSpec) {
                    updateProgramConfig({
                      copy: { ...draftSpec.copy, tagline: e.target.value }
                    });
                  }
                }}
                placeholder="e.g., Sip. Earn. Repeat."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Logo Upload</h3>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <div className="text-slate-600">
              <p className="mb-2">Upload your logo</p>
              <p className="text-sm">Drag and drop or click to select</p>
            </div>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Choose File
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderPreviewStep = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Review & Publish</h2>
          <p className="text-slate-600">Review your program configuration before publishing</p>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Program Summary</h3>
          {draftSpec && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Program Type:</span>
                <span className="font-medium capitalize">{draftSpec.program_type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Program Name:</span>
                <span className="font-medium">{draftSpec.copy?.program_name || 'Untitled Program'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Enabled Components:</span>
                <span className="font-medium">{draftSpec.ui_contract.sections.length}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Ready to Publish</h3>
          <p className="text-green-700 mb-4">Your program is configured and ready to go live!</p>
          <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Publish Program
          </button>
        </div>
      </div>
    )
  }

  // Live Preview Component
  const renderLivePreview = () => {
    if (!draftSpec) {
      return (
        <div className="bg-gradient-to-br from-[#1a1f2e] via-[#2E3748] to-[#1a1f2e] rounded-lg p-6 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <EyeIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-[#C6C8CC]">Select a template to see preview</p>
          </div>
        </div>
      )
    }

    const mockData = getMockCustomerData()
    
    return (
      <div className="bg-gradient-to-br from-[#1a1f2e] via-[#2E3748] to-[#1a1f2e] rounded-lg p-6 h-full">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {draftSpec.copy?.program_name || 'Your Program'}
          </h2>
          {draftSpec.copy?.tagline && (
            <p className="text-[#C6C8CC] mt-2">{draftSpec.copy.tagline}</p>
          )}
        </div>
        
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {draftSpec.ui_contract.sections.map((section, index) => {
            const Component = SECTION_REGISTRY[section.type as keyof typeof SECTION_REGISTRY]
            
            if (!Component) {
              return (
                <div key={index} className="bg-white/10 border border-white/20 rounded-lg p-4">
                  <p className="text-white text-sm">Unknown component: {section.type}</p>
                </div>
              )
            }
            
            const boundProps = bindProps(section.props, mockData)
            
            try {
              return <Component key={index} {...boundProps} />
            } catch (error) {
              console.warn(`Error rendering ${section.type}:`, error)
              return (
                <div key={index} className="bg-white/10 border border-white/20 rounded-lg p-4">
                  <p className="text-white text-sm">Error rendering {section.type}</p>
                </div>
              )
            }
          })}
        </div>
      </div>
    )
  }

  const steps = [
    { key: 'template' as const, label: 'Template', description: 'Choose your pass template' },
    { key: 'program-type' as const, label: 'Program Type', description: 'Select program type' },
    { key: 'components' as const, label: 'Components', description: 'Choose dashboard sections' },
    { key: 'branding' as const, label: 'Branding', description: 'Customize appearance' },
    { key: 'preview' as const, label: 'Review', description: 'Review and publish' },
  ]

  const currentStepIndex = steps.findIndex(step => step.key === currentStep)
  const canGoNext = currentStepIndex < steps.length - 1
  const canGoPrev = currentStepIndex > 0

  return (
    <>
      <div className="dashboard-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Program Configurator</h1>
            <p className="text-slate-600 mt-1">Design your customer engagement program</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Step Indicator */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index === currentStepIndex 
                    ? 'bg-blue-600 text-white' 
                    : index < currentStepIndex 
                    ? 'bg-green-600 text-white' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {index < currentStepIndex ? '✓' : index + 1}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-slate-900">{step.label}</div>
                  <div className="text-xs text-slate-600">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-px w-12 ${
                    index < currentStepIndex ? 'bg-green-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-250px)]">
          {/* Configurator Content - 2 columns */}
          <div className="col-span-8 overflow-y-auto">
            <div className="pr-4">
              {renderStepContent()}
            </div>
            
            {/* Navigation Footer */}
            <div className="flex justify-between items-center pt-6 pb-4 border-t border-slate-200 mt-8 sticky bottom-0 bg-white">
              <button
                onClick={prevStep}
                disabled={!canGoPrev}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  canGoPrev 
                    ? 'border border-slate-300 text-slate-700 hover:bg-slate-50' 
                    : 'border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Previous
              </button>
              
              <div className="text-sm text-slate-600">
                Step {currentStepIndex + 1} of {steps.length}
              </div>
              
              <button
                onClick={nextStep}
                disabled={!canGoNext}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  canGoNext 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Next
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Preview - 1 column */}
          <div className="col-span-4">
            <div className="sticky top-0">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-4">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <EyeIcon className="w-5 h-5 text-blue-600" />
                  Live Preview
                </h3>
                <p className="text-sm text-slate-600">See how your dashboard will look to members</p>
              </div>
              
              <div className="h-[calc(100vh-350px)] min-h-[400px]">
                {renderLivePreview()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Drawer */}
      {configDrawerOpen && selectedSectionForConfig && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setConfigDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <div className="relative ml-auto w-96 h-full bg-white shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Configure {SECTION_CATALOG.find(s => s.key === selectedSectionForConfig)?.label}
                </h2>
                <button
                  onClick={() => setConfigDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const schema = SECTION_SCHEMAS[selectedSectionForConfig]
                if (!schema) return <p className="text-slate-500">No configuration available</p>

                return (
                  <div className="space-y-6">
                    {/* Appearance Tab */}
                    {schema.appearance && schema.appearance.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-slate-900 mb-3">Appearance</h3>
                        <div className="space-y-4">
                          {schema.appearance.map((field) => (
                            <div key={field.key}>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                {field.label}
                              </label>
                              {field.type === 'select' && (
                                <select 
                                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                  onChange={(e) => updateSectionConfig(selectedSectionForConfig, field.key, e.target.value)}
                                >
                                  {field.options?.map((option) => (
                                    <option key={option} value={option}>
                                      {typeof option === 'string' ? option.charAt(0).toUpperCase() + option.slice(1) : option}
                                    </option>
                                  ))}
                                </select>
                              )}
                              {field.type === 'switch' && (
                                <label className="flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    onChange={(e) => updateSectionConfig(selectedSectionForConfig, field.key, e.target.checked)}
                                  />
                                  <div className="relative w-10 h-6 bg-slate-200 rounded-full transition-colors">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform" />
                                  </div>
                                </label>
                              )}
                              {field.help && (
                                <p className="text-xs text-slate-500 mt-1">{field.help}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Behavior Tab */}
                    {schema.behavior && schema.behavior.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-slate-900 mb-3">Behavior</h3>
                        <div className="space-y-4">
                          {schema.behavior.map((field) => (
                            <div key={field.key}>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                {field.label}
                              </label>
                              {field.type === 'number' && (
                                <input
                                  type="number"
                                  min={field.min}
                                  max={field.max}
                                  step={field.step}
                                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                  placeholder={field.placeholder}
                                  onChange={(e) => updateSectionConfig(selectedSectionForConfig, field.key, parseFloat(e.target.value) || 0)}
                                />
                              )}
                              {field.type === 'switch' && (
                                <label className="flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    onChange={(e) => updateSectionConfig(selectedSectionForConfig, field.key, e.target.checked)}
                                  />
                                  <div className="relative w-10 h-6 bg-slate-200 rounded-full transition-colors">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform" />
                                  </div>
                                </label>
                              )}
                              {field.help && (
                                <p className="text-xs text-slate-500 mt-1">{field.help}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="pt-4 border-t border-slate-200">
                      <button
                        onClick={() => {
                          // TODO: Save configuration to draftSpec
                          setConfigDrawerOpen(false)
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Save Configuration
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
