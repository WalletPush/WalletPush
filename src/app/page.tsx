'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle,
  ArrowRight,
  Star,
  Sparkles,
  Smartphone,
  CreditCard,
  Bell,
  Users,
  BarChart3,
  Zap,
  Shield,
  TrendingUp,
  Target,
  Gift,
  Wallet,
  Crown,
  Megaphone
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { DynamicLogo } from '@/components/branding/DynamicLogo'
import AgencyHomepageRenderer from '@/components/AgencyHomepageRenderer'

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)
  const [packages, setPackages] = useState<any[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [agencyHomepage, setAgencyHomepage] = useState<any>(null)
  const [loadingAgency, setLoadingAgency] = useState(true)

  useEffect(() => {
    setIsVisible(true)
    loadPackages()
    loadAgencyHomepage()
  }, [])

  const loadAgencyHomepage = async () => {
    try {
      // Check if there's an agency context (from URL params or domain)
      const urlParams = new URLSearchParams(window.location.search)
      const agencyId = urlParams.get('agency_id')
      
      if (!agencyId) {
        setLoadingAgency(false)
        return
      }

      const response = await fetch(`/api/agency/resolve-homepage?agency_id=${agencyId}`)
      const data = await response.json()

      if (data.success) {
        console.log('✅ Agency homepage loaded:', data)
        setAgencyHomepage(data)
      }
    } catch (error) {
      console.error('Error loading agency homepage:', error)
    } finally {
      setLoadingAgency(false)
    }
  }

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-section')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const loadPackages = async () => {
    try {
      console.log('🔄 Starting to load packages...')
      const response = await fetch('/api/public/agency-packages')
      console.log('📡 Package API response status:', response.status)
      
      const result = await response.json()
      console.log('📦 Package API result:', result)
      
      if (result.success && result.packages) {
        console.log('✅ Setting packages:', result.packages.length, 'packages')
        setPackages(result.packages)
      } else {
        console.log('⚠️ No packages in result or success=false')
      }
    } catch (error) {
      console.error('❌ Error loading packages:', error)
      // Keep default behavior if API fails
    } finally {
      setLoadingPackages(false)
      console.log('🏁 Package loading finished')
    }
  }

  // If we have an agency homepage, render it instead of the default
  if (agencyHomepage && !loadingAgency) {
    console.log('🎯 Rendering AgencyHomepageRenderer with:', agencyHomepage)
    return <AgencyHomepageRenderer homepage={agencyHomepage} />
  }

  // Show loading while checking for agency homepage
  if (loadingAgency) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading homepage...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with stunning gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-[url('/images/bgimg.png')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-indigo-600/20"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="container mx-auto flex items-center justify-between h-20 px-6">
          <Link href="/" className="flex items-center">
            <DynamicLogo 
              width={175} 
              height={56} 
              className="h-14 w-auto object-contain" 
              alt="Logo"
              variant="white"
            />
          </Link>
          <nav className="flex items-center space-x-6">
            <Link href="/business/auth/login" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Login
            </Link>
            <Button 
              onClick={scrollToPricing}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105 border border-white/20"
            >
              Get Started Free
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center justify-items-center">
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto lg:mx-0">
              <div className="mb-8 inline-flex items-center rounded-full bg-blue-600/30 text-white border border-blue-400 px-6 py-3 text-sm font-semibold backdrop-blur-sm">
                <Sparkles className="w-5 h-5 mr-3 text-yellow-400" />
                Customer Loyalty & Retention Made Easy
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-8 text-white leading-tight">
                Turn One-Time Shoppers Into
                <span className="block text-yellow-400 font-extrabold">
                  Lifelong Customers
                </span>
              </h1>
              <p className="text-lg text-white mb-10 leading-relaxed max-w-xl">
                Acquiring a new customer costs 5× more than retaining existing ones. A 5% boost in retention can increase profits by 25-95%. WalletPush makes customer loyalty effortless.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={scrollToPricing}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-full text-lg font-bold shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105 border border-white/20"
                >
                  Start Free Trial <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 px-8 py-4 rounded-full text-lg font-semibold backdrop-blur-sm">
                  Watch Demo <Smartphone className="ml-3 w-5 h-5" />
                </Button>
              </div>
              
              {/* Stats */}
              <div className="mt-16 grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-white mb-2">95%</div>
                  <div className="text-blue-200 text-sm">Retention Boost</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-2">10×</div>
                  <div className="text-blue-200 text-sm">Higher Redemption</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-2">31%</div>
                  <div className="text-blue-200 text-sm">More Spending</div>
                </div>
              </div>
            </div>
            
            <div className="relative lg:text-right opacity-100 translate-x-0">
              <div className="relative">
                <Image
                  src="/images/Wallet02.png"
                  alt="Digital Wallet Interface"
                  width={640}
                  height={452}
                  className="rounded-2xl shadow-2xl border border-white/20"
                  priority
                />
                <div className="absolute -bottom-6 -left-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-4 shadow-2xl border border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-white">$12M+</div>
                      <div className="text-white/80 text-xs">Extra Revenue</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="absolute inset-0 bg-white"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">Meet WalletPush</h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Your all-in-one SaaS platform for digital loyalty cards, VIP memberships, and mobile wallet marketing. 
              <span className="font-semibold text-blue-600"> 10× faster than building an app</span>, with zero coding required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            <Card className="p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mb-6 mx-auto shadow-lg">
                  <CreditCard className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-4">Digital Loyalty Cards</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  Ditch punch cards forever. Issue digital loyalty cards that live on customers' phones with automatic point tracking and instant rewards.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl mb-6 mx-auto shadow-lg">
                  <Crown className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-4">VIP Memberships</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  Create exclusive membership tiers with special perks. 93% retention rate like Amazon Prime - turn customers into loyal members.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl mb-6 mx-auto shadow-lg">
                  <Gift className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-4">Smart Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  Send targeted offers directly to mobile wallets. 10× higher redemption rates than paper coupons with lock-screen notifications.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Memberships Image Showcase */}
          <div className="text-center mb-20">
            <h3 className="text-4xl font-bold text-gray-900 mb-8">Beautiful Mobile Wallet Experiences</h3>
            <div className="relative max-w-4xl mx-auto">
              <Image
                src="/images/Memberships.webp"
                alt="Digital Membership Cards"
                width={800}
                height={500}
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -top-6 -right-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 shadow-xl">
                <div className="font-bold text-lg text-white">Mobile Wallet Ready</div>
              </div>
            </div>
          </div>

          {/* Power Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <Bell className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="font-bold text-gray-900 mb-2">Unlimited Push Notifications</h4>
              <p className="text-gray-600 text-sm">Free push messages to customers' lock screens</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <Zap className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h4 className="font-bold text-gray-900 mb-2">Instant Setup</h4>
              <p className="text-gray-600 text-sm">Go live in minutes, not months</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <BarChart3 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h4 className="font-bold text-gray-900 mb-2">Real-Time Analytics</h4>
              <p className="text-gray-600 text-sm">Track performance and optimize campaigns</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <Shield className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h4 className="font-bold text-gray-900 mb-2">Enterprise Security</h4>
              <p className="text-gray-600 text-sm">Bank-level security for all customer data</p>
            </div>
          </div>

          {/* Your Program, Your Style Section */}
          <div className="mt-32 mx-auto px-4 md:px-8 max-w-7xl">
            <div className="text-center mb-12 md:mb-20">
              <h3 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-2">Your Program, Your Style</h3>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl md:rounded-3xl p-6 md:p-12 lg:p-16 shadow-2xl border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center max-w-6xl mx-auto">
                <div className="order-2 lg:order-1 space-y-6 md:space-y-8">
                  <p className="text-xl md:text-2xl font-semibold text-gray-800 leading-relaxed">
                    With us, you're in full control.
                  </p>
                  <div className="space-y-4 md:space-y-6">
                    <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                      Whether you want to reward customer check-ins, launch a refer-a-friend campaign, encourage social shares, or create something entirely your own - our flexible <span className="font-semibold text-blue-600">Program Configurator</span> makes it effortless.
                    </p>
                    <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                      Design loyalty, membership, or store card programs that reflect your brand and engage your customers the way you want. No cookie-cutter templates - just your vision, powered by our smart tools.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 pt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Fully Customizable</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">No Coding Required</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Live in Minutes</span>
                    </div>
                  </div>
                </div>
                
                <div className="order-1 lg:order-2">
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <div className="relative">
                      <Image
                        src="/images/yourstyle.png"
                        alt="Your Program, Your Style"
                        width={600}
                        height={400}
                        className="rounded-2xl shadow-2xl w-full h-auto transform group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute -bottom-4 md:-bottom-6 -right-4 md:-right-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-3 md:p-4 shadow-xl">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div className="w-8 md:w-10 h-8 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Target className="w-4 md:w-5 h-4 md:h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm md:text-lg font-bold text-white">Your Brand</div>
                            <div className="text-white/80 text-xs">Your Rules</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="relative z-10 py-32 px-6 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">Simple, Transparent Pricing</h2>
            <p className="text-xl text-white max-w-3xl mx-auto">
              Choose the plan that fits your business. No hidden fees, no long-term contracts.
            </p>
          </div>

          {loadingPackages ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {packages.map((pkg, index) => (
                <div key={pkg.id} className={`p-8 rounded-xl relative ${pkg.isPopular ? 'bg-gradient-to-br from-blue-600 to-purple-600 transform scale-105 border-2 border-yellow-400' : 'bg-white/10 backdrop-blur-lg border border-white/20'}`}>
                  {/* Popular Badge */}
                  {pkg.isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-bold">
                        MOST POPULAR
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center text-white">
                    <h3 className="text-2xl font-bold mb-4 text-white">{pkg.name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-white">${pkg.price}</span>
                      <span className="text-white">/month</span>
                    </div>
                    <p className="text-white mb-8">{pkg.description}</p>
                  </div>
                  <div className="space-y-4 text-white">
                    {pkg.features?.map((feature: any) => (
                      <div key={feature.id} className="flex items-center space-x-3">
                        <CheckCircle className={`w-5 h-5 ${pkg.isPopular ? 'text-green-300' : 'text-green-400'}`} />
                        <span className="text-white">{feature.name}</span>
                      </div>
                    ))}
                    <div className="pt-6">
                      <Link href={pkg.name === 'Enterprise' ? '/contact' : `/business/auth/sign-up?package=${pkg.id}`}>
                        <Button className={`w-full py-3 rounded-full font-semibold ${
                          pkg.isPopular 
                            ? 'bg-white text-blue-600 hover:bg-gray-100 font-bold' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                        }`}>
                          {pkg.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <p className="text-white mb-4">All plans include 14-day free trial • No setup fees • Cancel anytime</p>
            <div className="flex justify-center items-center space-x-8 text-sm text-white">
              <div className="flex items-center text-white">
                <Shield className="w-4 h-4 mr-2 text-white" />
                <span className="text-white">Enterprise Security</span>
              </div>
              <div className="flex items-center text-white">
                <Zap className="w-4 h-4 mr-2 text-white" />
                <span className="text-white">99.9% Uptime SLA</span>
              </div>
              <div className="flex items-center text-white">
                <Users className="w-4 h-4 mr-2 text-white" />
                <span className="text-white">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 py-20 px-6 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-12">Trusted by Businesses Worldwide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-4xl font-bold text-blue-600 mb-2">$12M+</div>
              <div className="text-gray-600">Extra Revenue Generated</div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-4xl font-bold text-purple-600 mb-2">500K+</div>
              <div className="text-gray-600">Loyalty Members</div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-4xl font-bold text-green-600 mb-2">98%</div>
              <div className="text-gray-600">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
          <div className="absolute inset-0 bg-[url('/images/bgimg.png')] bg-cover bg-center opacity-10"></div>
        </div>
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Ready to <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Transform</span> Your Business?
          </h2>
          <p className="text-xl text-blue-100/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of businesses using WalletPush to create loyal customers and drive repeat sales. 
            No contracts, no setup fees - start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              onClick={scrollToPricing}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-5 rounded-full text-xl font-bold shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105 border border-white/20"
            >
              Start Free Trial <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
            <div className="text-blue-200 text-sm">
              ✓ No credit card required  ✓ 14-day free trial  ✓ Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <DynamicLogo 
                width={175} 
                height={56} 
                className="h-12 w-auto object-contain" 
                alt="Logo"
                variant="white"
              />
            </div>
            <p className="text-gray-400 text-lg mb-6">
              The future of customer loyalty is digital
            </p>
            <div className="flex justify-center space-x-8 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} WalletPush. All rights reserved. Built with 💜 for businesses that care about their customers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}