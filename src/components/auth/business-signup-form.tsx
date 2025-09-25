'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBranding } from '@/lib/branding'

export function BusinessSignUpForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { branding } = useBranding()

  useEffect(() => {
    const packageId = searchParams.get('package')
    if (packageId) {
      loadPackageInfo(packageId)
    }
  }, [searchParams])

  const loadPackageInfo = async (packageId: string) => {
    try {
      const response = await fetch('/api/public/agency-packages')
      const result = await response.json()
      
      if (result.success && result.packages) {
        const pkg = result.packages.find((p: any) => p.id === packageId)
        if (pkg) {
          setSelectedPackage(pkg)
        }
      }
    } catch (error) {
      console.error('Error loading package info:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            business_name: formData.businessName,
            user_type: 'business',
            selected_package: selectedPackage ? {
              package_id: selectedPackage.id,
              package_name: selectedPackage.name,
              package_price: selectedPackage.price,
              pass_limit: selectedPackage.passLimit,
              program_limit: selectedPackage.programLimit,
              staff_limit: selectedPackage.staffLimit
            } : null
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.user) {
        console.log('✅ User created successfully, now provisioning business account...')
        
        // Provision the business account
        try {
          const provisionResponse = await fetch('/api/business/provision', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          const provisionResult = await provisionResponse.json()

          if (!provisionResponse.ok) {
            console.error('❌ Business provision failed:', provisionResult)
            setError(`Account created but setup failed: ${provisionResult.error}`)
            return
          }

          console.log('✅ Business account provisioned successfully:', provisionResult)
          
          // Redirect to login page with success message
          router.push('/business/auth/login?message=Account created successfully! You can now sign in to access your dashboard.')
          
        } catch (provisionError) {
          console.error('❌ Error during business provisioning:', provisionError)
          setError('Account created but setup failed. Please contact support.')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Sign up error:', err)
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
            {selectedPackage ? 'Start Your Free Trial' : 'Request Business Access'}
          </h1>
          <p className="text-[#C6C8CC]">
            {selectedPackage ? 'Create your account and get started today' : 'Apply for a business dashboard account'}
          </p>
        </div>

        {/* Selected Package Display */}
        {selectedPackage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-400/30 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-2">{selectedPackage.name} Plan</h3>
              <div className="text-2xl font-bold text-white mb-2">
                ${selectedPackage.price}<span className="text-sm font-normal">/month</span>
              </div>
              <p className="text-blue-200 text-sm mb-3">{selectedPackage.description}</p>
              <div className="text-xs text-blue-200">
                ✓ 14-day free trial • ✓ No setup fees • ✓ Cancel anytime
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-white mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[#C6C8CC] focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-white mb-2">
              Business Name
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              value={formData.businessName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[#C6C8CC] focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
              placeholder="Enter your business name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Business Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[#C6C8CC] focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
              placeholder="Enter your business email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[#C6C8CC] focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
              placeholder="Create a password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[#C6C8CC] focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 border border-white/30 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : selectedPackage ? 'Start Free Trial' : 'Request Access'}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center">
          <div className="text-[#C6C8CC] text-sm">
            Already have access?{' '}
            <a
              href="/business/auth/login"
              className="text-white hover:underline"
            >
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
