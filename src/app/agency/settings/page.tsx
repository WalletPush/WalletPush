'use client'

import React, { useState } from 'react'
import { 
  GlobeAltIcon, 
  EnvelopeIcon, 
  ShieldCheckIcon,
  CreditCardIcon,
  UserGroupIcon,
  KeyIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  CogIcon
} from '@heroicons/react/24/outline'

type SettingsTab = 'domains' | 'smtp' | 'security' | 'billing' | 'team' | 'api' | 'branding' | 'stripe'

interface CustomDomain {
  id: string
  domain: string
  type: 'agency' | 'business'
  status: 'pending' | 'active' | 'failed'
  sslStatus: 'pending' | 'active' | 'failed'
  createdAt: string
}

interface SMTPSettings {
  host: string
  port: number
  username: string
  password: string
  fromName: string
  fromEmail: string
  encryption: 'none' | 'tls' | 'ssl'
  enabled: boolean
}

interface OpenRouterSettings {
  apiKey: string
  model: string
  enabled: boolean
  lastTested: string | null
}

interface BrandingSettings {
  logo: string | null
  primaryColor: string
  secondaryColor: string
  companyName: string
  supportEmail: string
  customCss: string
}

interface StripeSettings {
  connectAccountId: string | null
  isConnected: boolean
  accountType: 'standard' | 'express'
  chargesEnabled: boolean
  payoutsEnabled: boolean
  country: string
  currency: string
}

