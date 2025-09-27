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

  // Prefill from URL
  useEffect(() => {
    const prefillEmail = searchParams?.get('email') || ''
    const firstName = searchParams?.get('firstName') || ''
    const lastName = searchParams?.get('lastName') || ''
    if (prefillEmail) setEmail(prefillEmail)
    if (firstName || lastName) setCustomerName(`${firstName} ${lastName}`.trim())
  }, [searchParams])

  // Note: Removed auto-redirect guard to ensure users can set their password
  // even if they have an active session from the signup process

  const redirectToDashboard = () => {
    const businessId = searchParams?.get('businessId')
    const dashboardUrl = businessId ? `/customer/dashboard?businessId=${businessId}` : '/customer/dashboard'
    
    const host = window.location.hostname
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.includes('walletpush.io')) {
      window.location.href = dashboardUrl
    } else {
      router.replace(dashboardUrl)
      router.refresh()
    }
  }

  const handleCompleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!email) return setError('Email is required')
      if (!password) return setError('Please create a password')
      if (password.length < 6) return setError('Password must be at least 6 characters')
      if (password !== confirmPassword) return setError('Passwords do not match')

      // Use our dedicated server-side API for account completion
      console.log('🔄 Calling complete-account API for:', email)
      
      const response = await fetch('/api/customer/complete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        }),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('❌ Complete account API error:', result)
        setError(result.error || 'Failed to complete account setup')
        return
      }

      console.log('✅ Customer verified:', result)
      
      // Customer verified, now create auth user with client-side auth
      const supabase = createClient()
      console.log('🔄 Creating auth user with client-side Supabase auth')
      console.log('🔍 Supabase client config:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
      })
      
      // Test basic Supabase connectivity
      try {
        console.log('🔍 Testing Supabase connectivity...')
        const { data: testData, error: testError } = await supabase.auth.getSession()
        console.log('🔍 Supabase connection test:', { 
          hasSession: !!testData.session, 
          error: testError?.message 
        })
      } catch (connectError) {
        console.error('❌ Supabase connection test failed:', connectError)
        setError('Cannot connect to authentication service. Please check your internet connection.')
        return
      }
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            first_name: result.customer?.first_name,
            last_name: result.customer?.last_name,
            role: 'customer',
            customer_id: result.customer?.id
          }
        }
      })

      if (signUpError) {
        console.error('❌ Client-side auth signup failed:', signUpError)
        console.error('❌ Full signup error:', JSON.stringify(signUpError, null, 2))
        
        // If user already exists, try to sign in
        if (signUpError.message?.includes('already') || signUpError.message?.includes('exists')) {
          console.log('🔄 User exists, trying sign in instead')
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
          })
          
          if (signInError) {
            console.error('❌ Sign in failed:', signInError)
            setError(`Sign in failed: ${signInError.message}`)
            return
          }
          
          if (signInData.session) {
            console.log('✅ Signed in successfully')
            redirectToDashboard()
            return
          }
        }
        
        setError(`Auth creation failed: ${signUpError.message}`)
        return
      }

      if (signUpData.session) {
        console.log('✅ Auth user created and signed in successfully')
        redirectToDashboard()
        return
      }

      console.log('⚠️ Auth user created but no session - trying sign in')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (signInError) {
        console.error('❌ Sign in after signup failed:', signInError)
        setError('Account created but sign in failed. Please try signing in manually.')
        return
      }

      if (signInData.session) {
        console.log('✅ Signed in successfully after signup')
        redirectToDashboard()
        return
      }

      setError('Account created but session not established. Please try signing in manually.')
    } catch (err: any) {
      console.error('Complete account error:', err)
      setError(err?.message ?? 'An unexpected error occurred')
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
            <img src={branding.logoUrl} alt={branding.companyName || 'Logo'} className="h-12 w-auto" />
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Account</h1>
          <p className="text-[#C6C8CC]">
            {customerName ? `Welcome ${customerName}! ` : ''}
            Create your password to access your {branding?.companyName || 'member'} dashboard
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
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
