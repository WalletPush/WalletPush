'use client'

import React, { useState } from 'react';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client'

interface DashboardHeaderProps {
  businessLogo?: string;
  businessName?: string;
  programName?: string;
  tagline?: string;
  user?: {
    email?: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
      full_name?: string;
    };
  };
  member?: {
    profile_photo_url?: string;
    first_name?: string;
    last_name?: string;
  };
}

export function DashboardHeader({ 
  businessLogo, 
  businessName, 
  programName, 
  tagline, 
  user,
  member 
}: DashboardHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/customer/auth/login'
  };

  // Determine user display info
  const displayName = member?.first_name && member?.last_name 
    ? `${member.first_name} ${member.last_name}`
    : user?.user_metadata?.full_name 
    || (user?.user_metadata?.first_name && user?.user_metadata?.last_name 
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
        : user?.email?.split('@')[0] || 'Member');

  const profileImage = member?.profile_photo_url || user?.user_metadata?.avatar_url;

  return (
    <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Left Side - Business Logo & Program Info */}
          <div className="flex items-center gap-4">
            {businessLogo ? (
              <img 
                src={businessLogo} 
                alt={businessName || 'Business Logo'} 
                className="h-12 w-auto max-w-[120px] object-contain"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {(businessName || programName || 'B')[0].toUpperCase()}
                </span>
              </div>
            )}
            
          </div>

          {/* Right Side - User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-all duration-300 group"
            >
              {/* Profile Picture */}
              <div className="relative">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-400/30 group-hover:ring-emerald-400/60 transition-all duration-300 shadow-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center ring-2 ring-emerald-400/30 group-hover:ring-emerald-400/60 transition-all duration-300 shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {displayName[0].toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Online status indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500/100 border-2 border-gray-900 rounded-full shadow-lg"></div>
              </div>

              {/* User Info (hidden on mobile) - Two lines, no email */}
              <div className="hidden lg:block text-left min-w-0">
                <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-tight">
                  {member?.first_name || user?.user_metadata?.first_name || displayName.split(' ')[0] || 'Member'}
                </div>
                <div className="text-sm font-medium text-blue-300 group-hover:text-blue-200 transition-colors leading-tight">
                  {member?.last_name || user?.user_metadata?.last_name || displayName.split(' ')[1] || ''}
                </div>
              </div>

              {/* Dropdown arrow */}
              <svg 
                className={`w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-all duration-300 ${showProfileMenu ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-64 bg-black/95 backdrop-blur-md border border-emerald-400/20 rounded-2xl shadow-2xl py-3 z-50">
                {/* User Info Section */}
                <div className="px-5 py-4 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt={displayName}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-400/40"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center ring-2 ring-emerald-400/40">
                        <span className="text-white font-bold text-lg">
                          {displayName[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-white text-lg leading-tight">{member?.first_name || displayName.split(' ')[0] || 'Member'}</div>
                      <div className="font-semibold text-blue-300 text-lg leading-tight">{member?.last_name || displayName.split(' ')[1] || ''}</div>
                      <div className="text-xs text-emerald-400 mt-1 font-medium">Premium Member</div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button 
                    className="w-full px-5 py-3 text-left text-white hover:text-white hover:bg-emerald-500/10 transition-all duration-200 flex items-center gap-3 rounded-xl mx-2"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <UserCircleIcon className="w-5 h-5 text-emerald-400" />
                    <span className="font-medium">Edit Profile</span>
                  </button>
                  
                  <button 
                    className="w-full px-5 py-3 text-left text-white hover:text-white hover:bg-blue-500/100/10 transition-all duration-200 flex items-center gap-3 rounded-xl mx-2"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Cog6ToothIcon className="w-5 h-5 text-blue-400" />
                    <span className="font-medium">Settings</span>
                  </button>
                  
                  <div className="border-t border-white/10 my-3 mx-2"></div>
                  
                  <button 
                    onClick={handleSignOut}
                    className="w-full px-5 py-3 text-left text-red-400 hover:text-red-300 hover:bg-red-500/100/10 transition-all duration-200 flex items-center gap-3 rounded-xl mx-2"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileMenu(false)}
        ></div>
      )}
    </header>
  );
}
