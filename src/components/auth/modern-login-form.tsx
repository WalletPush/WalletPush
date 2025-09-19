'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useBranding } from '@/lib/branding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'

interface ModernLoginFormProps {
  className?: string
  redirectTo?: string
}

export function ModernLoginForm({ className, redirectTo = '/business/dashboard' }: ModernLoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const { branding } = useBranding()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fallback branding for SSR
  const safeBranding = isMounted ? branding : {
    logo_url: '/images/walletpush-logo.png',
    company_name: 'WalletPush',
    welcome_message: 'Welcome to WalletPush',
    tagline: 'Digital Wallet Solutions'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      console.log('✅ User logged in successfully!')
      router.push(redirectTo)
      router.refresh()
    } catch (error: unknown) {
      console.error('❌ Login error:', error)
      setError(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Logo and Branding */}
      <div className="text-center mb-8">
        {safeBranding.logo_url && (
          <div className="mb-6">
            <Image
              src={safeBranding.logo_url}
              alt={`${safeBranding.company_name} Logo`}
              width={120}
              height={120}
              className="mx-auto h-16 w-auto object-contain"
              priority
            />
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {safeBranding.welcome_message}
        </h1>
        {safeBranding.tagline && (
          <p className="mt-2" style={{ color: '#C6C8CC' }}>
            {safeBranding.tagline}
          </p>
        )}
      </div>

      {/* Login Card */}
      <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-md border border-white/20">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl font-semibold text-center text-white">
            Sign in to your account
          </CardTitle>
          <CardDescription className="text-center" style={{ color: '#C6C8CC' }}>
            Enter your email and password to access your dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-[#C6C8CC] focus:border-white/40 focus:ring-white/20"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-[#C6C8CC] focus:border-white/40 focus:ring-white/20"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium hover:underline transition-colors"
                style={{ color: '#C6C8CC' }}
              >
                Forgot your password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-12 text-white font-semibold transition-all duration-200 hover:shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: '#C6C8CC' }}>
              Don't have an account?{' '}
              <Link
                href="/auth/sign-up"
                className="font-medium hover:underline transition-colors text-white"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
