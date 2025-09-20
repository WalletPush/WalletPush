'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBranding } from '@/lib/branding'

export default function CustomerDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { branding } = useBranding()

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    
    getUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#2E3748] to-[#1a1f2e] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#2E3748] to-[#1a1f2e]">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome to {branding?.companyName || 'Your Account'}
              </h1>
              <p className="text-[#C6C8CC]">
                {user?.email}
              </p>
            </div>
            {branding?.logoUrl && (
              <img 
                src={branding.logoUrl} 
                alt={branding.companyName || 'Logo'} 
                className="h-12 w-auto"
              />
            )}
          </div>

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* My Passes */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">My Passes</h3>
              <p className="text-[#C6C8CC] mb-4">View and manage your digital wallet passes</p>
              <button className="w-full py-2 px-4 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 border border-white/30 rounded-lg text-white font-medium transition-all duration-200">
                View Passes
              </button>
            </div>

            {/* Rewards */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Rewards</h3>
              <p className="text-[#C6C8CC] mb-4">Check your points and available rewards</p>
              <button className="w-full py-2 px-4 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 border border-white/30 rounded-lg text-white font-medium transition-all duration-200">
                View Rewards
              </button>
            </div>

            {/* Profile */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Profile</h3>
              <p className="text-[#C6C8CC] mb-4">Update your account information</p>
              <button className="w-full py-2 px-4 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 border border-white/30 rounded-lg text-white font-medium transition-all duration-200">
                Edit Profile
              </button>
            </div>
          </div>

          {/* Sign Out */}
          <div className="mt-8 text-center">
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                window.location.href = '/customer/auth/login'
              }}
              className="text-[#C6C8CC] hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
