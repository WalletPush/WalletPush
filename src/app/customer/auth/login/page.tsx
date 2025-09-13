import { AuthLayout } from '@/components/auth/auth-layout'
import { CustomerLoginForm } from '@/components/auth/customer-login-form'

export default function CustomerLoginPage() {
  return (
    <AuthLayout>
      <CustomerLoginForm />
    </AuthLayout>
  )
}
