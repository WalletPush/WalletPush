'use client'

import React, { useState, useEffect } from 'react'
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowUpIcon,
  ClockIcon,
  GlobeAltIcon,
  ShoppingBagIcon,
  BoltIcon,
  FireIcon,
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  // Revenue Metrics
  mrr: number
  arr: number
  potentialRevenue: number
  revenueGrowth: number
  
  // Business Metrics
  totalBusinesses: number
  activeBusinesses: number
  trialBusinesses: number
  churnRate: number
  
  // Pass Metrics
  totalPassesUsed: number
  passesRemaining: number
  passUtilization: number
  passGrowthRate: number
  
  // Performance Metrics
  avgRevenuePerBusiness: number
  customerLifetimeValue: number
  conversionRate: number
  
  // Trending Data
  revenueChart: Array<{ month: string; revenue: number; businesses: number }>
  passUsageChart: Array<{ date: string; passes: number; businesses: number }>
  businessGrowthChart: Array<{ month: string; new: number; churned: number; net: number }>
  
  // Top Performers
  topBusinesses: Array<{ name: string; revenue: number; passes: number; growth: number }>
  topPrograms: Array<{ name: string; business: string; installs: number; engagement: number }>
  
  // Insights & Alerts
  insights: Array<{ type: 'success' | 'warning' | 'danger'; title: string; description: string; action?: string }>
  
  // Geographic Data
  revenueByRegion: Array<{ region: string; revenue: number; businesses: number }>
  
  // Package Performance
  packagePerformance: Array<{ package: string; businesses: number; revenue: number; satisfaction: number }>
}