export default function AgencySettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('domains')
  const [isLoading, setIsLoading] = useState(false)

  const tabs = [
    { id: 'domains', name: 'Custom Domains', icon: GlobeAltIcon },
    { id: 'smtp', name: 'Email/SMTP', icon: EnvelopeIcon },
    { id: 'stripe', name: 'Stripe Connect', icon: CreditCardIcon },
    { id: 'branding', name: 'White-Label Branding', icon: BuildingOfficeIcon },
    { id: 'api', name: 'OpenRouter API', icon: SparklesIcon },
    { id: 'team', name: 'Team Management', icon: UserGroupIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon },
  ]
  
  // Custom Domains State
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([
    {
      id: '1',
      domain: 'portal.myagency.com',
      type: 'agency',
      status: 'active',
      sslStatus: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: '2', 
      domain: 'login.myagency.com',
      type: 'agency',
      status: 'pending',
      sslStatus: 'pending',
      createdAt: '2024-01-20'
    }
  ])
  const [newDomain, setNewDomain] = useState('')
  const [newDomainType, setNewDomainType] = useState<'agency' | 'business'>('agency')

  // SMTP Settings State
  const [smtpSettings, setSmtpSettings] = useState<SMTPSettings>({
    host: 'smtp.gmail.com',
    port: 587,
    username: '',
    password: '',
    fromName: 'My Agency',
    fromEmail: '',
    encryption: 'tls',
    enabled: false
  })

  // OpenRouter Settings State
  const [openRouterSettings, setOpenRouterSettings] = useState<OpenRouterSettings>({
    apiKey: '',
    model: 'anthropic/claude-sonnet-4',
    enabled: false,
    lastTested: null
  })

  // Branding Settings State
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({
    logo: null,
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    companyName: 'My Agency',
    supportEmail: 'support@myagency.com',
    customCss: ''
  })

  // Stripe Settings State
  const [stripeSettings, setStripeSettings] = useState<StripeSettings>({
    connectAccountId: null,
    isConnected: false,
    accountType: 'standard',
    chargesEnabled: false,
    payoutsEnabled: false,
    country: 'US',
    currency: 'USD'
  })

  // Load existing settings on component mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/agency/settings?key=openrouter')
        const result = await response.json()
        
        if (result.data && !result.error) {
          setOpenRouterSettings({
            apiKey: result.data.api_key || '',
            model: result.data.model || 'anthropic/claude-sonnet-4',
            enabled: result.data.enabled || false,
            lastTested: result.data.last_tested || null
          })
        }
      } catch (error) {
        console.error('Failed to load OpenRouter settings:', error)
      }
    }

    loadSettings()
  }, [])

  const addCustomDomain = async () => {
    if (!newDomain.trim()) return

    const domain: CustomDomain = {
      id: Date.now().toString(),
      domain: newDomain.trim(),
      type: newDomainType,
      status: 'pending',
      sslStatus: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    }

    setCustomDomains([...customDomains, domain])
    setNewDomain('')
  }

  const removeDomain = (id: string) => {
    setCustomDomains(customDomains.filter(d => d.id !== id))
  }

  const saveOpenRouterSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/agency/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'openrouter',
          data: {
            api_key: openRouterSettings.apiKey,
            model: openRouterSettings.model,
            enabled: openRouterSettings.enabled
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        alert('OpenRouter settings saved successfully!')
      } else {
        alert('Failed to save settings: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to save OpenRouter settings:', error)
      alert('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const testOpenRouterConnection = async () => {
    if (!openRouterSettings.apiKey) {
      alert('Please enter an API key first')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/agency/test-openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: openRouterSettings.apiKey,
          model: openRouterSettings.model
        })
      })

      const result = await response.json()
      if (result.success) {
        setOpenRouterSettings(prev => ({
          ...prev,
          lastTested: new Date().toISOString()
        }))
        alert('Connection successful!')
      } else {
        alert('Connection failed: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to test OpenRouter connection:', error)
      alert('Connection test failed')
    } finally {
      setIsLoading(false)
    }
  }

  const connectStripe = async () => {
    try {
      const response = await fetch('/api/agency/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: stripeSettings.accountType,
          country: stripeSettings.country
        })
      })

      const result = await response.json()
      if (result.success && result.connectUrl) {
        window.location.href = result.connectUrl
      } else {
        alert('Failed to initiate Stripe connection: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to connect Stripe:', error)
      alert('Failed to connect Stripe')
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'domains':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Custom Domains</h3>
              <p className="text-slate-600 mb-6">
                Configure custom domains for your agency portal and business clients.
              </p>
              
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="e.g., portal.myagency.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <select
                      value={newDomainType}
                      onChange={(e) => setNewDomainType(e.target.value as 'agency' | 'business')}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="agency">Agency Portal</option>
                      <option value="business">Business Template</option>
                    </select>
                  </div>
                  <button
                    onClick={addCustomDomain}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Domain
                  </button>
                </div>

                <div className="space-y-4">
                  {customDomains.map((domain) => (
                    <div key={domain.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-slate-900">{domain.domain}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            domain.type === 'agency' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {domain.type === 'agency' ? 'Agency' : 'Business'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            domain.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : domain.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {domain.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Added {domain.createdAt} • SSL: {domain.sslStatus}
                        </p>
                      </div>
                      <button
                        onClick={() => removeDomain(domain.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'smtp':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">SMTP Configuration</h3>
              <p className="text-slate-600 mb-6">
                Configure email settings for your agency and business clients.
              </p>
              
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={smtpSettings.host}
                      onChange={(e) => setSmtpSettings({...smtpSettings, host: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Port</label>
                    <input
                      type="number"
                      value={smtpSettings.port}
                      onChange={(e) => setSmtpSettings({...smtpSettings, port: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                    <input
                      type="text"
                      value={smtpSettings.username}
                      onChange={(e) => setSmtpSettings({...smtpSettings, username: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                    <input
                      type="password"
                      value={smtpSettings.password}
                      onChange={(e) => setSmtpSettings({...smtpSettings, password: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">From Name</label>
                    <input
                      type="text"
                      value={smtpSettings.fromName}
                      onChange={(e) => setSmtpSettings({...smtpSettings, fromName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">From Email</label>
                    <input
                      type="email"
                      value={smtpSettings.fromEmail}
                      onChange={(e) => setSmtpSettings({...smtpSettings, fromEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={smtpSettings.enabled}
                      onChange={(e) => setSmtpSettings({...smtpSettings, enabled: e.target.checked})}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-slate-700">Enable SMTP</span>
                  </label>
                  
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Save SMTP Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'stripe':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Stripe Connect</h3>
              <p className="text-slate-600 mb-6">
                Connect your Stripe account to process payments for your agency and business clients.
              </p>
              
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                {!stripeSettings.isConnected ? (
                  <div className="text-center py-8">
                    <CreditCardIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-slate-900 mb-2">Connect Stripe Account</h4>
                    <p className="text-slate-600 mb-6">
                      Connect your Stripe account to start processing payments
                    </p>
                    
                    <div className="max-w-md mx-auto space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Account Type</label>
                        <select
                          value={stripeSettings.accountType}
                          onChange={(e) => setStripeSettings({...stripeSettings, accountType: e.target.value as 'standard' | 'express'})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="standard">Standard (Full Dashboard Access)</option>
                          <option value="express">Express (Quick Setup)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                        <select
                          value={stripeSettings.country}
                          onChange={(e) => setStripeSettings({...stripeSettings, country: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="GB">United Kingdom</option>
                          <option value="AU">Australia</option>
                        </select>
                      </div>
                    </div>
                    
                    <button
                      onClick={connectStripe}
                      className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Connect with Stripe
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                          <ShieldCheckIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-green-900">Stripe Connected</p>
                          <p className="text-sm text-green-700">Account ID: {stripeSettings.connectAccountId}</p>
                        </div>
                      </div>
                      <button className="text-red-600 hover:text-red-700 text-sm">
                        Disconnect
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-slate-200 rounded-lg">
                        <p className="text-sm font-medium text-slate-700">Charges</p>
                        <p className={`text-lg font-semibold ${stripeSettings.chargesEnabled ? 'text-green-600' : 'text-red-600'}`}>
                          {stripeSettings.chargesEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                      <div className="p-4 border border-slate-200 rounded-lg">
                        <p className="text-sm font-medium text-slate-700">Payouts</p>
                        <p className={`text-lg font-semibold ${stripeSettings.payoutsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                          {stripeSettings.payoutsEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 'branding':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">White-Label Branding</h3>
              <p className="text-slate-600 mb-6">
                Customize the branding for your agency and business client portals.
              </p>
              
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={brandingSettings.companyName}
                      onChange={(e) => setBrandingSettings({...brandingSettings, companyName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Support Email</label>
                    <input
                      type="email"
                      value={brandingSettings.supportEmail}
                      onChange={(e) => setBrandingSettings({...brandingSettings, supportEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Primary Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={brandingSettings.primaryColor}
                        onChange={(e) => setBrandingSettings({...brandingSettings, primaryColor: e.target.value})}
                        className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandingSettings.primaryColor}
                        onChange={(e) => setBrandingSettings({...brandingSettings, primaryColor: e.target.value})}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={brandingSettings.secondaryColor}
                        onChange={(e) => setBrandingSettings({...brandingSettings, secondaryColor: e.target.value})}
                        className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandingSettings.secondaryColor}
                        onChange={(e) => setBrandingSettings({...brandingSettings, secondaryColor: e.target.value})}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Custom CSS</label>
                  <textarea
                    value={brandingSettings.customCss}
                    onChange={(e) => setBrandingSettings({...brandingSettings, customCss: e.target.value})}
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="/* Add custom CSS for advanced branding */"
                  />
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Save Branding Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'api':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">OpenRouter API Settings</h3>
              <p className="text-slate-600 mb-6">
                Configure OpenRouter API for AI-powered sales page generation and content creation.
              </p>
              
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">API Key</label>
                    <input
                      type="password"
                      value={openRouterSettings.apiKey}
                      onChange={(e) => setOpenRouterSettings({...openRouterSettings, apiKey: e.target.value})}
                      placeholder="sk-or-..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
                    <select
                      value={openRouterSettings.model}
                      onChange={(e) => setOpenRouterSettings({...openRouterSettings, model: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
                      <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                      <option value="openai/gpt-4o">GPT-4o</option>
                      <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={openRouterSettings.enabled}
                        onChange={(e) => setOpenRouterSettings({...openRouterSettings, enabled: e.target.checked})}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-slate-700">Enable OpenRouter API</span>
                    </label>
                    
                    {openRouterSettings.lastTested && (
                      <span className="text-sm text-green-600">
                        Last tested: {new Date(openRouterSettings.lastTested).toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={testOpenRouterConnection}
                      disabled={isLoading || !openRouterSettings.apiKey}
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      onClick={saveOpenRouterSettings}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'team':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Team Management</h3>
              <p className="text-slate-600 mb-6">
                Manage your agency team members and their permissions.
              </p>
              
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <div className="text-center py-8">
                  <UserGroupIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-slate-900 mb-2">Team Management</h4>
                  <p className="text-slate-600 mb-4">
                    Invite team members and manage their access to your agency portal.
                  </p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Invite Team Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Security Settings</h3>
              <p className="text-slate-600 mb-6">
                Configure security settings for your agency and business clients.
              </p>
              
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <div className="text-center py-8">
                  <ShieldCheckIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-slate-900 mb-2">Security Configuration</h4>
                  <p className="text-slate-600 mb-4">
                    Two-factor authentication, API keys, and access controls.
                  </p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Configure Security
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Billing & Subscription</h3>
              <p className="text-slate-600 mb-6">
                Manage your agency subscription and billing with the platform.
              </p>
              
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <div className="text-center py-8">
                  <CreditCardIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-slate-900 mb-2">Agency Subscription</h4>
                  <p className="text-slate-600 mb-4">
                    $297/month • 100,000 pass allocation • Unlimited businesses
                  </p>
                  <div className="space-y-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2">
                      View Invoices
                    </button>
                    <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
                      Update Payment Method
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
          <h1 className="text-2xl font-bold text-slate-900">Agency Settings</h1>
          <p className="text-slate-600 mt-1">Configure your agency portal and business client settings</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-0">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`settings-nav-tab flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'settings-nav-tab-active'
                      : 'settings-nav-tab-inactive'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
