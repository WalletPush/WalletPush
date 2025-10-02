import { AuthLayout } from '@/components/auth/auth-layout'

export default function AgencyAuthErrorPage() {
  return (
    <AuthLayout>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
            <p className="text-gray-300">There was a problem with your authentication request.</p>
          </div>
          
          <div className="space-y-4">
            <a
              href="/agency/auth/login"
              className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 rounded-lg text-white font-semibold transition-all duration-200 hover:shadow-lg"
            >
              Back to Login
            </a>
            <a
              href="/agency/auth/sign-up"
              className="block w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white font-semibold hover:bg-white/20 transition-all duration-200"
            >
              Create Account
            </a>
          </div>
        </div>
    </AuthLayout>
  )
}
