'use client'

import TemplateManager from '@/components/templates/template-manager'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function TemplateManagerPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link 
                href="/" 
                className="flex items-center text-slate-600 hover:text-slate-900 transition-colors mr-6"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Main Page
              </Link>
              <div className="flex items-center">
                <Image 
                  src="/images/walletpush-logo.png" 
                  alt="WalletPush" 
                  width={160}
                  height={40}
                  className="h-10 w-auto mr-3"
                />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Template Manager</h1>
                  <p className="text-sm text-slate-600">Save and export your beautiful sales page</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <TemplateManager />
      </div>
    </div>
  )
}
