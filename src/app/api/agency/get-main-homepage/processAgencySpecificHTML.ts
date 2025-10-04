// Extracted processAgencySpecificHTML function for reuse
import { createClient } from '@supabase/supabase-js'

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
      .select('logo_url, name')
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
      const pricingHTML = generatePricingHTML(packages)
      
      // 🚀 FIX DUPLICATE PRICING: Only replace the main pricing grid, not multiple sections
      // First try to replace just the pricing grid within a section
      const gridReplaced = html.replace(
        /<div class="grid grid-cols-1 md:grid-cols-[23] gap-8[^>]*>[\s\S]*?<\/div>/gi,
        pricingHTML
      )
      
      // If the grid replacement worked, use that
      if (gridReplaced !== html) {
        html = gridReplaced
        console.log('✅ Replaced pricing grid within existing section')
      } else {
        // Otherwise, replace the entire pricing section (fallback)
        html = html.replace(
          /<section[^>]*id="pricing[^"]*"[^>]*>[\s\S]*?<\/section>/gi,
          `<section id="pricing-section" class="relative z-10 py-32 px-6 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
            <div class="container mx-auto">
              <div class="text-center mb-16">
                <h2 class="text-5xl font-bold text-white mb-6">Simple, Transparent Pricing</h2>
                <p class="text-xl text-white max-w-3xl mx-auto">Choose the plan that fits your business. No hidden fees, no long-term contracts.</p>
              </div>
              ${pricingHTML}
            </div>
          </section>`
        )
        console.log('✅ Replaced entire pricing section as fallback')
      }
    }
    
    console.log('✅ Processed agency-specific HTML')
    return html
    
  } catch (error) {
    console.error('❌ Error processing agency-specific HTML:', error)
    return html // Return original HTML if processing fails
  }
}

function generatePricingHTML(packages: any[]) {
  return `
    <div class="grid grid-cols-1 md:grid-cols-${Math.min(packages.length, 3)} gap-8 max-w-6xl mx-auto">
      ${packages.map((pkg, index) => `
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
              <button class="inline-flex items-center justify-center whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow hover:bg-primary/90 h-9 px-4 w-full py-3 rounded-full font-semibold ${index === 1 ? 'bg-white text-blue-600 hover:bg-gray-100 font-bold' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'}">Start Free Trial</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `
}
