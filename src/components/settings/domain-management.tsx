'use client'

import { useState, useEffect } from 'react'
import { Plus, Globe, Trash2, Check, X } from 'lucide-react'

interface Domain {
  id: string
  domain: string
  domain_type: 'customer' | 'admin' | 'main'
  is_primary: boolean
  created_at: string
}

export function DomainManagement() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newDomain, setNewDomain] = useState({
    domain: '',
    domain_type: 'customer' as 'customer' | 'admin' | 'main',
    is_primary: false
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains')
      const data = await response.json()
      
      if (response.ok) {
        setDomains(data.domains || [])
      } else {
        setError(data.error || 'Failed to fetch domains')
      }
    } catch (err) {
      setError('Failed to fetch domains')
    } finally {
      setIsLoading(false)
    }
  }

  const addDomain = async () => {
    if (!newDomain.domain) {
      setError('Domain is required')
      return
    }

    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDomain),
      })

      const data = await response.json()

      if (response.ok) {
        setDomains([...domains, data.domain])
        setNewDomain({ domain: '', domain_type: 'customer', is_primary: false })
        setIsAdding(false)
        setError('')
      } else {
        setError(data.error || 'Failed to add domain')
      }
    } catch (err) {
      setError('Failed to add domain')
    }
  }

  const deleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) {
      return
    }

    try {
      const response = await fetch(`/api/domains?id=${domainId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDomains(domains.filter(d => d.id !== domainId))
        setError('')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete domain')
      }
    } catch (err) {
      setError('Failed to delete domain')
    }
  }

  const getDomainTypeLabel = (type: string) => {
    switch (type) {
      case 'customer': return 'Customer Portal'
      case 'admin': return 'Admin Portal'
      case 'main': return 'Main Website'
      default: return type
    }
  }

  const getDomainTypeColor = (type: string) => {
    switch (type) {
      case 'customer': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'admin': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'main': return 'bg-green-500/20 text-green-300 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
        <div className="text-white">Loading domains...</div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Custom Domains</h2>
          <p className="text-[#C6C8CC]">
            Configure custom domains for your portals
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 border border-white/30 rounded-lg text-white font-medium transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Add Domain
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Add Domain Form */}
      {isAdding && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Domain</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Domain
              </label>
              <input
                type="text"
                value={newDomain.domain}
                onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                placeholder="example.com"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[#C6C8CC] focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Portal Type
              </label>
              <select
                value={newDomain.domain_type}
                onChange={(e) => setNewDomain({ ...newDomain, domain_type: e.target.value as any })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="customer">Customer Portal</option>
                <option value="admin">Admin Portal</option>
                <option value="main">Main Website</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={newDomain.is_primary}
                  onChange={(e) => setNewDomain({ ...newDomain, is_primary: e.target.checked })}
                  className="rounded border-white/20 bg-white/10"
                />
                <span className="text-sm">Primary</span>
              </label>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={addDomain}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-400/10 hover:from-green-500/30 hover:to-green-400/20 border border-green-500/30 rounded-lg text-green-300 font-medium transition-all duration-200"
            >
              <Check className="w-4 h-4" />
              Add Domain
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewDomain({ domain: '', domain_type: 'customer', is_primary: false })
                setError('')
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-200"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Domains List */}
      <div className="space-y-4">
        {domains.length === 0 ? (
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-[#C6C8CC] mx-auto mb-4" />
            <p className="text-[#C6C8CC]">No custom domains configured</p>
            <p className="text-sm text-[#C6C8CC] mt-2">
              Add a custom domain to white-label your portals
            </p>
          </div>
        ) : (
          domains.map((domain) => (
            <div
              key={domain.id}
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Globe className="w-5 h-5 text-[#C6C8CC]" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{domain.domain}</span>
                    {domain.is_primary && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-xs">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 border rounded text-xs ${getDomainTypeColor(domain.domain_type)}`}>
                      {getDomainTypeLabel(domain.domain_type)}
                    </span>
                    <span className="text-sm text-[#C6C8CC]">
                      Added {new Date(domain.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => deleteDomain(domain.id)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                title="Delete domain"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Domain Setup Instructions */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h4 className="text-white font-medium mb-2">Domain Setup Instructions</h4>
        <div className="text-sm text-[#C6C8CC] space-y-1">
          <p>1. Add your domain above</p>
          <p>2. Create a CNAME record pointing to: <code className="bg-white/10 px-1 rounded">app.walletpush.com</code></p>
          <p>3. Wait for DNS propagation (up to 24 hours)</p>
          <p>4. Your custom domain will be active once DNS resolves</p>
        </div>
      </div>
    </div>
  )
}
