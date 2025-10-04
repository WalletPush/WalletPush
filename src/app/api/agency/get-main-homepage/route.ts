import { NextRequest, NextResponse } from 'next/server'
import { processAgencySpecificHTML } from './processAgencySpecificHTML'


export async function GET(request: NextRequest) {
  try {
    console.log('🏠 Generating main homepage HTML...')
    
    // Get agency account ID from query params
    const { searchParams } = new URL(request.url)
    const agencyAccountId = searchParams.get('agency_account_id')
    
    // Fetch the actual main homepage from WalletPush (not the current domain to avoid loops)
    const walletpushUrl = 'https://walletpush.io'
    
    console.log('🌐 Fetching main homepage from WalletPush:', walletpushUrl)
    const homepageResponse = await fetch(walletpushUrl, {
      headers: {
        'User-Agent': 'WalletPush-Agency-Homepage'
      }
    })
    
    if (!homepageResponse.ok) {
      throw new Error(`Failed to fetch main homepage: ${homepageResponse.status}`)
    }
    
    let html = await homepageResponse.text()
    console.log('✅ Fetched homepage HTML, length:', html.length)
    
    // Clean up the HTML to remove dynamic components that cause hydration issues
    console.log('🧹 Cleaning up dynamic components...')
    
    // Replace DynamicLogo with slot marker
    html = html.replace(
      /<div class="h-14 w-auto object-contain" style="width:175px;height:56px"><\/div>/g,
      `<!-- WP:DYNAMIC-START header -->
<header data-wp-component="Header" data-wp-slot="header">
  <img src="/placeholder-logo.png" alt="Logo" class="h-14 w-auto object-contain" style="width:175px;height:56px" />
  <nav class="hidden md:flex space-x-8">
    <a href="#" data-wp-bind="header.nav[0].label" class="text-white hover:text-blue-300">Home</a>
    <a href="#" data-wp-bind="header.nav[1].label" class="text-white hover:text-blue-300">Features</a>
    <a href="#" data-wp-bind="header.nav[2].label" class="text-white hover:text-blue-300">Pricing</a>
    <a href="#" data-wp-bind="header.cta.label" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Get Started</a>
  </nav>
</header>
<!-- WP:DYNAMIC-END header -->`
    )
    
    // Replace pricing section with slot marker
    html = html.replace(
      /<section[^>]*id="pricing-section"[^>]*>[\s\S]*?<\/section>/gi,
      `<!-- WP:DYNAMIC-START pricing -->
<section id="pricing-section" data-wp-component="PricingTable" data-wp-slot="pricing" class="relative z-10 py-32 px-6 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
  <div class="container mx-auto">
    <div class="text-center mb-16">
      <h2 data-wp-bind="pricing.title" class="text-5xl font-bold text-white mb-6">Simple, Transparent Pricing</h2>
      <p data-wp-bind="pricing.subtitle" class="text-xl text-white max-w-3xl mx-auto">Choose the plan that fits your business. No hidden fees, no long-term contracts.</p>
    </div>
    <div class="text-center py-20">
      <div class="text-white text-lg">Pricing will be customized based on your agency packages</div>
    </div>
    <div class="text-center mt-12">
      <p data-wp-bind="pricing.footer" class="text-white mb-4">All plans include 14-day free trial • No setup fees • Cancel anytime</p>
    </div>
  </div>
</section>
<!-- WP:DYNAMIC-END pricing -->`
    )
    
    // Add footer slot marker
    html = html.replace(
      /<footer[^>]*>[\s\S]*?<\/footer>/gi,
      `<!-- WP:DYNAMIC-START footer -->
<footer data-wp-component="Footer" data-wp-slot="footer" class="bg-gray-900 text-white py-12">
  <div class="container mx-auto px-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <h3 data-wp-bind="footer.company.name" class="text-lg font-semibold mb-4">WalletPush</h3>
        <p data-wp-bind="footer.company.description" class="text-gray-400">Digital wallet solutions for modern businesses.</p>
      </div>
      <div>
        <h4 data-wp-bind="footer.links[0].title" class="font-semibold mb-4">Product</h4>
        <ul class="space-y-2">
          <li><a href="#" data-wp-bind="footer.links[0].items[0]" class="text-gray-400 hover:text-white">Features</a></li>
          <li><a href="#" data-wp-bind="footer.links[0].items[1]" class="text-gray-400 hover:text-white">Pricing</a></li>
        </ul>
      </div>
      <div>
        <h4 data-wp-bind="footer.links[1].title" class="font-semibold mb-4">Support</h4>
        <ul class="space-y-2">
          <li><a href="#" data-wp-bind="footer.links[1].items[0]" class="text-gray-400 hover:text-white">Help Center</a></li>
          <li><a href="#" data-wp-bind="footer.links[1].items[1]" class="text-gray-400 hover:text-white">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 data-wp-bind="footer.links[2].title" class="font-semibold mb-4">Legal</h4>
        <ul class="space-y-2">
          <li><a href="#" data-wp-bind="footer.links[2].items[0]" class="text-gray-400 hover:text-white">Privacy</a></li>
          <li><a href="#" data-wp-bind="footer.links[2].items[1]" class="text-gray-400 hover:text-white">Terms</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-gray-800 mt-8 pt-8 text-center">
      <p data-wp-bind="footer.copyright" class="text-gray-400">&copy; 2024 WalletPush. All rights reserved.</p>
    </div>
  </div>
</footer>
<!-- WP:DYNAMIC-END footer -->`
    )
    
    // Also remove any div with loading spinners or dynamic content
    html = html.replace(
      /<div[^>]*class="[^"]*animate-spin[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
      ''
    )
    
    // Remove all script tags to prevent hydration issues
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    
    // Remove Next.js specific attributes that cause hydration issues
    html = html.replace(/data-nimg="[^"]*"/g, '')
    html = html.replace(/fetchPriority="[^"]*"/g, '')
    html = html.replace(/decoding="[^"]*"/g, '')
    
    console.log('✅ Cleaned HTML, new length:', html.length)
    
    // Store the original cleaned HTML (dynamic version)
    const originalHtml = html
    
    // Process agency-specific content for preview
    html = await processAgencySpecificHTML(html, agencyAccountId || undefined)
    
    return NextResponse.json({
      success: true,
      html: html, // Processed HTML for preview
      originalHtml: originalHtml // Original HTML for saving
    })
    
  } catch (error) {
    console.error('❌ Error fetching main homepage:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
