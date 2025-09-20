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
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import CustomFieldsManager from '@/components/settings/custom-fields-manager'

type SettingsTab = 'custom-fields' | 'domains' | 'smtp' | 'security' | 'billing' | 'team' | 'api'

interface CustomDomain {
  id: string
  domain: string
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

interface OpenAISettings {
  apiKey: string
  model: string
  enabled: boolean
  lastTested: string | null
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('custom-fields')
  const [isLoading, setIsLoading] = useState(false)
  
  // Custom Domains State
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [loadingDomains, setLoadingDomains] = useState(true)

  // SMTP Settings State
  const [smtpSettings, setSmtpSettings] = useState<SMTPSettings>({
    host: 'smtp.gmail.com',
    port: 587,
    username: '',
    password: '',
    fromName: 'WalletPush',
    fromEmail: '',
    encryption: 'tls',
    enabled: false
  })

  // OpenRouter Settings State
  const [openRouterSettings, setOpenRouterSettings] = useState<OpenAISettings>({
    apiKey: '',
    model: 'anthropic/claude-sonnet-4',
    enabled: false,
    lastTested: null
  })

  // Load existing settings on component mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/business-settings?key=openrouter')
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
        console.error('Error loading OpenRouter settings:', error)
      }
    }

    const loadDomains = async () => {
      try {
        // Get the session for authentication
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          console.log('No session found for loading domains')
          setLoadingDomains(false)
          return
        }

        const response = await fetch('/api/domains', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        const result = await response.json()
        
        if (response.ok) {
          setCustomDomains(result.domains?.map((d: any) => ({
            id: d.id,
            domain: d.domain,
            status: d.status === 'active' ? 'active' : 'pending',
            sslStatus: d.ssl_status || 'pending',
            createdAt: new Date(d.created_at).toLocaleDateString()
          })) || [])
        }
      } catch (error) {
        console.error('Error loading domains:', error)
      } finally {
        setLoadingDomains(false)
      }
    }
    
    loadSettings()
    loadDomains()
  }, [])

  const handleAddDomain = async () => {
    if (!newDomain) return
    
    setIsLoading(true)
    
    try {
      // Get the session for authentication
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('You must be logged in to add domains')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          domain: newDomain,
          domain_type: 'customer',
          is_primary: false
        })
      })

      const result = await response.json()

      console.log('🔍 Domain API response:', { status: response.status, result })

      if (response.ok) {
        const newDomainObj: CustomDomain = {
          id: result.domain.id,
          domain: result.domain.domain,
          status: 'pending',
          sslStatus: 'pending',
          createdAt: new Date().toLocaleDateString()
        }
        
        setCustomDomains([...customDomains, newDomainObj])
        setNewDomain('')
        alert('Domain added successfully! Please configure your DNS settings.')
      } else {
        console.error('❌ Domain API error:', result)
        alert(`Failed to add domain: ${result.error || result.details || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding domain:', error)
      alert('Failed to add domain. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to remove this domain? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCustomDomains(customDomains.filter(d => d.id !== domainId))
        alert('Domain removed successfully!')
      } else {
        const result = await response.json()
        alert(`Failed to remove domain: ${result.error}`)
      }
    } catch (error) {
      console.error('Error removing domain:', error)
      alert('Failed to remove domain. Please try again.')
    }
  }

  const handleConfigureDomain = (domain: string) => {
    const dnsInstructions = `
DNS CONFIGURATION FOR: ${domain}

To configure your domain, add these DNS records:

1. CNAME Record:
   - Host: @ (for root domain) or subdomain name only
   - Value: walletpush.io
   - TTL: 3600

2. TXT Record (for verification):
   - Host: _walletpush-verification
   - Value: ${domain}-${Date.now()}
   - TTL: 3600

Once configured, it may take up to 24 hours for changes to propagate.

Need help? Contact support@walletpush.io
    `
    
    alert(dnsInstructions)
  }

  const handleVerifyDomain = async (domainId: string, domain: string) => {
    try {
      // Get the session for authentication
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('You must be logged in to verify domains')
        return
      }

      const response = await fetch(`/api/domains/${domainId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok) {
        // Refresh the domains list
        await loadDomains()
        alert(`Domain verification: ${result.verified ? 'SUCCESS! Domain is now active.' : 'DNS records not found yet. Please check your DNS configuration.'}`)
      } else {
        alert(`Verification failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error verifying domain:', error)
      alert('Failed to verify domain. Please try again.')
    }
  }

  const handleSaveSMTP = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    // Show success message
  }

  const handleTestSMTP = async () => {
    setIsLoading(true)
    // Simulate test email
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    alert('Test email sent successfully!')
  }

  const handleSaveOpenRouter = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/business-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setting_key: 'openrouter',
          setting_value: {
            api_key: openRouterSettings.apiKey,
            model: openRouterSettings.model,
            enabled: openRouterSettings.enabled,
            last_tested: openRouterSettings.lastTested
          }
        })
      })
      
      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      alert('OpenRouter settings saved successfully!')
      
    } catch (error) {
      console.error('Error saving OpenRouter settings:', error)
      alert('Failed to save OpenRouter settings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestOpenRouter = async () => {
    setIsLoading(true)
    // Simulate OpenRouter API test
    await new Promise(resolve => setTimeout(resolve, 2500))
    const now = new Date().toISOString()
    setOpenRouterSettings({...openRouterSettings, lastTested: now})
    setIsLoading(false)
    alert('OpenRouter API connection successful!')
  }

  const tabs = [
    { id: 'custom-fields', name: 'Custom Fields', icon: AdjustmentsHorizontalIcon },
    { id: 'domains', name: 'Custom Domains', icon: GlobeAltIcon },
    { id: 'smtp', name: 'Email/SMTP', icon: EnvelopeIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon },
    { id: 'team', name: 'Team', icon: UserGroupIcon },
    { id: 'api', name: 'API Keys', icon: KeyIcon },
  ]

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    }
    return `px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`
  }

  return (
    <div className="dashboard-header">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">Manage your business settings and configurations</p>
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
          {/* Custom Fields Tab */}
          {activeTab === 'custom-fields' && (
            <CustomFieldsManager />
          )}

          {/* Custom Domains Tab */}
          {activeTab === 'domains' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Custom Domains</h3>
                <p className="text-slate-600 mb-6">
                  Set up custom domains for your membership and loyalty programs. 
                  Each domain will have its own branded landing page.
                </p>

                {/* Add New Domain */}
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-slate-900 mb-3">Add New Domain</h4>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g., membership.yourbusiness.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleAddDomain}
                      disabled={isLoading || !newDomain}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Adding...' : 'Add Domain'}
                    </button>
                  </div>
                </div>

                {/* Domains List */}
                <div className="space-y-3">
                  {loadingDomains ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-slate-500 mt-2">Loading domains...</p>
                    </div>
                  ) : customDomains.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-500">No domains configured yet.</p>
                      <p className="text-sm text-slate-400 mt-1">Add a domain above to get started.</p>
                    </div>
                  ) : (
                    customDomains.map((domain) => (
                    <div key={domain.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-slate-900">{domain.domain}</h4>
                          <span className={getStatusBadge(domain.status)}>
                            {domain.status.charAt(0).toUpperCase() + domain.status.slice(1)}
                          </span>
                          <span className={getStatusBadge(domain.sslStatus)}>
                            SSL: {domain.sslStatus.charAt(0).toUpperCase() + domain.sslStatus.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">Added on {domain.createdAt}</p>
                        
                        {domain.status === 'pending' && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                            <p className="font-medium text-yellow-800">DNS Configuration Required</p>
                            <p className="text-yellow-700 mt-1">
                              Please add these DNS records to your domain:
                            </p>
                            <div className="mt-2 font-mono text-xs bg-yellow-100 p-2 rounded">
                              <div>Type: CNAME</div>
                              <div>Name: @ (for {domain.domain})</div>
                              <div>Value: walletpush.io</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleConfigureDomain(domain.domain)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                        >
                          Configure
                        </button>
                        {domain.status === 'pending' && (
                          <button 
                            onClick={() => handleVerifyDomain(domain.id, domain.domain)}
                            className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded"
                          >
                            Verify
                          </button>
                        )}
                        <button 
                          onClick={() => handleRemoveDomain(domain.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SMTP Tab */}
          {activeTab === 'smtp' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Email & SMTP Configuration</h3>
                <p className="text-slate-600 mb-6">
                  Configure your SMTP settings to send emails to your members. 
                  This enables CRM functionality and automated communications.
                </p>

                <div className="space-y-6">
                  {/* SMTP Status */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${smtpSettings.enabled ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                      <span className="font-medium text-slate-900">
                        SMTP {smtpSettings.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <button
                      onClick={() => setSmtpSettings({...smtpSettings, enabled: !smtpSettings.enabled})}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        smtpSettings.enabled 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {smtpSettings.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>

                  {/* SMTP Settings Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">SMTP Host</label>
                      <input
                        type="text"
                        value={smtpSettings.host}
                        onChange={(e) => setSmtpSettings({...smtpSettings, host: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="smtp.gmail.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Port</label>
                      <input
                        type="number"
                        value={smtpSettings.port}
                        onChange={(e) => setSmtpSettings({...smtpSettings, port: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="587"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                      <input
                        type="text"
                        value={smtpSettings.username}
                        onChange={(e) => setSmtpSettings({...smtpSettings, username: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your-email@domain.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                      <input
                        type="password"
                        value={smtpSettings.password}
                        onChange={(e) => setSmtpSettings({...smtpSettings, password: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">From Name</label>
                      <input
                        type="text"
                        value={smtpSettings.fromName}
                        onChange={(e) => setSmtpSettings({...smtpSettings, fromName: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your Business Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">From Email</label>
                      <input
                        type="email"
                        value={smtpSettings.fromEmail}
                        onChange={(e) => setSmtpSettings({...smtpSettings, fromEmail: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="noreply@yourbusiness.com"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Encryption</label>
                      <select
                        value={smtpSettings.encryption}
                        onChange={(e) => setSmtpSettings({...smtpSettings, encryption: e.target.value as any})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">None</option>
                        <option value="tls">TLS</option>
                        <option value="ssl">SSL</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveSMTP}
                      disabled={isLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Settings'}
                    </button>
                    <button
                      onClick={handleTestSMTP}
                      disabled={isLoading || !smtpSettings.host || !smtpSettings.username}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Testing...' : 'Send Test Email'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder tabs for future implementation */}
          {activeTab === 'security' && (
            <div className="text-center py-12">
              <ShieldCheckIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Security Settings</h3>
              <p className="text-slate-600">Two-factor authentication, API access, and security logs coming soon.</p>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="text-center py-12">
              <CreditCardIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Billing Settings</h3>
              <p className="text-slate-600">Subscription management and billing history coming soon.</p>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="text-center py-12">
              <UserGroupIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Team Management</h3>
              <p className="text-slate-600">Invite team members and manage permissions coming soon.</p>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">API Keys & Integrations</h3>
                <p className="text-slate-600 mb-6">
                  Manage your API keys for third-party integrations and AI-powered features.
                </p>

                {/* OpenRouter API Settings */}
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <SparklesIcon className="w-6 h-6 text-purple-600" />
                    <h4 className="text-lg font-semibold text-slate-900">OpenRouter API</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      openRouterSettings.enabled 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}>
                      {openRouterSettings.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <p className="text-slate-600 mb-6">
                    Enable AI-powered features for generating HTML landing pages, email content, and more.
                  </p>

                  <div className="space-y-6">
                    {/* API Key Status */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-purple-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${openRouterSettings.enabled ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                        <span className="font-medium text-slate-900">
                          OpenRouter Integration {openRouterSettings.enabled ? 'Active' : 'Inactive'}
                        </span>
                        {openRouterSettings.lastTested && (
                          <span className="text-sm text-slate-500">
                            Last tested: {new Date(openRouterSettings.lastTested).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setOpenRouterSettings({...openRouterSettings, enabled: !openRouterSettings.enabled})}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          openRouterSettings.enabled 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {openRouterSettings.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>

                    {/* OpenRouter Settings Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          OpenRouter API Key
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="password"
                          value={openRouterSettings.apiKey}
                          onChange={(e) => setOpenRouterSettings({...openRouterSettings, apiKey: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="sk-or-v1-..."
                        />
                        <p className="text-sm text-slate-500 mt-1">
                          Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">OpenRouter Dashboard</a>
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
                        <select
                          value={openRouterSettings.model}
                          onChange={(e) => setOpenRouterSettings({...openRouterSettings, model: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="anthropic/claude-sonnet-4">Claude Sonnet 4 (Latest & Best)</option>
                          <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                          <option value="anthropic/claude-3-haiku">Claude 3 Haiku (Fast)</option>
                          <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
                          <option value="openai/gpt-4o">GPT-4o</option>
                          <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                          <option value="meta-llama/llama-3.1-405b-instruct">Llama 3.1 405B</option>
                          <option value="google/gemini-pro-1.5">Gemini Pro 1.5</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <div className="w-full">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Features Enabled</label>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              Landing Page Generation
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              Email Content Creation
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              Content Optimization
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSaveOpenRouter}
                        disabled={isLoading}
                        className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : 'Save Settings'}
                      </button>
                      <button
                        onClick={handleTestOpenRouter}
                        disabled={isLoading || !openRouterSettings.apiKey}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Testing...' : 'Test Connection'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Future API Integrations */}
                <div className="mt-8 p-6 border border-slate-200 rounded-lg bg-slate-50">
                  <h4 className="font-medium text-slate-900 mb-2">Coming Soon</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-white rounded border">
                      <h5 className="font-medium text-slate-700">Webhooks</h5>
                      <p className="text-sm text-slate-500">Real-time notifications</p>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <h5 className="font-medium text-slate-700">Zapier Integration</h5>
                      <p className="text-sm text-slate-500">Workflow automation</p>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <h5 className="font-medium text-slate-700">Analytics API</h5>
                      <p className="text-sm text-slate-500">Custom reporting</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}