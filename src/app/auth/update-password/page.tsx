import { Suspense } from 'react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { ModernUpdatePasswordForm } from '@/components/auth/modern-update-password-form'

export default function Page() {
  return (
    <AuthLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <ModernUpdatePasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
