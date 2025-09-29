import type { Metadata } from 'next'
import './globals.css'
import '@/components/member-dashboard/wp-themes.css'
import { BrandingProvider } from '@/lib/branding'

export const metadata: Metadata = {
  title: 'WalletPush - Modern Wallet Membership & Loyalty Platform',
  description: 'Create and manage Apple Wallet and Google Wallet membership, loyalty, and store card programs for your business.',
  icons: {
    icon: '/images/favicon.ico',
    shortcut: '/images/favicon.ico',
    apple: '/images/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="font-inter">
      <body className="font-inter antialiased">
        <BrandingProvider>
          {children}
        </BrandingProvider>
      </body>
    </html>
  )
}
