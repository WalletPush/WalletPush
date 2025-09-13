import { AuthLayout } from '@/components/auth/auth-layout'
import { ModernLoginForm } from '@/components/auth/modern-login-form'

export default function Page() {
  return (
    <AuthLayout>
      <ModernLoginForm />
    </AuthLayout>
  )
}
