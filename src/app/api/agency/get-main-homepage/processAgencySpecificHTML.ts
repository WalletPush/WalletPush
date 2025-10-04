// Extracted processAgencySpecificHTML function for reuse
import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

export async function processAgencySpecificHTML(html: string, agencyAccountId?: string) {
  if (!agencyAccountId) {
    console.log('⚠️ No agency account ID provided, using default content')
    return html
  }

  console.log('🏢 Processing agency-specific content for:', agencyAccountId)
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get agency account details for logo
    const { data: agencyAccount } = await supabase
      .from('agency_accounts')
      .select('logo_url, name, custom_domain')
      .eq('id', agencyAccountId)
      .single()
    
    // Get agency packages for pricing
    const { data: packages } = await supabase
      .from('agency_packages')
      .select('*')
      .eq('agency_account_id', agencyAccountId)
      .eq('is_active', true)
      .order('display_order')
    
    console.log('🏢 Agency data:', { 
      agencyName: agencyAccount?.name,
      logoUrl: agencyAccount?.logo_url,
      customDomain: agencyAccount?.custom_domain,
      packagesCount: packages?.length || 0
    })
    
    // Replace logos with agency-specific logo
    if (agencyAccount?.logo_url) {
      // Multiple patterns to catch different logo formats
      html = html.replace(
        /<img[^>]*src="[^"]*\/images\/logo[^"]*"[^>]*>/gi,
        `<img src="${agencyAccount.logo_url}" alt="${agencyAccount.name || 'Agency'}" class="h-14 w-auto object-contain" style="width:175px;height:56px" />`
      )
      html = html.replace(
        /<img[^>]*src="[^"]*logo[^"]*\.png"[^>]*>/gi,
        `<img src="${agencyAccount.logo_url}" alt="${agencyAccount.name || 'Agency'}" class="h-14 w-auto object-contain" style="width:175px;height:56px" />`
      )
      html = html.replace(
        /<img[^>]*alt="[^"]*Logo[^"]*"[^>]*>/gi,
        `<img src="${agencyAccount.logo_url}" alt="${agencyAccount.name || 'Agency'}" class="h-14 w-auto object-contain" style="width:175px;height:56px" />`
      )
    }
    
    // Replace company name text
    if (agencyAccount?.name) {
      html = html.replace(/WalletPush/g, agencyAccount.name)
    }
    
    // Replace pricing section with agency packages
    if (packages && packages.length > 0) {
      // 🚀 REUSE AGENCY DATA: Use already fetched agency account data for pricing links
      const agencyDomain = agencyAccount?.custom_domain ? `https://${agencyAccount.custom_domain}` : ''
      const agencyName = agencyAccount?.name || ''
      
      console.log('🔗 Pricing URL generation:', {
        customDomain: agencyAccount?.custom_domain,
        agencyDomain,
        agencyName,
        packagesCount: packages.length
      })
      
      const pricingHTML = generatePricingHTML(packages, agencyDomain, agencyName)
      
      // 🚀 SURGICAL FIX: Use Cheerio to target ONLY the pricing section
      try {
        const $ = cheerio.load(html)
        
        // Look for the specific pricing section with ULTRA PRECISE targeting
        // Try multiple patterns based on the actual DOM structure
        let pricingSection = $('#pricing-section')
        
        // If the section itself has the container class
        if (pricingSection.hasClass('container') && pricingSection.hasClass('mx-auto')) {
          console.log('🎯 Found pricing section with container classes on section element')
        } 
        // Or if there's a container div inside the section
        else if (pricingSection.find('.container.mx-auto').length > 0) {
          pricingSection = pricingSection.find('.container.mx-auto').first()
          console.log('🎯 Found pricing section with container div inside')
        }
        // Or try the combined selector
        else {
          pricingSection = $('#pricing-section.container.mx-auto')
          if (pricingSection.length > 0) {
            console.log('🎯 Found pricing section using combined selector')
          }
        }
        
        if (pricingSection.length > 0) {
          // Find the pricing grid within the section and replace it
          const pricingGrid = pricingSection.find('.grid.grid-cols-1.md\\:grid-cols-3.gap-8')
          if (pricingGrid.length > 0) {
            pricingGrid.replaceWith(pricingHTML)
            html = $.html()
            console.log('✅ ULTRA PRECISE: Replaced pricing grid using exact DOM structure targeting')
          } else {
            console.log('⚠️ No pricing grid found within the targeted pricing section')
          }
        } else {
          // Fallback: Look for any section with pricing-related content
          const fallbackSection = $('section').filter((i, el) => {
            const sectionHtml = $(el).html() || ''
            return sectionHtml.includes('pricing') || sectionHtml.includes('Pricing') || 
                   sectionHtml.includes('plans') || sectionHtml.includes('Plans')
          }).first()
          
          if (fallbackSection.length > 0) {
            fallbackSection.replaceWith(`
              <section id="pricing-section" class="relative z-10 py-32 px-6 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
                <div class="container mx-auto">
                  <div class="text-center mb-16">
                    <h2 class="text-5xl font-bold text-white mb-6">Simple, Transparent Pricing</h2>
                    <p class="text-xl text-white max-w-3xl mx-auto">Choose the plan that fits your business. No hidden fees, no long-term contracts.</p>
                  </div>
                  ${pricingHTML}
                </div>
              </section>
            `)
            html = $.html()
            console.log('✅ Replaced pricing section using content-based fallback')
          } else {
            console.log('⚠️ No pricing section found - skipping pricing replacement')
          }
        }
      } catch (cheerioError) {
        console.error('❌ Cheerio parsing failed, skipping pricing replacement:', cheerioError)
      }
    }
    
    // 🚀 CRITICAL FIX: Replace ALL button URLs to point to agency domain
    if (agencyAccountId) {
      try {
        // Get the agency's custom domain
        const { data: agencyAccount } = await supabase
          .from('agency_accounts')
          .select('custom_domain, name')
          .eq('id', agencyAccountId)
          .single()
        
        if (agencyAccount?.custom_domain) {
          const agencyDomain = `https://${agencyAccount.custom_domain}`
          console.log('🔗 Replacing button URLs with agency domain:', agencyDomain)
          
          // Replace all walletpush.io URLs with agency domain
          html = html.replace(/https:\/\/walletpush\.io/g, agencyDomain)
          html = html.replace(/https:\/\/www\.walletpush\.io/g, agencyDomain)
          
          // Replace any relative URLs that should point to agency domain
          html = html.replace(/href="\/business\/auth\/sign-up/g, `href="${agencyDomain}/business/auth/sign-up`)
          html = html.replace(/href="\/auth\/sign-up/g, `href="${agencyDomain}/auth/sign-up`)
          html = html.replace(/href="\/pricing/g, `href="${agencyDomain}/pricing`)
          html = html.replace(/href="\/contact/g, `href="${agencyDomain}/contact`)
          
          console.log('✅ Replaced all button URLs with agency domain')
        } else {
          console.log('⚠️ No custom domain found for agency, keeping original URLs')
        }
      } catch (urlError) {
        console.error('⚠️ Failed to replace URLs with agency domain:', urlError)
      }
    }
    
    // 🚀 ADD SMOOTH SCROLL TO CTA BUTTONS: Make "Get Started" and "Launch Free Trial" buttons scroll to pricing
    html = html.replace(
      /<button([^>]*?)>Get Started Free<\/button>/gi,
      '<button$1 onclick="document.getElementById(\'pricing-section\').scrollIntoView({behavior: \'smooth\'})">Get Started Free</button>'
    )
    
    html = html.replace(
      /<button([^>]*?)>Launch Free Trial([^<]*?)<\/button>/gi,
      '<button$1 onclick="document.getElementById(\'pricing-section\').scrollIntoView({behavior: \'smooth\'})">Launch Free Trial$2</button>'
    )
    
    console.log('✅ Added smooth scroll functionality to CTA buttons')
    console.log('✅ Processed agency-specific HTML')
    return html
    
  } catch (error) {
    console.error('❌ Error processing agency-specific HTML:', error)
    return html // Return original HTML if processing fails
  }
}

function generatePricingHTML(packages: any[], agencyDomain?: string, agencyName?: string) {
  return `
    <div class="grid grid-cols-1 md:grid-cols-${Math.min(packages.length, 3)} gap-8 max-w-6xl mx-auto">
      ${packages.map((pkg, index) => {
        // 🚀 DYNAMIC PRICING LINKS: Create agency-specific signup URL with CORRECT parameter structure
        // Use same format as WalletPush: ?package=UUID (not package_id, plan, agency, price)
        const signupUrl = agencyDomain 
          ? `${agencyDomain}/business/auth/sign-up?package=${pkg.id}`
          : `/business/auth/sign-up?package=${pkg.id}`
        
        console.log(`🎯 Package ${index + 1} URL:`, {
          packageId: pkg.id,
          packageName: pkg.package_name,
          agencyDomain,
          signupUrl
        })
        
        return `
        <div class="p-8 rounded-xl relative bg-white/10 backdrop-blur-lg border border-white/20 ${index === 1 ? 'bg-gradient-to-br from-blue-600 to-purple-600 transform scale-105 border-2 border-yellow-400' : ''}">
          ${index === 1 ? '<div class="absolute -top-4 left-1/2 transform -translate-x-1/2"><div class="bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-bold">MOST POPULAR</div></div>' : ''}
          <div class="text-center text-white">
            <h3 class="text-2xl font-bold mb-4 text-white">${pkg.package_name}</h3>
            <div class="mb-6">
              <span class="text-4xl font-bold text-white">$${pkg.monthly_price}</span>
              <span class="text-white">/month</span>
            </div>
            <p class="text-white mb-8">${pkg.package_description}</p>
          </div>
          <div class="space-y-4 text-white">
            <div class="flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-green-400">
                <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                <path d="m9 11 3 3L22 4"></path>
              </svg>
              <span class="text-white">${pkg.pass_limit?.toLocaleString() || 'Unlimited'} passes per month</span>
            </div>
            <div class="flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-green-400">
                <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                <path d="m9 11 3 3L22 4"></path>
              </svg>
              <span class="text-white">${pkg.program_limit || 'Unlimited'} program${(pkg.program_limit || 0) > 1 ? 's' : ''}</span>
            </div>
            <div class="pt-6">
              <a href="${signupUrl}" class="inline-flex items-center justify-center whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow hover:bg-primary/90 h-9 px-4 w-full py-3 rounded-full font-semibold text-center no-underline ${index === 1 ? 'bg-white text-blue-600 hover:bg-gray-100 font-bold' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'}">Start Free Trial</a>
            </div>
          </div>
        </div>
        `
      }).join('')}
    </div>
  `
}
