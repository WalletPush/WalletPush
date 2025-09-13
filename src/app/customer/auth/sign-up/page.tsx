import { AuthLayout } from '@/components/auth/auth-layout'
import { CustomerSignUpForm } from '@/components/auth/customer-signup-form'

export default function CustomerSignUpPage() {
  return (
    <AuthLayout>
      <CustomerSignUpForm />
    </AuthLayout>
  )
}
