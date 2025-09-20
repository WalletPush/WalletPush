'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useBranding } from '@/lib/branding'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Mail, ArrowRight } from 'lucide-react'

interface ModernSignUpSuccessProps {
  className?: string
}

export function ModernSignUpSuccess({ className }: ModernSignUpSuccessProps) {
  const { branding } = useBranding()

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
          Welcome to {branding.companyName}!
        </h1>
        <p className="mt-2" style={{ color: '#C6C8CC' }}>
          Your account has been created successfully
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
              <h2 className="text-xl font-semibold">Account created successfully!</h2>
              <p className="text-muted-foreground">
                We've sent a confirmation email to verify your account
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="text-sm font-medium text-blue-900">Check your email</h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Click the verification link in your email to activate your account and start using {branding.companyName}.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Didn't receive the email? Check your spam folder or contact support if you need help.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                asChild
                className="w-full h-12 text-white font-semibold transition-all duration-200 hover:shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
              >
                <Link href="/auth/login">
                  Continue to login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full"
              >
                <Link href="/">
                  Back to homepage
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs" style={{ color: '#C6C8CC' }}>
          Need help?{' '}
          <Link
            href="/support"
            className="font-medium hover:underline text-white"
          >
            Contact support
          </Link>
        </p>
      </div>
    </div>
  )
}
