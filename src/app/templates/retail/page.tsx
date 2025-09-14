'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface PricingPackage {
  id: string
  name: string
  description: string
  price: number
  passLimit: number
  programLimit: number
  staffLimit: number
  features: any
  isActive: boolean
}

export default function RetailTemplate() {
  const [pricingPackages, setPricingPackages] = useState<PricingPackage[]>([])

  useEffect(() => {
    // Load pricing packages for retail businesses
    const retailPackages = [
      {
        id: '1',
        name: 'Shop',
        description: 'Perfect for small retail stores and boutiques',
        price: 89,
        passLimit: 1000,
        programLimit: 2,
        staffLimit: 3,
        features: {
          customBranding: true,
          analytics: 'basic',
          apiAccess: false,
          prioritySupport: false,
          whitelabelDomain: false,
          smtpConfiguration: false,
          loyaltyProgram: true,
          storeCard: true,
          inventoryAlerts: false,
          customerSegments: false
        },
        isActive: true
      },
      {
        id: '2',
        name: 'Retail Pro',
        description: 'Ideal for established retailers with multiple programs',
        price: 179,
        passLimit: 5000,
        programLimit: 5,
        staffLimit: 10,
        features: {
          customBranding: true,
          analytics: 'advanced',
          apiAccess: true,
          prioritySupport: true,
          whitelabelDomain: true,
          smtpConfiguration: true,
          loyaltyProgram: true,
          storeCard: true,
          inventoryAlerts: true,
          customerSegments: true,
          posIntegration: true,
          multiLocation: false
        },
        isActive: true
      },
      {
        id: '3',
        name: 'Retail Chain',
        description: 'Full-featured solution for retail chains and franchises',
        price: 349,
        passLimit: 15000,
        programLimit: -1,
        staffLimit: -1,
        features: {
          customBranding: true,
          analytics: 'enterprise',
          apiAccess: true,
          prioritySupport: true,
          whitelabelDomain: true,
          smtpConfiguration: true,
          loyaltyProgram: true,
          storeCard: true,
          inventoryAlerts: true,
          customerSegments: true,
          posIntegration: true,
          multiLocation: true,
          franchiseManagement: true,
          customIntegrations: true
        },
        isActive: true
      }
    ]
    setPricingPackages(retailPackages)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  src="/images/walletpush-logo.png" 
                  alt="Retail Pro" 
                  className="h-12 w-auto"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-slate-700 hover:text-slate-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up?type=business">
                <Button className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-slate-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-slate-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Turn Shoppers Into
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-100 mt-4">
                Loyal Customers
              </span>
            </h1>
            <p className="text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
              Digital loyalty cards and store credit that live in Apple Wallet. Reward purchases, track points, and send personalized offers straight to their Lock Screen.
            </p>
            <p className="text-xl text-slate-400 mb-16 max-w-4xl mx-auto leading-relaxed">
              Your customers add your store card to Apple Wallet in one tap. You send exclusive offers, point updates, and new arrival alerts that appear right on their Lock Screen.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/auth/sign-up?type=business">
                <Button size="lg" className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white text-lg px-12 py-6 rounded-xl shadow-2xl hover:shadow-slate-500/25 transition-all duration-300">
                  Get Started
                </Button>
              </Link>
              <Link href="#examples">
                <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-6 rounded-xl backdrop-blur-sm">
                  See Retail Examples
                </Button>
              </Link>
            </div>

            {/* Trust Bar */}
            <div className="text-slate-400 mb-12">
              <div className="flex items-center justify-center space-x-8 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Works with any POS system
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  No app required
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Setup in hours
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Paper cards get lost. Apps get deleted.
            </h2>
            <p className="text-xl text-slate-700 max-w-4xl mx-auto leading-relaxed">
              But Apple Wallet? That's where your customers keep their credit cards, boarding passes, and now — your store loyalty card.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13l-1.1 5m0 0h9.1M6 20v.01M20 20v.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Always in their wallet</h3>
              <p className="text-slate-600 leading-relaxed">Digital cards can't be forgotten at home or lost in purses</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Instant notifications</h3>
              <p className="text-slate-600 leading-relaxed">New arrivals, sales, and earned rewards appear on Lock Screen</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Track everything</h3>
              <p className="text-slate-600 leading-relaxed">Points, purchases, store credit — all updated in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Retail Examples */}
      <section id="examples" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Perfect for Every Type of Retail Business
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: '👗',
                title: 'Fashion & Apparel',
                description: 'Style points, VIP early access, and personalized outfit recommendations.',
                example: '"New spring collection just arrived! VIP preview starts now."'
              },
              {
                icon: '💄',
                title: 'Beauty & Cosmetics',
                description: 'Beauty rewards, birthday perks, and exclusive product launches.',
                example: '"Your birthday gift is ready! Free makeover this month."'
              },
              {
                icon: '📚',
                title: 'Bookstores',
                description: 'Reading rewards, author event invites, and new release alerts.',
                example: '"Your favorite author has a new book! 20% off pre-order."'
              },
              {
                icon: '🏠',
                title: 'Home & Garden',
                description: 'Project rewards, seasonal sales, and DIY workshop invites.',
                example: '"Spring planting season! 30% off all garden supplies."'
              },
              {
                icon: '🎁',
                title: 'Gift Shops',
                description: 'Holiday specials, gift card bonuses, and occasion reminders.',
                example: '"Mother\'s Day is next week. Perfect gifts inside!"'
              },
              {
                icon: '⌚',
                title: 'Electronics',
                description: 'Tech rewards, trade-in credits, and new product notifications.',
                example: '"New iPhone available! Trade-in value: $400 credit."'
              }
            ].map((retail, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-2 hover:border-slate-300">
                <CardHeader>
                  <div className="text-4xl mb-4">{retail.icon}</div>
                  <CardTitle className="text-xl font-bold text-slate-900">{retail.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed mb-4">{retail.description}</p>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-sm text-slate-800 italic">"{retail.example}"</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Simple Setup, Powerful Results
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Design Your Card</h3>
              <p className="text-slate-600 leading-relaxed">Upload your logo, set your colors, configure rewards</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Customers Join</h3>
              <p className="text-slate-600 leading-relaxed">QR code at checkout, website signup, or email invitation</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Track & Reward</h3>
              <p className="text-slate-600 leading-relaxed">Scan at POS, points accumulate, rewards unlock automatically</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">4</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Drive Sales</h3>
              <p className="text-slate-600 leading-relaxed">Send targeted offers and new product alerts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Real Results from Real Retailers
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              {
                stat: '45%',
                label: 'More repeat customers',
                description: 'Lock Screen visibility drives return visits'
              },
              {
                stat: '30%',
                label: 'Higher average spend',
                description: 'Rewards encourage larger purchases'
              },
              {
                stat: '65%',
                label: 'Better engagement',
                description: 'vs traditional loyalty cards'
              },
              {
                stat: '80%',
                label: 'Program participation',
                description: 'Digital cards are always accessible'
              }
            ].map((result, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold text-slate-700 mb-2">{result.stat}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{result.label}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{result.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <blockquote className="text-2xl font-medium text-slate-900 mb-4">
              "Our customer retention improved by 45% and average order value increased by 30% after switching to Apple Wallet loyalty cards."
            </blockquote>
            <cite className="text-lg text-slate-600">— Bella Boutique, San Francisco</cite>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Retail Business Pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Transparent pricing that scales with your retail business. No hidden fees, no per-transaction charges.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPackages.map((pkg, index) => (
              <Card key={pkg.id} className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
                index === 1 ? 'border-slate-500 bg-gradient-to-br from-slate-50 to-slate-100 scale-105' : 'border-slate-200 hover:border-slate-300'
              }`}>
                {index === 1 && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-slate-900">{pkg.name}</CardTitle>
                  <CardDescription className="text-slate-600">{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-slate-900">${pkg.price}</span>
                    <span className="text-slate-600">/month</span>
                  </div>
                  <ul className="text-left space-y-3 mb-8">
                    <li className="flex items-center text-slate-700">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      {pkg.passLimit.toLocaleString()} loyalty cards
                    </li>
                    <li className="flex items-center text-slate-700">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      {pkg.programLimit === -1 ? 'Unlimited' : pkg.programLimit} programs
                    </li>
                    <li className="flex items-center text-slate-700">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      {pkg.staffLimit === -1 ? 'Unlimited' : pkg.staffLimit} staff accounts
                    </li>
                    <li className="flex items-center text-slate-700">
                      {pkg.features.loyaltyProgram ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-slate-400 mr-3" />
                      )}
                      Loyalty program
                    </li>
                    <li className="flex items-center text-slate-700">
                      {pkg.features.storeCard ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-slate-400 mr-3" />
                      )}
                      Store credit cards
                    </li>
                    <li className="flex items-center text-slate-700">
                      {pkg.features.posIntegration ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-slate-400 mr-3" />
                      )}
                      POS integration
                    </li>
                  </ul>
                  <Link href="/auth/sign-up?type=business">
                    <Button className={`w-full ${
                      index === 1 
                        ? 'bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950' 
                        : 'bg-slate-900 hover:bg-slate-800'
                    } text-white`}>
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to turn shoppers into loyal customers?
          </h2>
          <p className="text-xl text-slate-300 mb-12 leading-relaxed">
            Join retail businesses using Apple Wallet to increase customer retention and drive repeat sales.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/sign-up?type=business">
              <Button size="lg" className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white text-lg px-12 py-6 rounded-xl shadow-2xl hover:shadow-slate-500/25 transition-all duration-300">
                Get Started
              </Button>
            </Link>
            <Link href="#examples">
              <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-6 rounded-xl backdrop-blur-sm">
                See Examples
              </Button>
            </Link>
          </div>
          <p className="text-slate-400 mt-8 text-sm">
            14-day free trial • No setup fees • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="/images/walletpush-logo.png" 
                alt="Retail Pro" 
                className="h-16 w-auto opacity-80"
              />
            </div>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Digital loyalty cards and store credit that live in Apple Wallet. Turn shoppers into loyal customers.
            </p>
            <div className="flex justify-center space-x-8 mb-8">
              <Link href="/auth/login" className="text-slate-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/sign-up" className="text-slate-400 hover:text-white transition-colors">
                Get Started
              </Link>
              <Link href="#" className="text-slate-400 hover:text-white transition-colors">
                Support
              </Link>
              <Link href="#" className="text-slate-400 hover:text-white transition-colors">
                Privacy
              </Link>
            </div>
            <div className="text-sm text-slate-500">
              © 2025 Retail Pro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
