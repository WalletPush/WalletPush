'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useBranding } from '@/lib/branding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, Lock, CheckCircle, Check } from 'lucide-react'

interface ModernUpdatePasswordFormProps {
  className?: string
}

export function ModernUpdatePasswordForm({ className }: ModernUpdatePasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { branding } = useBranding()

  useEffect(() => {
    // Check if we have the required tokens from the URL
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (!accessToken || !refreshToken) {
      setError('Invalid or expired reset link. Please request a new password reset.')
      return
    }

    // Set the session with the tokens
    const supabase = createClient()
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })
  }, [searchParams])

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    return Math.min(strength, 100)
  }

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 25) return '#ef4444'
    if (strength < 50) return '#f97316'
    if (strength < 75) return '#eab308'
    return '#22c55e'
  }

  const getPasswordStrengthText = (strength: number): string => {
    if (strength < 25) return 'Weak'
    if (strength < 50) return 'Fair'
    if (strength < 75) return 'Good'
    return 'Strong'
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordStrength(calculatePasswordStrength(value))
  }

  const validateForm = (): string | null => {
    if (!password) return 'Password is required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (password !== confirmPassword) return 'Passwords do not match'
    return null
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setIsSuccess(true)
      console.log('✅ Password updated successfully!')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (error: unknown) {
      console.error('❌ Password update error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          {branding.logo_url && (
            <div className="mb-6">
              <Image
                src={branding.logo_url}
                alt={`${branding.company_name} Logo`}
                width={120}
                height={120}
                className="mx-auto h-16 w-auto object-contain"
                priority
              />
            </div>
          )}
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Password updated!
        </h1>
        <p className="mt-2" style={{ color: '#C6C8CC' }}>
          Your password has been successfully changed
        </p>
        </div>

      {/* Success Card */}
      <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-md border border-white/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Password updated successfully!</h2>
                <p className="text-muted-foreground">
                  You can now sign in with your new password
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                Redirecting to login page in 3 seconds...
              </p>

              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full text-white font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
              >
                Continue to login
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    )
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Logo and Branding */}
      <div className="text-center mb-8">
        {branding.logo_url && (
          <div className="mb-6">
            <Image
              src={branding.logo_url}
              alt={`${branding.company_name} Logo`}
              width={120}
              height={120}
              className="mx-auto h-16 w-auto object-contain"
              priority
            />
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Set new password
        </h1>
        <p className="mt-2" style={{ color: '#C6C8CC' }}>
          Choose a strong password for your account
        </p>
      </div>

      {/* Update Password Card */}
      <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-md border border-white/20">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl font-semibold text-center text-white">
            Update your password
          </CardTitle>
          <CardDescription className="text-center" style={{ color: '#C6C8CC' }}>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
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
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength</span>
                    <span 
                      className="font-medium"
                      style={{ color: getPasswordStrengthColor(passwordStrength) }}
                    >
                      {getPasswordStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${passwordStrength}%`,
                        backgroundColor: getPasswordStrengthColor(passwordStrength)
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-white">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-[#C6C8CC] focus:border-white/40 focus:ring-white/20"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="flex items-center text-xs">
                  {password === confirmPassword ? (
                    <>
                      <Check className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-600">Passwords match</span>
                    </>
                  ) : (
                    <span className="text-red-500">Passwords do not match</span>
                  )}
                </div>
              )}
            </div>

            {/* Update Button */}
            <Button
              type="submit"
              className="w-full h-12 text-white font-semibold transition-all duration-200 hover:shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  )
}
