import { Suspense } from 'react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { ModernUpdatePasswordForm } from '@/components/auth/modern-update-password-form'

export default function BusinessUpdatePasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
        <ModernUpdatePasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
