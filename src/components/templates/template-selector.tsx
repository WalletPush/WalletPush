'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  SparklesIcon,
  EyeIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface Template {
  id: string
  name: string
  description: string
  category: string
  type: string
  preview: string
  templateData: {
    headline: string
    subheadline: string
    valueProposition: string
    features: string[]
    testimonials: any[]
    selectedPackages: any[]
    templateStyle: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    fontFamily: string
    logoUrl?: string
    heroImageUrl?: string
    callToAction: string
  }
  createdAt: string
  isGlobal: boolean
  createdBy: string
}

interface TemplateSelectorProps {
  templateType: 'sales-page' | 'distribution' | 'all'
  selectedTemplate?: string
  onTemplateSelect: (template: Template) => void
  className?: string
}

const CATEGORY_LABELS = {
  'business-main': 'Business Main Pages',
  'loyalty': 'Loyalty Programs',
  'coupon': 'Coupon Campaigns',
  'membership': 'Membership Programs',
  'store-card': 'Store Cards',
  'distribution': 'Distribution Pages',
  'agency-sales': 'Agency Sales Pages',
  'general-sales': 'General Sales Pages',
  'general': 'General Templates'
}

const CATEGORY_ICONS = {
  'business-main': '🏢',
  'loyalty': '🎯',
  'coupon': '🎫',
  'membership': '👑',
  'store-card': '💳',
  'distribution': '📄',
  'agency-sales': '🏛️',
  'general-sales': '💼',
  'general': '📋'
}

export default function TemplateSelector({ 
  templateType, 
  selectedTemplate, 
  onTemplateSelect, 
  className = '' 
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [templatesByCategory, setTemplatesByCategory] = useState<Record<string, Template[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadTemplates()
  }, [templateType])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (templateType !== 'all') {
        params.append('type', templateType)
      }

      const response = await fetch(`/api/templates/library?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load templates: ${response.status}`)
      }
      
      const data = await response.json()
      setTemplates(data.templates || [])
      setTemplatesByCategory(data.templatesByCategory || {})

      // Set default category to first available category or 'all'
      const categories = Object.keys(data.templatesByCategory || {})
      if (categories.length > 0 && selectedCategory === 'all') {
        setSelectedCategory(categories[0])
      }
      
    } catch (error) {
      console.error('❌ Failed to load templates:', error)
      setError(error instanceof Error ? error.message : 'Failed to load templates')
      
      // Fallback to mock templates for development
      const mockTemplates: Template[] = [
        {
          id: 'walletpush-main',
          name: 'WalletPush Main Template',
          description: 'Complete main sales page with dark hero, pricing tables, and conversion-optimized copy',
          category: 'business-main',
          type: 'general',
          preview: '/images/template-preview-main.jpg',
          templateData: {
            headline: 'Loyalty, memberships & store cards that live on your customer\'s phone — without SMS headaches.',
            subheadline: 'Stop paying for texts. Put your offer on the Lock Screen.',
            valueProposition: 'Customers add your card to Apple Wallet in one tap. You send instant push updates — no carrier rules, no A2P forms, no per-message fees.',
            features: [
              'More repeat visits - gentle nudges on the Lock Screen beat another text in a crowded inbox',
              'Lower costs - flat monthly price, no per-message fees',
              'Easy for staff - scan the Wallet card like a normal barcode/QR',
              'Zero app - customers already have Apple Wallet',
              'Fast launch - go live in minutes, not weeks',
              'Always visible - your card lives on their Lock Screen'
            ],
            testimonials: [],
            selectedPackages: [
              { id: '1', name: 'Starter', price: 29, features: ['1,000 passes/month', '3 programs', '2 staff accounts'] },
              { id: '2', name: 'Business', price: 69, features: ['5,000 passes/month', '10 programs', '5 staff accounts'] },
              { id: '3', name: 'Pro', price: 97, features: ['10,000 passes/month', '20 programs', 'Unlimited staff'] }
            ],
            templateStyle: 'modern-dark',
            primaryColor: '#2563eb',
            secondaryColor: '#7c3aed',
            accentColor: '#10b981',
            fontFamily: 'Inter',
            callToAction: 'Start Free Trial'
          },
          createdAt: new Date().toISOString(),
          isGlobal: true,
          createdBy: 'WalletPush'
        }
      ]
      setTemplates(mockTemplates)
      setTemplatesByCategory({ 'business-main': mockTemplates })
    } finally {
      setLoading(false)
    }
  }

  const getFilteredTemplates = () => {
    if (selectedCategory === 'all') {
      return templates
    }
    return templatesByCategory[selectedCategory] || []
  }

  const categories = ['all', ...Object.keys(templatesByCategory)]

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <ArrowPathIcon className="w-8 h-8 text-slate-400 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading templates...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-800 mb-4">{error}</p>
            <Button onClick={loadTemplates} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Choose a Template</h3>
        <p className="text-slate-600">
          Select a template to get started quickly, then customize it with your own content and branding.
        </p>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {category === 'all' ? '🎨 All Templates' : `${CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || '📋'} ${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}`}
            </button>
          ))}
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredTemplates().map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedTemplate === template.id
                ? 'border-2 border-blue-500 bg-blue-50'
                : 'border-2 border-slate-200 hover:border-blue-300'
            }`}
            onClick={() => onTemplateSelect(template)}
          >
            <CardHeader className="p-4">
              <div className="aspect-video bg-slate-100 rounded-lg mb-4 overflow-hidden">
                {template.preview ? (
                  <img 
                    src={template.preview} 
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <SparklesIcon className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-slate-900 mb-1">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    {template.description}
                  </CardDescription>
                </div>
                {selectedTemplate === template.id && (
                  <CheckIcon className="w-5 h-5 text-blue-600 ml-2 flex-shrink-0" />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center">
                  {template.isGlobal ? '🌍' : '👤'} {template.createdBy}
                </span>
                <span>{CATEGORY_LABELS[template.category as keyof typeof CATEGORY_LABELS] || template.category}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {getFilteredTemplates().length === 0 && (
        <div className="text-center py-12">
          <SparklesIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No templates found</h3>
          <p className="text-slate-600 mb-4">
            {selectedCategory === 'all' 
              ? 'No templates are available yet.' 
              : `No templates found in the ${CATEGORY_LABELS[selectedCategory as keyof typeof CATEGORY_LABELS] || selectedCategory} category.`}
          </p>
          {selectedCategory !== 'all' && (
            <Button 
              onClick={() => setSelectedCategory('all')} 
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              View All Templates
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
