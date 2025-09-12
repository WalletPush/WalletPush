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
  const [programTemplates, setProgramTemplates] = useState<ProgramTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
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
      try {
        const response = await fetch('/api/templates')
        const result = await response.json()
        
        if (result.data) {
          setProgramTemplates(result.data.map((template: any) => ({
            id: template.id,
            name: template.name,
            type: template.pass_type || 'Unknown',
            description: template.description || 'No description available'
          })))
        }
      } catch (error) {
        console.error('Error loading program templates:', error)
        // Fallback to mock data if API fails
        setProgramTemplates([
          { id: '1', name: 'Blue Karma Loyalty', type: 'Loyalty', description: 'Tier-based loyalty program' },
          { id: '2', name: 'VIP Membership', type: 'Membership', description: 'Exclusive member benefits' },
          { id: '3', name: 'Store Credit Card', type: 'Store Card', description: 'Digital wallet store card' }
        ])
      } finally {
        setLoadingTemplates(false)
      }
    }

    loadProgramTemplates()
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

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return wizardData.pageTitle && wizardData.pageDescription
      case 2:
        return true // Optional step
      case 3:
        return wizardData.headline && wizardData.incentive
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
          <div className="text-center py-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">AI Landing Page Creator</h2>
            <p className="text-slate-600">Build your landing page step by step</p>
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
                  const associatedTemplate = programTemplates.find(t => t.id === page.program_id) || 
                    { name: 'Unknown Template', type: 'Unknown', description: 'Template not found' }
                  
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
                          <button className="flex items-center gap-1 px-3 py-1 text-slate-600 hover:text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50">
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
