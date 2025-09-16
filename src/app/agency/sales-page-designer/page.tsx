'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  SparklesIcon,
  PhotoIcon,
  EyeIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  PencilIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'

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
  headline: string // H1 - Main headline
  subHeadline: string // H2 - Sub-headline
  keyBenefits: string[] // 3-5 key benefits
  howItWorks: Array<{step: number, title: string, description: string}> // 3 steps
  riskReversal: string[] // Risk reversal elements
  
  // Step 4: Pricing Packages
  selectedPackages: Array<{
    id: string
    name: string
    description: string
    price: number
    passLimit: number
    programLimit: number
    staffLimit: number
    features: string[]
    isPopular: boolean
  }>
  
  // Step 5: Give Claude More Info
  primaryColor: string
  secondaryColor: string
  imageUrls: {
    hero?: string
    logo?: string
    background?: string
    feature1?: string
    feature2?: string
    feature3?: string
  }
  customInstructions: string
  
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
  { id: 4, title: 'Pricing Packages', description: 'Configure your pricing tiers' },
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

export default function SalesPageDesignerPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create')
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [programTemplates, setProgramTemplates] = useState<ProgramTemplate[]>([
    { id: 'temp-blue-karma-1', name: 'Blue Karma Loyalty', type: 'storeCard', description: 'Blue Karma loyalty program template' }
  ])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [savedLandingPages, setSavedLandingPages] = useState<any[]>([])
  const [loadingSavedPages, setLoadingSavedPages] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [isChatting, setIsChatting] = useState(false)
  const [currentHomepageId, setCurrentHomepageId] = useState<string | null>(null)
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
    subHeadline: '',
    keyBenefits: ['', '', ''],
    howItWorks: [
      { step: 1, title: '', description: '' },
      { step: 2, title: '', description: '' },
      { step: 3, title: '', description: '' }
    ],
    riskReversal: [''],
    
    // Step 4
    selectedPackages: [
      {
        id: '1',
        name: 'Starter',
        description: 'Perfect for small businesses getting started',
        price: 29,
        passLimit: 1000,
        programLimit: 3,
        staffLimit: 2,
        features: ['Custom Branding', 'Basic Analytics', '2 Staff Accounts'],
        isPopular: false
      },
      {
        id: '2',
        name: 'Business',
        description: 'Ideal for growing businesses',
        price: 69,
        passLimit: 5000,
        programLimit: 10,
        staffLimit: 5,
        features: ['Advanced Analytics', 'API Access', 'Priority Support', 'White-label Domain'],
        isPopular: true
      },
      {
        id: '3',
        name: 'Pro',
        description: 'Full-featured solution for enterprises',
        price: 97,
        passLimit: 10000,
        programLimit: 20,
        staffLimit: -1,
        features: ['All Features', 'Unlimited Staff', 'SMTP Configuration', 'Webhook Support'],
        isPopular: false
      }
    ],
    
    // Step 5
    primaryColor: '#3862EA',
    secondaryColor: '#10B981',
    imageUrls: {},
    customInstructions: '',
    
    // Step 6
    generatedHtml: ''
  })

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null)
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const socialImageInputRef = useRef<HTMLInputElement>(null)
  const additionalImagesInputRef = useRef<HTMLInputElement>(null)

  // Fetch saved pages when switching to saved tab
  useEffect(() => {
    if (activeTab === 'saved') {
      fetchSavedPages()
    }
  }, [activeTab])

  const fetchSavedPages = async () => {
    setLoadingSavedPages(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.error('Not authenticated')
        setLoadingSavedPages(false)
        return
      }

      const response = await fetch('/api/agency/sales-pages', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSavedLandingPages(data.pages || [])
        // Also check which page is currently the homepage
        await checkCurrentHomepage(data.pages || [])
      } else {
        console.error('Failed to fetch saved pages:', response.status)
      }
    } catch (error) {
      console.error('Error fetching saved pages:', error)
    } finally {
      setLoadingSavedPages(false)
    }
  }

  const checkCurrentHomepage = async (pages = savedLandingPages) => {
    try {
      const response = await fetch('/api/admin/get-homepage')
      if (response.ok) {
        const data = await response.json()
        if (data.html) {
          // Try to find which saved page matches the current homepage
          const currentPage = pages.find(page => 
            page.html_content === data.html
          )
          setCurrentHomepageId(currentPage?.id || 'custom')
        } else {
          setCurrentHomepageId(null) // React homepage is active
        }
      }
    } catch (error) {
      // Ignore errors, just assume React homepage
      setCurrentHomepageId(null)
    }
  }

  // Load program templates from API
  useEffect(() => {
    const loadProgramTemplates = async () => {
      try {
        setLoadingTemplates(true)
        // TODO: Replace with actual API call
        // const response = await fetch('/api/program-templates')
        // const data = await response.json()
        // setProgramTemplates(data.templates || [])
        
        // For now, use mock data
        setProgramTemplates([
          { id: 'temp-blue-karma-1', name: 'Blue Karma Loyalty', type: 'storeCard', description: 'Blue Karma loyalty program template' }
        ])
      } catch (error) {
        console.error('Failed to load program templates:', error)
      } finally {
        setLoadingTemplates(false)
      }
    }

    loadProgramTemplates()
  }, [])

  // Load saved landing pages
  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedPages()
    }
  }, [activeTab])

  const loadSavedPages = async () => {
    try {
      setLoadingSavedPages(true)
      // TODO: Replace with actual API call
      // const response = await fetch('/api/landing-pages')
      // const data = await response.json()
      // setSavedLandingPages(data.pages || [])
      
      // For now, use mock data
      setSavedLandingPages([])
    } catch (error) {
      console.error('Failed to load saved pages:', error)
    } finally {
      setLoadingSavedPages(false)
    }
  }

  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }))
  }

  const addKeyBenefit = () => {
    if (wizardData.keyBenefits.length < 5) {
      setWizardData(prev => ({
        ...prev,
        keyBenefits: [...prev.keyBenefits, '']
      }))
    }
  }

  const updateKeyBenefit = (index: number, value: string) => {
    setWizardData(prev => ({
      ...prev,
      keyBenefits: prev.keyBenefits.map((benefit, i) => i === index ? value : benefit)
    }))
  }

  const removeKeyBenefit = (index: number) => {
    if (wizardData.keyBenefits.length > 3) {
      setWizardData(prev => ({
        ...prev,
        keyBenefits: prev.keyBenefits.filter((_, i) => i !== index)
      }))
    }
  }

  const updateHowItWorks = (index: number, field: 'title' | 'description', value: string) => {
    setWizardData(prev => ({
      ...prev,
      howItWorks: prev.howItWorks.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }))
  }

  const addRiskReversal = () => {
    setWizardData(prev => ({
      ...prev,
      riskReversal: [...prev.riskReversal, '']
    }))
  }

  const updateRiskReversal = (index: number, value: string) => {
    setWizardData(prev => ({
      ...prev,
      riskReversal: prev.riskReversal.map((item, i) => i === index ? value : item)
    }))
  }

  const removeRiskReversal = (index: number) => {
    if (wizardData.riskReversal.length > 1) {
      setWizardData(prev => ({
        ...prev,
        riskReversal: prev.riskReversal.filter((_, i) => i !== index)
      }))
    }
  }

  const updatePackage = (packageId: string, updates: any) => {
    setWizardData(prev => ({
      ...prev,
      selectedPackages: prev.selectedPackages.map(pkg => 
        pkg.id === packageId ? { ...pkg, ...updates } : pkg
      )
    }))
  }

  const togglePackagePopular = (packageId: string) => {
    setWizardData(prev => ({
      ...prev,
      selectedPackages: prev.selectedPackages.map(pkg => ({
        ...pkg,
        isPopular: pkg.id === packageId ? !pkg.isPopular : false
      }))
    }))
  }

  const handleFileUpload = async (file: File, type: 'logo' | 'background' | 'social' | 'additional') => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      // TODO: Replace with actual upload API
      // const response = await fetch('/api/upload', {
      //   method: 'POST',
      //   body: formData
      // })
      // const data = await response.json()
      
      // For now, create a mock URL
      const mockUrl = URL.createObjectURL(file)
      
      if (type === 'logo') {
        updateWizardData({ logo: mockUrl })
      } else if (type === 'background') {
        updateWizardData({ backgroundImage: mockUrl })
      } else if (type === 'social') {
        updateWizardData({ socialImage: mockUrl })
      } else if (type === 'additional') {
        const newImage = {
          id: Date.now().toString(),
          url: mockUrl,
          name: file.name
        }
        updateWizardData({
          additionalImages: [...wizardData.additionalImages, newImage]
        })
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const removeAdditionalImage = (id: string) => {
    updateWizardData({
      additionalImages: wizardData.additionalImages.filter(img => img.id !== id)
    })
  }

  const toggleRequiredField = (fieldId: string) => {
    const field = FORM_FIELDS.find(f => f.id === fieldId)
    if (!field) return

    if (field.required) return // Can't toggle required fields

    if (wizardData.requiredFields.includes(fieldId)) {
      // Move from required to optional
      updateWizardData({
        requiredFields: wizardData.requiredFields.filter(id => id !== fieldId),
        optionalFields: [...wizardData.optionalFields, fieldId]
      })
    } else if (wizardData.optionalFields.includes(fieldId)) {
      // Remove from optional
      updateWizardData({
        optionalFields: wizardData.optionalFields.filter(id => id !== fieldId)
      })
    } else {
      // Add to optional
      updateWizardData({
        optionalFields: [...wizardData.optionalFields, fieldId]
      })
    }
  }

  const generateLandingPage = async () => {
    try {
      setIsGenerating(true)
      
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('You must be logged in to generate sales pages.')
        return
      }
      
      const response = await fetch('/api/agency/generate-sales-page', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ wizardData })
      })
      
      const data = await response.json()
      
      if (data.error) {
        console.error('Generation failed:', data.error)
        // Still show mock HTML as fallback
        const mockHtml = generateFallbackHTML()
        updateWizardData({ generatedHtml: mockHtml })
        return
      }
      
      updateWizardData({ generatedHtml: data.data.html })
      
    } catch (error) {
      console.error('Generation failed:', error)
      // Fallback to mock HTML
      const mockHtml = generateFallbackHTML()
      updateWizardData({ generatedHtml: mockHtml })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateFallbackHTML = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${wizardData.pageTitle}</title>
    <meta name="description" content="${wizardData.pageDescription}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-2xl mx-auto text-center p-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">${wizardData.headline}</h1>
            <p class="text-xl text-gray-600 mb-8">${wizardData.subHeadline}</p>
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-semibold mb-4">Your sales page is being generated...</h2>
                <p class="text-gray-600">This is a fallback preview. The actual page will be generated with AI.</p>
            </div>
        </div>
    </div>
</body>
</html>`
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
      alert('Please generate a sales page first.')
      return
    }

    try {
      const supabase = createClient()
      
      // Get current session to include auth headers
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('You must be logged in to save sales pages.')
        return
      }

      const requestData = {
        name: wizardData.pageTitle || 'Untitled Sales Page',
        title: wizardData.pageTitle,
        description: wizardData.pageDescription,
        custom_url: wizardData.customUrl,
        html_content: wizardData.generatedHtml,
        settings: wizardData,
        status: 'published'
      }

      console.log('🚀 Sending save request:', { 
        ...requestData, 
        html_content: requestData.html_content ? `${requestData.html_content.substring(0, 100)}...` : 'null',
        settings: 'object'
      })

      const response = await fetch('/api/agency/sales-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()
      
      // Debug the full response
      console.log('🔍 Save response:', { status: response.status, ok: response.ok, result })
      
      if (!response.ok || result.error) {
        const errorMsg = result.error || `Server error: ${response.status}`
        console.error('❌ Save error:', errorMsg)
        throw new Error(errorMsg)
      }

      alert(`Sales page "${wizardData.pageTitle}" saved and published successfully!`)
      
      // Refresh saved pages list if we're on the saved tab
      if (activeTab === 'saved') {
        fetchSavedPages()
      }
    } catch (error) {
      console.error('Error saving sales page:', error)
      alert(`SAVE FAILED: ${error.message}`)
    }
  }

  const handleRegenerate = () => {
    setWizardData(prev => ({
      ...prev,
      generatedHtml: ''
    }))
    generateLandingPage()
  }

  const handleChatWithClaude = async () => {
    if (!chatMessage.trim() || !wizardData.generatedHtml) return
    
    setIsChatting(true)
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('You must be logged in to chat with Claude.')
        return
      }

      // Add user message to chat history
      const userMessage = { role: 'user' as const, content: chatMessage }
      setChatHistory(prev => [...prev, userMessage])
      setChatMessage('')

      const response = await fetch('/api/agency/chat-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: chatMessage,
          currentHtml: wizardData.generatedHtml,
          wizardData: wizardData
        })
      })

      const data = await response.json()
      
      if (data.error) {
        alert('Failed to get response from Claude. Please try again.')
        return
      }

      // Add Claude's response to chat history
      const assistantMessage = { role: 'assistant' as const, content: data.message }
      setChatHistory(prev => [...prev, assistantMessage])
      
      // Update the HTML if Claude provided an updated version
      if (data.updatedHtml) {
        updateWizardData({ generatedHtml: data.updatedHtml })
      }
      
    } catch (error) {
      console.error('Chat error:', error)
      alert('Failed to chat with Claude. Please try again.')
    } finally {
      setIsChatting(false)
    }
  }


  const handleEditPage = (page: any) => {
    // Load the saved page data into the wizard
    setWizardData({
      pageTitle: page.page_title || '',
      pageDescription: page.page_subtitle || '',
      socialImage: null,
      customUrl: page.custom_domain || '',
      pageUrlSlug: page.page_slug || '',
      programTemplate: '',
      
      logo: page.logo_url || null,
      backgroundImage: page.hero_image_url || null,
      additionalImages: [],
      
      headline: page.headline || '',
      subHeadline: page.subheadline || '',
      keyBenefits: page.value_proposition ? page.value_proposition.split(', ') : ['', '', ''],
      howItWorks: page.features || [
        { step: 1, title: '', description: '' },
        { step: 2, title: '', description: '' },
        { step: 3, title: '', description: '' }
      ],
      riskReversal: [''],
      
      selectedPackages: page.selected_packages || [],
      
      selectedTemplate: page.template_style || 'custom',
      customTemplate: page.template_style === 'custom' ? 'custom' : '',
      
      generatedHtml: page.html_content || ''
    })
    
    // Switch to create tab and go to the last step to show the generated content
    setActiveTab('create')
    setCurrentStep(6)
  }

  const handleViewPage = (page: any) => {
    if (page.html_content) {
      // Open in new window
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(page.html_content)
        newWindow.document.close()
      }
    } else {
      alert('No preview available for this page.')
    }
  }

  const handleSaveAsHomepage = async (page: any) => {
    const isCurrentHomepage = currentHomepageId === page.id
    
    if (isCurrentHomepage) {
      // Toggle back to React homepage
      const confirmed = confirm(
        `This will restore the default React homepage. Are you sure?`
      )
      
      if (!confirmed) return
      
      try {
        const response = await fetch('/api/admin/reset-homepage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        const result = await response.json()
        
        if (!response.ok || result.error) {
          throw new Error(result.error || `Server error: ${response.status}`)
        }

        setCurrentHomepageId(null)
        alert('✅ Homepage reset to default! React homepage is now active.')
      } catch (error) {
        alert(`❌ RESET FAILED: ${error.message}`)
      }
    } else {
      // Set as homepage
      if (!page.html_content) {
        alert('This page has no content to use as homepage.')
        return
      }

      const confirmed = confirm(
        `This will replace your current homepage with "${page.page_title || page.page_name}". Are you sure?`
      )
      
      if (!confirmed) return

      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          alert('You must be logged in to save homepage.')
          return
        }

        const response = await fetch('/api/admin/save-homepage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            htmlContent: page.html_content,
            pageTitle: page.page_title || page.page_name,
            pageDescription: page.page_subtitle || page.meta_description || 'Agency Homepage'
          })
        })

        const result = await response.json()
        
        if (!response.ok || result.error) {
          throw new Error(result.error || `Server error: ${response.status}`)
        }

        setCurrentHomepageId(page.id)
        alert('✅ Homepage saved successfully! Your sales page is now live at http://localhost:3000/')
      } catch (error) {
        alert(`❌ SAVE HOMEPAGE FAILED: ${error.message}`)
      }
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return wizardData.pageTitle && wizardData.pageDescription
      case 2:
        return true // Optional step
      case 3:
        return wizardData.headline && wizardData.subHeadline && 
               wizardData.keyBenefits.filter(b => b.trim()).length >= 3 &&
               wizardData.howItWorks.every(step => step.title && step.description)
      case 4:
        return wizardData.selectedPackages.length > 0
      case 5:
        return wizardData.primaryColor && wizardData.secondaryColor
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
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Basic Information</h2>
              <p className="text-slate-600">Let's start with the basics of your sales page</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Page Title *
                </label>
                <input
                  type="text"
                  value={wizardData.pageTitle}
                  onChange={(e) => updateWizardData({ pageTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Join Our Loyalty Program"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Page URL Slug
                </label>
                <input
                  type="text"
                  value={wizardData.pageUrlSlug}
                  onChange={(e) => updateWizardData({ pageUrlSlug: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., loyalty-signup"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Page Description *
              </label>
              <textarea
                value={wizardData.pageDescription}
                onChange={(e) => updateWizardData({ pageDescription: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what this landing page is for..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Custom URL
              </label>
              <input
                type="url"
                value={wizardData.customUrl}
                onChange={(e) => updateWizardData({ customUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://yourdomain.com/signup"
              />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logo for Header *
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                  {wizardData.logo ? (
                    <div className="space-y-4">
                      <img src={wizardData.logo} alt="Logo" className="max-h-20 mx-auto" />
                      <button
                        onClick={() => updateWizardData({ logo: null })}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Logo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <PhotoIcon className="w-12 h-12 text-slate-400 mx-auto" />
                      <div>
                        <p className="text-slate-600 mb-2">Upload your logo</p>
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Choose Logo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'logo')
                  }}
                  className="hidden"
                />
              </div>

              {/* Hero Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hero Image *
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                  {wizardData.backgroundImage ? (
                    <div className="space-y-4">
                      <img src={wizardData.backgroundImage} alt="Hero" className="max-h-20 mx-auto rounded" />
                      <button
                        onClick={() => updateWizardData({ backgroundImage: null })}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Hero Image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <PhotoIcon className="w-12 h-12 text-slate-400 mx-auto" />
                      <div>
                        <p className="text-slate-600 mb-2">Upload hero image</p>
                        <button
                          onClick={() => backgroundInputRef.current?.click()}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Choose Hero Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={backgroundInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'background')
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Additional Images */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-4">
                Additional Images (Max 5)
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                {wizardData.additionalImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {wizardData.additionalImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <img src={image.url} alt={image.name} className="w-full h-20 object-cover rounded" />
                          <button
                            onClick={() => removeAdditionalImage(image.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {wizardData.additionalImages.length < 5 && (
                      <button
                        onClick={() => additionalImagesInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Add More Images
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <SparklesIcon className="w-12 h-12 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-slate-600 mb-2">Add additional images</p>
                      <button
                        onClick={() => additionalImagesInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Add Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={additionalImagesInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file && wizardData.additionalImages.length < 5) {
                    handleFileUpload(file, 'additional')
                  }
                }}
                className="hidden"
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Sales Copy & Content</h2>
              <p className="text-slate-600">Create compelling copy that converts visitors into customers</p>
            </div>

            {/* Main Headline (H1) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Main Headline (H1) *
              </label>
              <p className="text-xs text-slate-500 mb-3">The big promise/goal that grabs attention</p>
              <input
                type="text"
                value={wizardData.headline}
                onChange={(e) => updateWizardData({ headline: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                placeholder="e.g., Double Your Customer Retention in 30 Days"
              />
            </div>

            {/* Sub-headline (H2) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sub-headline (H2) *
              </label>
              <p className="text-xs text-slate-500 mb-3">One sentence explaining how it works or why it's different</p>
              <textarea
                value={wizardData.subHeadline}
                onChange={(e) => updateWizardData({ subHeadline: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Our Apple Wallet loyalty cards live on your customers' Lock Screen, driving repeat visits without expensive SMS campaigns."
              />
            </div>

            {/* Key Benefits */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Key Benefits (3-5 bullets) *
              </label>
              <p className="text-xs text-slate-500 mb-3">Focus on outcomes, not features</p>
              <div className="space-y-3">
                {wizardData.keyBenefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-2">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => updateKeyBenefit(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`e.g., ${index === 0 ? 'Increase repeat visits by 40%' : index === 1 ? 'Reduce marketing costs by 60%' : 'Improve customer satisfaction scores'}`}
                    />
                    {wizardData.keyBenefits.length > 3 && (
                      <button
                        onClick={() => removeKeyBenefit(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                {wizardData.keyBenefits.length < 5 && (
                  <button
                    onClick={addKeyBenefit}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    + Add Another Benefit
                  </button>
                )}
              </div>
            </div>

            {/* How It Works */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                How It Works (3 steps) *
              </label>
              <p className="text-xs text-slate-500 mb-3">Quick path to value for your customers</p>
              <div className="space-y-4">
                {wizardData.howItWorks.map((step, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {step.step}
                      </span>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => updateHowItWorks(index, 'title', e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        placeholder={`Step ${step.step} title (e.g., ${index === 0 ? 'Sign Up' : index === 1 ? 'Get Your Card' : 'Start Earning'})`}
                      />
                    </div>
                    <textarea
                      value={step.description}
                      onChange={(e) => updateHowItWorks(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Describe step ${step.step} (e.g., ${index === 0 ? 'Quick 30-second signup with just your email' : index === 1 ? 'Add your loyalty card to Apple Wallet in one tap' : 'Earn points and rewards with every purchase'})`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Reversal */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Risk Reversal / Reassurance
              </label>
              <p className="text-xs text-slate-500 mb-3">Address concerns (cancel anytime, no app needed, secure, etc.)</p>
              <div className="space-y-3">
                {wizardData.riskReversal.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-green-500 mt-2 flex-shrink-0" />
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateRiskReversal(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`e.g., ${index === 0 ? 'Cancel anytime, no long-term contracts' : 'No app download required'}`}
                    />
                    {wizardData.riskReversal.length > 1 && (
                      <button
                        onClick={() => removeRiskReversal(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addRiskReversal}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  + Add Another Reassurance
                </button>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Pricing Packages</h2>
              <p className="text-slate-600">Configure your pricing tiers to maximize conversions</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {wizardData.selectedPackages.map((pkg, index) => (
                <div
                  key={pkg.id}
                  className={`relative border-2 rounded-xl p-6 ${
                    pkg.isPopular 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {pkg.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) => updatePackage(pkg.id, { name: e.target.value })}
                      className="text-2xl font-bold text-slate-900 bg-transparent border-none text-center w-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    />
                    <textarea
                      value={pkg.description}
                      onChange={(e) => updatePackage(pkg.id, { description: e.target.value })}
                      rows={2}
                      className="text-slate-600 text-center w-full bg-transparent border-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded mt-2"
                    />
                  </div>

                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center">
                      <span className="text-4xl font-bold text-slate-900">$</span>
                      <input
                        type="number"
                        value={pkg.price}
                        onChange={(e) => updatePackage(pkg.id, { price: parseInt(e.target.value) || 0 })}
                        className="text-4xl font-bold text-slate-900 bg-transparent border-none w-20 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      />
                      <span className="text-slate-600 ml-2">/month</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Pass Limit:</span>
                      <input
                        type="number"
                        value={pkg.passLimit}
                        onChange={(e) => updatePackage(pkg.id, { passLimit: parseInt(e.target.value) || 0 })}
                        className="text-slate-900 font-medium bg-transparent border border-slate-300 rounded px-2 py-1 w-20 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Programs:</span>
                      <input
                        type="number"
                        value={pkg.programLimit}
                        onChange={(e) => updatePackage(pkg.id, { programLimit: parseInt(e.target.value) || 0 })}
                        className="text-slate-900 font-medium bg-transparent border border-slate-300 rounded px-2 py-1 w-20 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Staff:</span>
                      <input
                        type="number"
                        value={pkg.staffLimit === -1 ? '' : pkg.staffLimit}
                        onChange={(e) => updatePackage(pkg.id, { staffLimit: e.target.value === '' ? -1 : parseInt(e.target.value) || 0 })}
                        placeholder="Unlimited"
                        className="text-slate-900 font-medium bg-transparent border border-slate-300 rounded px-2 py-1 w-20 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-slate-900">Features:</h4>
                    {pkg.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => {
                            const newFeatures = [...pkg.features]
                            newFeatures[featureIndex] = e.target.value
                            updatePackage(pkg.id, { features: newFeatures })
                          }}
                          className="text-slate-700 bg-transparent border-none flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => togglePackagePopular(pkg.id)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        pkg.isPopular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {pkg.isPopular ? 'Popular' : 'Make Popular'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-600">
                💡 Tip: Make one package "Most Popular" to guide customer choice
              </p>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Give Claude More Info</h2>
              <p className="text-slate-600">Provide specific guidance for AI generation</p>
            </div>

            {/* Color Theme */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded mr-2"></div>
                Brand Colors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Primary Color (Buttons, Headers)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={wizardData.primaryColor}
                      onChange={(e) => setWizardData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={wizardData.primaryColor}
                      onChange={(e) => setWizardData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="#3862EA"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Secondary Color (Accents, Links)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={wizardData.secondaryColor}
                      onChange={(e) => setWizardData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={wizardData.secondaryColor}
                      onChange={(e) => setWizardData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="#10B981"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Image URLs */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <PhotoIcon className="w-5 h-5 text-blue-500 mr-2" />
                Specific Images (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Hero Image URL</label>
                  <input
                    type="url"
                    value={wizardData.imageUrls.hero || ''}
                    onChange={(e) => setWizardData(prev => ({ 
                      ...prev, 
                      imageUrls: { ...prev.imageUrls, hero: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="https://example.com/hero-image.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Logo URL</label>
                  <input
                    type="url"
                    value={wizardData.imageUrls.logo || ''}
                    onChange={(e) => setWizardData(prev => ({ 
                      ...prev, 
                      imageUrls: { ...prev.imageUrls, logo: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Background Image URL</label>
                  <input
                    type="url"
                    value={wizardData.imageUrls.background || ''}
                    onChange={(e) => setWizardData(prev => ({ 
                      ...prev, 
                      imageUrls: { ...prev.imageUrls, background: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="https://example.com/background.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Feature Image 1 URL</label>
                  <input
                    type="url"
                    value={wizardData.imageUrls.feature1 || ''}
                    onChange={(e) => setWizardData(prev => ({ 
                      ...prev, 
                      imageUrls: { ...prev.imageUrls, feature1: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="https://example.com/feature1.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <DocumentTextIcon className="w-5 h-5 text-blue-500 mr-2" />
                Additional Instructions for Claude
              </h3>
              <textarea
                value={wizardData.customInstructions}
                onChange={(e) => setWizardData(prev => ({ ...prev, customInstructions: e.target.value }))}
                placeholder="Give Claude specific instructions about style, layout, tone, or features you want. For example:
- Make it look modern and minimalist
- Use a tech startup vibe
- Include testimonials section
- Make buttons larger and more prominent
- Use professional photography style
- Add animations or hover effects
- Focus on mobile-first design"
                className="w-full p-4 border border-slate-300 rounded-lg"
                rows={8}
              />
              <p className="text-sm text-slate-500 mt-2">
                These instructions will be prioritized in the AI generation process
              </p>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Generate Your Sales Page</h2>
              <p className="text-slate-600">Review your settings and generate your AI-powered sales page</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-slate-900 mb-4">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Page Title:</strong> {wizardData.pageTitle}</p>
                  <p><strong>URL:</strong> {wizardData.customUrl}</p>
                  <p><strong>Headline:</strong> {wizardData.headline}</p>
                  <p><strong>Sub-headline:</strong> {wizardData.subHeadline}</p>
                  <p><strong>Key Benefits:</strong> {wizardData.keyBenefits?.filter(b => b.trim()).length || 0} benefits</p>
                </div>
                <div>
                  <p><strong>How It Works:</strong> {wizardData.howItWorks?.length || 0} steps</p>
                  <p><strong>Pricing Packages:</strong> {wizardData.selectedPackages?.length || 0} packages</p>
                  <p><strong>Risk Reversal:</strong> {wizardData.riskReversal?.filter(r => r.trim()).length || 0} items</p>
                  <p><strong>Primary Color:</strong> {wizardData.primaryColor}</p>
                  <p><strong>Secondary Color:</strong> {wizardData.secondaryColor}</p>
                  <p><strong>Custom Instructions:</strong> {wizardData.customInstructions ? 'Yes' : 'None'}</p>
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
                      Generating Sales Page...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5" />
                      Generate Sales Page
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-900">Generated Sales Page</h3>
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
                      title="Generated Sales Page Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      Sales page preview will appear here
                    </div>
                  )}
                </div>
                
                {/* Chat with Claude for Edits */}
                <div className="mt-6 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-3">Chat with Claude for Edits</h4>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
                      {chatHistory.length === 0 ? (
                        <p className="text-sm text-slate-600">
                          Ask Claude to make changes to your sales page. For example:
                          "Make the headline larger", "Change the background color to blue", "Add a testimonials section"
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {chatHistory.map((msg, index) => (
                            <div key={index} className={`text-sm ${msg.role === 'user' ? 'text-blue-700 font-medium' : 'text-slate-700'}`}>
                              <span className="font-semibold">{msg.role === 'user' ? 'You:' : 'Claude:'}</span> {msg.content}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isChatting && handleChatWithClaude()}
                        placeholder="Ask Claude to make changes..."
                        className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isChatting}
                      />
                      <button 
                        onClick={handleChatWithClaude}
                        disabled={isChatting || !chatMessage.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isChatting ? (
                          <>
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            Asking...
                          </>
                        ) : (
                          <>
                            <PaperAirplaneIcon className="w-4 h-4" />
                            Send
                          </>
                        )}
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <SparklesIcon className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">Sales Page Designer</h1>
                <p className="text-sm text-slate-600">Create high-converting sales pages for any use case</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create New
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'saved'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Saved Pages
          </button>
        </div>

        {activeTab === 'create' ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            {/* Progress Steps */}
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {STEPS.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep === step.id
                            ? 'bg-blue-600 text-white'
                            : currentStep > step.id
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {currentStep > step.id ? (
                          <CheckIcon className="w-4 h-4" />
                        ) : (
                          step.id
                        )}
                      </div>
                      {index < STEPS.length - 1 && (
                        <div
                          className={`w-12 h-0.5 mx-2 ${
                            currentStep > step.id ? 'bg-green-500' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-slate-500">Step {currentStep} of {STEPS.length}</span>
              </div>
            </div>

            {/* Step Content */}
            <div className="px-6 py-8">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Previous
              </button>

              <button
                onClick={nextStep}
                disabled={currentStep === 6 || !canProceedToNext()}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Saved Landing Pages</h2>
            {loadingSavedPages ? (
              <div className="text-center py-8">
                <ArrowPathIcon className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-spin" />
                <p className="text-slate-600">Loading saved pages...</p>
              </div>
            ) : savedLandingPages.length === 0 ? (
              <div className="text-center py-8">
                <DocumentDuplicateIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No saved pages yet</h3>
                <p className="text-slate-600 mb-4">Create your first landing page to see it here</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create New Page
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedLandingPages.map((page) => (
                  <div key={page.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow relative">
                    {/* Save as Default button in top-right corner */}
                    <button
                      onClick={() => handleSaveAsHomepage(page)}
                      className={`absolute top-3 right-3 p-1.5 text-white rounded-md transition-colors ${
                        currentHomepageId === page.id 
                          ? 'bg-orange-600 hover:bg-orange-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                      title={
                        currentHomepageId === page.id 
                          ? 'Click to restore default homepage' 
                          : 'Save as default homepage'
                      }
                    >
                      <GlobeAltIcon className="w-4 h-4" />
                    </button>
                    
                    <h3 className="font-semibold text-slate-900 mb-2 pr-10">{page.page_title || page.page_name}</h3>
                    <p className="text-sm text-slate-600 mb-4">{page.page_subtitle || page.meta_description || 'No description'}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        Created {new Date(page.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditPage(page)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleViewPage(page)}
                          className="text-slate-600 hover:text-slate-700"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}