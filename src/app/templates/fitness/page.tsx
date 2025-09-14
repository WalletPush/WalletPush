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

export default function FitnessTemplate() {
  const [pricingPackages, setPricingPackages] = useState<PricingPackage[]>([])

  useEffect(() => {
    // Load pricing packages for fitness businesses
    const fitnessPackages = [
      {
        id: '1',
        name: 'Studio',
        description: 'Perfect for boutique fitness studios and personal trainers',
        price: 99,
        passLimit: 500,
        programLimit: 3,
        staffLimit: 5,
        features: {
          customBranding: true,
          analytics: 'basic',
          apiAccess: false,
          prioritySupport: false,
          whitelabelDomain: false,
          smtpConfiguration: false,
          classBooking: true,
          membershipTracking: true,
          workoutReminders: true,
          progressTracking: false
        },
        isActive: true
      },
      {
        id: '2',
        name: 'Gym Pro',
        description: 'Ideal for gyms and fitness centers with multiple programs',
        price: 199,
        passLimit: 2500,
        programLimit: 10,
        staffLimit: 15,
        features: {
          customBranding: true,
          analytics: 'advanced',
          apiAccess: true,
          prioritySupport: true,
          whitelabelDomain: true,
          smtpConfiguration: true,
          classBooking: true,
          membershipTracking: true,
          workoutReminders: true,
          progressTracking: true,
          personalTraining: true,
          equipmentBooking: true
        },
        isActive: true
      },
      {
        id: '3',
        name: 'Fitness Chain',
        description: 'Full-featured solution for fitness chains and franchises',
        price: 399,
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
          classBooking: true,
          membershipTracking: true,
          workoutReminders: true,
          progressTracking: true,
          personalTraining: true,
          equipmentBooking: true,
          multiLocation: true,
          franchiseManagement: true
        },
        isActive: true
      }
    ]
    setPricingPackages(fitnessPackages)
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
                  alt="Fitness Pro" 
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
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white">
                  Start Your Journey
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 bg-gradient-to-br from-green-900 via-teal-900 to-blue-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Keep Members Motivated
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mt-4">
                Beyond the Gym
              </span>
            </h1>
            <p className="text-2xl text-green-100 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
              Digital membership cards that live in Apple Wallet. Track workouts, book classes, and stay motivated with progress updates right on the Lock Screen.
            </p>
            <p className="text-xl text-teal-200 mb-16 max-w-4xl mx-auto leading-relaxed">
              Your members add their gym pass to Apple Wallet in one tap. You send motivational updates, class reminders, and achievement celebrations straight to their Lock Screen.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/auth/sign-up?type=business">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg px-12 py-6 rounded-xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300">
                  Start Your Journey
                </Button>
              </Link>
              <Link href="#examples">
                <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-6 rounded-xl backdrop-blur-sm">
                  See Fitness Examples
                </Button>
              </Link>
            </div>

            {/* Trust Bar */}
            <div className="text-green-200 mb-12">
              <div className="flex items-center justify-center space-x-8 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Works with any gym software
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  No app download needed
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Launch in days
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
              Plastic cards get lost. Apps get ignored.
            </h2>
            <p className="text-xl text-slate-700 max-w-4xl mx-auto leading-relaxed">
              But Apple Wallet? That's where your members keep their most important cards — and now their gym membership too.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Always accessible</h3>
              <p className="text-slate-600 leading-relaxed">Digital membership cards can't be forgotten at home</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l6.586 6.586a2 2 0 002.828 0l6.586-6.586a2 2 0 000-2.828L14.242 1.757a2 2 0 00-2.828 0L4.828 4.172a2 2 0 000 2.828z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Motivational reminders</h3>
              <p className="text-slate-600 leading-relaxed">Lock Screen updates keep fitness goals top of mind</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Track progress</h3>
              <p className="text-slate-600 leading-relaxed">Celebrate milestones and achievements instantly</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fitness Examples */}
      <section id="examples" className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Perfect for Every Fitness Business
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: '🏋️',
                title: 'Gyms & Fitness Centers',
                description: 'Full membership management with class booking and progress tracking.',
                example: '"5 workouts this week! You\'re crushing your goals 💪"'
              },
              {
                icon: '🧘',
                title: 'Yoga Studios',
                description: 'Class passes, workshop bookings, and mindfulness reminders.',
                example: '"New meditation class tomorrow at 7am - perfect for your practice"'
              },
              {
                icon: '🥊',
                title: 'Boxing & MMA Gyms',
                description: 'Training sessions, sparring bookings, and achievement tracking.',
                example: '"Ready for tonight\'s boxing class? Your gloves are waiting!"'
              },
              {
                icon: '🏃',
                title: 'Running Clubs',
                description: 'Group runs, race registrations, and milestone celebrations.',
                example: '"Tomorrow\'s 5K group run starts at 6am. See you there!"'
              },
              {
                icon: '🏊',
                title: 'Swimming Pools',
                description: 'Lane bookings, swim lessons, and lap count tracking.',
                example: '"Pool opens in 30 minutes. Lane 3 is reserved for you."'
              },
              {
                icon: '🚴',
                title: 'Cycling Studios',
                description: 'Spin class bookings, bike reservations, and performance metrics.',
                example: '"Beat your PR in today\'s HIIT spin class! Bike 12 is ready."'
              }
            ].map((fitness, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200">
                <CardHeader>
                  <div className="text-4xl mb-4">{fitness.icon}</div>
                  <CardTitle className="text-xl font-bold text-slate-900">{fitness.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed mb-4">{fitness.description}</p>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800 italic">"{fitness.example}"</p>
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
              Simple Setup, Powerful Motivation
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Design Your Pass</h3>
              <p className="text-slate-600 leading-relaxed">Upload your logo, set your colors, configure membership tiers</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Members Join</h3>
              <p className="text-slate-600 leading-relaxed">QR code signup, website integration, or front desk enrollment</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Track & Engage</h3>
              <p className="text-slate-600 leading-relaxed">Check-ins, class bookings, progress updates automatically</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">4</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Keep Them Motivated</h3>
              <p className="text-slate-600 leading-relaxed">Send achievements, reminders, and encouragement</p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Real Results from Real Gyms
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              {
                stat: '35%',
                label: 'Higher retention',
                description: 'Members stay engaged longer with Lock Screen reminders'
              },
              {
                stat: '50%',
                label: 'More class bookings',
                description: 'Easy booking increases class participation'
              },
              {
                stat: '28%',
                label: 'Increased check-ins',
                description: 'Digital passes make gym visits more convenient'
              },
              {
                stat: '85%',
                label: 'Member satisfaction',
                description: 'Members love the convenience and motivation'
              }
            ].map((result, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">{result.stat}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{result.label}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{result.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <blockquote className="text-2xl font-medium text-slate-900 mb-4">
              "Our member retention improved by 35% after implementing Apple Wallet passes. The Lock Screen reminders keep fitness top of mind!"
            </blockquote>
            <cite className="text-lg text-slate-600">— FitLife Gym, Portland</cite>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Fitness Business Pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Flexible pricing that grows with your fitness business. No setup fees, no per-member charges.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPackages.map((pkg, index) => (
              <Card key={pkg.id} className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
                index === 1 ? 'border-green-500 bg-gradient-to-br from-green-50 to-blue-50 scale-105' : 'border-slate-200 hover:border-green-200'
              }`}>
                {index === 1 && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
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
                      {pkg.passLimit.toLocaleString()} member passes
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
                      {pkg.features.classBooking ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-slate-400 mr-3" />
                      )}
                      Class booking system
                    </li>
                    <li className="flex items-center text-slate-700">
                      {pkg.features.membershipTracking ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-slate-400 mr-3" />
                      )}
                      Membership tracking
                    </li>
                    <li className="flex items-center text-slate-700">
                      {pkg.features.progressTracking ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-slate-400 mr-3" />
                      )}
                      Progress tracking
                    </li>
                  </ul>
                  <Link href="/auth/sign-up?type=business">
                    <Button className={`w-full ${
                      index === 1 
                        ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700' 
                        : 'bg-slate-900 hover:bg-slate-800'
                    } text-white`}>
                      Start Your Journey
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-green-900 via-teal-900 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to motivate your members beyond the gym?
          </h2>
          <p className="text-xl text-green-100 mb-12 leading-relaxed">
            Join fitness businesses using Apple Wallet to increase member retention and engagement.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/sign-up?type=business">
              <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg px-12 py-6 rounded-xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300">
                Start Your Journey
              </Button>
            </Link>
            <Link href="#examples">
              <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-6 rounded-xl backdrop-blur-sm">
                See Examples
              </Button>
            </Link>
          </div>
          <p className="text-green-200 mt-8 text-sm">
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
                alt="Fitness Pro" 
                className="h-16 w-auto opacity-80"
              />
            </div>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Digital fitness memberships that live in Apple Wallet. Keep members motivated beyond the gym.
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
              © 2025 Fitness Pro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
