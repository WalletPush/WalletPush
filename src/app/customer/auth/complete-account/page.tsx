import { AuthLayout } from '@/components/auth/auth-layout'
import { CompleteAccountForm } from '@/components/auth/complete-account-form'
import { Suspense } from 'react'

export default function CompleteAccountPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div />}> 
        <CompleteAccountForm />
      </Suspense>
    </AuthLayout>
  )
}
