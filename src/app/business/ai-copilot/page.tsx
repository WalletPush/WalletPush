'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SparklesIcon, GlobeAltIcon, RocketLaunchIcon, ChartBarIcon } from '@heroicons/react/24/outline'

export default function AICopilotPage() {
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleGetStarted = async () => {
    if (!websiteUrl.trim()) {
      alert('Please enter your website URL')
      return
    }

    // Validate URL format
    let url = websiteUrl.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    try {
      new URL(url) // Validate URL
    } catch {
      alert('Please enter a valid website URL')
      return
    }

    setIsProcessing(true)
    
    // Navigate to chat interface in same window
    router.push(`/business/ai-copilot/chat?website=${encodeURIComponent(url)}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGetStarted()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <SparklesIcon className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            AI Copilot
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Let our AI assistant help you create the perfect membership program, loyalty system, store card, or coupon campaign for your business. 
            Simply enter your website URL and watch the magic happen!
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <GlobeAltIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Website Analysis</h3>
            <p className="text-slate-600">
              Our AI crawls your website to understand your business, industry, and target audience.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <SparklesIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Smart Suggestions</h3>
            <p className="text-slate-600">
              Get industry-specific recommendations and proven strategies to maximize customer engagement.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <RocketLaunchIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Auto Creation</h3>
            <p className="text-slate-600">
              Automatically generate your loyalty pass and promotional landing page in minutes.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 mb-12 text-slate-900">
          <div className="text-center mb-6">
            <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold mb-2">Why Customer Programs Work</h2>
            <p className="text-blue-600">Industry statistics that prove the power of customer engagement</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">68%</div>
              <div className="text-blue-600">increase in customer lifetime value</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">5x</div>
              <div className="text-blue-600">more cost-effective than acquiring new customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">73%</div>
              <div className="text-blue-600">of consumers prefer brands with loyalty programs</div>
            </div>
          </div>
        </div>

        {/* Main CTA */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-slate-600">
              Enter your website URL below and our AI will analyze your business to create the perfect customer program for your needs.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-2">
                Your Website URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GlobeAltIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="url"
                  id="website"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="www.yourwebsite.com"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  disabled={isProcessing}
                />
              </div>
            </div>

            <button
              onClick={handleGetStarted}
              disabled={isProcessing || !websiteUrl.trim()}
              className="w-full bg-blue-600 font-semibold py-4 px-6 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-lg text-white"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center text-white">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  <span className="text-white">Opening AI Assistant...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center text-white">
                  <SparklesIcon className="w-5 h-5 mr-2 text-white" />
                  <span className="text-white">Get Started with AI</span>
                </div>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              This process typically takes 2-3 minutes to analyze your website and create your program.
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                1
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Enter Website</h3>
              <p className="text-sm text-slate-600">Provide your website URL for analysis</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                2
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">AI Analysis</h3>
              <p className="text-sm text-slate-600">Our AI crawls and understands your business</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                3
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Smart Recommendations</h3>
              <p className="text-sm text-slate-600">Get personalized program suggestions</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                4
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Auto Creation</h3>
              <p className="text-sm text-slate-600">Launch your loyalty program instantly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
