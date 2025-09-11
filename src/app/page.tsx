import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
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
              <Link href="/auth/login">
                <Button variant="ghost" className="text-slate-700 hover:text-slate-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up?type=business">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6">
              White-Label Wallet
              <span className="block text-indigo-600">Platform for Agencies</span>
            </h1>
            <p className="text-xl text-slate-700 mb-12 max-w-3xl mx-auto leading-relaxed">
              Offer Apple Wallet and Google Wallet membership, loyalty, and store card programs to your clients. 
              Complete white-label solution with custom domains and branding.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/auth/sign-up?type=agency">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-4">
                  Start Agency Trial
                </Button>
              </Link>
              <Link href="/auth/sign-up?type=business">
                <Button size="lg" variant="outline" className="text-slate-700 border-slate-300 hover:bg-slate-50 text-lg px-8 py-4">
                  Direct Business Access
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="text-sm text-slate-600 mb-12">
              Trusted by 500+ agencies and businesses worldwide
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-700 max-w-2xl mx-auto">
              Whether you're an agency offering white-label solutions or a business managing your own programs, 
              we have the perfect plan for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Business Card */}
            <Card className="relative overflow-hidden border-2 hover:border-indigo-200 transition-all duration-300">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Business</CardTitle>
                <CardDescription className="text-lg text-slate-600">Perfect for individual businesses</CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">$97</span>
                  <span className="text-slate-600">/month</span>
                </div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Unlimited wallet passes
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Custom domain (membership.yourbrand.com)
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Stripe Connect integration
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Pass designer & analytics
                  </li>
                </ul>
                <Link href="/auth/sign-up?type=business">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Agency Card */}
            <Card className="relative overflow-hidden border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
              <div className="absolute top-4 right-4">
                <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Agency</CardTitle>
                <CardDescription className="text-lg text-slate-700">White-label for marketing agencies</CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">$297</span>
                  <span className="text-slate-700">/month</span>
                </div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Up to 10 business accounts
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Complete white-label branding
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Custom domains for all clients
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Agency management dashboard
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Priority support & training
                  </li>
                </ul>
                <Link href="/auth/sign-up?type=agency">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    Start Agency Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features to create, manage, and distribute wallet passes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Pass Designer',
                description: 'Intuitive WYSIWYG designer with Apple & Google Wallet previews',
                icon: '🎨'
              },
              {
                title: 'Custom Domains',
                description: 'Brand your membership portal with custom domains',
                icon: '🌐'
              },
              {
                title: 'Stripe Integration',
                description: 'Multi-tenant payment processing with Stripe Connect',
                icon: '💳'
              },
              {
                title: 'Real-time Updates',
                description: 'Instant pass updates via push notifications',
                icon: '⚡'
              },
              {
                title: 'Analytics Dashboard',
                description: 'Comprehensive insights and performance metrics',
                icon: '📊'
              },
              {
                title: 'White Label',
                description: 'Complete white-label solution for agencies',
                icon: '🏷️'
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/images/walletpush-logo.png" 
                alt="WalletPush" 
                className="h-16 w-auto"
              />
            </div>
            <p className="mb-8">Modern wallet membership platform for the digital age</p>
            <div className="text-sm text-slate-500">
              © 2025 WalletPush. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}