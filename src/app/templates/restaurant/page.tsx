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

export default function RestaurantTemplate() {
  const [pricingPackages, setPricingPackages] = useState<PricingPackage[]>([])

  useEffect(() => {
    // Load pricing packages for restaurants
    const restaurantPackages = [
      {
        id: '1',
        name: 'Bistro',
        description: 'Perfect for small restaurants and cafes',
        price: 79,
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
          menuIntegration: true,
          reservationAlerts: false
        },
        isActive: true
      },
      {
        id: '2',
        name: 'Restaurant Pro',
        description: 'Ideal for established restaurants with multiple locations',
        price: 149,
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
          menuIntegration: true,
          reservationAlerts: true,
          multiLocation: true,
          posIntegration: true
        },
        isActive: true
      },
      {
        id: '3',
        name: 'Restaurant Chain',
        description: 'Full-featured solution for restaurant chains and franchises',
        price: 299,
        passLimit: 20000,
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
          menuIntegration: true,
          reservationAlerts: true,
          multiLocation: true,
          posIntegration: true,
          franchiseManagement: true,
          customIntegrations: true
        },
        isActive: true
      }
    ]
    setPricingPackages(restaurantPackages)
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
                  alt="Restaurant Loyalty Pro" 
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
                <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white">
                  Get Started Today
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Turn First-Time Diners Into
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mt-4">
                Loyal Regulars
              </span>
            </h1>
            <p className="text-2xl text-orange-100 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
              Digital loyalty cards that live in Apple Wallet. No more forgotten punch cards or lost points.
            </p>
            <p className="text-xl text-red-200 mb-16 max-w-4xl mx-auto leading-relaxed">
              Your customers add your loyalty card to Apple Wallet in one tap. You send delicious updates straight to their Lock Screen — new menu items, special offers, and rewards they've earned.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/auth/sign-up?type=business">
                <Button size="lg" className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg px-12 py-6 rounded-xl shadow-2xl hover:shadow-orange-500/25 transition-all duration-300">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#examples">
                <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-6 rounded-xl backdrop-blur-sm">
                  See Restaurant Examples
                </Button>
              </Link>
            </div>

            {/* Trust Bar */}
            <div className="text-orange-200 mb-12">
              <div className="flex items-center justify-center space-x-8 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Works with any POS
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  No app download needed
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Setup in minutes
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
              Paper punch cards get lost. Apps get deleted.
            </h2>
            <p className="text-xl text-slate-700 max-w-4xl mx-auto leading-relaxed">
              But Apple Wallet? That's where your customers keep their credit cards, boarding passes, and now — your loyalty program.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">No more lost cards</h3>
              <p className="text-slate-600 leading-relaxed">Digital cards can't be forgotten at home or lost in wallets</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Always on Lock Screen</h3>
              <p className="text-slate-600 leading-relaxed">Your restaurant appears when customers are deciding where to eat</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Instant updates</h3>
              <p className="text-slate-600 leading-relaxed">New menu items, daily specials, earned rewards — delivered instantly</p>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Examples */}
      <section id="examples" className="py-20 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Perfect for Every Type of Restaurant
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: '☕',
                title: 'Coffee Shops',
                description: 'Buy 9 coffees, get the 10th free. Loyalty that actually works.',
                example: '"Free coffee after 9 visits" updates automatically on their Lock Screen'
              },
              {
                icon: '🍕',
                title: 'Pizza Places',
                description: 'Points for every dollar spent. Redeem for free pizzas and sides.',
                example: '"You have enough points for a free pizza!" appears when they walk by'
              },
              {
                icon: '🍔',
                title: 'Burger Joints',
                description: 'Stamp cards that never get lost. Build loyalty one burger at a time.',
                example: '"2 more visits for a free burger" motivates the next visit'
              },
              {
                icon: '🍜',
                title: 'Asian Restaurants',
                description: 'Reward frequent diners with exclusive menu previews and discounts.',
                example: '"New ramen flavor available - 20% off for loyalty members"'
              },
              {
                icon: '🥗',
                title: 'Healthy Fast-Casual',
                description: 'Health-conscious customers love tracking their rewards digitally.',
                example: '"Earned a free smoothie! Valid for 30 days" with countdown timer'
              },
              {
                icon: '🍰',
                title: 'Bakeries & Desserts',
                description: 'Sweet rewards for sweet customers. Birthday specials and more.',
                example: '"Happy Birthday! Free slice of cake waiting for you"'
              }
            ].map((restaurant, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-200">
                <CardHeader>
                  <div className="text-4xl mb-4">{restaurant.icon}</div>
                  <CardTitle className="text-xl font-bold text-slate-900">{restaurant.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed mb-4">{restaurant.description}</p>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm text-orange-800 italic">"{restaurant.example}"</p>
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
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Design Your Card</h3>
              <p className="text-slate-600 leading-relaxed">Upload your logo, choose colors, set your rewards</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Share with Customers</h3>
              <p className="text-slate-600 leading-relaxed">QR code at checkout, link in email, or website button</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Track & Reward</h3>
              <p className="text-slate-600 leading-relaxed">Scan at POS, points add up, rewards unlock automatically</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">4</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Keep Them Coming</h3>
              <p className="text-slate-600 leading-relaxed">Send updates about new items, specials, and earned rewards</p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Real Results from Real Restaurants
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              {
                stat: '40%',
                label: 'More repeat visits',
                description: 'Lock Screen visibility drives return customers'
              },
              {
                stat: '25%',
                label: 'Higher average order',
                description: 'Rewards encourage customers to spend more'
              },
              {
                stat: '60%',
                label: 'Better engagement',
                description: 'vs traditional punch cards or apps'
              },
              {
                stat: '90%',
                label: 'Customer retention',
                description: 'Digital cards never get lost or forgotten'
              }
            ].map((result, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold text-orange-600 mb-2">{result.stat}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{result.label}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{result.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <blockquote className="text-2xl font-medium text-slate-900 mb-4">
              "Our loyalty program participation went from 20% to 80% after switching to Apple Wallet cards. Customers actually use them now!"
            </blockquote>
            <cite className="text-lg text-slate-600">— Maria's Pizzeria, Downtown</cite>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Restaurant Loyalty Pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Simple pricing that grows with your restaurant. No setup fees, no per-customer charges.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPackages.map((pkg, index) => (
              <Card key={pkg.id} className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
                index === 1 ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 scale-105' : 'border-slate-200 hover:border-orange-200'
              }`}>
                {index === 1 && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
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
                      {pkg.programLimit === -1 ? 'Unlimited' : pkg.programLimit} loyalty programs
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
                      Loyalty program tools
                    </li>
                    <li className="flex items-center text-slate-700">
                      {pkg.features.menuIntegration ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-slate-400 mr-3" />
                      )}
                      Menu integration
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
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700' 
                        : 'bg-slate-900 hover:bg-slate-800'
                    } text-white`}>
                      Start Free Trial
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to build customer loyalty that lasts?
          </h2>
          <p className="text-xl text-orange-100 mb-12 leading-relaxed">
            Join hundreds of restaurants using Apple Wallet loyalty cards to turn first-time diners into regulars.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/sign-up?type=business">
              <Button size="lg" className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg px-12 py-6 rounded-xl shadow-2xl hover:shadow-orange-500/25 transition-all duration-300">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#examples">
              <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-6 rounded-xl backdrop-blur-sm">
                See Examples
              </Button>
            </Link>
          </div>
          <p className="text-orange-200 mt-8 text-sm">
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
                alt="Restaurant Loyalty Pro" 
                className="h-16 w-auto opacity-80"
              />
            </div>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Digital loyalty cards that live in Apple Wallet. Turn first-time diners into loyal regulars.
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
              © 2025 Restaurant Loyalty Pro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
