'use client'

import { useBranding } from '@/lib/branding'

interface AuthLayoutProps {
  children: React.ReactNode
  className?: string
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  const { branding } = useBranding()

  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 ${className}`}
      style={{
        background: `linear-gradient(135deg, #1a1f2e 0%, #2E3748 50%, #1a1f2e 100%)`,
      }}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 animate-pulse"
             style={{ 
               background: `radial-gradient(circle, ${branding.primary_color}40 0%, transparent 70%)` 
             }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-15 animate-pulse delay-1000"
             style={{ 
               background: `radial-gradient(circle, ${branding.secondary_color || '#4F46E5'}30 0%, transparent 70%)` 
             }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 animate-pulse delay-500"
             style={{ 
               background: `radial-gradient(circle, ${branding.primary_color}20 0%, transparent 70%)` 
             }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5"
             style={{
               backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
               backgroundSize: '20px 20px'
             }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-white/20 animate-pulse" />
      <div className="absolute top-20 right-20 w-3 h-3 rounded-full bg-white/15 animate-pulse delay-1000" />
      <div className="absolute bottom-20 left-20 w-1.5 h-1.5 rounded-full bg-white/25 animate-pulse delay-500" />
      <div className="absolute top-1/3 right-10 w-1 h-1 rounded-full bg-white/30 animate-pulse delay-2000" />
      <div className="absolute bottom-1/3 left-10 w-2.5 h-2.5 rounded-full bg-white/10 animate-pulse delay-1500" />
    </div>
  )
}
