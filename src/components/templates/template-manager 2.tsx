'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DocumentArrowDownIcon, 
  DocumentDuplicateIcon, 
  SparklesIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface TemplateManagerProps {
  className?: string
}

export default function TemplateManager({ className = '' }: TemplateManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSaveAsTemplate = async () => {
    try {
      setIsLoading(true)
      setMessage(null)

      const response = await fetch('/api/templates/save-main-page', {
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
        text: `Template "${data.template.name}" saved successfully! You can now use it in the Sales Page Designer.`
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

  const handleExportHTML = async () => {
    try {
      setIsLoading(true)
      setMessage(null)

      const response = await fetch('/api/templates/export-html')

      if (!response.ok) {
        throw new Error('Failed to export HTML')
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'walletpush-main-page.html'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setMessage({
        type: 'success',
        text: 'HTML file downloaded successfully! You can now use it as a standalone website.'
      })

    } catch (error) {
      console.error('❌ Error exporting HTML:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to export HTML'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Save This Beautiful Page as a Template
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Your main sales page is absolutely stunning! Save it as a template for agencies to use, 
          or export it as standalone HTML for use anywhere.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Save as Agency Template */}
        <Card className="border-2 hover:border-blue-200 transition-all duration-300">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Save as Agency Template</CardTitle>
            <CardDescription>
              Add this page to your Sales Page Designer as a reusable template that agencies can customize
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-left space-y-2 mb-6 text-sm text-slate-600">
              <li className="flex items-center">
                <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                Available in Sales Page Designer
              </li>
              <li className="flex items-center">
                <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                Agencies can customize copy & branding
              </li>
              <li className="flex items-center">
                <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                Includes all sections & pricing tables
              </li>
              <li className="flex items-center">
                <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                Responsive & conversion-optimized
              </li>
            </ul>
            <Button 
              onClick={handleSaveAsTemplate}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {isLoading ? 'Saving...' : 'Save as Template'}
            </Button>
          </CardContent>
        </Card>

        {/* Export as HTML */}
        <Card className="border-2 hover:border-green-200 transition-all duration-300">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentArrowDownIcon className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Export as Static HTML</CardTitle>
            <CardDescription>
              Download a standalone HTML file that you can host anywhere or use as a starting point
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-left space-y-2 mb-6 text-sm text-slate-600">
              <li className="flex items-center">
                <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                Self-contained HTML file
              </li>
              <li className="flex items-center">
                <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                Includes Tailwind CSS via CDN
              </li>
              <li className="flex items-center">
                <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                All animations & gradients
              </li>
              <li className="flex items-center">
                <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                Host on any web server
              </li>
            </ul>
            <Button 
              onClick={handleExportHTML}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? 'Exporting...' : 'Download HTML'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status Message */}
      {message && (
        <Card className={`border-2 ${
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

      {/* Additional Options */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
            What happens next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <strong>Agency Template:</strong> Once saved, agencies can access this template in their Sales Page Designer 
              and customize it with their own branding, copy, and pricing packages.
            </p>
            <p>
              <strong>Static HTML:</strong> The exported HTML file includes everything needed to run independently - 
              Tailwind CSS via CDN, all animations, and your exact styling. Perfect for hosting on any web server.
            </p>
            <p>
              <strong>Customization:</strong> Both options preserve your beautiful design while allowing for easy 
              customization of colors, copy, images, and pricing to match different brands.
            </p>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-300">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-slate-900">🎨 See the Unified Template System</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Demo how templates work for both Agency and Business users
                </p>
              </div>
              <Button 
                asChild
                variant="outline" 
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Link href="/admin/template-demo">
                  View Demo
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
