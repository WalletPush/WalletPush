import React from 'react'
import { 
  ChartBarIcon, 
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface UsageAllowance {
  service: string
  used: number
  limit: number
  category: 'fitness' | 'spa' | 'dining' | 'guest' | 'other'
  icon?: string
  resetFrequency: 'monthly' | 'weekly' | 'daily'
  nextReset: string
  overagePolicy?: string
}

interface MembershipUsageTrackerProps {
  monthlyAllowances?: UsageAllowance[]
  resetDate?: string
  showOverages?: boolean
  showHistory?: boolean
}

export function MembershipUsageTracker({ 
  monthlyAllowances = [
    {
      service: 'Personal Training Sessions',
      used: 2,
      limit: 4,
      category: 'fitness',
      resetFrequency: 'monthly',
      nextReset: 'Jan 1, 2025',
      overagePolicy: '$75 per additional session'
    },
    {
      service: 'Guest Passes',
      used: 1,
      limit: 3,
      category: 'guest',
      resetFrequency: 'monthly',
      nextReset: 'Jan 1, 2025'
    },
    {
      service: 'Spa Services',
      used: 0,
      limit: 2,
      category: 'spa',
      resetFrequency: 'monthly',
      nextReset: 'Jan 1, 2025',
      overagePolicy: '20% discount on additional services'
    },
    {
      service: 'Premium Classes',
      used: 8,
      limit: 10,
      category: 'fitness',
      resetFrequency: 'monthly',
      nextReset: 'Jan 1, 2025'
    },
    {
      service: 'Restaurant Reservations',
      used: 3,
      limit: 4,
      category: 'dining',
      resetFrequency: 'monthly',
      nextReset: 'Jan 1, 2025'
    }
  ],
  resetDate = "Jan 1, 2025",
  showOverages = true,
  showHistory = true
}: MembershipUsageTrackerProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fitness': return '💪'
      case 'spa': return '🧖‍♀️'
      case 'dining': return '🍽️'
      case 'guest': return '👥'
      default: return '📊'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fitness': return 'bg-green-500/100/20 text-green-400 border-green-500/30'
      case 'spa': return 'bg-white/10 text-white border-white/20'
      case 'dining': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'guest': return 'bg-white/10 text-white border-white/20'
      default: return 'bg-white/10 text-white border-white/10'
    }
  }

  const getUsageStatus = (used: number, limit: number) => {
    const percentage = (used / limit) * 100
    if (used >= limit) return { status: 'exhausted', color: 'text-red-600', bgColor: 'bg-red-500/100' }
    if (percentage >= 80) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-500/100' }
    if (percentage >= 50) return { status: 'moderate', color: 'text-blue-600', bgColor: 'bg-blue-500/100' }
    return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-500/100' }
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100)
  }

  const totalUsed = monthlyAllowances.reduce((sum, allowance) => sum + allowance.used, 0)
  const totalLimit = monthlyAllowances.reduce((sum, allowance) => sum + allowance.limit, 0)
  const overallPercentage = (totalUsed / totalLimit) * 100

  const daysUntilReset = Math.ceil((new Date(resetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-purple-400" />
          Usage & Allowances
        </h2>
        <span className="text-sm text-white">
          Resets in {daysUntilReset} days
        </span>
      </div>

      {/* Overall Usage Summary */}
      <div className="bg-white/5 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">Overall Monthly Usage</h3>
          <span className="text-sm font-bold text-white">{Math.round(overallPercentage)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-white">
          <span>{totalUsed} used</span>
          <span>{totalLimit} total allowances</span>
        </div>
      </div>

      {/* Individual Service Usage */}
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-medium text-white">Service Breakdown</h3>
        {monthlyAllowances.map((allowance, index) => {
          const status = getUsageStatus(allowance.used, allowance.limit)
          const percentage = getUsagePercentage(allowance.used, allowance.limit)
          
          return (
            <div key={index} className="border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getCategoryIcon(allowance.category)}</span>
                  <div>
                    <h4 className="text-sm font-medium text-white">{allowance.service}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded border ${getCategoryColor(allowance.category)}`}>
                      {allowance.category}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    {allowance.used >= allowance.limit ? (
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                    ) : allowance.used === 0 ? (
                      <span className="text-xs text-purple-400">Unused</span>
                    ) : (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    )}
                    <span className={`text-sm font-bold ${status.color}`}>
                      {allowance.used} / {allowance.limit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${status.bgColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-white">
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  Resets {allowance.nextReset}
                </span>
                {allowance.overagePolicy && (
                  <span className="text-blue-600">Overage: {allowance.overagePolicy}</span>
                )}
              </div>

              {/* Usage Status Messages */}
              {allowance.used >= allowance.limit && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                  Allowance exhausted. {allowance.overagePolicy || 'Contact support for additional access.'}
                </div>
              )}
              
              {allowance.used === 0 && (
                <div className="mt-2 p-2 bg-blue-500/10 border border-white/20 rounded text-xs text-white">
                  Available! Book your {allowance.service.toLowerCase()} today.
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Reset Information */}
      <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-medium text-white">Next Reset</h3>
        </div>
        <p className="text-sm text-white mb-1">
          All allowances reset on <span className="font-medium">{resetDate}</span>
        </p>
        <p className="text-xs text-blue-600">
          {daysUntilReset} days remaining in current cycle
        </p>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-white/10">
        <div className="space-y-3">
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-blue-200 rounded-xl transition-colors">
            Book Services
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-slate-200 rounded-xl transition-colors">
            Usage History
          </button>
        </div>
      </div>
    </div>
  )
}
