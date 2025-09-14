'use client'

import React, { useState } from 'react'
import TemplateSelector from '@/components/templates/template-selector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function TemplateDemoPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [templateType, setTemplateType] = useState<'sales-page' | 'distribution' | 'all'>('all')

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template)
    console.log('🎨 Selected template:', template)
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
                <SparklesIcon className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Unified Template System Demo</h1>
                  <p className="text-sm text-slate-600">See how templates work for both Agency and Business users</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Template Selector */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  🎨 Template Type Filter
                </CardTitle>
                <CardDescription>
                  Choose what type of templates to show
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setTemplateType('all')}
                    variant={templateType === 'all' ? 'default' : 'outline'}
                    className={templateType === 'all' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : ''}
                  >
                    All Templates
                  </Button>
                  <Button
                    onClick={() => setTemplateType('sales-page')}
                    variant={templateType === 'sales-page' ? 'default' : 'outline'}
                    className={templateType === 'sales-page' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : ''}
                  >
                    Sales Pages (Agency)
                  </Button>
                  <Button
                    onClick={() => setTemplateType('distribution')}
                    variant={templateType === 'distribution' ? 'default' : 'outline'}
                    className={templateType === 'distribution' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : ''}
                  >
                    Distribution (Business)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <TemplateSelector
              templateType={templateType}
              selectedTemplate={selectedTemplate?.id}
              onTemplateSelect={handleTemplateSelect}
            />
          </div>

          {/* Selected Template Details */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  🔍 Selected Template
                </CardTitle>
                <CardDescription>
                  Template details and data preview
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">{selectedTemplate.name}</h3>
                      <p className="text-sm text-slate-600 mb-4">{selectedTemplate.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-medium text-slate-700">Category:</span>
                          <p className="text-slate-600">{selectedTemplate.category}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Type:</span>
                          <p className="text-slate-600">{selectedTemplate.type}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Created by:</span>
                          <p className="text-slate-600">{selectedTemplate.createdBy}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Global:</span>
                          <p className="text-slate-600">{selectedTemplate.isGlobal ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-slate-900 mb-2">Template Data Preview:</h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium text-slate-700">Headline:</span>
                          <p className="text-slate-600 truncate">{selectedTemplate.templateData.headline}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Features:</span>
                          <p className="text-slate-600">{selectedTemplate.templateData.features.length} items</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Packages:</span>
                          <p className="text-slate-600">{selectedTemplate.templateData.selectedPackages.length} pricing tiers</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Style:</span>
                          <p className="text-slate-600">{selectedTemplate.templateData.templateStyle}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Colors:</span>
                          <div className="flex gap-2 mt-1">
                            <div 
                              className="w-4 h-4 rounded border border-slate-300" 
                              style={{ backgroundColor: selectedTemplate.templateData.primaryColor }}
                              title="Primary"
                            />
                            <div 
                              className="w-4 h-4 rounded border border-slate-300" 
                              style={{ backgroundColor: selectedTemplate.templateData.secondaryColor }}
                              title="Secondary"
                            />
                            <div 
                              className="w-4 h-4 rounded border border-slate-300" 
                              style={{ backgroundColor: selectedTemplate.templateData.accentColor }}
                              title="Accent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-slate-900 mb-2">How This Works:</h4>
                      <ul className="text-xs text-slate-600 space-y-1">
                        <li>• Template data is stored in database</li>
                        <li>• Both Agency & Business can use templates</li>
                        <li>• Content gets replaced with user's data</li>
                        <li>• Design structure stays the same</li>
                        <li>• Colors and fonts can be customized</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <SparklesIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 text-sm">
                      Select a template to see its details and data structure
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Explanation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              💡 How the Unified Template System Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">🏛️ Agency Sales Page Designer</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• <strong>Step 5:</strong> Template selection uses this system</li>
                  <li>• Templates provide complete page structure</li>
                  <li>• Agency customizes copy, branding, pricing</li>
                  <li>• Perfect for client sales pages</li>
                  <li>• Categories: business-main, agency-sales, general-sales</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">🏢 Business Distribution Page</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• <strong>Step 5:</strong> Template selection uses this system</li>
                  <li>• Templates provide landing page structure</li>
                  <li>• Business customizes for their programs</li>
                  <li>• Perfect for customer signup pages</li>
                  <li>• Categories: loyalty, coupon, membership, store-card</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">🎯 The Magic:</h4>
              <p className="text-blue-800 text-sm">
                Your beautiful main sales page becomes a <strong>template blueprint</strong> that both agencies and businesses can use. 
                They get the professional design and conversion-optimized structure, but can customize all the content, 
                branding, and pricing to match their needs. It's like having a professional designer create the foundation, 
                then letting users build their own house on top!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
