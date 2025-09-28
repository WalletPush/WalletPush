'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, XCircle, Clock, Filter, Download, Eye } from 'lucide-react'

interface ActionRequest {
  id: string
  business_id: string
  program_id: string
  customer_id: string
  type: string
  payload: any
  status: string
  source: string
  policy_applied: any
  risk_score: number
  reviewer_user_id?: string
  approved_at?: string
  resulting_event_id?: string
  created_at: string
  updated_at: string
  customers?: {
    first_name: string
    last_name: string
    email: string
  }
}

interface CustomerEvent {
  id: string
  business_id: string
  program_id: string
  customer_id: string
  type: string
  amounts_json: any
  source: string
  meta_json: any
  observed_at: string
  recorded_at: string
  customers?: {
    first_name: string
    last_name: string
    email: string
  }
}

const ACTION_TYPE_LABELS = {
  check_in: 'Check In',
  earn_points: 'Earn Points',
  redeem_offer: 'Redeem Offer',
  spend_value: 'Spend Value',
  ticket_use: 'Ticket Use',
  receipt_credit: 'Receipt Credit',
  adjust: 'Adjustment'
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  auto_approved: 'bg-green-100 text-green-800',
  approved: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  expired: 'bg-gray-100 text-gray-800'
}

export default function PointsTransactionsPage() {
  const [activeTab, setActiveTab] = useState('requests')
  const [actionRequests, setActionRequests] = useState<ActionRequest[]>([])
  const [customerEvents, setCustomerEvents] = useState<CustomerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔍 Loading Points & Transactions data...')

      // Load action requests
      const requestsResponse = await fetch('/api/business/action-requests')
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        console.log('✅ Action requests loaded:', requestsData.length)
        setActionRequests(requestsData)
      } else {
        console.error('❌ Failed to load action requests')
      }

      // Load customer events  
      const eventsResponse = await fetch('/api/business/customer-events')
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        console.log('✅ Customer events loaded:', eventsData.length)
        setCustomerEvents(eventsData)
      } else {
        console.error('❌ Failed to load customer events')
      }

    } catch (error) {
      console.error('❌ Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const supabase = createClient()

  // Removed duplicate loadData function

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/action-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId })
      })

      if (response.ok) {
        loadData() // Refresh data
      } else {
        console.error('Failed to approve request')
      }
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/action-requests/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId })
      })

      if (response.ok) {
        loadData() // Refresh data
      } else {
        console.error('Failed to decline request')
      }
    } catch (error) {
      console.error('Error declining request:', error)
    }
  }

  const filteredRequests = actionRequests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    const matchesType = typeFilter === 'all' || request.type === typeFilter
    const matchesSearch = !searchTerm || 
      `${request.customers?.first_name} ${request.customers?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customers?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesType && matchesSearch
  })

  const filteredEvents = customerEvents.filter(event => {
    const matchesType = typeFilter === 'all' || event.type === typeFilter
    const matchesSearch = !searchTerm || 
      `${event.customers?.first_name} ${event.customers?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.customers?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesType && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <header className="dashboard-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Points & Transactions</h1>
            <p className="text-slate-600">Manage action requests and view transaction ledger</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="requests" className="flex items-center gap-2 px-4 py-2 rounded-md text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
            <Clock className="w-4 h-4" />
            Requests ({actionRequests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="ledger" className="flex items-center gap-2 px-4 py-2 rounded-md text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
            <Eye className="w-4 h-4" />
            Ledger ({customerEvents.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filters:</span>
              </div>
              
              <Input
                placeholder="Search by customer name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(ACTION_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {activeTab === 'requests' && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="auto_approved">Auto Approved</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Action Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No action requests found
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div key={request.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]}>
                              {request.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="font-medium text-slate-900">
                              {ACTION_TYPE_LABELS[request.type as keyof typeof ACTION_TYPE_LABELS]}
                            </span>
                            <span className="text-sm text-slate-500">
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          
                          <div className="text-sm text-slate-600">
                            <span className="font-medium">
                              {request.customers ? `${request.customers.first_name} ${request.customers.last_name}` : 'Unknown Customer'}
                            </span>
                            <span className="mx-2">•</span>
                            <span>{request.customers?.email}</span>
                            <span className="mx-2">•</span>
                            <span>Source: {request.source.replace('_', ' ')}</span>
                          </div>
                          
                          {request.payload && Object.keys(request.payload).length > 0 && (
                            <div className="mt-2 text-sm text-slate-500">
                              <strong>Details:</strong> {JSON.stringify(request.payload, null, 2)}
                            </div>
                          )}
                        </div>
                        
                        {request.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveRequest(request.id)}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeclineRequest(request.id)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No transactions found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Date & Time</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Customer</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Action</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-700">Points</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-700">Balance</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Source</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((event) => {
                        const pointsDelta = event.amounts_json?.points_delta || 0;
                        const isPositive = pointsDelta > 0;
                        const isNegative = pointsDelta < 0;
                        
                        return (
                          <tr key={event.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm text-slate-600">
                              <div>{new Date(event.recorded_at).toLocaleDateString()}</div>
                              <div className="text-xs text-slate-400">
                                {new Date(event.recorded_at).toLocaleTimeString()}
                              </div>
                            </td>
                            
                            <td className="py-3 px-4">
                              <div className="text-sm font-medium text-slate-900">
                                {event.customers ? `${event.customers.first_name} ${event.customers.last_name}` : 'Unknown Customer'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {event.customers?.email}
                              </div>
                            </td>
                            
                            <td className="py-3 px-4">
                              <Badge 
                                variant="outline" 
                                className={`
                                  ${event.type === 'check_in' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                  ${event.type === 'earn' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                  ${event.type === 'redeem' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                                  ${event.type === 'adjust' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                                `}
                              >
                                {event.type.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </td>
                            
                            <td className="py-3 px-4 text-right">
                              <span className={`text-sm font-medium ${
                                isPositive ? 'text-green-600' : 
                                isNegative ? 'text-red-600' : 
                                'text-slate-600'
                              }`}>
                                {isPositive ? '+' : ''}{pointsDelta}
                              </span>
                            </td>
                            
                            <td className="py-3 px-4 text-right text-sm text-slate-600">
                              {event.amounts_json?.balance_after || '—'}
                            </td>
                            
                            <td className="py-3 px-4">
                              <Badge variant="secondary" className="text-xs">
                                {event.source.replace('_', ' ')}
                              </Badge>
                            </td>
                            
                            <td className="py-3 px-4 text-sm text-slate-600">
                              {event.meta_json?.auto_approved && (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                  <CheckCircle className="w-3 h-3" />
                                  Auto-approved
                                </span>
                              )}
                              {event.meta_json?.action_request_id && !event.meta_json?.auto_approved && (
                                <span className="text-xs text-blue-600">
                                  Staff approved
                                </span>
                              )}
                              {event.meta_json?.points && (
                                <div className="text-xs text-slate-500 mt-1">
                                  Earned: {event.meta_json.points} pts
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </>
  )
}
