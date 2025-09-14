'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  SparklesIcon,
  PhotoIcon,
  EyeIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import TemplateSelector from '@/components/templates/template-selector'

// Types and interfaces
interface WizardData {
  // Step 1: Basic Information
  pageTitle: string
  pageDescription: string
  socialImage: string | null
  customUrl: string
  pageUrlSlug: string
  programTemplate: string
  
  // Step 2: Brand Assets
  logo: string | null
  backgroundImage: string | null
  additionalImages: Array<{id: string, url: string, name: string}>
  
  // Step 3: Copy & Content
  headline: string
  incentive: string
  subHeader: string
  benefits: string[]
  additionalCopy: string
  
  // Step 4: Form Requirements
  requiredFields: string[]
  optionalFields: string[]
  
  // Step 5: Template Style
  selectedTemplate: string
  customTemplate: string
  
  // Step 6: Generated Result
  generatedHtml: string
}

interface ProgramTemplate {
  id: string
  name: string
  type: string
  description: string
}

interface LandingPageTemplate {
  id: string
  name: string
  preview: string
  description: string
  category: string
}

const STEPS = [
  { id: 1, title: 'Basic Information', description: 'Page title, description & URL' },
  { id: 2, title: 'Brand Assets', description: 'Logo, images & branding' },
  { id: 3, title: 'Copy & Content', description: 'Headlines & benefits' },
  { id: 4, title: 'Form Requirements', description: 'Signup form configuration' },
  { id: 5, title: 'Template Style', description: 'Choose your design' },
  { id: 6, title: 'AI Generation', description: 'Generate your landing page' }
]

const MOCK_LANDING_TEMPLATES: LandingPageTemplate[] = [
  { id: '1', name: 'Modern Minimalist', preview: '/templates/modern.jpg', description: 'Clean, simple design', category: 'Modern' },
  { id: '2', name: 'Bold & Colorful', preview: '/templates/bold.jpg', description: 'Eye-catching and vibrant', category: 'Creative' },
  { id: '3', name: 'Elegant Luxury', preview: '/templates/luxury.jpg', description: 'Premium, sophisticated feel', category: 'Premium' },
  { id: '4', name: 'Fun & Friendly', preview: '/templates/friendly.jpg', description: 'Playful and approachable', category: 'Casual' },
  { id: '5', name: 'Professional', preview: '/templates/professional.jpg', description: 'Corporate and trustworthy', category: 'Business' }
]

const FORM_FIELDS = [
  { id: 'firstName', label: 'First Name', required: true },
  { id: 'lastName', label: 'Last Name', required: false },
  { id: 'email', label: 'Email Address', required: true },
  { id: 'phone', label: 'Phone Number', required: false },
  { id: 'dateOfBirth', label: 'Date of Birth', required: false },
  { id: 'address', label: 'Address', required: false },
  { id: 'city', label: 'City', required: false },
  { id: 'zipCode', label: 'ZIP Code', required: false },
  { id: 'company', label: 'Company', required: false }
]

