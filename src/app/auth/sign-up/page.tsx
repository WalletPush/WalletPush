import { AuthLayout } from '@/components/auth/auth-layout'
import { ModernSignUpForm } from '@/components/auth/modern-signup-form'

export default function Page() {
  return (
    <AuthLayout>
      <ModernSignUpForm />
    </AuthLayout>
  )
}
