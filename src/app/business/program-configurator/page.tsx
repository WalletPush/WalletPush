'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { CogIcon, ArrowRightIcon, ArrowLeftIcon, CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline'
import { analyzeTemplate, getRecommendations, type ProgramType, type TemplateCapabilities } from '@/lib/template-validation-system'
import { useConfiguratorState } from '@/lib/member-dashboard/use-configurator-state'
import { getSectionsForProgramType, SECTION_CATALOG } from '@/lib/member-dashboard/section-catalog'
import { SECTION_REGISTRY } from '@/lib/member-dashboard/registry'
import { bindProps } from '@/lib/member-dashboard/utils'
import { SECTION_SCHEMAS, sectionHasConfig } from '@/lib/member-dashboard/section-schemas'
import { BrandedHeader } from '@/components/branding/BrandedHeader'
import '@/components/member-dashboard/wp-themes.css'

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
  const [mockData, setMockData] = useState<{ customer?: { profilePicture?: string; name?: string; [key: string]: any } }>({ customer: {} })
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false)
  const [selectedSectionForConfig, setSelectedSectionForConfig] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [profileUploading, setProfileUploading] = useState(false)
  
  // Legacy program config for form state
  const [programConfig, setProgramConfig] = useState({
    name: '',
    tagline: '',
    pointsPerDollar: 1,
    monthlyFee: 47,
    tiersEnabled: true
  })

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
        console.log('🎨 Template details:', data.templates.map((t: any) => ({ id: t.id, name: t.programs?.name || t.name })))
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

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [])

  // Logo upload handler
  const handleLogoUpload = async (file: File) => {
    if (!file) return

    setLogoUploading(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      formData.append('businessId', 'demo-business-123') // TODO: Get actual business ID

      const response = await fetch('/api/branding/logo', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        console.log('✅ Logo uploaded successfully:', result.logoUrl)
        
        // Update draft spec with new logo
        if (draftSpec) {
          updateProgramConfig({
            ...draftSpec,
            branding: { ...(draftSpec.branding || {}), businessLogo: result.logoUrl }
          })
        }
        
        alert('Logo uploaded successfully!')
      } else {
        console.error('❌ Logo upload failed:', result.error)
        alert(`Upload failed: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Logo upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setLogoUploading(false)
    }
  }

  // Profile picture upload handler
  const handleProfileUpload = async (file: File) => {
    if (!file) return

    setProfileUploading(true)
    try {
      const formData = new FormData()
      formData.append('profile', file)
      formData.append('customerId', 'demo-customer-456') // TODO: Get actual customer ID

      const response = await fetch('/api/branding/profile', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        console.log('✅ Profile picture uploaded successfully:', result.profileUrl)
        
        // Update mock data with new profile
        setMockData((prev) => ({
          ...prev,
          customer: { ...(prev.customer || {}), profilePicture: result.profileUrl }
        }))
        
        alert('Profile picture uploaded successfully!')
      } else {
        console.error('❌ Profile upload failed:', result.error)
        alert(`Upload failed: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Profile upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setProfileUploading(false)
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

        {/* Logo Upload Section */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Business Logo</h3>
          <p className="text-sm text-slate-600 mb-4">Upload your business logo. Recommended size: 120x50 pixels (optimized for header)</p>
          
          <div className="flex items-center gap-6">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              <div className="w-[120px] h-[50px] border border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center">
                <img
                  src={draftSpec?.branding?.businessLogo || '/images/logo_placeholder.png'}
                  alt="Business Logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
            
            {/* Upload Button */}
            <div className="flex-1">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                <div className="text-slate-600">
                  <p className="mb-2">Upload your business logo</p>
                  <p className="text-sm mb-4">PNG, JPG up to 2MB. Will be stored securely by business ID.</p>
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleLogoUpload(file)
                    }}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer ${
                      logoUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {logoUploading ? 'Uploading...' : 'Choose Logo File'}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Dashboard Theme</h3>
          <p className="text-sm text-slate-600 mb-4">Choose a theme for your customer dashboard</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'dark-midnight', name: 'Dark Midnight', bg: 'from-slate-900 to-slate-800', text: 'white' },
              { key: 'dark-plum', name: 'Dark Plum', bg: 'from-purple-900 to-purple-800', text: 'white' },
              { key: 'dark-emerald', name: 'Dark Emerald', bg: 'from-emerald-900 to-emerald-800', text: 'white' },
              { key: 'dark-ocean', name: 'Dark Ocean', bg: 'from-[#1A434E] to-[#213A43]', text: 'white' },
              { key: 'dark-ink', name: 'Dark Ink', bg: 'from-[#110F0E] to-[#1A1817]', text: 'white' },
              { key: 'dark-violet', name: 'Dark Violet', bg: 'from-[#231439] to-[#2D1B47]', text: 'white' },
              { key: 'dark-charcoal', name: 'Dark Charcoal', bg: 'from-[#1B1D1F] to-[#23262A]', text: 'white' },
              { key: 'light-classic', name: 'Light Classic', bg: 'from-gray-100 to-white', text: 'gray-900' },
              { key: 'brand-auto', name: 'Brand Auto', bg: 'from-blue-600 to-blue-700', text: 'white' }
            ].map((theme) => (
              <button
                key={theme.key}
                onClick={() => {
                  if (draftSpec) {
                    updateProgramConfig({
                      branding: { ...draftSpec.branding, theme: theme.key }
                    });
                  }
                }}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  draftSpec?.branding?.theme === theme.key || (!draftSpec?.branding?.theme && theme.key === 'dark-midnight')
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className={`w-full h-16 bg-gradient-to-r ${theme.bg} rounded mb-2 flex items-center justify-center`}>
                  <span className={`text-sm font-medium text-${theme.text}`}>Preview</span>
                </div>
                <p className="text-sm font-medium text-slate-900">{theme.name}</p>
              </button>
            ))}
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
      <div className="bg-gradient-to-br from-[#1a1f2e] via-[#2E3748] to-[#1a1f2e] rounded-lg overflow-hidden h-full flex flex-col">
        {/* Branded Header */}
        <div className="wp-root" data-wp-theme={draftSpec.branding?.theme || 'dark-midnight'}>
          <BrandedHeader
            businessLogo={draftSpec.branding?.businessLogo}
            businessName={draftSpec.copy?.program_name || 'Your Business'}
            businessTagline={draftSpec.copy?.tagline || 'Customer loyalty made simple'}
            profilePicture={(mockData as any)?.customer?.profilePicture}
            customerName={(mockData as any)?.customer?.name || 'John Doe'}
            showProfile={true}
            theme={draftSpec.branding?.theme || 'dark-midnight'}
          />
        </div>
        
        {/* Dashboard Content */}
        <div className="wp-root flex-1 p-6 space-y-4 max-h-[400px] overflow-y-auto" data-wp-theme={draftSpec.branding?.theme || 'dark-midnight'} key={JSON.stringify(draftSpec.ui_contract.sections)}>
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
            
            // Add settings from the configuration to the props
            const componentProps = {
              ...boundProps,
              settings: (section as any).settings || {},
              business: (mockData as any).business || {},
              // Pass the full context for complex components
              ...mockData
            }
            
            try {
              return <Component key={index} {...componentProps} />
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
          {/* Drawer */}
          <div className="relative w-96 h-full bg-white shadow-xl overflow-y-auto">
          
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 -z-10" 
            onClick={() => setConfigDrawerOpen(false)}
          />
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

                // Get current values from draftSpec
                const getCurrentValue = (fieldKey: string) => {
                  if (!draftSpec || !selectedSectionForConfig) return undefined
                  
                  if (fieldKey.startsWith('rules.')) {
                    const pathParts = fieldKey.replace('rules.', '').split('.')
                    let current = draftSpec.rules || {}
                    for (const part of pathParts) {
                      if (current && typeof current === 'object') {
                        current = current[part]
                      } else {
                        return undefined
                      }
                    }
                    return current
                  } else if (fieldKey.startsWith('settings.')) {
                    const settingKey = fieldKey.replace('settings.', '')
                    const section = draftSpec.ui_contract.sections.find(s => s.type === selectedSectionForConfig)
                    return (section as any)?.settings?.[settingKey]
                  }
                  return undefined
                }

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
                                  value={getCurrentValue(field.key) || (field.options?.[0] || '')}
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
                                    checked={getCurrentValue(field.key) || false}
                                    onChange={(e) => updateSectionConfig(selectedSectionForConfig, field.key, e.target.checked)}
                                  />
                                  <div className={`relative w-10 h-6 rounded-full transition-colors ${
                                    getCurrentValue(field.key) ? 'bg-blue-600' : 'bg-slate-200'
                                  }`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                      getCurrentValue(field.key) ? 'translate-x-5' : 'translate-x-1'
                                    }`} />
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
                                  value={getCurrentValue(field.key) || ''}
                                  onChange={(e) => updateSectionConfig(selectedSectionForConfig, field.key, parseFloat(e.target.value) || 0)}
                                />
                              )}
                              {field.type === 'text' && (
                                <input
                                  type="text"
                                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                  placeholder={field.placeholder}
                                  value={getCurrentValue(field.key) || ''}
                                  onChange={(e) => updateSectionConfig(selectedSectionForConfig, field.key, e.target.value)}
                                />
                              )}
                              {field.type === 'earning_methods' && (
                                <div className="space-y-3">
                                  {(() => {
                                    const currentMethods = getCurrentValue(field.key) || [
                                      { id: 'purchase', title: 'Make Purchases', description: 'Earn points with every dollar spent', points: '1 point per $1', icon: 'dollar' },
                                      { id: 'checkin', title: 'Check In', description: 'Visit our location and check in', points: '50 points', icon: 'clock' },
                                      { id: 'referral', title: 'Refer Friends', description: 'Invite friends to join our program', points: '500 points', icon: 'users' },
                                      { id: 'bonus', title: 'Special Offers', description: 'Complete special challenges and promotions', points: 'Varies', icon: 'gift' }
                                    ];
                                    
                                    return currentMethods.map((method: any, index: number) => (
                                      <div key={method.id || index} className="p-3 border border-slate-200 rounded-lg">
                                        <div className="grid grid-cols-2 gap-3 mb-2">
                                          <input
                                            type="text"
                                            placeholder="Title (e.g., Make Purchases)"
                                            className="text-sm p-2 border border-slate-300 rounded"
                                            value={method.title || ''}
                                            onChange={(e) => {
                                              const updatedMethods = [...currentMethods];
                                              updatedMethods[index] = { ...method, title: e.target.value };
                                              updateSectionConfig(selectedSectionForConfig, field.key, updatedMethods);
                                            }}
                                          />
                                          <input
                                            type="text"
                                            placeholder="Points (e.g., 50 points)"
                                            className="text-sm p-2 border border-slate-300 rounded"
                                            value={method.points || ''}
                                            onChange={(e) => {
                                              const updatedMethods = [...currentMethods];
                                              updatedMethods[index] = { ...method, points: e.target.value };
                                              updateSectionConfig(selectedSectionForConfig, field.key, updatedMethods);
                                            }}
                                          />
                                        </div>
                                        <textarea
                                          placeholder="Description (e.g., Earn points with every dollar spent)"
                                          className="w-full text-sm p-2 border border-slate-300 rounded resize-none"
                                          rows={2}
                                          value={method.description || ''}
                                          onChange={(e) => {
                                            const updatedMethods = [...currentMethods];
                                            updatedMethods[index] = { ...method, description: e.target.value };
                                            updateSectionConfig(selectedSectionForConfig, field.key, updatedMethods);
                                          }}
                                        />
                                        <div className="flex justify-between items-center mt-2">
                                          <select
                                            className="text-sm p-1 border border-slate-300 rounded"
                                            value={method.icon || 'dollar'}
                                            onChange={(e) => {
                                              const updatedMethods = [...currentMethods];
                                              updatedMethods[index] = { ...method, icon: e.target.value };
                                              updateSectionConfig(selectedSectionForConfig, field.key, updatedMethods);
                                            }}
                                          >
                                            <option value="dollar">💰 Dollar</option>
                                            <option value="clock">⏰ Clock</option>
                                            <option value="users">👥 Users</option>
                                            <option value="gift">🎁 Gift</option>
                                            <option value="star">⭐ Star</option>
                                            <option value="zap">⚡ Zap</option>
                                          </select>
                                          <button
                                            onClick={() => {
                                              const updatedMethods = currentMethods.filter((_: any, i: number) => i !== index);
                                              updateSectionConfig(selectedSectionForConfig, field.key, updatedMethods);
                                            }}
                                            className="text-red-500 text-sm px-2 py-1 hover:bg-red-50 rounded"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    ));
                                  })()}
                                  <button
                                    onClick={() => {
                                      const currentMethods = getCurrentValue(field.key) || [];
                                      const newMethod = {
                                        id: `method_${Date.now()}`,
                                        title: 'New Earning Method',
                                        description: 'Describe how customers earn points',
                                        points: '10 points',
                                        icon: 'star'
                                      };
                                      updateSectionConfig(selectedSectionForConfig, field.key, [...currentMethods, newMethod]);
                                    }}
                                    className="w-full p-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-slate-400 hover:text-slate-700"
                                  >
                                    + Add Earning Method
                                  </button>
                                </div>
                              )}
                              {field.type === 'tier_config' && (
                                <div className="space-y-4">
                                  {(() => {
                                    const currentTiers = getCurrentValue(field.key) || [
                                      { id: 'bronze', name: 'Bronze', pointsRequired: 0, color: '#cd7f32' },
                                      { id: 'silver', name: 'Silver', pointsRequired: 1000, color: '#c0c0c0' },
                                      { id: 'gold', name: 'Gold', pointsRequired: 5000, color: '#ffd700' }
                                    ];
                                    
                                    return (
                                      <div>
                                        <div className="flex items-center justify-between mb-3">
                                          <span className="text-sm font-medium text-slate-700">Loyalty Tiers (Max 3)</span>
                                          {currentTiers.length < 3 && (
                                            <button
                                              onClick={() => {
                                                const newTier = {
                                                  id: `tier_${Date.now()}`,
                                                  name: `Tier ${currentTiers.length + 1}`,
                                                  pointsRequired: (currentTiers[currentTiers.length - 1]?.pointsRequired || 0) + 1000,
                                                  color: '#6366f1'
                                                };
                                                updateSectionConfig(selectedSectionForConfig, field.key, [...currentTiers, newTier]);
                                              }}
                                              className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                            >
                                              + Add Tier
                                            </button>
                                          )}
                                        </div>
                                        
                                        {currentTiers.map((tier: any, index: number) => (
                                          <div key={tier.id || index} className="p-3 border border-slate-200 rounded-lg mb-3">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-sm font-medium text-slate-600">Tier {index + 1}</span>
                                              {currentTiers.length > 1 && (
                                                <button
                                                  onClick={() => {
                                                    const updatedTiers = currentTiers.filter((_: any, i: number) => i !== index);
                                                    updateSectionConfig(selectedSectionForConfig, field.key, updatedTiers);
                                                  }}
                                                  className="text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded"
                                                >
                                                  Remove
                                                </button>
                                              )}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                              <input
                                                type="text"
                                                placeholder="Tier name (e.g., Bronze)"
                                                className="text-sm p-2 border border-slate-300 rounded"
                                                value={tier.name || ''}
                                                onChange={(e) => {
                                                  const updatedTiers = [...currentTiers];
                                                  updatedTiers[index] = { ...tier, name: e.target.value };
                                                  updateSectionConfig(selectedSectionForConfig, field.key, updatedTiers);
                                                }}
                                              />
                                              <input
                                                type="number"
                                                placeholder="Points required"
                                                className="text-sm p-2 border border-slate-300 rounded"
                                                value={tier.pointsRequired || 0}
                                                onChange={(e) => {
                                                  const updatedTiers = [...currentTiers];
                                                  updatedTiers[index] = { ...tier, pointsRequired: parseInt(e.target.value) || 0 };
                                                  updateSectionConfig(selectedSectionForConfig, field.key, updatedTiers);
                                                }}
                                              />
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                              <label className="text-xs text-slate-600">Color:</label>
                                              <input
                                                type="color"
                                                className="w-8 h-6 border border-slate-300 rounded cursor-pointer"
                                                value={tier.color || '#6366f1'}
                                                onChange={(e) => {
                                                  const updatedTiers = [...currentTiers];
                                                  updatedTiers[index] = { ...tier, color: e.target.value };
                                                  updateSectionConfig(selectedSectionForConfig, field.key, updatedTiers);
                                                }}
                                              />
                                              <span className="text-xs text-slate-500">{tier.color || '#6366f1'}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                              {field.type === 'switch' && (
                                <label className="flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={getCurrentValue(field.key) || false}
                                    onChange={(e) => updateSectionConfig(selectedSectionForConfig, field.key, e.target.checked)}
                                  />
                                  <div className={`relative w-10 h-6 rounded-full transition-colors ${
                                    getCurrentValue(field.key) ? 'bg-blue-600' : 'bg-slate-200'
                                  }`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                      getCurrentValue(field.key) ? 'translate-x-5' : 'translate-x-1'
                                    }`} />
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
                            // Configuration is already saved via updateSectionConfig()
                            setConfigDrawerOpen(false)
                            // Force a re-render by updating the preview
                            setMockData(prev => ({ ...prev, lastUpdate: Date.now() }))
                            // Show success message
                            alert('✅ Configuration saved successfully! Check the live preview →')
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
