'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  SparklesIcon,
  ChevronDownIcon,
  PlayIcon,
  PauseIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import AutomationBuilder from '@/components/automations/automation-builder'

interface Automation {
  id: string
  name: string
  description?: string
  status: 'published' | 'draft' | 'paused'
  trigger_type: string
  trigger_config: any
  conditions: any[]
  actions: any[]
  template_id?: string
  total_enrolled: number
  active_enrolled: number
  total_executions: number
  created_at: string
  updated_at: string
  last_executed_at?: string
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'needs_review' | 'deleted'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)

  useEffect(() => {
    fetchAutomations()
  }, [])

  const fetchAutomations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/business/automations')
      if (!response.ok) throw new Error('Failed to fetch automations')
      
      const { automations } = await response.json()
      setAutomations(automations || [])
    } catch (error) {
      console.error('Error fetching automations:', error)
      setAutomations([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNew = () => {
    setSelectedAutomation(null)
    setShowBuilder(true)
  }

  const handleEditAutomation = (automation: Automation) => {
    setSelectedAutomation(automation)
    setShowBuilder(true)
  }

  const handleSaveAutomation = (automation: Automation) => {
    if (selectedAutomation) {
      // Update existing
      setAutomations(automations.map(a => a.id === automation.id ? automation : a))
    } else {
      // Add new
      setAutomations([automation, ...automations])
    }
    setShowBuilder(false)
    setSelectedAutomation(null)
  }

  const handleDeleteAutomation = async (automationId: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return
    
    try {
      const response = await fetch(`/api/business/automations/${automationId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete automation')
      
      setAutomations(automations.filter(a => a.id !== automationId))
    } catch (error) {
      console.error('Error deleting automation:', error)
      toast.error('Failed to delete automation. Please try again.')
    }
  }

  const handleToggleStatus = async (automation: Automation) => {
    const newStatus = automation?.status === 'published' ? 'paused' : 'published'
    
    try {
      const response = await fetch(`/api/business/automations/${automation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...automation, status: newStatus })
      })
      if (!response.ok) throw new Error('Failed to update automation')
      
      const { automation: updatedAutomation } = await response.json()
      setAutomations(automations.map(a => a.id === automation.id ? updatedAutomation : a))
    } catch (error) {
      console.error('Error updating automation:', error)
      toast.error('Failed to update automation. Please try again.')
    }
  }

  const filteredAutomations = (automations || []).filter(automation => {
    if (activeTab === 'needs_review') return automation?.status === 'draft'
    if (activeTab === 'deleted') return false // No soft delete in current implementation
    
    if (searchQuery) {
      return automation?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             automation?.trigger_type?.toLowerCase().includes(searchQuery.toLowerCase())
    }
    
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'registration.created': return '📱'
      case 'scan.performed': return '📷'
      case 'pass.created': return '🎫'
      case 'pass.downloaded': return '⬇️'
      case 'custom_field_updated': return '✏️'
      default: return '⚡'
    }
  }

  const getTriggerName = (type: string) => {
    switch (type) {
      case 'pass.created': return 'Pass Created'
      case 'pass.downloaded': return 'Pass Downloaded'
      case 'registration.created': return 'Pass Installed'
      case 'scan.performed': return 'QR Code Scanned'
      case 'custom_field_updated': return 'Custom Field Updated'
      default: return type
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SparklesIcon className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
                <p className="text-sm text-gray-500">
                  Automate your member engagement with smart workflows
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Automation
            </button>
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          {/* Tabs */}
          <div className="flex space-x-8 -mb-px">
            {[
              { key: 'all', label: 'All Workflows', count: automations?.length || 0 },
              { key: 'needs_review', label: 'Needs Review', count: automations?.filter(a => a?.status === 'draft').length || 0 },
              { key: 'deleted', label: 'Deleted', count: 0 }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search automations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
                <ChevronDownIcon className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading automations...</span>
          </div>
        ) : filteredAutomations.length === 0 ? (
          <div className="text-center py-12">
            <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No automations yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first automation workflow.
            </p>
            <div className="mt-6">
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Automation
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredAutomations.map((automation) => (
                <div key={automation.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getTriggerIcon(automation.trigger_type)}</div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{automation.name}</h3>
                          {automation.description && (
                            <p className="text-sm text-gray-500 mt-1">{automation.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(automation?.status || 'draft')}`}>
                              {(automation?.status || 'draft').charAt(0).toUpperCase() + (automation?.status || 'draft').slice(1)}
                            </span>
                            <span className="text-sm text-gray-500">
                              Trigger: {getTriggerName(automation?.trigger_type || '')}
                            </span>
                            <span className="text-sm text-gray-500">
                              Actions: {automation?.actions?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{(automation?.total_enrolled || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Total Enrolled</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{(automation?.active_enrolled || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Active</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-500">{formatDate(automation?.updated_at || automation?.created_at)}</div>
                        <div className="text-xs text-gray-500">Last Updated</div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleStatus(automation)}
                          className={`p-2 rounded-lg transition-colors ${
                            automation?.status === 'published' 
                              ? 'text-yellow-600 hover:bg-yellow-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={automation?.status === 'published' ? 'Pause' : 'Publish'}
                        >
                          {automation?.status === 'published' ? (
                            <PauseIcon className="h-5 w-5" />
                          ) : (
                            <PlayIcon className="h-5 w-5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleEditAutomation(automation)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => handleDeleteAutomation(automation.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>

                        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Automation Builder Modal */}
      <AutomationBuilder
        isOpen={showBuilder}
        onClose={() => {
          setShowBuilder(false)
          setSelectedAutomation(null)
        }}
        automation={selectedAutomation}
        onSave={handleSaveAutomation}
      />
    </div>
  )
}