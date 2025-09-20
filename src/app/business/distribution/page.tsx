'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  ChevronRightIcon,
  TrashIcon,
  DocumentTextIcon
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
  { id: 4, title: 'Form & Placeholders', description: 'Map customer data to pass fields' },
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
    { id: 'ae76dc2a-e295-4219-b5ce-f6ecd8961de1', name: 'Blue Karma Membership', type: 'storeCard', description: 'Blue Karma membership program template' }
  ])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [selectedTemplatePlaceholders, setSelectedTemplatePlaceholders] = useState<any[]>([])
  const [placeholderMapping, setPlaceholderMapping] = useState<{[key: string]: string}>({})
  const [savedLandingPages, setSavedLandingPages] = useState<any[]>([])
  const [loadingSavedPages, setLoadingSavedPages] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [isChatting, setIsChatting] = useState(false)
  const [debugMessages, setDebugMessages] = useState<string[]>([])
  const [currentLandingPageId, setCurrentLandingPageId] = useState<string | null>(null)
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null)
  const [editingUrl, setEditingUrl] = useState('')
  const [updatingUrl, setUpdatingUrl] = useState(false)
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
    primaryColor: '#3862EA',
    secondaryColor: '#10B981',
    imageUrls: {},
    customInstructions: '',
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
            name: template.programs?.name || template.template_json?.name || `Template ${template.id.slice(0, 8)}`,
            type: template.template_json?.metadata?.pass_style || template.pass_type || 'storeCard',
            description: template.template_json?.description || template.programs?.name || 'Custom pass template'
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

  // Load template placeholders when a template is selected
  const loadTemplatePlaceholders = async (templateId: string) => {
    if (!templateId) {
      setSelectedTemplatePlaceholders([])
      return
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`)
      const result = await response.json()
      
      if (result.data) {
        const template = result.data
        const placeholders = template.passkit_json?.placeholders || {}
        
        // Convert placeholders to array with metadata
        const placeholderArray = Object.keys(placeholders).map(key => ({
          key,
          defaultValue: placeholders[key],
          isCustomerFacing: isCustomerFacingPlaceholder(key),
          suggestedFormField: suggestFormField(key)
        }))
        
        console.log('🎯 Template placeholders loaded:', placeholderArray)
        setSelectedTemplatePlaceholders(placeholderArray)
        
        // Initialize mapping for customer-facing placeholders
        const initialMapping: {[key: string]: string} = {}
        placeholderArray.forEach(placeholder => {
          if (placeholder.isCustomerFacing && placeholder.suggestedFormField) {
            initialMapping[placeholder.key] = placeholder.suggestedFormField
          }
        })
        setPlaceholderMapping(initialMapping)
      }
    } catch (error) {
      console.error('Error loading template placeholders:', error)
    }
  }

  // Detect if a placeholder is customer-facing
  const isCustomerFacingPlaceholder = (placeholder: string): boolean => {
    const lower = placeholder.toLowerCase()
    return lower.includes('first') && lower.includes('name') ||
           lower.includes('last') && lower.includes('name') ||
           lower.includes('full') && lower.includes('name') ||
           lower.includes('email') ||
           lower.includes('phone') ||
           lower.includes('mobile') ||
           lower.includes('birth') ||
           lower.includes('dob') ||
           lower.includes('address') ||
           lower.includes('city') ||
           lower.includes('zip') ||
           lower.includes('company')
  }

  // Suggest form field for a placeholder
  const suggestFormField = (placeholder: string): string => {
    const lower = placeholder.toLowerCase()
    if (lower.includes('first') && lower.includes('name')) return 'firstName'
    if (lower.includes('last') && lower.includes('name')) return 'lastName'
    if (lower.includes('full') && lower.includes('name')) return 'fullName'
    if (lower.includes('email')) return 'email'
    if (lower.includes('phone') || lower.includes('mobile')) return 'phone'
    if (lower.includes('birth') || lower.includes('dob')) return 'dateOfBirth'
    if (lower.includes('address')) return 'address'
    if (lower.includes('city')) return 'city'
    if (lower.includes('zip')) return 'zipCode'
    if (lower.includes('company')) return 'company'
    return ''
  }

  // Trigger placeholder loading when template changes
  useEffect(() => {
    if (wizardData.programTemplate) {
      loadTemplatePlaceholders(wizardData.programTemplate)
    }
  }, [wizardData.programTemplate])

  const [uploadingImages, setUploadingImages] = useState<{[key: string]: boolean}>({})

  const handleImageUpload = async (file: File, type: 'logo' | 'background' | 'social' | 'additional') => {
    // Set uploading state
    setUploadingImages(prev => ({ ...prev, [type]: true }))

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }
      
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

      console.log(`✅ ${type} uploaded successfully:`, result.fileName)
    } catch (error) {
      console.error('Error uploading image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image'
      alert(`Upload failed: ${errorMessage}. Please try again.`)
    } finally {
      // Clear uploading state
      setUploadingImages(prev => ({ ...prev, [type]: false }))
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
      // Build the prompt from wizard data
      const prompt = `Create a landing page for ${wizardData.pageTitle}.
      
Headline: ${wizardData.headline}
Sub-headline: ${wizardData.subHeader}
Incentive: ${wizardData.incentive}
Benefits: ${wizardData.benefits.filter(b => b.trim()).join(', ')}
Additional Copy: ${wizardData.additionalCopy}

Style Instructions: ${wizardData.customInstructions}
Primary Color: ${wizardData.primaryColor}
Secondary Color: ${wizardData.secondaryColor}

This is for a ${programTemplates.find(t => t.id === wizardData.programTemplate)?.type || 'loyalty'} program.
Make it modern, professional, and conversion-focused.`

      const response = await fetch('/api/generate-landing-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          business_name: wizardData.pageTitle,
          logo_url: wizardData.logo,
          background_image_url: wizardData.backgroundImage,
          template_id: wizardData.programTemplate,
          project_state: {
            requiredFields: wizardData.requiredFields,
            optionalFields: wizardData.optionalFields,
            placeholder_mapping: placeholderMapping,
            selected_placeholders: selectedTemplatePlaceholders,
            primaryColor: wizardData.primaryColor,
            secondaryColor: wizardData.secondaryColor,
            customInstructions: wizardData.customInstructions
          }
        })
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
      let response
      let landingPageId = currentLandingPageId

      if (currentLandingPageId) {
        // Update existing landing page
        console.log('🔄 Updating existing landing page:', currentLandingPageId)
        response = await fetch(`/api/landing-pages/${currentLandingPageId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: wizardData.pageTitle || 'Untitled Landing Page',
            title: wizardData.pageTitle,
            description: wizardData.pageDescription,
            custom_url: wizardData.customUrl,
            html_content: wizardData.generatedHtml,
            template_id: wizardData.programTemplate,
            settings: wizardData,
            status: 'published'
          })
        })
      } else {
        // Create new landing page
        console.log('✨ Creating new landing page')
        response = await fetch('/api/landing-pages', {
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
            template_id: wizardData.programTemplate,
            settings: wizardData,
            status: 'published'
          })
        })
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      // Set the landing page ID if it's a new one
      if (!currentLandingPageId && result.data?.id) {
        setCurrentLandingPageId(result.data.id)
        landingPageId = result.data.id
      }

      // Update the generated HTML with the actual landing page ID
      if (landingPageId && wizardData.generatedHtml) {
        const updatedHtml = wizardData.generatedHtml.replace(
          'LANDING_PAGE_ID_PLACEHOLDER', 
          landingPageId
        )
        
        // Only update if HTML changed
        if (updatedHtml !== wizardData.generatedHtml) {
          await fetch(`/api/landing-pages/${landingPageId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              html_content: updatedHtml
            })
          })
          
          // Update local state
          setWizardData(prev => ({ ...prev, generatedHtml: updatedHtml }))
        }
      }

      // Refresh the saved landing pages list
      loadSavedLandingPages()

      alert(`Landing page "${wizardData.pageTitle}" ${currentLandingPageId ? 'updated' : 'created'} and published successfully!`)
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

  const addDebugMessage = (message: string) => {
    setDebugMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`].slice(-10))
  }

  const handleChatWithClaude = async () => {
    setDebugMessages([]) // Clear previous debug messages
    
    if (!chatMessage.trim() || !wizardData.generatedHtml) {
      addDebugMessage(`❌ Validation failed - Message: ${!!chatMessage.trim()}, HTML: ${!!wizardData.generatedHtml}`)
      return
    }
    
    setIsChatting(true)
    addDebugMessage('🚀 Starting chat with Claude...')
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      addDebugMessage(`🔑 Session: ${!!session ? 'Found' : 'Missing'}`)
      
      if (!session) {
        addDebugMessage('❌ Not logged in')
        alert('You must be logged in to chat with Claude.')
        setIsChatting(false)
        return
      }

      // Add user message to chat history
      const userMessage = { role: 'user' as const, content: chatMessage }
      setChatHistory(prev => [...prev, userMessage])
      const messageToSend = chatMessage
      setChatMessage('')

      addDebugMessage(`📡 Making API request - Message: ${messageToSend.substring(0, 50)}...`)
      addDebugMessage(`📝 HTML length: ${wizardData.generatedHtml?.length}`)

      const response = await fetch('/api/business/chat-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: messageToSend,
          currentHtml: wizardData.generatedHtml,
          wizardData: wizardData
        })
      })

      addDebugMessage(`📥 Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        addDebugMessage(`❌ Server error: ${response.status} ${response.statusText}`)
        addDebugMessage(`❌ Error body: ${errorText.substring(0, 200)}...`)
        alert(`Server error: ${response.status} ${response.statusText}`)
        return
      }

      const data = await response.json()
      addDebugMessage(`✅ Response received - Has message: ${!!data.message}`)
      
      if (data.error) {
        addDebugMessage(`❌ API error: ${data.error}`)
        alert('Failed to get response from Claude. Please try again.')
        return
      }

      // Add Claude's response to chat history
      const assistantMessage = { role: 'assistant' as const, content: data.message }
      setChatHistory(prev => [...prev, assistantMessage])
      
      // Update the HTML if Claude provided an updated version
      if (data.updatedHtml) {
        addDebugMessage('🔄 Updating HTML with Claude response')
        setWizardData(prev => ({ ...prev, generatedHtml: data.updatedHtml }))
      }
      
      addDebugMessage('✅ Chat completed successfully')
      
    } catch (error: any) {
      addDebugMessage(`❌ Error: ${error.message}`)
      alert(`Failed to chat with Claude: ${error.message}`)
    } finally {
      setIsChatting(false)
    }
  }

  const handleEditLandingPage = (page: any) => {
    try {
      // Set the current landing page ID for updating
      setCurrentLandingPageId(page.id)
      
      // Switch to create tab to show the wizard
      setActiveTab('create')
      
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
        generatedHtml: page.generated_html || '',
        
        // Missing required properties
        primaryColor: settings.primaryColor || '#3862EA',
        secondaryColor: settings.secondaryColor || '#10B981',
        imageUrls: settings.imageUrls || {},
        customInstructions: settings.customInstructions || ''
      })
      
      // Switch to create tab and go to the last step (step 6)
      setActiveTab('create')
      setCurrentStep(6)
    } catch (error) {
      console.error('Error loading landing page for editing:', error)
      alert('Failed to load landing page for editing. Please try again.')
    }
  }

  const handleDeleteLandingPage = async (page: any) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${page.name}"?\n\nThis action cannot be undone.`
    )
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/landing-pages/${page.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete landing page')
      }

      // Remove the page from the local state
      setSavedLandingPages(prev => prev.filter(p => p.id !== page.id))
      
      // Show success message
      alert(`Landing page "${page.name}" has been deleted successfully.`)
    } catch (error) {
      console.error('Error deleting landing page:', error)
      alert(`Failed to delete landing page: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleStartEditUrl = (page: any) => {
    setEditingUrlId(page.id)
    setEditingUrl(page.custom_url)
  }

  const handleCancelEditUrl = () => {
    setEditingUrlId(null)
    setEditingUrl('')
  }

  const handleSaveUrl = async (pageId: string) => {
    if (!editingUrl.trim()) {
      alert('URL cannot be empty')
      return
    }

    setUpdatingUrl(true)
    try {
      const response = await fetch(`/api/landing-pages/${pageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          custom_url: editingUrl.trim()
        })
      })

      if (response.ok) {
        // Refresh the saved pages list
        await loadSavedLandingPages()
        setEditingUrlId(null)
        setEditingUrl('')
        alert('URL updated successfully!')
      } else {
        const result = await response.json()
        alert(`Failed to update URL: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating URL:', error)
      alert('Failed to update URL')
    } finally {
      setUpdatingUrl(false)
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
        return Object.keys(placeholderMapping).length > 0 // Must have some placeholder mappings
      case 5:
        return wizardData.primaryColor && wizardData.secondaryColor // Brand colors required
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
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Form & Pass Placeholder Mapping</h2>
              <p className="text-slate-600">Map customer form fields to pass template placeholders</p>
            </div>

            {!wizardData.programTemplate ? (
              <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">Please select a pass template in Step 1 first.</p>
              </div>
            ) : selectedTemplatePlaceholders.length === 0 ? (
              <div className="text-center p-8">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-600">Loading template placeholders...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Template Placeholders Found:</h3>
                  <p className="text-blue-800 text-sm">
                    {selectedTemplatePlaceholders.length} placeholders detected in your pass template.
                    Map customer-facing placeholders to form fields below.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Customer Data Placeholders</h3>
                  {selectedTemplatePlaceholders.filter(p => p.isCustomerFacing).map((placeholder) => (
                    <div key={placeholder.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">${placeholder.key}</div>
                        <div className="text-sm text-slate-500">Default: "{placeholder.defaultValue}"</div>
                      </div>
                      <div className="flex-1 mx-4">
                        <select
                          value={placeholderMapping[placeholder.key] || ''}
                          onChange={(e) => setPlaceholderMapping(prev => ({
                            ...prev,
                            [placeholder.key]: e.target.value
                          }))}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">-- Select Form Field --</option>
                          <option value="firstName">First Name</option>
                          <option value="lastName">Last Name</option>
                          <option value="fullName">Full Name</option>
                          <option value="email">Email Address</option>
                          <option value="phone">Phone Number</option>
                          <option value="dateOfBirth">Date of Birth</option>
                          <option value="address">Address</option>
                          <option value="city">City</option>
                          <option value="zipCode">ZIP Code</option>
                          <option value="company">Company</option>
                        </select>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          placeholderMapping[placeholder.key] 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {placeholderMapping[placeholder.key] ? 'Mapped' : 'Not Mapped'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Business-Controlled Placeholders</h3>
                  <p className="text-sm text-slate-600 mb-4">These use default values from your pass template and are not collected from customers.</p>
                  {selectedTemplatePlaceholders.filter(p => !p.isCustomerFacing).map((placeholder) => (
                    <div key={placeholder.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-slate-700">${placeholder.key}</div>
                        <div className="text-sm text-slate-500">Default: "{placeholder.defaultValue}"</div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          Auto-Generated
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Mapping Summary:</h4>
                  <div className="text-sm text-green-800">
                    <p><strong>Form Fields:</strong> {Object.values(placeholderMapping).join(', ') || 'None mapped yet'}</p>
                    <p><strong>Customer Placeholders:</strong> {selectedTemplatePlaceholders.filter(p => p.isCustomerFacing).length}</p>
                    <p><strong>Business Placeholders:</strong> {selectedTemplatePlaceholders.filter(p => !p.isCustomerFacing).length}</p>
                  </div>
                </div>
              </div>
            )}
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
                
                {/* Debug Panel */}
                {debugMessages.length > 0 && (
                  <div className="mt-6 border border-amber-200 bg-amber-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-amber-900">🔍 Debug Log</h4>
                      <button 
                        onClick={() => setDebugMessages([])}
                        className="text-xs text-amber-700 hover:text-amber-900"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="bg-white rounded border max-h-[150px] overflow-y-auto p-2">
                      {debugMessages.map((msg, index) => (
                        <div key={index} className="text-xs font-mono text-slate-700 mb-1">
                          {msg}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat with Claude for Edits */}
                <div className="mt-6 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-3">Chat with Claude for Edits</h4>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
                      {chatHistory.length === 0 ? (
                        <p className="text-sm text-slate-600">
                          Ask Claude to make changes to your landing page. For example:
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
              onClick={() => {
                setActiveTab('create')
                // Reset wizard for new landing page
                setCurrentLandingPageId(null)
                setCurrentStep(1)
                setChatHistory([])
                setDebugMessages([])
                setWizardData({
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
                  primaryColor: '#3862EA',
                  secondaryColor: '#10B981',
                  imageUrls: {},
                  customInstructions: '',
                  selectedTemplate: '',
                  customTemplate: '',
                  
                  // Step 6
                  generatedHtml: ''
                })
              }}
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
                              {editingUrlId === page.id ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="text"
                                    value={editingUrl}
                                    onChange={(e) => setEditingUrl(e.target.value)}
                                    className="flex-1 text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                                    placeholder="Enter URL slug..."
                                  />
                                  <button
                                    onClick={() => handleSaveUrl(page.id)}
                                    disabled={updatingUrl}
                                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {updatingUrl ? '...' : '✓'}
                                  </button>
                                  <button
                                    onClick={handleCancelEditUrl}
                                    className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 mt-1">
                                  <a
                                    href={`/api/public/landing-page/${page.custom_url.includes('/') ? page.custom_url.split('/').pop() : page.custom_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {page.custom_url}
                                  </a>
                                  <button
                                    onClick={() => handleStartEditUrl(page)}
                                    className="text-slate-400 hover:text-slate-600"
                                    title="Edit URL"
                                  >
                                    <PencilIcon className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
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
                          <a
                            href={`/api/public/landing-page/${page.custom_url.includes('/') ? page.custom_url.split('/').pop() : page.custom_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md hover:bg-blue-50"
                          >
                            <EyeIcon className="w-4 h-4" />
                            Live Preview
                          </a>
                          <button 
                            onClick={() => handleEditLandingPage(page)}
                            className="flex items-center gap-1 px-3 py-1 text-slate-600 hover:text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
                          >
                            <PencilIcon className="w-4 h-4" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteLandingPage(page)}
                            className="flex items-center gap-1 px-3 py-1 text-red-600 hover:text-red-700 border border-red-600 rounded-md hover:bg-red-50"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Delete
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
