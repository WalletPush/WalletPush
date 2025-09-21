'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBranding } from '@/lib/branding'

export function CustomerLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'create'>('login')
  const router = useRouter()
  const { branding } = useBranding()
  const searchParams = useSearchParams()

  useEffect(() => {
    const prefill = searchParams?.get('email') || ''
    if (prefill) setEmail(prefill)
    const m = searchParams?.get('mode')
    if (m === 'create') setMode('create')
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        // If the user likely doesn't exist, offer account creation
        setError(signInError.message)
        setMode('create')
        return
      }

      if (data.user) {
        // For customers, redirect to their dashboard
        router.push('/customer/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      if (!email) {
        setError('Email is required')
        return
      }
      if (!password) {
        setError('Please set a password')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // If email confirmation is disabled, user may be signed in immediately
      if (data.user) {
        router.push('/customer/dashboard')
        router.refresh()
        return
      }

      // Otherwise, show success message and switch to login mode
      setMode('login')
      setError('Account created. Please check your email to verify, then sign in.')
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Signup error:', err)
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
            Welcome Back
          </h1>
          <p className="text-[#C6C8CC]">
            Sign in to your {branding?.companyName || 'account'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Auth Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[#C6C8CC] focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[#C6C8CC] focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 rounded-lg text-white font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('create')}
                className="text-[#C6C8CC] hover:text-white text-sm"
              >
                Create your account
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateAccount} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[#C6C8CC] focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-white mb-2">
                Set Password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[#C6C8CC] focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                placeholder="Create a password"
              />
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
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#C6C8CC] hover:text-white text-sm"
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          {mode === 'login' && (
            <a
              href="/customer/auth/forgot-password"
              className="text-[#C6C8CC] hover:text-white text-sm transition-colors"
            >
              Forgot your password?
            </a>
          )}
          <div className="text-[#C6C8CC] text-sm">
            Don't have an account?{' '}
            {mode === 'login' ? (
              <button onClick={() => setMode('create')} className="text-white hover:underline">
                Create one
              </button>
            ) : (
              <button onClick={() => setMode('login')} className="text-white hover:underline">
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
