'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBranding } from '@/lib/branding'

export function CompleteAccountForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [customerName, setCustomerName] = useState('')
  const router = useRouter()
  const { branding } = useBranding()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get pre-filled email from URL parameters
    const prefillEmail = searchParams?.get('email') || ''
    const firstName = searchParams?.get('firstName') || ''
    const lastName = searchParams?.get('lastName') || ''
    
    if (prefillEmail) setEmail(prefillEmail)
    if (firstName || lastName) {
      setCustomerName(`${firstName} ${lastName}`.trim())
    }
  }, [searchParams])

  const handleCompleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!email) {
        setError('Email is required')
        return
      }
      if (!password) {
        setError('Please create a password')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      // Call our complete account API
      const response = await fetch('/api/customer/complete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to complete account setup')
        return
      }

      // Account completed successfully, now sign them in
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Account created but sign-in failed. Please try logging in.')
        return
      }

      if (data.user) {
        // Redirect to customer dashboard
        // If we're on a custom domain, stay on the same domain
        const currentHost = window.location.hostname
        if (currentHost !== 'localhost' && currentHost !== '127.0.0.1' && !currentHost.includes('walletpush.io')) {
          // We're on a custom domain, redirect within the same domain
          window.location.href = '/customer/dashboard'
        } else {
          // Default routing
          router.push('/customer/dashboard')
          router.refresh()
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Complete account error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
        {/* Logo */}
        {branding?.logoUrl && (
          <div className="flex justify-center mb-6">
            <img 
              src={branding.logoUrl} 
              alt={branding.companyName || 'Logo'} 
              className="h-12 w-auto"
            />
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Your Account
          </h1>
          <p className="text-[#C6C8CC]">
            {customerName ? `Welcome ${customerName}! ` : ''}Create your password to access your {branding?.companyName || 'member'} dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Complete Account Form */}
        <form onSubmit={handleCompleteAccount} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/70 cursor-not-allowed"
              placeholder="Your email address"
            />
            <p className="text-xs text-[#C6C8CC] mt-1">This email is already associated with your pass</p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              Create Your Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[#C6C8CC] focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
              placeholder="Create a secure password"
            />
            <p className="text-xs text-[#C6C8CC] mt-1">At least 6 characters</p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-white mb-2">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[#C6C8CC] focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0 rounded-lg text-white font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Setting Up Account...' : 'Complete Account Setup'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#C6C8CC]">
            Already have an account?{' '}
            <a href="/customer/auth/login" className="text-white hover:underline">
              Sign in instead
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
