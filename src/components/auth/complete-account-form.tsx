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

      const supabase = createClient()

      // TEMPORARILY DISABLED: Check if user already has a session (from customer signup)
      // This logic was causing immediate redirects before users could set passwords
      // TODO: Re-enable this with proper validation that password is actually set
      // const { data: { user: currentUser } } = await supabase.auth.getUser()
      // 
      // if (currentUser && currentUser.email === email) {
      //   // User already exists and has active session - just update their password
      //   const { error: updateError } = await supabase.auth.updateUser({
      //     password: password
      //   })
      //   
      //   if (updateError) {
      //     setError(`Failed to set password: ${updateError.message}`)
      //     return
      //   }
      //   
      //   // Password successfully set, redirect to dashboard
      //   redirectToDashboard()
      //   return
      // }

      // If no existing session, try sign-up (new user flow)
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password })

      if (!signUpErr) {
        // If email confirmations are OFF, you'll get a live session here
        if (signUpData.session) {
          redirectToDashboard()
          return
        }
        // If still no session, confirmation is probably ON
        setError('Account created. Please check your email to verify before signing in.')
        return
      }

      // If user already exists, attempt sign-in
      const msg = (signUpErr?.message || '').toLowerCase()
      if (msg.includes('already') || msg.includes('registered') || msg.includes('user exists')) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signInErr) {
          const em = (signInErr.message || '').toLowerCase()
          if (em.includes('email not confirmed') || em.includes('email_confirm')) {
            setError('Please verify your email before signing in.')
            return
          }
          setError('This email already has an account. Try signing in or reset your password.')
          return
        }
        if (signInData.session) {
          redirectToDashboard()
          return
        }
      }

      // 3) Any other failure
      setError(signUpErr.message || 'Unable to complete account setup.')
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
