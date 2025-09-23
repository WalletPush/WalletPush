import React from 'react'
import { 
  ChatBubbleLeftRightIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'

interface ConciergeService {
  id: string
  category: 'dining' | 'travel' | 'events' | 'shopping' | 'transport' | 'personal' | 'business'
  name: string
  description: string
  responseTime: string
  available: boolean
  icon: string
}

interface ConciergeRequest {
  id: string
  service: string
  description: string
  requestDate: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  estimatedCompletion?: string
  priority: 'standard' | 'urgent' | 'vip'
  assignedTo?: string
  response?: string
  completedDate?: string
}

interface MembershipConciergeProps {
  services?: ConciergeService[]
  requestHistory?: ConciergeRequest[]
  responseTime?: string
  availability?: string
  memberTier?: 'silver' | 'gold' | 'platinum'
}

export function MembershipConcierge({ 
  services = [
    {
      id: '1',
      category: 'dining',
      name: 'Restaurant Reservations',
      description: 'Hard-to-get reservations at exclusive restaurants',
      responseTime: '30 minutes',
      available: true,
      icon: '🍽️'
    },
    {
      id: '2',
      category: 'events',
      name: 'Event Tickets',
      description: 'Concerts, theater, sports - even sold-out shows',
      responseTime: '2 hours',
      available: true,
      icon: '🎟️'
    },
    {
      id: '3',
      category: 'travel',
      name: 'Travel Planning',
      description: 'Complete itinerary planning and bookings',
      responseTime: '4 hours',
      available: true,
      icon: '✈️'
    },
    {
      id: '4',
      category: 'shopping',
      name: 'Personal Shopping',
      description: 'Luxury shopping and gift sourcing',
      responseTime: '1 hour',
      available: true,
      icon: '🛍️'
    },
    {
      id: '5',
      category: 'transport',
      name: 'Transportation',
      description: 'Premium car service and airport transfers',
      responseTime: '15 minutes',
      available: true,
      icon: '🚗'
    },
    {
      id: '6',
      category: 'personal',
      name: 'Personal Assistant',
      description: 'General personal tasks and errands',
      responseTime: '1 hour',
      available: true,
      icon: '📋'
    }
  ],
  requestHistory = [
    {
      id: '1',
      service: 'Restaurant Reservations',
      description: 'Table for 4 at Le Bernardin this Saturday evening',
      requestDate: '2024-12-15T10:30:00Z',
      status: 'completed',
      priority: 'standard',
      assignedTo: 'Sarah Chen',
      response: 'Reserved table for 4 at 7:30 PM on Saturday. Confirmation #RES123456.',
      completedDate: '2024-12-15T11:15:00Z'
    },
    {
      id: '2',
      service: 'Event Tickets',
      description: 'Two tickets to Hamilton next month',
      requestDate: '2024-12-16T14:20:00Z',
      status: 'in_progress',
      priority: 'standard',
      assignedTo: 'Mike Rodriguez',
      estimatedCompletion: '2024-12-16T18:00:00Z'
    },
    {
      id: '3',
      service: 'Travel Planning',
      description: 'Weekend getaway to Napa Valley for anniversary',
      requestDate: '2024-12-17T09:15:00Z',
      status: 'pending',
      priority: 'vip'
    }
  ],
  responseTime = "Within 2 hours for most requests",
  availability = "24/7 for VIP members, 6 AM - 10 PM for others",
  memberTier = 'gold'
}: MembershipConciergeProps) {
  const [selectedService, setSelectedService] = React.useState<string>('')
  const [requestDescription, setRequestDescription] = React.useState('')
  const [showRequestForm, setShowRequestForm] = React.useState(false)
  const [requestPriority, setRequestPriority] = React.useState<'standard' | 'urgent' | 'vip'>('standard')

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'dining': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'travel': return 'bg-white/10 text-white border-white/20'
      case 'events': return 'bg-white/10 text-white border-white/20'
      case 'shopping': return 'bg-pink-100 text-pink-700 border-pink-200'
      case 'transport': return 'bg-green-500/100/20 text-green-400 border-green-500/30'
      case 'personal': return 'bg-white/10 text-white border-white/10'
      case 'business': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      default: return 'bg-white/10 text-white border-white/10'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'in_progress': return 'text-blue-600'
      case 'pending': return 'text-yellow-600'
      case 'cancelled': return 'text-red-600'
      default: return 'text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleSolid className="w-4 h-4 text-green-500" />
      case 'in_progress': return <ClockIcon className="w-4 h-4 text-blue-500" />
      case 'pending': return <ExclamationCircleIcon className="w-4 h-4 text-yellow-500" />
      case 'cancelled': return <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
      default: return <ClockIcon className="w-4 h-4 text-purple-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'vip': return 'bg-white/10 text-white'
      case 'urgent': return 'bg-red-500/100/20 text-red-400'
      default: return 'bg-white/10 text-white'
    }
  }

  const handleSubmitRequest = () => {
    if (!selectedService || !requestDescription.trim()) return

    console.log('Submitting concierge request:', {
      service: selectedService,
      description: requestDescription,
      priority: requestPriority
    })

    // Reset form
    setSelectedService('')
    setRequestDescription('')
    setRequestPriority('standard')
    setShowRequestForm(false)
  }

  const handleCallConcierge = () => {
    console.log('Calling concierge')
    // Phone call logic
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const pendingRequests = requestHistory.filter(req => req.status === 'pending' || req.status === 'in_progress')
  const canMakeVipRequests = memberTier === 'platinum'

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
          Concierge Services
        </h2>
        <button 
          onClick={handleCallConcierge}
          className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
        >
          <PhoneIcon className="w-4 h-4" />
          Call Now
        </button>
      </div>

      {/* Service Availability */}
      <div className="bg-white/5 rounded-xl p-4 mb-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Response Time</h3>
            <p className="text-sm text-white">{responseTime}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Availability</h3>
            <p className="text-sm text-white">{availability}</p>
          </div>
        </div>
      </div>

      {/* Pending Requests Alert */}
      {pendingRequests.length > 0 && (
        <div className="bg-blue-500/10 border border-white/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-white">
                {pendingRequests.length} Active Request{pendingRequests.length > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-white">Your concierge is working on your requests</p>
            </div>
          </div>
        </div>
      )}

      {/* New Request Form */}
      {!showRequestForm ? (
        <div className="text-center mb-6">
          <button 
            onClick={() => setShowRequestForm(true)}
            className="px-6 py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors"
          >
            New Concierge Request
          </button>
        </div>
      ) : (
        <div className="border border-white/10 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-white mb-4">New Concierge Request</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Service Category
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a service...</option>
                {services.filter(service => service.available).map((service) => (
                  <option key={service.id} value={service.name}>
                    {service.icon} {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Request Details
              </label>
              <textarea
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                placeholder="Please describe your request in detail..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Priority Level
              </label>
              <div className="space-y-2">
                {[
                  { value: 'standard', label: 'Standard', desc: 'Regular processing time' },
                  { value: 'urgent', label: 'Urgent', desc: 'Faster response needed' },
                  ...(canMakeVipRequests ? [{ value: 'vip', label: 'VIP', desc: 'Immediate attention' }] : [])
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={option.value}
                      checked={requestPriority === option.value}
                      onChange={(e) => setRequestPriority(e.target.value as any)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-white">{option.label}</span>
                      <p className="text-xs text-white">{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleSubmitRequest}
                disabled={!selectedService || !requestDescription.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                Submit Request
              </button>
              <button 
                onClick={() => setShowRequestForm(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available Services */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-white mb-3">Available Services</h3>
        <div className="space-y-3">
          {(services || []).filter(service => service.available).map((service) => (
            <div key={service.id} className="border border-white/10 rounded-xl p-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">{service.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-white">{service.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded border ${getCategoryColor(service.category)}`}>
                      {service.category}
                    </span>
                  </div>
                  <p className="text-xs text-white mb-2">{service.description}</p>
                  <div className="flex items-center gap-1 text-xs text-purple-400">
                    <ClockIcon className="w-3 h-3" />
                    <span>Response time: {service.responseTime}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Request History */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Recent Requests</h3>
        {requestHistory.length === 0 ? (
          <div className="text-center py-8 text-purple-400">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <h3 className="text-sm font-medium text-white mb-1">No Requests Yet</h3>
            <p className="text-sm">Submit your first concierge request above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requestHistory.map((request) => (
              <div key={request.id} className="border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-white">{request.service}</h4>
                      {getStatusIcon(request.status)}
                      <span className={`text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {request.priority !== 'standard' && (
                        <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(request.priority)}`}>
                          {request.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-white mb-2">{request.description}</p>
                    
                    <div className="text-xs text-white space-y-1">
                      <p>Requested: {formatDateTime(request.requestDate)}</p>
                      {request.assignedTo && (
                        <p>Assigned to: {request.assignedTo}</p>
                      )}
                      {request.estimatedCompletion && (
                        <p>Estimated completion: {formatDateTime(request.estimatedCompletion)}</p>
                      )}
                      {request.completedDate && (
                        <p>Completed: {formatDateTime(request.completedDate)}</p>
                      )}
                    </div>

                    {request.response && (
                      <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-sm text-green-400">
                        <strong>Response:</strong> {request.response}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="space-y-3">
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-purple-200 rounded-xl transition-colors">
            Service Guidelines
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-slate-200 rounded-xl transition-colors">
            Request History
          </button>
        </div>
      </div>
    </div>
  )
}
