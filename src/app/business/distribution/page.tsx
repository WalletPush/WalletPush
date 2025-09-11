'use client'

import React, { useState, useRef } from 'react'
import { 
  SparklesIcon,
  PhotoIcon,
  EyeIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

interface LandingPageData {
  id: string
  name: string
  businessName: string
  customUrl: string
  logo: string | null
  backgroundImage: string | null
  prompt: string
  htmlCode: string
  isPublished: boolean
  createdAt: string
  lastModified: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: string
}

export default function DistributionPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome! I\'m your AI Landing Page Creator. Describe the landing page you\'d like me to build, and I\'ll create custom HTML using your uploaded assets.',
      timestamp: new Date().toISOString()
    }
  ])
  
  const logoInputRef = useRef<HTMLInputElement>(null)
  const backgroundInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    customUrl: '',
    logo: null as string | null,
    backgroundImage: null as string | null
  })

  const [existingPages] = useState<LandingPageData[]>([
    {
      id: '1',
      name: 'Monthly Wine Club',
      businessName: 'Vintage Cellars',
      customUrl: 'wine.vintagecellars.com/join',
      logo: null,
      backgroundImage: null,
      prompt: 'Build me a landing page to promote our Monthly Wine club. Users will get a selection of our finest wines each month for $49.99 per month.',
      htmlCode: '<html>...</html>',
      isPublished: true,
      createdAt: '2024-01-15',
      lastModified: '2024-01-20'
    },
    {
      id: '2',
      name: 'Fitness Membership',
      businessName: 'PowerFit Gym',
      customUrl: 'join.powerfit.com/membership',
      logo: null,
      backgroundImage: null,
      prompt: 'Create a landing page for our premium gym membership with personal training included for $99/month.',
      htmlCode: '<html>...</html>',
      isPublished: false,
      createdAt: '2024-01-18',
      lastModified: '2024-01-22'
    }
  ])

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData({ ...formData, logo: e.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData({ ...formData, backgroundImage: e.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSendPrompt = async () => {
    if (!currentPrompt.trim()) return
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentPrompt,
      timestamp: new Date().toISOString()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setCurrentPrompt('')
    setIsGenerating(true)
    
    try {
      // Call the API to generate the landing page
      const response = await fetch('/api/generate-landing-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          business_name: formData.businessName || 'Your Business',
          logo_url: formData.logo,
          background_image_url: formData.backgroundImage
        })
      })
      
      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: result.data.message || 'Perfect! I\'ve created a beautiful landing page based on your requirements. The page includes your assets, compelling copy, and an integrated signup form. Check out the preview below!',
        timestamp: new Date().toISOString()
      }
      
      setChatMessages(prev => [...prev, aiMessage])
      setGeneratedHtml(result.data.html)
      setShowPreview(true)
      
    } catch (error) {
      console.error('Error generating landing page:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error generating your landing page. Please try again.',
        timestamp: new Date().toISOString()
      }
      
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveLandingPage = async () => {
    if (!generatedHtml || !formData.name) {
      alert('Please generate a landing page and provide a name before saving.')
      return
    }
    
    try {
      const response = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          custom_url: formData.customUrl,
          logo_url: formData.logo,
          background_image_url: formData.backgroundImage,
          ai_prompt: chatMessages.find(m => m.type === 'user')?.content || '',
          generated_html: generatedHtml
        })
      })
      
      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      alert('Landing page saved successfully!')
      
    } catch (error) {
      console.error('Error saving landing page:', error)
      alert('Failed to save landing page. Please try again.')
    }
  }


  return (
    <div className="dashboard-header">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Distribution</h1>
          <p className="text-slate-600 mt-1">Create AI-powered landing pages with custom prompts</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-0">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              AI Landing Page Creator
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <GlobeAltIcon className="w-4 h-4" />
              Manage Pages
            </button>
          </nav>
        </div>
      </div>

      {/* Create Landing Page Tab */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration & Chat */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Page Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Monthly Wine Club Landing Page"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Vintage Cellars"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Custom URL</label>
                    <input
                      type="text"
                      value={formData.customUrl}
                      onChange={(e) => setFormData({ ...formData, customUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="wine.yourbusiness.com/join"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Assets */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Brand Assets</h3>
              <div className="space-y-4">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Business Logo</label>
                  <div className="flex items-center space-x-4">
                    {formData.logo ? (
                      <div className="relative">
                        <img src={formData.logo} alt="Logo" className="w-20 h-20 object-contain border border-slate-200 rounded-lg" />
                        <button
                          onClick={() => setFormData({ ...formData, logo: null })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                        <PhotoIcon className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Upload Logo
                      </button>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 2MB</p>
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Background Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Background Image (1200x600)</label>
                  <div className="flex items-center space-x-4">
                    {formData.backgroundImage ? (
                      <div className="relative">
                        <img src={formData.backgroundImage} alt="Background" className="w-32 h-16 object-cover border border-slate-200 rounded-lg" />
                        <button
                          onClick={() => setFormData({ ...formData, backgroundImage: null })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                        <PhotoIcon className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <button
                        onClick={() => backgroundInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Upload Background
                      </button>
                      <p className="text-xs text-slate-500 mt-1">1200x600px recommended</p>
                    </div>
                    <input
                      ref={backgroundInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Chat Interface */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5" />
                  AI Landing Page Creator
                </h3>
                <p className="text-purple-100 text-sm mt-1">Describe your landing page and I'll build it for you</p>
              </div>
              
              {/* Chat Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white'
                        : message.type === 'ai'
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-purple-100 text-purple-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-900 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        <span className="text-sm">AI is creating your landing page...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="border-t border-slate-200 p-4">
                <div className="flex space-x-2">
                  <textarea
                    value={currentPrompt}
                    onChange={(e) => setCurrentPrompt(e.target.value)}
                    placeholder="e.g., Build me a landing page to promote our Monthly Wine club. Users will get a selection of our finest wines each month for $49.99 per month. Please use my logo and background image. The join form should collect their full name, email and phone..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendPrompt()
                      }
                    }}
                  />
                  <button
                    onClick={handleSendPrompt}
                    disabled={!currentPrompt.trim() || isGenerating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed self-end"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Preview & Actions */}
          <div className="space-y-6">
            {generatedHtml && (
              <>
                {/* Preview */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Live Preview</h3>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200"
                    >
                      <EyeIcon className="w-4 h-4" />
                      {showPreview ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showPreview && (
                    <div className="p-4">
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <iframe
                          srcDoc={generatedHtml}
                          className="w-full h-96"
                          title="Landing Page Preview"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedHtml)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      <DocumentDuplicateIcon className="w-5 h-5" />
                      Copy HTML Code
                    </button>

                    <button
                      onClick={() => {
                        const blob = new Blob([generatedHtml], { type: 'text/html' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${formData.name || 'landing-page'}.html`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                    >
                      <CodeBracketIcon className="w-5 h-5" />
                      Download HTML
                    </button>

                    <button 
                      onClick={handleSaveLandingPage}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                    >
                      <CheckIcon className="w-5 h-5" />
                      Save Landing Page
                    </button>

                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700">
                      <GlobeAltIcon className="w-5 h-5" />
                      Publish to {formData.customUrl || 'Custom URL'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {!generatedHtml && (
              <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 p-8 text-center">
                <SparklesIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">Ready to Create</h3>
                <p className="text-slate-500 text-sm">Upload your assets and describe your landing page in the chat to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manage Pages Tab */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Existing Landing Pages</h3>
            <p className="text-slate-600 mt-1">Manage your AI-generated landing pages</p>
          </div>
          
          <div className="divide-y divide-slate-200">
            {existingPages.map((page) => (
              <div key={page.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-slate-900">{page.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        page.isPublished 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {page.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-2">{page.businessName}</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-500 mb-2">
                      <span className="flex items-center space-x-1">
                        <GlobeAltIcon className="w-4 h-4" />
                        <span>{page.customUrl}</span>
                      </span>
                      <span>Modified {page.lastModified}</span>
                    </div>
                    <div className="bg-slate-100 rounded-md p-2 text-xs text-slate-600">
                      <span className="font-medium">AI Prompt:</span> {page.prompt}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600" title="Preview">
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600" title="View Code">
                      <CodeBracketIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600" title="Edit with AI">
                      <SparklesIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
