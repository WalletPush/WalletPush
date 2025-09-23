import React from 'react'
import { 
  CreditCardIcon, 
  CalendarIcon,
  ReceiptPercentIcon,
  ArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface PaymentMethod {
  id: string
  type: 'credit' | 'debit' | 'bank'
  last4: string
  brand: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}

interface Invoice {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  description: string
  downloadUrl?: string
}

interface Plan {
  id: string
  name: string
  tier: 'silver' | 'gold' | 'platinum'
  price: number
  billing: 'monthly' | 'annual'
  features: string[]
  popular?: boolean
}

interface MembershipBillingManagerProps {
  currentPlan?: string
  nextBilling?: string
  paymentMethods?: PaymentMethod[]
  invoiceHistory?: Invoice[]
  upgradeOptions?: Plan[]
  cancelationPolicy?: string
  memberSince?: string
}

export function MembershipBillingManager({ 
  currentPlan = "Gold Annual",
  nextBilling = "Jan 15, 2025",
  paymentMethods = [
    {
      id: '1',
      type: 'credit',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2026,
      isDefault: true
    },
    {
      id: '2',
      type: 'credit',
      last4: '5555',
      brand: 'Mastercard',
      expiryMonth: 8,
      expiryYear: 2025,
      isDefault: false
    }
  ],
  invoiceHistory = [
    {
      id: 'INV-2024-001',
      date: '2024-01-15',
      amount: 599,
      status: 'paid',
      description: 'Gold Annual Membership',
      downloadUrl: '/invoices/inv-2024-001.pdf'
    },
    {
      id: 'INV-2023-012',
      date: '2023-01-15',
      amount: 549,
      status: 'paid',
      description: 'Gold Annual Membership',
      downloadUrl: '/invoices/inv-2023-012.pdf'
    }
  ],
  upgradeOptions = [
    {
      id: 'platinum-annual',
      name: 'Platinum Annual',
      tier: 'platinum',
      price: 999,
      billing: 'annual',
      features: ['All Gold benefits', 'Concierge services', 'VIP events', 'Personal training'],
      popular: true
    },
    {
      id: 'platinum-monthly',
      name: 'Platinum Monthly',
      tier: 'platinum',
      price: 99,
      billing: 'monthly',
      features: ['All Gold benefits', 'Concierge services', 'VIP events', 'Personal training']
    }
  ],
  cancelationPolicy = "Cancel anytime. Remaining membership period will be honored.",
  memberSince = "January 2023"
}: MembershipBillingManagerProps) {
  const [showUpgradeOptions, setShowUpgradeOptions] = React.useState(false)
  const [showAddPayment, setShowAddPayment] = React.useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      case 'refunded': return 'text-white'
      default: return 'text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon className="w-4 h-4 text-green-500" />
      case 'pending': return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
      case 'failed': return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
      default: return null
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'silver': return 'bg-white/10 text-white border-white/10'
      case 'gold': return 'bg-yellow-500/100/20 text-yellow-400 border-yellow-500/30'
      case 'platinum': return 'bg-white/10 text-white border-white/20'
      default: return 'bg-white/10 text-white border-white/10'
    }
  }

  const handleUpgrade = (planId: string) => {
    console.log('Upgrading to plan:', planId)
    // Upgrade logic
  }

  const handleSetDefaultPayment = (methodId: string) => {
    console.log('Setting default payment method:', methodId)
    // Payment method update logic
  }

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log('Downloading invoice:', invoiceId)
    // Download logic
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const isCardExpiringSoon = (month: number, year: number) => {
    const now = new Date()
    const expiry = new Date(year, month - 1)
    const threeMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 3)
    return expiry <= threeMonthsFromNow
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <CreditCardIcon className="w-5 h-5 text-purple-400" />
          Billing & Subscription
        </h2>
        <span className="text-sm text-white">
          Member since {memberSince}
        </span>
      </div>

      {/* Current Plan */}
      <div className="bg-blue-500/10 border border-white/20 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">Current Plan</h3>
          <span className="text-lg font-bold text-white">{currentPlan}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-white">
          <span>Next billing date:</span>
          <span className="font-medium">{nextBilling}</span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Payment Methods</h3>
          <button 
            onClick={() => setShowAddPayment(true)}
            className="px-3 py-1 text-sm font-medium text-white bg-white/10 hover:bg-blue-200 rounded transition-colors"
          >
            Add Payment Method
          </button>
        </div>

        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const expiringSoon = isCardExpiringSoon(method.expiryMonth, method.expiryYear)
            
            return (
              <div key={method.id} className="border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCardIcon className="w-6 h-6 text-slate-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {method.brand} •••• {method.last4}
                        </span>
                        {method.isDefault && (
                          <span className="px-2 py-0.5 bg-green-500/100/20 text-green-400 text-xs rounded">
                            Default
                          </span>
                        )}
                        {expiringSoon && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                            Expiring Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white">
                        Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!method.isDefault && (
                      <button 
                        onClick={() => handleSetDefaultPayment(method.id)}
                        className="px-3 py-1 text-xs font-medium text-white bg-white/10 hover:bg-blue-200 rounded transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button className="px-3 py-1 text-xs font-medium text-white bg-white/10 hover:bg-slate-200 rounded transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upgrade Options */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Upgrade Options</h3>
          <button 
            onClick={() => setShowUpgradeOptions(!showUpgradeOptions)}
            className="px-3 py-1 text-sm font-medium text-white bg-white/10 hover:bg-purple-200 rounded transition-colors flex items-center gap-1"
          >
            <ArrowUpIcon className="w-4 h-4" />
            View Upgrades
          </button>
        </div>

        {showUpgradeOptions && (
          <div className="space-y-4">
            {upgradeOptions.map((plan) => (
              <div key={plan.id} className={`border rounded-xl p-4 ${plan.popular ? 'border-purple-300 bg-purple-50' : 'border-white/10'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-white">{plan.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded border ${getTierColor(plan.tier)}`}>
                      {plan.tier.toUpperCase()}
                    </span>
                  </div>
                  {plan.popular && (
                    <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded">
                      Popular
                    </span>
                  )}
                </div>
                
                <div className="mb-3">
                  <span className="text-2xl font-bold text-white">{formatCurrency(plan.price)}</span>
                  <span className="text-sm text-white">/{plan.billing}</span>
                </div>

                <ul className="space-y-1 mb-4">
                  {plan.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="text-xs text-white flex items-center gap-1">
                      <CheckCircleIcon className="w-3 h-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => handleUpgrade(plan.id)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice History */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-white mb-3">Recent Invoices</h3>
        <div className="space-y-2">
          {invoiceHistory.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0">
              <div className="flex items-center gap-3">
                <ReceiptPercentIcon className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{invoice.description}</span>
                    {getStatusIcon(invoice.status)}
                    <span className={`text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white">
                    <span>{formatDate(invoice.date)}</span>
                    <span>Invoice #{invoice.id}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">
                  {formatCurrency(invoice.amount)}
                </span>
                {invoice.downloadUrl && (
                  <button 
                    onClick={() => handleDownloadInvoice(invoice.id)}
                    className="px-3 py-1 text-xs font-medium text-white bg-white/10 hover:bg-slate-200 rounded transition-colors"
                  >
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="bg-white/5 rounded-xl p-4">
        <h3 className="text-sm font-medium text-white mb-2">Cancellation Policy</h3>
        <p className="text-sm text-white mb-3">{cancelationPolicy}</p>
        <button className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/100/20 hover:bg-red-200 rounded transition-colors">
          Cancel Membership
        </button>
      </div>
    </div>
  )
}
