/*
  One-time snapshot script
  - Fetches https://walletpush.io
  - Inlines external CSS into <style> tags for preview stability
  - Generates a slotted html_static by replacing likely header/pricing/footer regions with <div data-wp-slot>
  - Inserts (or upserts) a default row into public.agency_sales_pages with is_default=true

  Usage:
    SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... pnpm tsx scripts/snapshot-default.ts
*/

import * as cheerio from 'cheerio'
import path from 'node:path'
import { URL } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const ORIGIN = 'https://walletpush.io'

function abs(base: string, href: string) {
  try { return new URL(href, base).toString() } catch { return href }
}

async function inlineCss(html: string, base: string) {
  const $ = cheerio.load(html, { decodeEntities: false })
  const links = $('link[rel="stylesheet"][href]')
  for (const el of links.toArray()) {
    const href = $(el).attr('href')!
    const cssUrl = abs(base, href)
    const res = await fetch(cssUrl)
    const css = await res.text()
    const cssBase = new URL(cssUrl).origin + path.dirname(new URL(cssUrl).pathname) + '/'
    const fixed = css.replace(/url\((['"]?)(\/??[^)'"]+)\1\)/g, (_m, q, p) => `url(${q}${abs(cssBase, p)}${q})`)
    $(el).replaceWith(`<style>${fixed}</style>`)
  }
  if ($('head base').length === 0) {
    $('head').prepend(`<base href="${ORIGIN}/">`)
  }
  return $.html()
}

function makeSlottedHtml(html: string) {
  const $ = cheerio.load(html, { decodeEntities: false })
  // Heuristics – non-destructive if not found
  $('[data-site-header], header, .site-header').first().replaceWith('<div data-wp-slot="header"></div>')
  $('[data-site-pricing], #pricing, section.pricing').first().replaceWith('<div data-wp-slot="pricing"></div>')
  $('[data-site-footer], footer, .site-footer').last().replaceWith('<div data-wp-slot="footer"></div>')
  return $.html()
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY envs')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  console.log('📸 Creating beautiful default WalletPush homepage...')
  
  // Create a beautiful static HTML template instead of scraping the dynamic one
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WalletPush - Modern Wallet Membership & Loyalty Platform</title>
    <meta name="description" content="Create and manage Apple Wallet and Google Wallet membership, loyalty, and store card programs for your business.">
    <link rel="shortcut icon" href="/images/favicon.ico">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #1e293b; 
            background: #f8fafc;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Header */
        .header { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem 0; }
        .nav { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.5rem; font-weight: 700; color: #2563eb; }
        .nav-links { display: flex; gap: 2rem; list-style: none; }
        .nav-links a { text-decoration: none; color: #64748b; font-weight: 500; }
        .nav-links a:hover { color: #2563eb; }
        .cta-button { 
            background: linear-gradient(135deg, #2563eb, #7c3aed); 
            color: white; 
            padding: 0.75rem 1.5rem; 
            border-radius: 0.5rem; 
            text-decoration: none; 
            font-weight: 600;
            transition: transform 0.2s;
        }
        .cta-button:hover { transform: translateY(-1px); }
        
        /* Hero Section */
        .hero { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 100px 0; 
            text-align: center; 
        }
        .hero h1 { 
            font-size: 3.5rem; 
            font-weight: 700; 
            margin-bottom: 1.5rem; 
            line-height: 1.1;
        }
        .hero p { 
            font-size: 1.25rem; 
            margin-bottom: 2rem; 
            opacity: 0.9; 
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        .hero-cta { 
            background: #ff6b6b; 
            color: white; 
            padding: 1rem 2rem; 
            border-radius: 50px; 
            text-decoration: none; 
            font-weight: 600; 
            font-size: 1.1rem;
            display: inline-block;
            transition: all 0.3s;
        }
        .hero-cta:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
        }
        
        /* Features Section */
        .features { padding: 100px 0; background: white; }
        .features h2 { 
            text-align: center; 
            font-size: 2.5rem; 
            margin-bottom: 3rem; 
            color: #1e293b;
        }
        .feature-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
            gap: 3rem; 
        }
        .feature-card { 
            background: #f8fafc; 
            padding: 2.5rem; 
            border-radius: 1rem; 
            text-align: center;
            border: 1px solid #e2e8f0;
            transition: all 0.3s;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .feature-icon { 
            font-size: 3rem; 
            margin-bottom: 1.5rem; 
            display: block;
        }
        .feature-card h3 { 
            font-size: 1.5rem; 
            margin-bottom: 1rem; 
            color: #2563eb; 
        }
        .feature-card p {
            color: #64748b;
            line-height: 1.6;
        }
        
        /* Stats Section */
        .stats { 
            background: linear-gradient(135deg, #2563eb, #7c3aed); 
            color: white; 
            padding: 80px 0; 
            text-align: center; 
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 2rem; 
        }
        .stat-item h3 { 
            font-size: 3rem; 
            font-weight: 700; 
            margin-bottom: 0.5rem; 
        }
        .stat-item p { 
            font-size: 1.1rem; 
            opacity: 0.9; 
        }
        
        /* CTA Section */
        .cta-section { 
            background: #1e293b; 
            color: white; 
            padding: 100px 0; 
            text-align: center; 
        }
        .cta-section h2 { 
            font-size: 2.5rem; 
            margin-bottom: 1rem; 
        }
        .cta-section p { 
            font-size: 1.2rem; 
            margin-bottom: 2rem; 
            opacity: 0.8; 
        }
        
        /* Footer */
        .footer { 
            background: #0f172a; 
            color: #94a3b8; 
            padding: 60px 0 30px; 
        }
        .footer-content { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 2rem; 
            margin-bottom: 2rem; 
        }
        .footer h4 { 
            color: white; 
            margin-bottom: 1rem; 
            font-size: 1.1rem; 
        }
        .footer ul { 
            list-style: none; 
        }
        .footer ul li { 
            margin-bottom: 0.5rem; 
        }
        .footer ul li a { 
            color: #94a3b8; 
            text-decoration: none; 
        }
        .footer ul li a:hover { 
            color: white; 
        }
        .footer-bottom { 
            border-top: 1px solid #334155; 
            padding-top: 2rem; 
            text-align: center; 
        }
        
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .hero p { font-size: 1.1rem; }
            .feature-grid { grid-template-columns: 1fr; }
            .nav-links { display: none; }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <nav class="nav">
                <div class="logo">WalletPush</div>
                <ul class="nav-links">
                    <li><a href="#features">Features</a></li>
                    <li><a href="#pricing">Pricing</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
                <a href="#get-started" class="cta-button">Get Started</a>
            </nav>
        </div>
    </header>

    <section class="hero">
        <div class="container">
            <h1>Transform Your Business with Digital Wallet Technology</h1>
            <p>Create engaging Apple Wallet and Google Wallet membership, loyalty, and store card programs that drive customer retention and boost revenue.</p>
            <a href="#get-started" class="hero-cta">Start Your Free Trial</a>
        </div>
    </section>

    <section class="features" id="features">
        <div class="container">
            <h2>Why Choose WalletPush?</h2>
            <div class="feature-grid">
                <div class="feature-card">
                    <span class="feature-icon">🎯</span>
                    <h3>Expert Strategy</h3>
                    <p>Our team of digital marketing experts will craft the perfect loyalty program strategy tailored to your business goals and customer needs.</p>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">🚀</span>
                    <h3>Fast Implementation</h3>
                    <p>Get your digital wallet program up and running in days, not months, with our streamlined setup process and intuitive dashboard.</p>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">📈</span>
                    <h3>Proven Results</h3>
                    <p>Our clients see an average 40% increase in customer retention and 25% boost in repeat purchases within the first 90 days.</p>
                </div>
            </div>
        </div>
    </section>

    <section class="stats">
        <div class="container">
            <div class="stats-grid">
                <div class="stat-item">
                    <h3>10M+</h3>
                    <p>Wallet Passes Created</p>
                </div>
                <div class="stat-item">
                    <h3>500+</h3>
                    <p>Happy Businesses</p>
                </div>
                <div class="stat-item">
                    <h3>40%</h3>
                    <p>Average Retention Increase</p>
                </div>
                <div class="stat-item">
                    <h3>99.9%</h3>
                    <p>Uptime Guarantee</p>
                </div>
            </div>
        </div>
    </section>

    <section class="cta-section" id="get-started">
        <div class="container">
            <h2>Ready to Transform Your Customer Experience?</h2>
            <p>Join hundreds of businesses already using WalletPush to drive customer loyalty and increase revenue.</p>
            <a href="#contact" class="hero-cta">Start Your Free Trial Today</a>
        </div>
    </section>

    <footer class="footer" id="contact">
        <div class="container">
            <div class="footer-content">
                <div>
                    <h4>WalletPush</h4>
                    <p>The modern platform for creating Apple Wallet and Google Wallet membership, loyalty, and store card programs.</p>
                </div>
                <div>
                    <h4>Product</h4>
                    <ul>
                        <li><a href="#">Features</a></li>
                        <li><a href="#">Pricing</a></li>
                        <li><a href="#">API Documentation</a></li>
                        <li><a href="#">Integrations</a></li>
                    </ul>
                </div>
                <div>
                    <h4>Company</h4>
                    <ul>
                        <li><a href="#">About Us</a></li>
                        <li><a href="#">Blog</a></li>
                        <li><a href="#">Careers</a></li>
                        <li><a href="#">Contact</a></li>
                    </ul>
                </div>
                <div>
                    <h4>Support</h4>
                    <ul>
                        <li><a href="#">Help Center</a></li>
                        <li><a href="#">Community</a></li>
                        <li><a href="#">Status</a></li>
                        <li><a href="#">Security</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 WalletPush. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`
  
  let html_full_preview = html // Already has inline CSS, no scripts to remove
  const html_static = makeSlottedHtml(html_full_preview)

  const content_model = {
    header: { nav: [{ label: 'Home' }, { label: 'Pricing' }], cta: { label: 'Get Started' } },
    pricing: { title: 'Simple pricing', subtitle: '', footer: '' },
    footer: { company: { name: 'WalletPush', description: '' }, links: [], copyright: '© WalletPush' }
  }

  // Update existing default row if present; otherwise insert
  const { data: existingDefault, error: fetchErr } = await supabase
    .from('agency_sales_pages')
    .select('id')
    .eq('is_default', true)
    .single()

  if (fetchErr == null && existingDefault) {
    const { error: updErr } = await supabase
      .from('agency_sales_pages')
      .update({
        page_name: 'DEFAULT',
        page_type: 'home',
        page_slug: 'home',
        page_title: 'WalletPush — Loyalty & Wallet Passes',
        headline: 'Turn customers into loyal members',
        call_to_action: 'Get Started',
        is_published: true,
        html_full_preview,
        html_static,
        content_model,
        assets_base: ORIGIN
      })
      .eq('id', existingDefault.id)
    if (updErr) throw updErr
    console.log('✅ Updated default preview row successfully')
  } else {
    const { error: insErr } = await supabase.from('agency_sales_pages').insert({
      is_default: true,
      page_name: 'DEFAULT',
      page_type: 'home',
      page_slug: 'home',
      page_title: 'WalletPush — Loyalty & Wallet Passes',
      headline: 'Turn customers into loyal members',
      call_to_action: 'Get Started',
      is_published: true,
      html_full_preview,
      html_static,
      content_model,
      assets_base: ORIGIN
    })
    if (insErr) throw insErr
    console.log('✅ Inserted default preview row successfully')
  }
}

main().catch((e) => {
  console.error('❌ Snapshot failed:', e)
  process.exit(1)
})


