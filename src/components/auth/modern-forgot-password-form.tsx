'use client'

import { useState } from 'react'
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
import { Loader2, Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react'

interface ModernForgotPasswordFormProps {
  className?: string
}

export function ModernForgotPasswordForm({ className }: ModernForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const router = useRouter()
  const { branding } = useBranding()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) throw error

      setIsEmailSent(true)
      console.log('✅ Password reset email sent successfully!')
    } catch (error: unknown) {
      console.error('❌ Password reset error:', error)
      setError(error instanceof Error ? error.message : 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/auth/login')
  }

  if (isEmailSent) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          {branding.logoUrl && (
            <div className="mb-6">
              <Image
                src={branding.logoUrl}
                alt={`${branding.companyName} Logo`}
                width={120}
                height={120}
                className="mx-auto h-16 w-auto object-contain"
                priority
              />
            </div>
          )}
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Check your email
        </h1>
        <p className="mt-2" style={{ color: '#C6C8CC' }}>
          We've sent password reset instructions
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
                <h2 className="text-xl font-semibold">Email sent successfully!</h2>
                <p className="text-muted-foreground">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Click the link in the email to reset your password. The link will expire in 1 hour.
                </p>
                <p>
                  Didn't receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => setIsEmailSent(false)}
                    className="font-medium hover:underline"
                    style={{ color: branding.primaryColor }}
                  >
                    try again
                  </button>
                </p>
              </div>

              <Button
                onClick={handleBackToLogin}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
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
        {branding.logoUrl && (
          <div className="mb-6">
            <Image
              src={branding.logoUrl}
              alt={`${branding.companyName} Logo`}
              width={120}
              height={120}
              className="mx-auto h-16 w-auto object-contain"
              priority
            />
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Forgot your password?
        </h1>
        <p className="mt-2" style={{ color: '#C6C8CC' }}>
          No worries! Enter your email and we'll send you reset instructions
        </p>
      </div>

      {/* Forgot Password Card */}
      <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-md border border-white/20">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl font-semibold text-center text-white">
            Reset your password
          </CardTitle>
          <CardDescription className="text-center" style={{ color: '#C6C8CC' }}>
            Enter the email address associated with your account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-6">
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
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-[#C6C8CC] focus:border-white/40 focus:ring-white/20"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Reset Button */}
            <Button
              type="submit"
              className="w-full h-12 text-white font-semibold transition-all duration-200 hover:shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset email...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send reset instructions
                </>
              )}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={handleBackToLogin}
              className="text-sm font-medium hover:underline"
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