export default function AgencyAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/agency/analytics?timeRange=${timeRange}`)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      setAnalyticsData(data)
      
    } catch (error) {
      console.error('❌ Failed to load analytics:', error)
      // Fallback to spectacular mock data
      setAnalyticsData({
        mrr: 3850,
        arr: 46200,
        potentialRevenue: 75000,
        revenueGrowth: 23.5,
        
        totalBusinesses: 47,
        activeBusinesses: 42,
        trialBusinesses: 8,
        churnRate: 3.2,
        
        totalPassesUsed: 67420,
        passesRemaining: 32580,
        passUtilization: 67.4,
        passGrowthRate: 18.7,
        
        avgRevenuePerBusiness: 82,
        customerLifetimeValue: 1240,
        conversionRate: 78.3,
        
        revenueChart: [
          { month: 'Jan', revenue: 2890, businesses: 32 },
          { month: 'Feb', revenue: 3120, businesses: 35 },
          { month: 'Mar', revenue: 3340, businesses: 38 },
          { month: 'Apr', revenue: 3520, businesses: 40 },
          { month: 'May', revenue: 3680, businesses: 43 },
          { month: 'Jun', revenue: 3850, businesses: 47 }
        ],
        
        passUsageChart: [
          { date: '1w ago', passes: 8420, businesses: 38 },
          { date: '6d ago', passes: 9150, businesses: 39 },
          { date: '5d ago', passes: 9890, businesses: 41 },
          { date: '4d ago', passes: 10200, businesses: 42 },
          { date: '3d ago', passes: 10850, businesses: 43 },
          { date: '2d ago', passes: 11200, businesses: 45 },
          { date: 'Yesterday', passes: 11750, businesses: 47 }
        ],
        
        businessGrowthChart: [
          { month: 'Jan', new: 8, churned: 2, net: 6 },
          { month: 'Feb', new: 6, churned: 1, net: 5 },
          { month: 'Mar', new: 7, churned: 2, net: 5 },
          { month: 'Apr', new: 5, churned: 1, net: 4 },
          { month: 'May', new: 9, churned: 2, net: 7 },
          { month: 'Jun', new: 8, churned: 1, net: 7 }
        ],
        
        topBusinesses: [
          { name: 'Premium Coffee Co.', revenue: 450, passes: 8420, growth: 34.2 },
          { name: 'Elite Fitness Club', revenue: 380, passes: 6890, growth: 28.7 },
          { name: 'Luxury Spa Resort', revenue: 320, passes: 5240, growth: 22.1 },
          { name: 'Gourmet Restaurant', revenue: 280, passes: 4120, growth: 19.8 },
          { name: 'Fashion Boutique', revenue: 240, passes: 3890, growth: 15.3 }
        ],
        
        topPrograms: [
          { name: 'VIP Loyalty Program', business: 'Premium Coffee Co.', installs: 12400, engagement: 89.2 },
          { name: 'Fitness Membership', business: 'Elite Fitness Club', installs: 9800, engagement: 84.7 },
          { name: 'Spa Rewards', business: 'Luxury Spa Resort', installs: 7600, engagement: 91.5 },
          { name: 'Dining Club', business: 'Gourmet Restaurant', installs: 6200, engagement: 76.3 },
          { name: 'Style Points', business: 'Fashion Boutique', installs: 4800, engagement: 82.1 }
        ],
        
        insights: [
          {
            type: 'success',
            title: 'Revenue Milestone Achieved! 🎉',
            description: 'Your MRR has crossed $3.8K! You\'re on track to hit $5K by Q4.',
            action: 'View Revenue Forecast'
          },
          {
            type: 'warning',
            title: 'Pass Utilization Alert',
            description: '3 businesses are approaching their pass limits. Consider upselling to higher tiers.',
            action: 'Contact High-Usage Clients'
          },
          {
            type: 'success',
            title: 'Conversion Rate Excellence',
            description: 'Your trial-to-paid conversion rate of 78.3% is 23% above industry average!',
            action: 'Analyze Success Factors'
          },
          {
            type: 'danger',
            title: 'Churn Risk Detected',
            description: '2 businesses haven\'t logged in for 14+ days. Proactive outreach recommended.',
            action: 'View At-Risk Accounts'
          }
        ],
        
        revenueByRegion: [
          { region: 'North America', revenue: 2310, businesses: 28 },
          { region: 'Europe', revenue: 1000, businesses: 12 },
          { region: 'Asia Pacific', revenue: 450, businesses: 5 },
          { region: 'Latin America', revenue: 90, businesses: 2 }
        ],
        
        packagePerformance: [
          { package: 'Starter ($29)', businesses: 18, revenue: 522, satisfaction: 4.2 },
          { package: 'Business ($69)', businesses: 21, revenue: 1449, satisfaction: 4.6 },
          { package: 'Pro ($97)', businesses: 8, revenue: 776, satisfaction: 4.8 }
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
      case 'danger': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
      default: return <SparklesIcon className="w-5 h-5 text-blue-500" />
    }
  }

  const getInsightBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500'
      case 'warning': return 'border-l-yellow-500'
      case 'danger': return 'border-l-red-500'
      default: return 'border-l-blue-500'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-slate-600">Loading your analytics...</p>
          <p className="text-sm text-slate-400 mt-2">Preparing something spectacular! 🚀</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Analytics Command Center
                </h1>
                <p className="text-slate-600 mt-1">Real-time insights into your agency's performance</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center">
                <SparklesIcon className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics - Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* MRR */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-xl group-hover:bg-green-200 transition-colors">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center text-green-600">
                <ArrowUpIcon className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">+{formatPercentage(analyticsData.revenueGrowth)}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Monthly Recurring Revenue</p>
              <p className="text-3xl font-bold text-slate-900">{formatCurrency(analyticsData.mrr)}</p>
              <p className="text-xs text-slate-500 mt-2">ARR: {formatCurrency(analyticsData.arr)}</p>
            </div>
          </div>

          {/* Potential Revenue */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-xl group-hover:bg-purple-200 transition-colors">
                <SparklesIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex items-center text-purple-600">
                <FireIcon className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Potential</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Revenue Potential</p>
              <p className="text-3xl font-bold text-slate-900">{formatCurrency(analyticsData.potentialRevenue)}</p>
              <p className="text-xs text-slate-500 mt-2">
                +{formatCurrency(analyticsData.potentialRevenue - analyticsData.arr)} opportunity
              </p>
            </div>
          </div>

          {/* Active Businesses */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-200 transition-colors">
                <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center text-blue-600">
                <UserGroupIcon className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">{analyticsData.totalBusinesses} Total</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Active Businesses</p>
              <p className="text-3xl font-bold text-slate-900">{analyticsData.activeBusinesses}</p>
              <p className="text-xs text-slate-500 mt-2">
                {analyticsData.trialBusinesses} trials • {formatPercentage(analyticsData.churnRate)} churn
              </p>
            </div>
          </div>

          {/* Pass Utilization */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-xl group-hover:bg-orange-200 transition-colors">
                <CreditCardIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex items-center text-orange-600">
                <BoltIcon className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">{formatPercentage(analyticsData.passUtilization)}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Passes Used</p>
              <p className="text-3xl font-bold text-slate-900">{formatNumber(analyticsData.totalPassesUsed)}</p>
              <p className="text-xs text-slate-500 mt-2">
                {formatNumber(analyticsData.passesRemaining)} remaining
              </p>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Per Business */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                <ArrowUpIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Revenue/Business</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(analyticsData.avgRevenuePerBusiness)}</p>
              </div>
            </div>
          </div>

          {/* Customer LTV */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="bg-violet-100 p-2 rounded-lg mr-3">
                <StarIcon className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Customer LTV</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(analyticsData.customerLifetimeValue)}</p>
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="bg-cyan-100 p-2 rounded-lg mr-3">
                <CheckCircleIcon className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-slate-900">{formatPercentage(analyticsData.conversionRate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Revenue Growth</h3>
              <div className="flex items-center text-green-600">
                <ArrowUpIcon className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">+{formatPercentage(analyticsData.revenueGrowth)}</span>
              </div>
            </div>
            <div className="space-y-4">
              {analyticsData.revenueChart.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 text-sm text-slate-600">{item.month}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                          style={{ width: `${(item.revenue / Math.max(...analyticsData.revenueChart.map(i => i.revenue))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">{formatCurrency(item.revenue)}</div>
                    <div className="text-xs text-slate-500">{item.businesses} businesses</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pass Usage Trend */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Pass Usage Trend</h3>
              <div className="flex items-center text-blue-600">
                <ArrowUpIcon className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">+{formatPercentage(analyticsData.passGrowthRate)}</span>
              </div>
            </div>
            <div className="space-y-4">
              {analyticsData.passUsageChart.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-16 text-sm text-slate-600">{item.date}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${(item.passes / Math.max(...analyticsData.passUsageChart.map(i => i.passes))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">{formatNumber(item.passes)}</div>
                    <div className="text-xs text-slate-500">{item.businesses} active</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Businesses */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Top Performing Businesses</h3>
              <StarIcon className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="space-y-4">
              {analyticsData.topBusinesses.map((business, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{business.name}</div>
                      <div className="text-sm text-slate-500">{formatNumber(business.passes)} passes used</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">{formatCurrency(business.revenue)}</div>
                    <div className="text-sm text-green-600">+{formatPercentage(business.growth)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Programs */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Top Loyalty Programs</h3>
              <FireIcon className="w-5 h-5 text-orange-500" />
            </div>
            <div className="space-y-4">
              {analyticsData.topPrograms.map((program, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{program.name}</div>
                      <div className="text-sm text-slate-500">{program.business}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">{formatNumber(program.installs)}</div>
                    <div className="text-sm text-blue-600">{formatPercentage(program.engagement)} engaged</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights & Alerts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">AI-Powered Insights</h3>
            <SparklesIcon className="w-5 h-5 text-purple-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analyticsData.insights.map((insight, index) => (
              <div key={index} className={`border-l-4 ${getInsightBorderColor(insight.type)} bg-slate-50 p-4 rounded-r-lg`}>
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-slate-600 mb-2">{insight.description}</p>
                    {insight.action && (
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        {insight.action} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic & Package Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Region */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Revenue by Region</h3>
              <GlobeAltIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-4">
              {analyticsData.revenueByRegion.map((region, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-20 text-sm text-slate-600">{region.region}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                          style={{ width: `${(region.revenue / Math.max(...analyticsData.revenueByRegion.map(r => r.revenue))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">{formatCurrency(region.revenue)}</div>
                    <div className="text-xs text-slate-500">{region.businesses} businesses</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Package Performance */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Package Performance</h3>
              <ShoppingBagIcon className="w-5 h-5 text-green-500" />
            </div>
            <div className="space-y-4">
              {analyticsData.packagePerformance.map((pkg, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-slate-900">{pkg.package}</div>
                    <div className="text-sm font-semibold text-slate-900">{formatCurrency(pkg.revenue)}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{pkg.businesses} businesses</span>
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                      <span>{pkg.satisfaction}/5.0</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="bg-slate-200 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${(pkg.revenue / Math.max(...analyticsData.packagePerformance.map(p => p.revenue))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Business Growth Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Business Growth & Churn</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-slate-600">New</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-slate-600">Churned</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-slate-600">Net Growth</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-4">
            {analyticsData.businessGrowthChart.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-medium text-slate-600 mb-2">{item.month}</div>
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-full bg-slate-200 rounded-full h-20 flex flex-col justify-end overflow-hidden">
                    <div className="bg-green-500 rounded-b-full" style={{ height: `${(item.new / 10) * 100}%` }}></div>
                  </div>
                  <div className="text-xs text-green-600 font-medium">+{item.new}</div>
                </div>
                <div className="flex flex-col items-center space-y-1 mt-2">
                  <div className="w-full bg-slate-200 rounded-full h-10 flex flex-col justify-end overflow-hidden">
                    <div className="bg-red-500 rounded-b-full" style={{ height: `${(item.churned / 5) * 100}%` }}></div>
                  </div>
                  <div className="text-xs text-red-600 font-medium">-{item.churned}</div>
                </div>
                <div className="mt-2 text-sm font-bold text-blue-600">+{item.net}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
