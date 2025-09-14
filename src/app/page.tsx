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

export default function LandingPage() {
  const [pricingPackages, setPricingPackages] = useState<PricingPackage[]>([])
  const [customHomepage, setCustomHomepage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if there's a custom homepage HTML saved
    checkForCustomHomepage()
    
    // Load pricing packages (we'll use default ones for the main sales page)
    const defaultPackages = [
      {
        id: '1',
        name: 'Starter',
        description: 'Perfect for small businesses getting started',
        price: 29,
        passLimit: 1000,
        programLimit: 3,
        staffLimit: 2,
        features: {
          customBranding: true,
          analytics: 'basic',
          apiAccess: false,
          prioritySupport: false,
          whitelabelDomain: false,
          smtpConfiguration: false
        },
        isActive: true
      },
      {
        id: '2',
        name: 'Business',
        description: 'Ideal for growing businesses with multiple programs',
        price: 69,
        passLimit: 5000,
        programLimit: 10,
        staffLimit: 5,
        features: {
          customBranding: true,
          analytics: 'advanced',
          apiAccess: true,
          prioritySupport: true,
          whitelabelDomain: true,
          smtpConfiguration: false
        },
        isActive: true
      },
      {
        id: '3',
        name: 'Pro',
        description: 'Full-featured solution for enterprise businesses',
        price: 97,
        passLimit: 10000,
        programLimit: 20,
        staffLimit: -1,
        features: {
          customBranding: true,
          analytics: 'enterprise',
          apiAccess: true,
          prioritySupport: true,
          whitelabelDomain: true,
          smtpConfiguration: true
        },
        isActive: true
      }
    ]
    setPricingPackages(defaultPackages)
  }, [])

  const checkForCustomHomepage = async () => {
    try {
      // Try to fetch from static file first (faster)
      const staticResponse = await fetch('/homepage.html')
      if (staticResponse.ok) {
        const html = await staticResponse.text()
        setCustomHomepage(html)
        setLoading(false)
        return
      }
    } catch (error) {
      console.log('No static homepage found, checking database...')
    }

    try {
      // If no static file, check database (for agencies)
      const response = await fetch('/api/admin/get-homepage')
      if (response.ok) {
        const data = await response.json()
        if (data.html) {
          setCustomHomepage(data.html)
        }
      }
    } catch (error) {
      console.log('No custom homepage found, using default')
    }
    
    setLoading(false)
  }

  // If we have a custom homepage, render it in an iframe for style isolation
  if (customHomepage) {
    return (
      <div className="w-full h-screen">
        <iframe
          srcDoc={customHomepage}
          className="w-full h-full border-0"
          title="Custom Homepage"
        />
      </div>
    )
  }

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  // Otherwise, show the default React homepage
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
                  alt="WalletPush" 
                  className="h-12 w-auto"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/template-builder">
                <Button variant="ghost" className="text-slate-700 hover:text-slate-900 text-sm">
                  🎨 Templates
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost" className="text-slate-700 hover:text-slate-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up?type=business">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Loyalty, memberships & store cards that live on your customer's phone
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mt-4">
                — without SMS headaches.
              </span>
            </h1>
            <p className="text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
              Stop paying for texts. Put your offer on the Lock Screen.
            </p>
            <p className="text-xl text-slate-300 mb-16 max-w-4xl mx-auto leading-relaxed">
              Customers add your card to Apple Wallet in one tap. You send instant push updates — no carrier rules, no A2P forms, no per-message fees.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/auth/sign-up?type=business">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-12 py-6 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-6 rounded-xl backdrop-blur-sm">
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="text-blue-200 mb-12">
              <div className="flex items-center justify-center space-x-8 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  No SMS fees
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  No carrier approvals
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Instant setup
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Switch from SMS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Why businesses switch from SMS
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Texts are pricey & filtered</h3>
              <p className="text-slate-600 leading-relaxed">Messages get blocked, costs creep up.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Wallet is seen</h3>
              <p className="text-slate-600 leading-relaxed">Your card sits in Apple Wallet and surfaces on the Lock Screen when you update it.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">No approvals</h3>
              <p className="text-slate-600 leading-relaxed">Send pushes without carrier paperwork or "STOP to opt out" drama.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Run */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              What you can run with WalletPush
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <Card className="border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">Loyalty Cards</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm leading-relaxed">Digital stamp/points, auto tier upgrades, "Come back today for 2x points."</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎫</span>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">Membership Passes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm leading-relaxed">Monthly/annual access with renewal reminders and an always-up-to-date barcode/QR.</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏪</span>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">Store Cards & Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm leading-relaxed">Limited-time promos, gift balance, "Happy Hour starts now."</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">Event or VIP</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm leading-relaxed">Access passes that update live (time, seat, perks).</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-xl text-slate-700 font-medium">
              All cards update live — change the offer, points, or perks and your customers see it right away.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              How it works <span className="text-slate-600">(really this simple)</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Create your card</h3>
              <p className="text-slate-600 leading-relaxed">Pick a template, drop in your logo and colors.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Share</h3>
              <p className="text-slate-600 leading-relaxed">Link, QR code, email or website button. One tap → Add to Apple Wallet.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Push to Lock Screen</h3>
              <p className="text-slate-600 leading-relaxed">Send an update anytime (new offer, points, reminder). No carrier rules. No per-text fees.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Love */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              What you'll love
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🔄',
                title: 'More repeat visits',
                description: 'Gentle nudges on the Lock Screen beat another text in a crowded inbox.'
              },
              {
                icon: '💰',
                title: 'Lower costs',
                description: 'Flat monthly price, no per-message fees.'
              },
              {
                icon: '👥',
                title: 'Easy for staff',
                description: 'Scan the Wallet card like a normal barcode/QR.'
              },
              {
                icon: '📱',
                title: 'Zero app',
                description: 'Customers already have Apple Wallet.'
              },
              {
                icon: '⚡',
                title: 'Fast launch',
                description: 'Go live in minutes, not weeks.'
              },
              {
                icon: '🎯',
                title: 'Always visible',
                description: 'Your card lives on their Lock Screen.'
              }
            ].map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
                <CardHeader>
                  <div className="text-4xl mb-4">{benefit.icon}</div>
                  <CardTitle className="text-xl font-bold text-slate-900">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              No setup fees. No per-message costs. No carrier drama.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPackages.map((pkg, index) => (
              <Card key={pkg.id} className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
                index === 1 ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-105' : 'border-slate-200 hover:border-blue-200'
              }`}>
                {index === 1 && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
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
                      {pkg.passLimit.toLocaleString()} passes/month
                    </li>
                    <li className="flex items-center text-slate-700">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      {pkg.programLimit} programs
                    </li>
                    <li className="flex items-center text-slate-700">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      {pkg.staffLimit === -1 ? 'Unlimited' : pkg.staffLimit} staff accounts
                    </li>
                    <li className="flex items-center text-slate-700">
                      {pkg.features.customBranding ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-slate-400 mr-3" />
                      )}
                      Custom branding
                    </li>
                    <li className="flex items-center text-slate-700">
                      {pkg.features.apiAccess ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-slate-400 mr-3" />
                      )}
                      API access
                    </li>
                    <li className="flex items-center text-slate-700">
                      {pkg.features.prioritySupport ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-slate-400 mr-3" />
                      )}
                      Priority support
                    </li>
                  </ul>
                  <Link href="/auth/sign-up?type=business">
                    <Button className={`w-full ${
                      index === 1 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
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

      {/* FAQs */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              FAQs
            </h2>
          </div>

          <div className="space-y-8">
            {[
              {
                question: "Do my customers need to download an app?",
                answer: "No. They add your card to Apple Wallet in one tap."
              },
              {
                question: "Is this SMS?",
                answer: "No. It's Wallet push — updates that appear on the Lock Screen through Apple Wallet. No carrier rules or per-text fees."
              },
              {
                question: "What about Android?",
                answer: "Today is Apple Wallet. Ask us about our Google Wallet timeline."
              },
              {
                question: "Can I change the offer anytime?",
                answer: "Yes. Edit the card, press update, your customers see it immediately."
              },
              {
                question: "How do customers join?",
                answer: "Share a link or QR code at checkout, in email, on your site, or on social."
              }
            ].map((faq, index) => (
              <Card key={index} className="border-2 hover:border-blue-200 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to ditch SMS fees?
          </h2>
          <p className="text-xl text-blue-100 mb-12 leading-relaxed">
            Join thousands of businesses using Apple Wallet to reach customers on the Lock Screen.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/sign-up?type=business">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-12 py-6 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-6 rounded-xl backdrop-blur-sm">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-blue-200 mt-8 text-sm">
            No setup fees • No per-message costs • Cancel anytime
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
                alt="WalletPush" 
                className="h-16 w-auto opacity-80"
              />
            </div>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              The modern way to reach customers. No SMS fees, no carrier drama, no app required.
            </p>
            <div className="flex justify-center space-x-8 mb-8">
              <Link href="/auth/login" className="text-slate-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/sign-up" className="text-slate-400 hover:text-white transition-colors">
                Sign Up
              </Link>
              <Link href="#" className="text-slate-400 hover:text-white transition-colors">
                Support
              </Link>
              <Link href="#" className="text-slate-400 hover:text-white transition-colors">
                Privacy
              </Link>
            </div>
            <div className="text-sm text-slate-500">
              © 2025 WalletPush. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}