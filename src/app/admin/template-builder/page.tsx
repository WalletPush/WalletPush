'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  ArrowLeftIcon, 
  SparklesIcon, 
  PlusIcon,
  EyeIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function TemplateBuilderPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const templates = [
    {
      id: 'main-sales',
      name: 'WalletPush Main Template',
      description: 'Complete main sales page with dark hero, pricing tables, FAQs, and conversion-optimized copy',
      category: 'business-main',
      style: 'Dark gradient (Blue to Purple)',
      status: 'Ready',
      previewUrl: '/',
      saveEndpoint: '/api/templates/save-main-page'
    },
    {
      id: 'membership-club',
      name: 'Membership Club Template',
      description: 'Premium membership club template for agencies targeting exclusive membership businesses',
      category: 'membership',
      style: 'Premium gradient (Purple to Pink)',
      status: 'Ready',
      previewUrl: '/templates/membership-club',
      saveEndpoint: '/api/templates/save-membership-club'
    },
    {
      id: 'restaurant',
      name: 'Restaurant & Food Template',
      description: 'Warm template for restaurants, cafes, pizza places, and food service businesses',
      category: 'restaurant',
      style: 'Warm gradient (Orange to Red)',
      status: 'Ready',
      previewUrl: '/templates/restaurant',
      saveEndpoint: '/api/templates/save-restaurant'
    },
    {
      id: 'fitness',
      name: 'Fitness & Gym Template',
      description: 'Energetic template for gyms, fitness centers, yoga studios, and fitness businesses',
      category: 'fitness',
      style: 'Energy gradient (Green to Blue)',
      status: 'Ready',
      previewUrl: '/templates/fitness',
      saveEndpoint: '/api/templates/save-fitness'
    },
    {
      id: 'retail',
      name: 'Retail & Shopping Template',
      description: 'Professional template for retail stores, boutiques, fashion, and shopping businesses',
      category: 'retail',
      style: 'Professional gradient (Slate to Dark)',
      status: 'Ready',
      previewUrl: '/templates/retail',
      saveEndpoint: '/api/templates/save-retail'
    }
  ]

  const handleSaveTemplate = async (template: typeof templates[0]) => {
    try {
      setIsLoading(true)
      setMessage(null)

      const response = await fetch(template.saveEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save template')
      }

      setMessage({
        type: 'success',
        text: `Template "${template.name}" saved successfully to the template library!`
      })

    } catch (error) {
      console.error('❌ Error saving template:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save template'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link 
                href="/" 
                className="flex items-center text-slate-600 hover:text-slate-900 transition-colors mr-6"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Main Page
              </Link>
              <div className="flex items-center">
                <SparklesIcon className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Template Builder</h1>
                  <p className="text-sm text-slate-600">Create and manage template library</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/template-demo">
                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  View Template Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Status Message */}
        {message && (
          <Card className={`mb-8 border-2 ${
            message.type === 'success' 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <CheckIcon className="w-5 h-5 text-green-600 mr-3" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-3" />
                )}
                <p className={`text-sm ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              🎨 Template Library Builder
            </CardTitle>
            <CardDescription>
              Create beautiful templates for different niches and use cases. Each template becomes available 
              in both the Agency Sales Page Designer and Business Distribution Page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🏛️</div>
                <h3 className="font-semibold text-slate-900 mb-1">Agency Sales Pages</h3>
                <p className="text-sm text-slate-600">Templates for client acquisition</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">🏢</div>
                <h3 className="font-semibold text-slate-900 mb-1">Business Distribution</h3>
                <p className="text-sm text-slate-600">Templates for customer signup</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold text-slate-900 mb-1">Niche Focused</h3>
                <p className="text-sm text-slate-600">Different styles & copy per vertical</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Library */}
        <div className="grid lg:grid-cols-2 gap-8">
          {templates.map((template) => (
            <Card key={template.id} className="border-2 hover:border-purple-200 transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-slate-900 mb-2">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-slate-600 mb-4">
                      {template.description}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    template.status === 'Ready' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {template.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Category:</span>
                      <p className="text-slate-600 capitalize">{template.category}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Style:</span>
                      <p className="text-slate-600">{template.style}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link href={template.previewUrl} target="_blank" className="flex-1">
                      <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
                        <EyeIcon className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => handleSaveTemplate(template)}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {isLoading ? 'Saving...' : 'Save to Library'}
                    </Button>
                  </div>

                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded">
                    <strong>Usage:</strong> Once saved, this template will be available in both Agency Sales Page Designer 
                    and Business Distribution Page. Users can select it in Step 5 and customize the content while keeping 
                    the professional design structure.
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Template Card */}
          <Card className="border-2 border-dashed border-slate-300 hover:border-purple-300 transition-all duration-300">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <PlusIcon className="w-12 h-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Create New Template</h3>
              <p className="text-slate-600 mb-6">
                Build another template for a different niche or use case
              </p>
              <Button 
                variant="outline" 
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                disabled
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Template Categories */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📋 Template Categories</CardTitle>
            <CardDescription>
              Different template categories for various business types and use cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { category: 'business-main', icon: '🏢', name: 'Business Main', description: 'General business sales pages' },
                { category: 'membership', icon: '👑', name: 'Membership', description: 'Exclusive membership clubs' },
                { category: 'loyalty', icon: '🎯', name: 'Loyalty', description: 'Customer loyalty programs' },
                { category: 'coupon', icon: '🎫', name: 'Coupon', description: 'Digital coupon campaigns' },
                { category: 'store-card', icon: '💳', name: 'Store Card', description: 'Prepaid store cards' },
                { category: 'distribution', icon: '📄', name: 'Distribution', description: 'Customer signup pages' },
                { category: 'agency-sales', icon: '🏛️', name: 'Agency Sales', description: 'Agency client acquisition' },
                { category: 'general', icon: '📋', name: 'General', description: 'Multi-purpose templates' }
              ].map((cat) => (
                <div key={cat.category} className="p-4 bg-slate-50 rounded-lg text-center">
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <h4 className="font-medium text-slate-900 mb-1">{cat.name}</h4>
                  <p className="text-xs text-slate-600">{cat.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-900">
              🚀 Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-purple-800">
              <div className="flex items-start">
                <span className="font-bold mr-3">1.</span>
                <div>
                  <strong>Save Templates:</strong> Click "Save to Library" to add templates to the database
                </div>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-3">2.</span>
                <div>
                  <strong>Integration:</strong> Update Agency Sales Page Designer and Business Distribution Page to use TemplateSelector component
                </div>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-3">3.</span>
                <div>
                  <strong>Template Application:</strong> When users select a template, populate their wizard with the template data
                </div>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-3">4.</span>
                <div>
                  <strong>Create More:</strong> Build templates for other niches (restaurants, fitness, retail, etc.)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
