'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  CreditCard, 
  Bell, 
  Users, 
  BarChart3, 
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Shield,
  Sparkles,
  TrendingUp,
  Target,
  Gift,
  Wallet,
  Crown,
  Megaphone
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/bgimg.png"
          alt="Background"
          fill
          className="object-cover opacity-5"
          priority
        />
      </div>

      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/images/logoColor.png"
              alt="WalletPush Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WalletPush
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-700 hover:text-blue-600 font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold">
                Get Started Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Customer Loyalty & Retention Made Easy
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent leading-tight">
                Turn One-Time Shoppers Into<br />
                <span className="text-purple-600">Lifelong Customers</span>
              </h1>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Meet WalletPush – Your friendly all-in-one loyalty platform that helps businesses launch digital loyalty cards, membership passes, and coupon offers straight to customers' mobile wallets.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/auth/sign-up">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold border-2 hover:bg-gray-50 w-full sm:w-auto">
                  Watch Demo
                  <Sparkles className="ml-2 w-5 h-5" />
                </Button>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  14-day free trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Cancel anytime
                </div>
              </div>
            </div>
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="relative">
                <Image
                  src="/images/MembersArea.png"
                  alt="Members Area Preview"
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl"
                  priority
                />
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">95% Retention Boost</div>
                      <div className="text-sm text-gray-600">Average increase</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/80 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Proven Results That Drive Growth
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of businesses already seeing incredible results with WalletPush
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-3">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">10x</div>
              <div className="text-gray-600 font-medium">Faster than mobile apps</div>
            </div>
            <div className="space-y-3">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent">95%</div>
              <div className="text-gray-600 font-medium">Retention increase potential</div>
            </div>
            <div className="space-y-3">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">31%</div>
              <div className="text-gray-600 font-medium">Higher customer spending</div>
            </div>
            <div className="space-y-3">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">$12M</div>
              <div className="text-gray-600 font-medium">Generated in extra sales</div>
            </div>
          </div>
        </div>
      </section>

      {/* Loyalty Programs Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200">
              <Crown className="w-4 h-4 mr-1" />
              Loyalty & Membership Programs
            </Badge>
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Programs that Boost Lifetime Value
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Create both points-based loyalty cards and VIP membership passes that make customers feel valued and encourage them to stick around.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-4">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Digital Loyalty Cards</h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Ditch the punch cards and old-school key fobs. Issue digital loyalty cards that live on your customer's phone – they'll never leave home without it. Every purchase can earn points or stamps toward rewards, automatically updated on their mobile wallet card.
              </p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">15-40% higher lifetime value for enrolled customers</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">83% of consumers prefer brands with loyalty programs</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Automatic points tracking and reward notifications</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/images/Memberships.webp"
                alt="Digital Memberships"
                width={500}
                height={350}
                className="rounded-2xl shadow-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h4 className="text-xl font-bold text-center mb-4">VIP Membership Example</h4>
                <div className="space-y-3 text-center">
                  <div className="bg-white rounded-lg p-3">
                    <span className="font-semibold text-purple-600">Gold Member Benefits</span>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <span className="text-gray-700">20% off all purchases</span>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <span className="text-gray-700">Priority booking & support</span>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <span className="text-gray-700">Exclusive member events</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">VIP Membership Passes</h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Turn your best customers into proud members of an exclusive club. Offer tiered memberships or subscription-based programs that grant special perks. When customers feel like insiders, they stick with you longer and increase their spending.
              </p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">93% retention rate for premium members (like Amazon Prime)</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">77% of consumers belong to paid loyalty programs</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">4.8x average ROI on loyalty programs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Digital Coupons Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-orange-200">
              <Gift className="w-4 h-4 mr-1" />
              Digital Coupons & Offers
            </Badge>
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Delivered Straight to the Lock Screen
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Send special offers directly to your customer's smartphone at the perfect moment – no printing, no mailing, no emails lost in spam.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">10x Higher Redemption</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">Digital coupons have redemption rates up to 10× higher than traditional paper coupons.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">24% More Spending</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">Coupon users spend up to 24% more than shoppers who don't use coupons.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Real-time Targeting</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">Send personalized offers based on customer behavior, location, and preferences.</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">
              Smart Automation Examples
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                <h4 className="font-semibold text-blue-700 mb-2">Win-Back Campaign</h4>
                <p className="text-gray-600 text-sm">Send "We miss you – here's 20% off" to customers who haven't visited in 30 days</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6">
                <h4 className="font-semibold text-green-700 mb-2">Birthday Rewards</h4>
                <p className="text-gray-600 text-sm">Automatically send birthday freebies to loyal members on their special day</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
                <h4 className="font-semibold text-purple-700 mb-2">Location-Based</h4>
                <p className="text-gray-600 text-sm">Trigger offers when customers are near your store location</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200">
              <Zap className="w-4 h-4 mr-1" />
              Your Own Branded App-Like Experience
            </Badge>
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Without the App
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Get an app-like presence in your customer's phone without any app development. The mobile wallet pass IS the app.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Megaphone className="w-8 h-8" />,
                title: "Unlimited Push Notifications",
                description: "Stay in touch with your customers for free. Send unlimited push messages to announce new rewards, flash sales, or just to say 'Thank you!'",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: "Easy Customization & Branding",
                description: "Add your logo, colors, and design to mobile wallet cards. Consistent branding reinforces recognition and trust.",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Effortless Setup & Integration",
                description: "Create sign-up forms and cards with a few clicks. Integrates with popular CRMs and marketing tools seamlessly.",
                gradient: "from-green-500 to-blue-500"
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Real-Time Updates & Analytics",
                description: "Update passes instantly and track sign-ups, active users, and offer redemptions with detailed analytics.",
                gradient: "from-orange-500 to-red-500"
              },
              {
                icon: <Wallet className="w-8 h-8" />,
                title: "Ultimate Convenience",
                description: "Everything lives on the native wallet app. No new downloads, no physical cards to carry. It's extremely convenient.",
                gradient: "from-indigo-500 to-purple-500"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Enterprise Security",
                description: "Enterprise-grade security with 99.9% uptime. Your data and customers are always protected and secure.",
                gradient: "from-gray-600 to-gray-800"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group">
                <CardHeader>
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Story Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-gradient-to-r from-green-100 to-blue-100 text-green-700 border-green-200">
            <Star className="w-4 h-4 mr-1" />
            Success Story
          </Badge>
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Drive Revenue and Retention – Starting Today
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Our clients have seen firsthand what a difference this makes – one WalletPush-powered campaign generated over <span className="font-bold text-green-600">$12 million in extra sales</span> for a business in a single run. That's the kind of impact loyalty and smart engagement can have when done right.
          </p>
          <div className="bg-white rounded-2xl p-8 shadow-xl max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">90%</div>
                <div className="text-gray-600">of companies report positive ROI</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">4.8x</div>
                <div className="text-gray-600">average return on investment</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">73%</div>
                <div className="text-gray-600">modify spending to maximize benefits</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl font-bold mb-6">
            Ready to Elevate Your Customer Loyalty?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
            Don't let your customers become strangers. Turn them into loyal fans with WalletPush – the friendly, powerful way to boost retention and customer lifetime value.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold">
              Schedule Demo
              <Sparkles className="ml-2 w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm opacity-75">
            ✨ No long-term contracts • No expensive hardware • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/images/logowhite.png"
                  alt="WalletPush Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <span className="text-2xl font-bold">WalletPush</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The friendly, powerful way to boost customer retention and lifetime value through mobile wallet loyalty programs.
              </p>
              <div className="text-gray-400">
                Get rid of outdated paper. Digital wallets are the future!
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Templates</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Support</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="text-gray-400 mb-4 md:mb-0">
              © 2024 WalletPush. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-gray-400">
              <span>Future-proof your customer engagement</span>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}