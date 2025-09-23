'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  ChartBarIcon, 
  BuildingOfficeIcon, 
  KeyIcon, 
  UserGroupIcon,
  CogIcon,
  SparklesIcon,
  UserIcon
} from '@heroicons/react/24/outline'

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Don't show sidebar for auth routes
  if (pathname.startsWith('/agency/auth/')) {
    return <>{children}</>
  }
  
  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div className="p-6">
          <div className="flex items-center justify-center mb-8">
            <Image src="/images/walletpush-logo.png" alt="WalletPush" width={160} height={40} className="h-10 w-auto" />
          </div>
          
          <nav className="space-y-2">
            <Link href="/agency/dashboard" className={`sidebar-item ${pathname === '/agency/dashboard' ? 'active' : ''}`}>
              <ChartBarIcon className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            
            <Link href="/agency/saas-configurator" className={`sidebar-item ${pathname === '/agency/saas-configurator' ? 'active' : ''}`}>
              <CogIcon className="w-5 h-5" />
              <span>SAAS Configurator</span>
            </Link>

            <Link href="/agency/sales-page-designer" className={`sidebar-item ${pathname === '/agency/sales-page-designer' ? 'active' : ''}`}>
              <SparklesIcon className="w-5 h-5" />
              <span>Sales Page Designer</span>
            </Link>

            <Link href="/agency/businesses" className={`sidebar-item ${pathname === '/agency/businesses' ? 'active' : ''}`}>
              <BuildingOfficeIcon className="w-5 h-5" />
              <span>Businesses</span>
            </Link>

            <Link href="/agency/pass-type-ids" className={`sidebar-item ${pathname === '/agency/pass-type-ids' ? 'active' : ''}`}>
              <KeyIcon className="w-5 h-5" />
              <span>Pass Type IDs</span>
            </Link>

            <Link href="/agency/analytics" className={`sidebar-item ${pathname === '/agency/analytics' ? 'active' : ''}`}>
              <ChartBarIcon className="w-5 h-5" />
              <span>Analytics</span>
            </Link>

            <div className="pt-6 mt-6 border-t border-slate-700">
              <Link href="/agency/settings" className={`sidebar-item ${pathname === '/agency/settings' ? 'active' : ''}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </Link>
              
              <Link href="/agency/profile" className={`sidebar-item ${pathname === '/agency/profile' ? 'active' : ''}`}>
                <UserIcon className="w-5 h-5" />
                <span>My Profile</span>
              </Link>
            </div>
          </nav>
        </div>
      </aside>
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  )
}
