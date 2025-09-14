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

export default function MembershipClubTemplate() {
  const [pricingPackages, setPricingPackages] = useState<PricingPackage[]>([])

  useEffect(() => {
    // Load pricing packages for membership clubs
    const membershipPackages = [
      {
        id: '1',
        name: 'Club Starter',
        description: 'Perfect for boutique membership programs',
        price: 149,
        passLimit: 500,
        programLimit: 1,
        staffLimit: 3,
        features: {
          customBranding: true,
          analytics: 'basic',
          apiAccess: false,
          prioritySupport: false,
          whitelabelDomain: false,
          smtpConfiguration: false,
          membershipTools: true,
          lockScreenUpdates: true
        },
        isActive: true
      },
      {
        id: '2',
        name: 'Club Professional',
        description: 'Ideal for growing membership businesses',
        price: 299,
        passLimit: 2000,
        programLimit: 3,
        staffLimit: 10,
        features: {
          customBranding: true,
          analytics: 'advanced',
          apiAccess: true,
          prioritySupport: true,
          whitelabelDomain: true,
          smtpConfiguration: true,
          membershipTools: true,
          lockScreenUpdates: true,
          tierManagement: true,
          automatedPerks: true
        },
        isActive: true
      },
      {
        id: '3',
        name: 'Club Enterprise',
        description: 'Full-featured solution for premium membership clubs',
        price: 599,
        passLimit: 10000,
        programLimit: -1,
        staffLimit: -1,
        features: {
          customBranding: true,
          analytics: 'enterprise',
          apiAccess: true,
          prioritySupport: true,
          whitelabelDomain: true,
          smtpConfiguration: true,
          membershipTools: true,
          lockScreenUpdates: true,
          tierManagement: true,
          automatedPerks: true,
          conciergeSetup: true,
          customIntegrations: true
        },
        isActive: true
      }
    ]
    setPricingPackages(membershipPackages)
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
                  alt="Membership Pro" 
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
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Book Free Consult
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Launch a Membership Your Customers
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mt-4">
                Actually Use
              </span>
            </h1>
            <p className="text-2xl text-purple-100 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
              We design and launch modern memberships your customers love — added to Apple Wallet in one tap, with lock-screen updates that bring them back again and again.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/auth/sign-up?type=business">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-12 py-6 rounded-xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300">
                  Book a Free Consult
                </Button>
              </Link>
              <Link href="#examples">
                <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-6 rounded-xl backdrop-blur-sm">
                  See Membership Examples
                </Button>
              </Link>
            </div>

            {/* Trust Bar */}
            <div className="text-purple-200 mb-12">
              <div className="flex items-center justify-center space-x-8 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  No app to build
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  One-tap add
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Fast launch
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Now Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              SMS is noisy. Apps are expensive.
            </h2>
            <p className="text-xl text-slate-700 max-w-4xl mx-auto leading-relaxed">
              Memberships that live in Apple Wallet are the sweet spot: one tap to join, always visible, and easy to redeem in-store.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">More visits</h3>
              <p className="text-slate-600 leading-relaxed">Gentle lock-screen nudges beat another ignored text</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Frictionless joining</h3>
              <p className="text-slate-600 leading-relaxed">Link or QR → Add to Wallet → done</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Lower cost</h3>
              <p className="text-slate-600 leading-relaxed">No per-message fees or carrier hoops</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              What You Get
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              We do everything start-to-finish:
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: '🎯',
                title: 'Membership concept & perks',
                description: 'We\'ll help structure bronze/silver/gold or a clean monthly plan'
              },
              {
                icon: '🎨',
                title: 'Card design',
                description: 'On-brand, looks great in Apple Wallet'
              },
              {
                icon: '📱',
                title: 'One-tap join link & QR',
                description: 'For counter, web, email, socials'
              },
              {
                icon: '🔔',
                title: 'Member updates to Lock Screen',
                description: 'New perks, points, reminders'
              },
              {
                icon: '👥',
                title: 'Staff training & checkout flow',
                description: 'Scan barcode/QR, no new hardware needed'
              },
              {
                icon: '📊',
                title: 'Simple dashboard & weekly report',
                description: 'Installs, actives, redemptions'
              }
            ].map((deliverable, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200">
                <CardHeader>
                  <div className="text-4xl mb-4">{deliverable.icon}</div>
                  <CardTitle className="text-xl font-bold text-slate-900">{deliverable.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">{deliverable.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <p className="text-lg text-slate-700 font-medium mb-8">
              <strong>Add-ons:</strong> Email welcome series, in-store signage pack, launch promo calendar, POS integration help.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              How it works <span className="text-slate-600">(simple!)</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Plan</h3>
              <p className="text-slate-600 leading-relaxed">We map your perks, pricing, and renewal</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Design</h3>
              <p className="text-slate-600 leading-relaxed">Your card and join page, ready in days</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Launch</h3>
              <p className="text-slate-600 leading-relaxed">We publish your join link + QR</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">4</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Grow</h3>
              <p className="text-slate-600 leading-relaxed">We send lock-screen updates that bring members back</p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/auth/sign-up?type=business">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-12 py-6 rounded-xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300">
                Book a Free Consult
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Proven Playbooks Section */}
      <section id="examples" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Proven Playbooks
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: '🍷',
                title: 'Wine Club',
                description: 'Welcome tasting, 10% off bottles, early release alerts'
              },
              {
                icon: '💪',
                title: 'Gym/Studio',
                description: 'Monthly pass, streak rewards, guest passes, class reminders'
              },
              {
                icon: '💅',
                title: 'Salon/Spa',
                description: 'VIP perks, last-minute openings, birthday rewards'
              },
              {
                icon: '☕',
                title: 'Café/Retail',
                description: 'Points card, weekly offer that updates every Friday'
              },
              {
                icon: '🏨',
                title: 'Hospitality',
                description: 'Guest card with check-in, perks, on-property offers'
              },
              {
                icon: '🎭',
                title: 'Entertainment',
                description: 'Season passes, early booking, member-only events'
              }
            ].map((playbook, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200">
                <CardHeader>
                  <div className="text-4xl mb-4">{playbook.icon}</div>
                  <CardTitle className="text-xl font-bold text-slate-900">{playbook.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">{playbook.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Link href="#examples">
              <Button size="lg" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 text-lg px-12 py-6 rounded-xl">
                See Membership Examples
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Results They Care About
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              {
                icon: '🔄',
                title: 'Higher repeat visits',
                description: 'Members see you on their lock screen'
              },
              {
                icon: '💰',
                title: 'Bigger average order',
                description: 'Perks nudge upgrades and add-ons'
              },
              {
                icon: '📉',
                title: 'Lower marketing cost',
                description: 'No per-text fees, no app to maintain'
              },
              {
                icon: '😊',
                title: 'Happier staff',
                description: 'Show card, scan, done'
              }
            ].map((result, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{result.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{result.title}</h3>
                <p className="text-slate-600 leading-relaxed">{result.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mb-16">
            <blockquote className="text-2xl font-medium text-slate-900 mb-4">
              "We launched in a week and saw 600 members join in month one."
            </blockquote>
            <cite className="text-lg text-slate-600">— Local Brand</cite>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Membership Club Pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Professional membership management with Apple Wallet integration
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPackages.map((pkg, index) => (
              <Card key={pkg.id} className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
                index === 1 ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 scale-105' : 'border-slate-200 hover:border-purple-200'
              }`}>
                {index === 1 && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-medium">
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
                      {pkg.passLimit.toLocaleString()} members/month
                    </li>
                    <li className="flex items-center text-slate-700">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      {pkg.programLimit === -1 ? 'Unlimited' : pkg.programLimit} membership programs
                    </li>
                    <li className="flex items-center text-slate-700">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      {pkg.staffLimit === -1 ? 'Unlimited' : pkg.staffLimit} staff accounts
                    </li>
                    <li className="flex items-center text-slate-700">
                      {pkg.features.membershipTools ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-slate-400 mr-3" />
                      )}
                      Membership tools
                    </li>
                    <li className="flex items-center text-slate-700">
                      {pkg.features.lockScreenUpdates ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-slate-400 mr-3" />
                      )}
                      Lock screen updates
                    </li>
                    <li className="flex items-center text-slate-700">
                      {pkg.features.tierManagement ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-slate-400 mr-3" />
                      )}
                      Tier management
                    </li>
                  </ul>
                  <Link href="/auth/sign-up?type=business">
                    <Button className={`w-full ${
                      index === 1 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                        : 'bg-slate-900 hover:bg-slate-800'
                    } text-white`}>
                      Book Free Consult
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to launch your membership club?
          </h2>
          <p className="text-xl text-purple-100 mb-12 leading-relaxed">
            Join successful businesses using Apple Wallet memberships to increase repeat visits and customer loyalty.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/sign-up?type=business">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-12 py-6 rounded-xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300">
                Book Free Consult
              </Button>
            </Link>
            <Link href="#examples">
              <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-6 rounded-xl backdrop-blur-sm">
                See Examples
              </Button>
            </Link>
          </div>
          <p className="text-purple-200 mt-8 text-sm">
            Free consultation • Custom design • Launch in days
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
                alt="Membership Pro" 
                className="h-16 w-auto opacity-80"
              />
            </div>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Professional membership clubs that live in Apple Wallet. Higher engagement, lower costs, happier members.
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
              © 2025 Membership Pro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