export default function DistributionPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create')
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [programTemplates, setProgramTemplates] = useState<ProgramTemplate[]>([
    { id: 'temp-blue-karma-1', name: 'Blue Karma Loyalty', type: 'storeCard', description: 'Blue Karma loyalty program template' }
  ])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [savedLandingPages, setSavedLandingPages] = useState<any[]>([])
  const [loadingSavedPages, setLoadingSavedPages] = useState(false)
  const [wizardData, setWizardData] = useState<WizardData>({
    // Step 1
    pageTitle: '',
    pageDescription: '',
    socialImage: null,
    customUrl: '',
    pageUrlSlug: '',
    programTemplate: '',
    
    // Step 2
    logo: null,
    backgroundImage: null,
    additionalImages: [],
    
    // Step 3
    headline: '',
    incentive: '',
    subHeader: '',
    benefits: [''],
    additionalCopy: '',
    
    // Step 4
    requiredFields: ['firstName', 'email'],
    optionalFields: [],
    
    // Step 5
    selectedTemplate: '',
    customTemplate: '',
    
    // Step 6
    generatedHtml: ''
  })

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null)
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const socialImageInputRef = useRef<HTMLInputElement>(null)
  const additionalImagesInputRef = useRef<HTMLInputElement>(null)

  // Load program templates from API
  useEffect(() => {
    const loadProgramTemplates = async () => {
      console.log('Loading program templates...')
      try {
        const response = await fetch('/api/templates')
        console.log('API Response status:', response.status)
        const result = await response.json()
        console.log('API Result:', result)
        
        if (result.data && result.data.length > 0) {
          const templates = result.data.map((template: any) => ({
            id: template.id,
            name: template.name,
            type: template.pass_type || 'Unknown',
            description: template.description || 'No description available'
          }))
          console.log('Setting templates from API:', templates)
          setProgramTemplates(templates)
        } else {
          console.log('No templates found in result.data, keeping initial templates')
        }
      } catch (error) {
        console.error('Error loading program templates:', error)
        // Keep the initial templates if API fails
      } finally {
        console.log('Setting loadingTemplates to false')
        setLoadingTemplates(false)
      }
    }

    // Add a small delay to ensure component is mounted
    const timeoutId = setTimeout(() => {
      loadProgramTemplates()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [])

  // Load saved landing pages
  const loadSavedLandingPages = async () => {
    setLoadingSavedPages(true)
    try {
      const response = await fetch('/api/landing-pages')
      const result = await response.json()
      
      if (result.data) {
        setSavedLandingPages(result.data)
      }
    } catch (error) {
      console.error('Error loading saved landing pages:', error)
    } finally {
      setLoadingSavedPages(false)
    }
  }

  // Load saved pages when switching to saved tab
  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedLandingPages()
    }
  }, [activeTab])

  const handleImageUpload = async (file: File, type: 'logo' | 'background' | 'social' | 'additional') => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) throw new Error('Upload failed')
      
      const result = await response.json()
      
      if (type === 'logo') {
        setWizardData(prev => ({
          ...prev,
          logo: result.url
        }))
      } else if (type === 'background') {
        setWizardData(prev => ({
          ...prev,
          backgroundImage: result.url
        }))
      } else if (type === 'social') {
        setWizardData(prev => ({
          ...prev,
          socialImage: result.url
        }))
      } else if (type === 'additional') {
        setWizardData(prev => ({
          ...prev,
          additionalImages: [...prev.additionalImages, {
            id: Date.now().toString(),
            url: result.url,
            name: file.name
          }]
        }))
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    }
  }

  const removeAdditionalImage = (id: string) => {
    setWizardData(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter(img => img.id !== id)
    }))
  }

  const addBenefit = () => {
    setWizardData(prev => ({
      ...prev,
      benefits: [...prev.benefits, '']
    }))
  }

  const updateBenefit = (index: number, value: string) => {
    setWizardData(prev => ({
      ...prev,
      benefits: prev.benefits.map((benefit, i) => i === index ? value : benefit)
    }))
  }

  const removeBenefit = (index: number) => {
    setWizardData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }))
  }

  const toggleFormField = (fieldId: string, isRequired: boolean) => {
    setWizardData(prev => {
      if (isRequired) {
        return {
          ...prev,
          requiredFields: prev.requiredFields.includes(fieldId) 
            ? prev.requiredFields.filter(f => f !== fieldId)
            : [...prev.requiredFields, fieldId],
          optionalFields: prev.optionalFields.filter(f => f !== fieldId)
        }
      } else {
        return {
          ...prev,
          optionalFields: prev.optionalFields.includes(fieldId)
            ? prev.optionalFields.filter(f => f !== fieldId)
            : [...prev.optionalFields, fieldId],
          requiredFields: prev.requiredFields.filter(f => f !== fieldId)
        }
      }
    })
  }

  const generateLandingPage = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-landing-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(wizardData)
      })

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      setWizardData(prev => ({
        ...prev,
        generatedHtml: result.data?.html || 'Generated with mock data'
      }))

    } catch (error) {
      console.error('Error generating landing page:', error)
      alert('Failed to generate landing page. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = () => {
    if (wizardData.generatedHtml) {
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(wizardData.generatedHtml)
        newWindow.document.close()
      }
    }
  }

  const handleSaveAndPublish = async () => {
    if (!wizardData.generatedHtml) {
      alert('Please generate a landing page first.')
      return
    }

    try {
      const response = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: wizardData.pageTitle || 'Untitled Landing Page',
          title: wizardData.pageTitle,
          description: wizardData.pageDescription,
          custom_url: wizardData.customUrl,
          html_content: wizardData.generatedHtml,
          settings: wizardData,
          status: 'published'
        })
      })

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      alert(`Landing page "${wizardData.pageTitle}" saved and published successfully!`)
    } catch (error) {
      console.error('Error saving landing page:', error)
      alert('Failed to save landing page. Please try again.')
    }
  }

  const handleRegenerate = () => {
    setWizardData(prev => ({
      ...prev,
      generatedHtml: ''
    }))
    generateLandingPage()
  }

  const handleEditLandingPage = (page: any) => {
    try {
      // Load the saved page data back into the wizard
      const settings = page.settings || {}
      
      setWizardData({
        // Step 1
        pageTitle: page.name || '',
        pageDescription: settings.pageDescription || '',
        socialImage: settings.socialImage || null,
        customUrl: page.custom_url || '',
        pageUrlSlug: settings.pageUrlSlug || '',
        programTemplate: page.program_id || '',
        
        // Step 2  
        logo: page.logo_url || settings.logo || null,
        backgroundImage: page.background_image_url || settings.backgroundImage || null,
        additionalImages: settings.additionalImages || [],
        
        // Step 3
        headline: settings.headline || '',
        incentive: settings.incentive || '',
        subHeader: settings.subHeader || '',
        benefits: settings.benefits || [''],
        additionalCopy: settings.additionalCopy || '',
        
        // Step 4
        requiredFields: settings.requiredFields || ['firstName', 'email'],
        optionalFields: settings.optionalFields || [],
        
        // Step 5
        selectedTemplate: settings.selectedTemplate || '',
        customTemplate: settings.customTemplate || '',
        
        // Step 6
        generatedHtml: page.generated_html || ''
      })
      
      // Switch to create tab and go to the last step (step 6)
      setActiveTab('create')
      setCurrentStep(6)
    } catch (error) {
      console.error('Error loading landing page for editing:', error)
      alert('Failed to load landing page for editing. Please try again.')
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return wizardData.pageTitle && wizardData.pageDescription && wizardData.customUrl && wizardData.programTemplate
      case 2:
        return wizardData.logo && wizardData.backgroundImage
      case 3:
        return wizardData.headline && wizardData.incentive && wizardData.subHeader && wizardData.benefits.some(b => b.trim())
      case 4:
        return wizardData.requiredFields.length > 0
      case 5:
        return wizardData.selectedTemplate || wizardData.customTemplate
      case 6:
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (currentStep < 6 && canProceedToNext()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome to the AI Landing Page Builder</h2>
              <p className="text-slate-600">Please fill in each of the fields and then click next to continue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Page Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="The title of your landing page"
                  value={wizardData.pageTitle}
                  onChange={(e) => setWizardData(prev => ({ ...prev, pageTitle: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Page Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Description of your landing page"
                  rows={3}
                  value={wizardData.pageDescription}
                  onChange={(e) => setWizardData(prev => ({ ...prev, pageDescription: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Social Image
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  {wizardData.socialImage ? (
                    <div className="space-y-3">
                      <img src={wizardData.socialImage} alt="Social preview" className="w-full h-32 object-cover rounded-lg" />
                      <button
                        onClick={() => setWizardData(prev => ({ ...prev, socialImage: null }))}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div>
                      <PhotoIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 mb-3">Upload a social image for sharing</p>
                      <input
                        ref={socialImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageUpload(e.target.files[0], 'social')
                            e.target.value = ''
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        onClick={() => socialImageInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Choose Image
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Page URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="loyalty.xyz.com/join"
                  value={wizardData.customUrl}
                  onChange={(e) => setWizardData(prev => ({ ...prev, customUrl: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Program Template <span className="text-red-500">*</span>
              </label>
              <select
                value={wizardData.programTemplate}
                onChange={(e) => setWizardData(prev => ({ ...prev, programTemplate: e.target.value }))}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a program template</option>
                {loadingTemplates ? (
                  <option disabled>Loading templates...</option>
                ) : (
                  programTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.type}) - {template.description}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Upload Your Brand Assets</h2>
              <p className="text-slate-600">Add your logo, background image, and any additional images you'd like to use</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Logo for Header <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  {wizardData.logo ? (
                    <div className="space-y-3">
                      <img src={wizardData.logo} alt="Logo preview" className="w-full h-32 object-contain rounded-lg" />
                      <button
                        onClick={() => setWizardData(prev => ({ ...prev, logo: null }))}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Logo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <PhotoIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 mb-3">Upload your logo</p>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageUpload(e.target.files[0], 'logo')
                            e.target.value = ''
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Choose Logo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Background Image <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  {wizardData.backgroundImage ? (
                    <div className="space-y-3">
                      <img src={wizardData.backgroundImage} alt="Background preview" className="w-full h-32 object-cover rounded-lg" />
                      <button
                        onClick={() => setWizardData(prev => ({ ...prev, backgroundImage: null }))}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Background
                      </button>
                    </div>
                  ) : (
                    <div>
                      <PhotoIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 mb-3">Upload background image</p>
                      <input
                        ref={backgroundInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageUpload(e.target.files[0], 'background')
                            e.target.value = ''
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        onClick={() => backgroundInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Choose Background
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Additional Images (Max 5)
              </label>
              <div className="space-y-4">
                {wizardData.additionalImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {wizardData.additionalImages.map((image) => (
                      <div key={image.id} className="relative">
                        <img src={image.url} alt={image.name} className="w-full h-24 object-cover rounded-lg" />
                        <button
                          onClick={() => removeAdditionalImage(image.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {wizardData.additionalImages.length < 5 && (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                    <SparklesIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 mb-3">Add additional images</p>
                    <input
                      ref={additionalImagesInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleImageUpload(e.target.files[0], 'additional')
                          e.target.value = ''
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      onClick={() => additionalImagesInputRef.current?.click()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Add Image
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Copy & Content</h2>
              <p className="text-slate-600">Create compelling headlines and messaging for your landing page</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Headline Copy <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="EX: Join our membership program today"
                  value={wizardData.headline}
                  onChange={(e) => setWizardData(prev => ({ ...prev, headline: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Incentive <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="EX: 20% Discount on your next visit"
                  value={wizardData.incentive}
                  onChange={(e) => setWizardData(prev => ({ ...prev, incentive: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Sub Header <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Description of what users will gain by joining"
                  rows={3}
                  value={wizardData.subHeader}
                  onChange={(e) => setWizardData(prev => ({ ...prev, subHeader: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Benefits <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {wizardData.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Enter a benefit"
                        value={benefit}
                        onChange={(e) => updateBenefit(index, e.target.value)}
                        className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {wizardData.benefits.length > 1 && (
                        <button
                          onClick={() => removeBenefit(index)}
                          className="p-3 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addBenefit}
                    className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-slate-400 hover:text-slate-700 flex items-center justify-center gap-2"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    Add Another Benefit
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Additional Copy
                </label>
                <textarea
                  placeholder="Write any additional copy you desire"
                  rows={4}
                  value={wizardData.additionalCopy}
                  onChange={(e) => setWizardData(prev => ({ ...prev, additionalCopy: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Sign Up Form Requirements</h2>
              <p className="text-slate-600">Choose which fields to include in your signup form</p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Form Fields</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FORM_FIELDS.map((field) => {
                    const isRequired = wizardData.requiredFields.includes(field.id)
                    const isOptional = wizardData.optionalFields.includes(field.id)
                    const isIncluded = isRequired || isOptional
                    const isLocked = field.id === 'firstName' || field.id === 'email'

                    return (
                      <div key={field.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div>
                          <span className="font-medium text-slate-900">{field.label}</span>
                          {isLocked && <span className="text-xs text-slate-500 ml-2">(Required)</span>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => !isLocked && toggleFormField(field.id, !isRequired)}
                            disabled={isLocked && isRequired}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              isRequired 
                                ? 'bg-red-100 text-red-700 border border-red-200' 
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-600'
                            } ${isLocked && isRequired ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          >
                            Required
                          </button>
                          <button
                            onClick={() => !isLocked && toggleFormField(field.id, !isOptional)}
                            disabled={isLocked}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              isOptional 
                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600'
                            } ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          >
                            Optional
                          </button>
                          {!isIncluded && !isLocked && (
                            <span className="px-3 py-1 rounded text-xs font-medium bg-slate-200 text-slate-500">
                              Not Included
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Selected Fields Summary:</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>Required:</strong> {wizardData.requiredFields.map(id => FORM_FIELDS.find(f => f.id === id)?.label).join(', ')}</p>
                  {wizardData.optionalFields.length > 0 && (
                    <p><strong>Optional:</strong> {wizardData.optionalFields.map(id => FORM_FIELDS.find(f => f.id === id)?.label).join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <TemplateSelector
              templateType="distribution"
              selectedTemplate={wizardData.selectedTemplate}
              onTemplateSelect={(template) => {
                console.log('🏢 Business selected template:', template)
                
                // Apply template data to wizard data
                setWizardData(prev => ({
                  ...prev,
                  selectedTemplate: template.id,
                  // Apply template content to previous steps
                  headline: template.templateData.headline,
                  subHeader: template.templateData.subheadline,
                  incentive: template.templateData.callToAction,
                  benefits: template.templateData.features || prev.benefits,
                  additionalCopy: template.templateData.valueProposition || prev.additionalCopy,
                  customTemplate: `
                    /* Template: ${template.name} */
                    :root {
                      --template-primary: ${template.templateData.primaryColor};
                      --template-secondary: ${template.templateData.secondaryColor};
                      --template-accent: ${template.templateData.accentColor};
                      --template-font: ${template.templateData.fontFamily};
                    }
                  `
                }))
                
                // Show success message
                alert(`✅ Template "${template.name}" applied! Your previous steps have been updated with the template content. You can now customize it for your specific program.`)
              }}
            />
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Generate Your Landing Page</h2>
              <p className="text-slate-600">Review your settings and generate your AI-powered landing page</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-slate-900 mb-4">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Page Title:</strong> {wizardData.pageTitle}</p>
                  <p><strong>URL:</strong> {wizardData.customUrl}</p>
                  <p><strong>Headline:</strong> {wizardData.headline}</p>
                  <p><strong>Incentive:</strong> {wizardData.incentive}</p>
                </div>
                <div>
                  <p><strong>Program:</strong> {programTemplates.find(t => t.id === wizardData.programTemplate)?.name || 'None'}</p>
                  <p><strong>Form Fields:</strong> {wizardData.requiredFields.length + wizardData.optionalFields.length} fields</p>
                  <p><strong>Benefits:</strong> {wizardData.benefits.filter(b => b.trim()).length} items</p>
                  <p><strong>Template:</strong> {wizardData.customTemplate === 'custom' ? 'Custom AI Template' : MOCK_LANDING_TEMPLATES.find(t => t.id === wizardData.selectedTemplate)?.name || 'None'}</p>
                </div>
              </div>
            </div>

            {!wizardData.generatedHtml ? (
              <div className="text-center">
                <button
                  onClick={generateLandingPage}
                  disabled={isGenerating}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Generating Landing Page...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5" />
                      Generate Landing Page
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-900">Generated Landing Page</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={handlePreview}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Preview
                    </button>
                    <button 
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      Regenerate
                    </button>
                    <button 
                      onClick={handleSaveAndPublish}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                      Save & Publish
                    </button>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg h-[600px] bg-white">
                  {wizardData.generatedHtml ? (
                    <iframe
                      srcDoc={wizardData.generatedHtml}
                      className="w-full h-full rounded-lg"
                      title="Generated Landing Page Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      Landing page preview will appear here
                    </div>
                  )}
                </div>
                
                {/* Chat with Claude for Edits */}
                <div className="mt-6 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-3">Chat with Claude for Edits</h4>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
                      <p className="text-sm text-slate-600">
                        Ask Claude to make changes to your landing page. For example:
                        "Make the headline larger", "Change the background color to blue", "Add a testimonials section"
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ask Claude to make changes..."
                        className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="dashboard-header">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Distribution</h1>
          <p className="text-slate-600 mt-1">AI-powered landing page builder</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Create New Landing Page
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'saved'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Saved Landing Pages
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          {/* Progress Steps */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex justify-between items-center">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep === step.id 
                      ? 'border-blue-500 bg-blue-500 text-white' 
                      : currentStep > step.id
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-slate-300 text-slate-500'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckIcon className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p className={`text-sm font-semibold ${currentStep === step.id ? 'text-blue-600' : currentStep > step.id ? 'text-green-600' : 'text-slate-500'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-500">{step.description}</p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`hidden md:block w-16 h-0.5 ml-4 ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-300'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="p-6">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="p-6 border-t border-slate-200 flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Previous
            </button>

            <div className="text-sm text-slate-500">
              Step {currentStep} of {STEPS.length}
            </div>

            <button
              onClick={nextStep}
              disabled={currentStep === 6 || !canProceedToNext()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Saved Landing Pages</h3>
            <p className="text-slate-600 mt-1">Manage your previously created landing pages</p>
          </div>
          
          <div className="p-6">
            {loadingSavedPages ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-slate-600 mt-2">Loading saved pages...</p>
              </div>
            ) : savedLandingPages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No saved landing pages</h3>
                <p className="text-slate-600 mb-4">Create your first landing page to see it here</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Landing Page
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedLandingPages.map((page) => {
                  // Find associated template by program_id
                  const associatedTemplate = programTemplates.find(t => t.id === page.program_id) || 
                    // Fallback: try to find by name if IDs don't match
                    programTemplates.find(t => t.name && page.ai_prompt && page.ai_prompt.includes(t.name)) ||
                    // Final fallback
                    { name: 'Blue Karma Loyalty', type: 'Store Card', description: 'Default template' }
                  
                  return (
                    <div key={page.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-slate-900 mb-2">{page.name}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">URL:</span>
                              <p className="font-medium text-blue-600">{page.custom_url}</p>
                            </div>
                            <div>
                              <span className="text-slate-500">Pass Template:</span>
                              <p className="font-medium">{associatedTemplate.name}</p>
                              <p className="text-xs text-slate-500">{associatedTemplate.type}</p>
                            </div>
                            <div>
                              <span className="text-slate-500">Status:</span>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                page.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {page.is_published ? 'Published' : 'Draft'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Created:</span>
                              <p className="font-medium">{new Date(page.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button 
                            onClick={() => {
                              const newWindow = window.open('', '_blank')
                              if (newWindow && page.generated_html) {
                                newWindow.document.write(page.generated_html)
                                newWindow.document.close()
                              }
                            }}
                            className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md hover:bg-blue-50"
                          >
                            <EyeIcon className="w-4 h-4" />
                            Preview
                          </button>
                          <button 
                            onClick={() => handleEditLandingPage(page)}
                            className="flex items-center gap-1 px-3 py-1 text-slate-600 hover:text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
                          >
                            <PencilIcon className="w-4 h-4" />
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
