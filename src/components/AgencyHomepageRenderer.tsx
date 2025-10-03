'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AgencyHomepageRendererProps {
  homepage: {
    html: string
    content_model?: any
    agency_account_id?: string
    pageData?: {
      agency_account_id: string
      content_model?: any
    }
  }
}

export default function AgencyHomepageRenderer({ homepage }: AgencyHomepageRendererProps) {
  const [processedHtml, setProcessedHtml] = useState(homepage.html)
  const [agencyData, setAgencyData] = useState<any>(null)
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgencyData()
  }, [homepage.agency_account_id, homepage.pageData?.agency_account_id])

  const loadAgencyData = async () => {
    try {
      const supabase = createClient()
      
      // Get the agency account ID from either direct property or pageData
      const agencyAccountId = homepage.agency_account_id || homepage.pageData?.agency_account_id
      
      if (!agencyAccountId) {
        console.error('❌ No agency account ID found in homepage data')
        setLoading(false)
        return
      }

      console.log('🏢 Loading data for agency:', agencyAccountId)
      
      // Get agency account details
      const { data: agencyAccount } = await supabase
        .from('agency_accounts')
        .select('logo_url, name, custom_domain')
        .eq('id', agencyAccountId)
        .single()

      // Get agency packages
      const { data: agencyPackages } = await supabase
        .from('agency_packages')
        .select('*')
        .eq('agency_account_id', agencyAccountId)
        .eq('is_active', true)
        .order('display_order')

      setAgencyData(agencyAccount)
      setPackages(agencyPackages || [])
      
      // Process the HTML with agency-specific data
      processHtml(agencyAccount, agencyPackages || [])
      
    } catch (error) {
      console.error('Error loading agency data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processHtml = (agencyAccount: any, agencyPackages: any[]) => {
    let html = homepage.html
    console.log('🔄 Processing agency homepage with:', { agencyAccount, packagesCount: agencyPackages.length })

    // Replace logo with agency-specific logo
    if (agencyAccount?.logo_url) {
      console.log('🖼️ Replacing logo with:', agencyAccount.logo_url)
      // Try multiple patterns to match the logo
      html = html.replace(
        /<img[^>]*src="[^"]*logo\.png"[^>]*alt="[^"]*"[^>]*>/gi,
        `<img src="${agencyAccount.logo_url}" alt="${agencyAccount.name || 'Agency'}" class="h-14 w-auto object-contain" style="width:175px;height:56px" />`
      )
      html = html.replace(
        /<img[^>]*src="[^"]*placeholder-logo\.png"[^>]*alt="[^"]*"[^>]*>/gi,
        `<img src="${agencyAccount.logo_url}" alt="${agencyAccount.name || 'Agency'}" class="h-14 w-auto object-contain" style="width:175px;height:56px" />`
      )
      // Also try to replace any img with logo.png
      html = html.replace(
        /<img[^>]*src="[^"]*\/images\/logo\.png"[^>]*>/gi,
        `<img src="${agencyAccount.logo_url}" alt="${agencyAccount.name || 'Agency'}" class="h-14 w-auto object-contain" style="width:175px;height:56px" />`
      )
    }

    // Replace pricing section with agency packages
    if (agencyPackages.length > 0) {
      console.log('💰 Replacing pricing with agency packages:', agencyPackages)
      const pricingHTML = generatePricingHTML(agencyPackages)
      // Try multiple patterns to match the pricing placeholder
      html = html.replace(
        /<div class="text-center py-20"><div class="text-white text-lg">Pricing will be customized based on your agency packages<\/div><\/div>/g,
        pricingHTML
      )
      html = html.replace(
        /<div class="text-center py-20"><div class="text-white text-lg">Pricing will be tailored to your specific business requirements<\/div><\/div>/g,
        pricingHTML
      )
      // Also try a more generic pattern
      html = html.replace(
        /<div class="text-center py-20">[\s\S]*?<div class="text-white text-lg">[^<]*<\/div>[\s\S]*?<\/div>/g,
        pricingHTML
      )
    }

    // Replace content model placeholders with actual content
    const contentModel = homepage.content_model || homepage.pageData?.content_model
    if (contentModel) {

      // Replace header content
      if (contentModel.header) {
        // Replace navigation labels
        if (contentModel.header.nav) {
          contentModel.header.nav.forEach((navItem: any, index: number) => {
            const regex = new RegExp(`data-wp-bind="header\\.nav\\[${index}\\]\\.label"[^>]*>([^<]+)<`, 'g')
            html = html.replace(regex, `data-wp-bind="header.nav[${index}].label">${navItem.label}<`)
          })
        }

        // Replace CTA label
        if (contentModel.header.cta?.label) {
          html = html.replace(
            /data-wp-bind="header\.cta\.label"[^>]*>([^<]+)</g,
            `data-wp-bind="header.cta.label">${contentModel.header.cta.label}<`
          )
        }
      }

      // Replace pricing content
      if (contentModel.pricing) {
        if (contentModel.pricing.title) {
          html = html.replace(
            /data-wp-bind="pricing\.title"[^>]*>([^<]+)</g,
            `data-wp-bind="pricing.title">${contentModel.pricing.title}<`
          )
        }
        if (contentModel.pricing.subtitle) {
          html = html.replace(
            /data-wp-bind="pricing\.subtitle"[^>]*>([^<]+)</g,
            `data-wp-bind="pricing.subtitle">${contentModel.pricing.subtitle}<`
          )
        }
        if (contentModel.pricing.footer) {
          html = html.replace(
            /data-wp-bind="pricing\.footer"[^>]*>([^<]+)</g,
            `data-wp-bind="pricing.footer">${contentModel.pricing.footer}<`
          )
        }
      }

      // Replace footer content
      if (contentModel.footer) {
        if (contentModel.footer.company?.name) {
          html = html.replace(
            /data-wp-bind="footer\.company\.name"[^>]*>([^<]+)</g,
            `data-wp-bind="footer.company.name">${contentModel.footer.company.name}<`
          )
        }
        if (contentModel.footer.company?.description) {
          html = html.replace(
            /data-wp-bind="footer\.company\.description"[^>]*>([^<]+)</g,
            `data-wp-bind="footer.company.description">${contentModel.footer.company.description}<`
          )
        }
        if (contentModel.footer.copyright) {
          html = html.replace(
            /data-wp-bind="footer\.copyright"[^>]*>([^<]+)</g,
            `data-wp-bind="footer.copyright">${contentModel.footer.copyright}<`
          )
        }
      }
    }

    console.log('✅ Processing complete:', {
      agencyAccount: agencyAccount?.name,
      logoUrl: agencyAccount?.logo_url,
      packagesCount: agencyPackages.length,
      contentModelKeys: Object.keys(contentModel || {}),
      htmlLength: html.length
    })
    
    setProcessedHtml(html)
  }

  const generatePricingHTML = (packages: any[]) => {
    return `
      <div class="grid grid-cols-1 md:grid-cols-${Math.min(packages.length, 3)} gap-8 max-w-6xl mx-auto">
        ${packages.map((pkg, index) => `
          <div class="relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 ${index === 1 ? 'transform scale-105 border-yellow-400' : ''}">
            ${index === 1 ? '<div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">Most Popular</div>' : ''}
            <div class="text-center">
              <h3 class="text-2xl font-bold text-white mb-4">${pkg.package_name}</h3>
              <div class="text-4xl font-bold text-white mb-2">$${pkg.monthly_price}<span class="text-lg font-normal text-white/80">/month</span></div>
              <p class="text-white/80 mb-6">${pkg.package_description}</p>
              <ul class="text-left space-y-3 mb-8">
                <li class="flex items-center text-white/90"><span class="text-green-400 mr-3">✓</span>${pkg.pass_limit.toLocaleString()} passes per month</li>
                <li class="flex items-center text-white/90"><span class="text-green-400 mr-3">✓</span>${pkg.program_limit} program${pkg.program_limit > 1 ? 's' : ''}</li>
                <li class="flex items-center text-white/90"><span class="text-green-400 mr-3">✓</span>${pkg.staff_limit} staff member${pkg.staff_limit > 1 ? 's' : ''}</li>
                ${pkg.features?.customBranding ? '<li class="flex items-center text-white/90"><span class="text-green-400 mr-3">✓</span>Custom Branding</li>' : ''}
                ${pkg.features?.apiAccess ? '<li class="flex items-center text-white/90"><span class="text-green-400 mr-3">✓</span>API Access</li>' : ''}
                ${pkg.features?.prioritySupport ? '<li class="flex items-center text-white/90"><span class="text-green-400 mr-3">✓</span>Priority Support</li>' : ''}
              </ul>
              <button class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105">
                Get Started
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading agency homepage...</p>
        </div>
      </div>
    )
  }

  console.log('🎨 Rendering agency homepage with processed HTML length:', processedHtml.length)
  console.log('🎨 Contains Blue Karma:', processedHtml.includes('Blue Karma'))
  console.log('🎨 Contains Starter package:', processedHtml.includes('Starter'))

  return (
    <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
  )
}
