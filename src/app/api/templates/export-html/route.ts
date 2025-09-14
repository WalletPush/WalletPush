import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

// GET - Export the main page as static HTML
export async function GET(request: NextRequest) {
  try {
    console.log('📄 Exporting main page as HTML')

    // Read the current page.tsx file
    const pagePath = join(process.cwd(), 'src/app/page.tsx')
    const pageContent = await readFile(pagePath, 'utf-8')

    // Generate static HTML version
    const staticHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WalletPush - Digital Wallet Membership Platform</title>
    <meta name="description" content="Loyalty, memberships & store cards that live on your customer's phone — without SMS headaches. Stop paying for texts. Put your offer on the Lock Screen.">
    <meta name="keywords" content="apple wallet, digital loyalty cards, SMS alternative, push notifications, membership cards">
    
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Custom CSS for animations and gradients -->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        body {
            font-family: 'Inter', sans-serif;
        }
        
        .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: .5;
            }
        }
        
        .delay-1000 {
            animation-delay: 1000ms;
        }
        
        .delay-500 {
            animation-delay: 500ms;
        }
        
        /* Custom gradient buttons */
        .btn-gradient {
            background: linear-gradient(to right, #2563eb, #7c3aed);
            transition: all 0.3s ease;
        }
        
        .btn-gradient:hover {
            background: linear-gradient(to right, #1d4ed8, #6d28d9);
            transform: translateY(-1px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        /* Smooth scrolling */
        html {
            scroll-behavior: smooth;
        }
    </style>
</head>
<body class="min-h-screen bg-white">
    <!-- Navigation -->
    <nav class="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <img src="/images/walletpush-logo.png" alt="WalletPush" class="h-12 w-auto">
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="/auth/login" class="text-slate-700 hover:text-slate-900 px-4 py-2 rounded-md transition-colors">
                        Sign In
                    </a>
                    <a href="/auth/sign-up?type=business" class="btn-gradient text-white px-6 py-2 rounded-md font-medium">
                        Start Free Trial
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative overflow-hidden pt-20 pb-32 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <!-- Animated background elements -->
        <div class="absolute inset-0 overflow-hidden">
            <div class="absolute -top-40 -right-32 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div class="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
        </div>
        
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center">
                <h1 class="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
                    Loyalty, memberships & store cards that live on your customer's phone
                    <span class="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mt-4">
                        — without SMS headaches.
                    </span>
                </h1>
                <p class="text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
                    Stop paying for texts. Put your offer on the Lock Screen.
                </p>
                <p class="text-xl text-slate-300 mb-16 max-w-4xl mx-auto leading-relaxed">
                    Customers add your card to Apple Wallet in one tap. You send instant push updates — no carrier rules, no A2P forms, no per-message fees.
                </p>
                
                <!-- CTA Buttons -->
                <div class="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                    <a href="/auth/sign-up?type=business" class="btn-gradient text-white text-lg px-12 py-6 rounded-xl shadow-2xl inline-block font-medium">
                        Start Free Trial
                    </a>
                    <a href="#how-it-works" class="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-6 rounded-xl backdrop-blur-sm inline-block font-medium transition-all">
                        See How It Works
                    </a>
                </div>

                <!-- Social Proof -->
                <div class="text-blue-200 mb-12">
                    <div class="flex items-center justify-center space-x-8 text-sm">
                        <div class="flex items-center">
                            <div class="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            No SMS fees
                        </div>
                        <div class="flex items-center">
                            <div class="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            No carrier approvals
                        </div>
                        <div class="flex items-center">
                            <div class="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            Instant setup
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Why Switch from SMS -->
    <section class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                    Why businesses switch from SMS
                </h2>
            </div>

            <div class="grid md:grid-cols-3 gap-8 mb-20">
                <div class="text-center">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 mb-4">Texts are pricey & filtered</h3>
                    <p class="text-slate-600 leading-relaxed">Messages get blocked, costs creep up.</p>
                </div>

                <div class="text-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 mb-4">Wallet is seen</h3>
                    <p class="text-slate-600 leading-relaxed">Your card sits in Apple Wallet and surfaces on the Lock Screen when you update it.</p>
                </div>

                <div class="text-center">
                    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 mb-4">No approvals</h3>
                    <p class="text-slate-600 leading-relaxed">Send pushes without carrier paperwork or "STOP to opt out" drama.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- What You Can Run -->
    <section class="py-20 bg-slate-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                    What you can run with WalletPush
                </h2>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <div class="bg-white border-2 border-slate-200 hover:border-blue-200 transition-all duration-300 hover:shadow-lg rounded-lg p-6">
                    <div class="text-center pb-4">
                        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl">🎯</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900 mb-4">Loyalty Cards</h3>
                    </div>
                    <p class="text-slate-600 text-sm leading-relaxed">Digital stamp/points, auto tier upgrades, "Come back today for 2x points."</p>
                </div>

                <div class="bg-white border-2 border-slate-200 hover:border-blue-200 transition-all duration-300 hover:shadow-lg rounded-lg p-6">
                    <div class="text-center pb-4">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl">🎫</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900 mb-4">Membership Passes</h3>
                    </div>
                    <p class="text-slate-600 text-sm leading-relaxed">Monthly/annual access with renewal reminders and an always-up-to-date barcode/QR.</p>
                </div>

                <div class="bg-white border-2 border-slate-200 hover:border-blue-200 transition-all duration-300 hover:shadow-lg rounded-lg p-6">
                    <div class="text-center pb-4">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl">🏪</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900 mb-4">Store Cards & Offers</h3>
                    </div>
                    <p class="text-slate-600 text-sm leading-relaxed">Limited-time promos, gift balance, "Happy Hour starts now."</p>
                </div>

                <div class="bg-white border-2 border-slate-200 hover:border-blue-200 transition-all duration-300 hover:shadow-lg rounded-lg p-6">
                    <div class="text-center pb-4">
                        <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl">⭐</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900 mb-4">Event or VIP</h3>
                    </div>
                    <p class="text-slate-600 text-sm leading-relaxed">Access passes that update live (time, seat, perks).</p>
                </div>
            </div>

            <div class="text-center">
                <p class="text-xl text-slate-700 font-medium">
                    All cards update live — change the offer, points, or perks and your customers see it right away.
                </p>
            </div>
        </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                    How it works <span class="text-slate-600">(really this simple)</span>
                </h2>
            </div>

            <div class="grid md:grid-cols-3 gap-12">
                <div class="text-center">
                    <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span class="text-white text-2xl font-bold">1</span>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 mb-4">Create your card</h3>
                    <p class="text-slate-600 leading-relaxed">Pick a template, drop in your logo and colors.</p>
                </div>

                <div class="text-center">
                    <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span class="text-white text-2xl font-bold">2</span>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 mb-4">Share</h3>
                    <p class="text-slate-600 leading-relaxed">Link, QR code, email or website button. One tap → Add to Apple Wallet.</p>
                </div>

                <div class="text-center">
                    <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span class="text-white text-2xl font-bold">3</span>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 mb-4">Push to Lock Screen</h3>
                    <p class="text-slate-600 leading-relaxed">Send an update anytime (new offer, points, reminder). No carrier rules. No per-text fees.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Pricing Section -->
    <section class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                    Simple, transparent pricing
                </h2>
                <p class="text-xl text-slate-600 max-w-3xl mx-auto">
                    No setup fees. No per-message costs. No carrier drama.
                </p>
            </div>

            <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <!-- Starter Package -->
                <div class="bg-white border-2 border-slate-200 hover:border-blue-200 rounded-lg p-8 transition-all duration-300 hover:shadow-xl">
                    <div class="text-center pb-6">
                        <h3 class="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
                        <p class="text-slate-600">Perfect for small businesses getting started</p>
                    </div>
                    <div class="text-center pb-8">
                        <div class="mb-6">
                            <span class="text-5xl font-bold text-slate-900">$29</span>
                            <span class="text-slate-600">/month</span>
                        </div>
                        <ul class="text-left space-y-3 mb-8">
                            <li class="flex items-center text-slate-700">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                1,000 passes/month
                            </li>
                            <li class="flex items-center text-slate-700">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                3 programs
                            </li>
                            <li class="flex items-center text-slate-700">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                2 staff accounts
                            </li>
                            <li class="flex items-center text-slate-700">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                Custom branding
                            </li>
                        </ul>
                        <a href="/auth/sign-up?type=business" class="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 px-6 rounded-md font-medium inline-block text-center transition-colors">
                            Start Free Trial
                        </a>
                    </div>
                </div>

                <!-- Business Package (Most Popular) -->
                <div class="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-500 rounded-lg p-8 transition-all duration-300 hover:shadow-xl transform scale-105 relative">
                    <div class="absolute top-4 right-4">
                        <span class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Most Popular
                        </span>
                    </div>
                    <div class="text-center pb-6">
                        <h3 class="text-2xl font-bold text-slate-900 mb-2">Business</h3>
                        <p class="text-slate-600">Ideal for growing businesses with multiple programs</p>
                    </div>
                    <div class="text-center pb-8">
                        <div class="mb-6">
                            <span class="text-5xl font-bold text-slate-900">$69</span>
                            <span class="text-slate-600">/month</span>
                        </div>
                        <ul class="text-left space-y-3 mb-8">
                            <li class="flex items-center text-slate-700">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                5,000 passes/month
                            </li>
                            <li class="flex items-center text-slate-700">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                10 programs
                            </li>
                            <li class="flex items-center text-slate-700">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                5 staff accounts
                            </li>
                            <li class="flex items-center text-slate-700">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                API access
                            </li>
                            <li class="flex items-center text-slate-700">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                Priority support
                            </li>
                        </ul>
                        <a href="/auth/sign-up?type=business" class="w-full btn-gradient text-white py-3 px-6 rounded-md font-medium inline-block text-center">
                            Start Free Trial
                        </a>
                    </div>
                </div>

                <!-- Pro Package -->
                <div class="bg-white border-2 border-slate-200 hover:border-blue-200 rounded-lg p-8 transition-all duration-300 hover:shadow-xl">
                    <div class="text-center pb-6">
                        <h3 class="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
                        <p class="text-slate-600">Full-featured solution for enterprise businesses</p>
                    </div>
                    <div class="text-center pb-8">
                        <div class="mb-6">
                            <span class="text-5xl font-bold text-slate-900">$97</span>
                            <span class="text-slate-600">/month</span>
                        </div>
                        <ul class="text-left space-y-3 mb-8">
                            <li class="flex items-center text-slate-700">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                10,000 passes/month
                            </li>
                            <li class="flex items-center text-slate-700">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                20 programs
                            </li>
                            <li class="flex items-center text-slate-700">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                Unlimited staff accounts
                            </li>
                            <li class="flex items-center text-slate-700">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                SMTP configuration
                            </li>
                        </ul>
                        <a href="/auth/sign-up?type=business" class="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 px-6 rounded-md font-medium inline-block text-center transition-colors">
                            Start Free Trial
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- FAQs -->
    <section class="py-20 bg-slate-50">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                    FAQs
                </h2>
            </div>

            <div class="space-y-8">
                <div class="bg-white border-2 border-slate-200 hover:border-blue-200 transition-all duration-300 rounded-lg p-6">
                    <h3 class="text-xl font-bold text-slate-900 mb-4">Do my customers need to download an app?</h3>
                    <p class="text-slate-700 leading-relaxed">No. They add your card to Apple Wallet in one tap.</p>
                </div>

                <div class="bg-white border-2 border-slate-200 hover:border-blue-200 transition-all duration-300 rounded-lg p-6">
                    <h3 class="text-xl font-bold text-slate-900 mb-4">Is this SMS?</h3>
                    <p class="text-slate-700 leading-relaxed">No. It's Wallet push — updates that appear on the Lock Screen through Apple Wallet. No carrier rules or per-text fees.</p>
                </div>

                <div class="bg-white border-2 border-slate-200 hover:border-blue-200 transition-all duration-300 rounded-lg p-6">
                    <h3 class="text-xl font-bold text-slate-900 mb-4">What about Android?</h3>
                    <p class="text-slate-700 leading-relaxed">Today is Apple Wallet. Ask us about our Google Wallet timeline.</p>
                </div>

                <div class="bg-white border-2 border-slate-200 hover:border-blue-200 transition-all duration-300 rounded-lg p-6">
                    <h3 class="text-xl font-bold text-slate-900 mb-4">Can I change the offer anytime?</h3>
                    <p class="text-slate-700 leading-relaxed">Yes. Edit the card, press update, your customers see it immediately.</p>
                </div>

                <div class="bg-white border-2 border-slate-200 hover:border-blue-200 transition-all duration-300 rounded-lg p-6">
                    <h3 class="text-xl font-bold text-slate-900 mb-4">How do customers join?</h3>
                    <p class="text-slate-700 leading-relaxed">Share a link or QR code at checkout, in email, on your site, or on social.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Final CTA -->
    <section class="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to ditch SMS fees?
            </h2>
            <p class="text-xl text-blue-100 mb-12 leading-relaxed">
                Join thousands of businesses using Apple Wallet to reach customers on the Lock Screen.
            </p>
            <div class="flex flex-col sm:flex-row gap-6 justify-center">
                <a href="/auth/sign-up?type=business" class="btn-gradient text-white text-lg px-12 py-6 rounded-xl shadow-2xl inline-block font-medium">
                    Start Free Trial
                </a>
                <a href="/auth/login" class="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-6 rounded-xl backdrop-blur-sm inline-block font-medium transition-all">
                    Sign In
                </a>
            </div>
            <p class="text-blue-200 mt-8 text-sm">
                No setup fees • No per-message costs • Cancel anytime
            </p>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center">
                <div class="flex items-center justify-center mb-6">
                    <img src="/images/walletpush-logo.png" alt="WalletPush" class="h-16 w-auto opacity-80">
                </div>
                <p class="text-slate-400 mb-8 max-w-2xl mx-auto">
                    The modern way to reach customers. No SMS fees, no carrier drama, no app required.
                </p>
                <div class="flex justify-center space-x-8 mb-8">
                    <a href="/auth/login" class="text-slate-400 hover:text-white transition-colors">Sign In</a>
                    <a href="/auth/sign-up" class="text-slate-400 hover:text-white transition-colors">Sign Up</a>
                    <a href="#" class="text-slate-400 hover:text-white transition-colors">Support</a>
                    <a href="#" class="text-slate-400 hover:text-white transition-colors">Privacy</a>
                </div>
                <div class="text-sm text-slate-500">
                    © 2025 WalletPush. All rights reserved.
                </div>
            </div>
        </div>
    </footer>
</body>
</html>`

    // Set headers for HTML download
    const headers = new Headers()
    headers.set('Content-Type', 'text/html')
    headers.set('Content-Disposition', 'attachment; filename="walletpush-main-page.html"')

    console.log('✅ Successfully exported main page as HTML')

    return new Response(staticHtml, { headers })

  } catch (error) {
    console.error('❌ Export HTML API error:', error)
    return NextResponse.json({ error: 'Failed to export HTML' }, { status: 500 })
  }
}
