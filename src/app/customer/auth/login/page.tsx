import { AuthLayout } from '@/components/auth/auth-layout'
import { CustomerLoginForm } from '@/components/auth/customer-login-form'
import { Suspense } from 'react'

export default function CustomerLoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div />}> 
        <CustomerLoginForm />
      </Suspense>
    </AuthLayout>
  )
}
