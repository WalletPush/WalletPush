'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Injects a dynamic script into landing page HTML to:
 * - Capture form submissions
 * - POST to /api/customer-signup with landing_page_id/template_id
 * - On success, redirect to pass download (mobile) and then to member login
 * The login URL is configured via NEXT_PUBLIC_MEMBER_LOGIN_URL (fallback /customer/auth/login)
 */
function injectWalletPassScript(html: string, context: { landing_page_id?: string; template_id?: string; hostname: string }): string {
  try {
    console.log('🚀 INJECTING SCRIPT with context:', context)
    const memberLoginBase = `https://${context.hostname}/customer/auth/login`
    const script = `\n<script>\nconsole.log('🔥 SCRIPT STARTING TO EXECUTE');\n(function(){\n  try {\n    console.log('🔥 INSIDE TRY BLOCK');\n    const LP_ID = ${JSON.stringify(context.landing_page_id || '')};\n    const TEMPLATE_ID = ${JSON.stringify(context.template_id || '')};\n    const LOGIN_BASE = ${JSON.stringify(memberLoginBase)};\n    console.log('🔥 VARIABLES SET:', { LP_ID, TEMPLATE_ID, LOGIN_BASE });\n    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);\n\n    function injectDeviceHelpers(){\n      try {\n        var deviceMessage = document.getElementById('deviceMessage');\n        var qrContainer = document.getElementById('qrCodeContainer');\n        var formContainer = document.querySelector('.vip-pass-container') || document.querySelector('form')?.parentElement;\n        if (!deviceMessage || !qrContainer || !formContainer) return;\n        var ua = navigator.userAgent;\n        var landingUrl = window.location.href;\n        if (/iPhone|iPad|iPod/i.test(ua)) {\n          deviceMessage.textContent = 'You are on iOS. Complete the form to add your pass to Apple Wallet.';\n          qrContainer.style.display = 'none';\n        } else if (/Android/i.test(ua)) {\n          deviceMessage.innerHTML = 'You are on Android. Install a wallet app if prompted, then complete the form.';\n          qrContainer.style.display = 'none';\n        } else {\n          deviceMessage.textContent = 'You are on desktop. Scan this QR code on your phone to open this page.';\n          if (formContainer) formContainer.style.display = 'none';\n          var qd = document.createElement('div');\n          qd.style.margin = '0 auto';\n          qd.style.textAlign = 'center';\n          qrContainer.appendChild(qd);\n          try {\n            if (window.QRCode) {\n              new window.QRCode(qd, { text: landingUrl, width: 200, height: 200 });\n            } else {\n              var img = new Image();\n              img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(landingUrl);\n              qd.appendChild(img);\n            }\n          } catch (e) { console.error('QR gen failed', e); }\n        }\n      } catch(e) { console.error('device helpers error', e); }\n    }\n\n    function findEmailValue() {\n      const el = document.querySelector('input[name="email"], input[type="email"]');\n      return el ? (el).value || '' : '';\n    }\n\n    async function submitToWalletPush(form) {\n      var button = form.querySelector('button');\n      var note = form.querySelector('.loading-notification');\n      if (!note) {\n        note = document.createElement('div');\n        note.className = 'loading-notification';\n        note.style.display = 'none';\n        if (button && button.parentElement) { button.parentElement.appendChild(note); }\n        else { form.appendChild(note); }\n      }\n      var resetUI = function(){ try { if (button) { button.textContent = 'Join'; button.disabled = false; } if (note) { note.style.display = 'none'; note.textContent = ''; } } catch(_){} };\n      try {\n        if (button) { button.innerHTML = 'Creating Your Pass<span class="loading-dots"></span>'; button.disabled = true; }\n        if (note) { note.textContent = 'Please wait. Pass creation in progress...'; note.style.display = 'block'; }\n\n        const formData = new FormData(form);\n        const payload = {};\n        formData.forEach((v,k)=>{ payload[k] = v; });\n        if (LP_ID) payload["landing_page_id"] = LP_ID;\n        if (!payload["template_id"] && TEMPLATE_ID) payload["template_id"] = TEMPLATE_ID;\n\n        let timeoutHit = false;\n        const guard = setTimeout(function(){ timeoutHit = true; try { alert('Still working... Please stay on this page while we finish creating your pass.'); } catch(_){} }, 12000);\n\n        const res = await fetch('/api/customer-signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });\n        clearTimeout(guard);\n        let data = null;\n        try { data = await res.json(); } catch(_) {}\n        if (!res.ok) {\n          const msg = (data && (data.error || data.message)) ? (data.error || data.message) : ('Signup failed (' + res.status + ')');\n          throw new Error(msg);\n        }\n        if (!data || !data.download_url) { throw new Error('No download URL returned'); }\n\n        const email = findEmailValue();\n        const encodedEmail = encodeURIComponent(email || '');\n        const passUrl = (data.download_url || '').replace('?t=', '.pkpass?t=');\n\n        // Get intelligent redirect URL based on customer account status\n        async function getRedirectUrl() {\n          if (!email) return LOGIN_BASE;\n          try {\n            const statusRes = await fetch('/api/customer/check-account-status?email=' + encodedEmail);\n            if (statusRes.ok) {\n              const statusData = await statusRes.json();\n              return statusData.redirectTo || LOGIN_BASE;\n            }\n          } catch (e) {\n            console.warn('Failed to check account status, using default redirect:', e);\n          }\n          return LOGIN_BASE + (encodedEmail ? ('?email=' + encodedEmail) : '');\n        }\n\n        if (isMobile) {\n          window.location.href = passUrl;\n          setTimeout(async function(){ \n            const redirectUrl = await getRedirectUrl();\n            window.location.href = redirectUrl;\n          }, 8000);\n        } else {\n          try { window.open(data.download_url, '_blank'); } catch(_){}\n          if (note) { note.textContent = "Please wait... We're setting up your account!"; note.style.display = 'block'; }\n          setTimeout(async function(){ \n            const redirectUrl = await getRedirectUrl();\n            window.location.href = redirectUrl;\n          }, 3000);\n        }\n        if (note) { note.style.display = 'none'; }\n        if (button) { button.textContent = 'Pass Created'; }\n      } catch (err) {\n        console.error('WalletPush submit error', err);\n        try { alert(err && err.message ? err.message : 'An error occurred. Please try again.'); } catch(_){}\n        resetUI();\n      }\n    }\n\n    function attachHandlers(){\n      const forms = Array.from(document.querySelectorAll('form'));\n      forms.forEach(form=>{\n        if ((form).dataset.__wpBound === '1') return;\n        (form).dataset.__wpBound = '1';\n        form.addEventListener('submit', async function(e){\n          try {\n            e.preventDefault();\n            await submitToWalletPush(form);\n          } catch(err) { console.error('WalletPush submit error', err); }\n        }, { capture: true });\n      });\n    }\n\n    if (document.readyState === 'loading') {\n      document.addEventListener('DOMContentLoaded', function(){ attachHandlers(); injectDeviceHelpers(); });\n    } else {\n      attachHandlers(); injectDeviceHelpers();\n    }\n\n    // Also observe dynamic content changes\n    const observer = new MutationObserver(()=>attachHandlers());\n    observer.observe(document.documentElement, { childList: true, subtree: true });\n  } catch(e) { console.error('🚨 WalletPush inject error:', e); alert('Script error: ' + e.message); }\n})();\n</script>\n`
    if (html.includes('</body>')) {
      const result = html.replace('</body>', script + '</body>')
      console.log('✅ Script injected before </body> tag')
      return result
    }
    const result = html + script
    console.log('✅ Script appended to end of HTML (no </body> found)')
    return result
  } catch (error) {
    console.error('❌ Script injection failed:', error)
    return html
  }
}

interface Props {
  params: {
    slug: string[]
  }
}

export default function CatchAllLandingPage({ params }: Props) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function loadLandingPage() {
      try {
        console.log('🎯 CATCH-ALL ROUTE IS RUNNING! Slug:', params.slug)
        console.log('🎯 THIS PROVES THE ROUTE IS ACTIVE!')
        console.log('🔍 Catch-all route triggered for slug:', params.slug)
        
        // Reconstruct the full path
        const fullPath = params.slug.join('/')
        console.log('🔍 Looking for landing page with path:', fullPath)
        
        const supabase = createClient()
        
        // Check if this is a landing page by looking for it in the database
        const { data: landingPages, error } = await supabase
          .from('landing_pages')
          .select('*')
          .eq('is_published', true)
          .like('custom_url', `%${fullPath}%`)
          .order('updated_at', { ascending: false })
        
        console.log('🔍 Found landing pages:', landingPages)
        
        if (error) {
          console.error('❌ Error fetching landing pages:', error)
          setError('Database error')
          setLoading(false)
          return
        }
        
        if (!landingPages || landingPages.length === 0) {
          console.log('❌ No landing page found for path:', fullPath)
          setError('Landing page not found')
          setLoading(false)
          return
        }
        
        const landingPage = landingPages[0]
        console.log('✅ Found landing page:', landingPage.name)
        
        // Use the raw HTML content (no script injection needed since we execute directly)
        let htmlContent = landingPage.generated_html || '<p>No content available</p>'
        
        console.log('🔧 Landing page loaded, HTML length:', htmlContent.length)
        console.log('🔧 Landing page context:', {
          landing_page_id: landingPage.id,
          template_id: landingPage.template_id,
          hostname: window.location.hostname
        })
        
        // Set the HTML content
        setHtmlContent(htmlContent)
        setLoading(false)
        
        // EXECUTE THE WALLETPUSH SCRIPT DIRECTLY (React doesn't execute injected scripts)
        setTimeout(() => {
          console.log('🔥 EXECUTING WALLETPUSH SCRIPT DIRECTLY...')
          
          const LP_ID = landingPage.id
          const TEMPLATE_ID = landingPage.template_id
          const LOGIN_BASE = `https://${window.location.hostname}/customer/auth/login`
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
          
          console.log('🔥 WalletPush context:', { LP_ID, TEMPLATE_ID, LOGIN_BASE, isMobile })

          function findEmailValue() {
            const el = document.querySelector('input[name="email"], input[type="email"]') as HTMLInputElement
            return el ? el.value || '' : ''
          }

          async function submitToWalletPush(form: HTMLFormElement) {
            const button = form.querySelector('button') as HTMLButtonElement
            const resetUI = () => {
              try { 
                if (button) { 
                  button.textContent = 'Join Rewards Program Now'
                  button.disabled = false
                } 
              } catch(_){}
            }
            
            try {
              if (button) { 
                button.innerHTML = 'Creating Your Pass<span class="loading-dots"></span>'
                button.disabled = true
              }

              const formData = new FormData(form)
              const payload: Record<string, any> = {}
              formData.forEach((v,k) => { payload[k] = v })
              if (LP_ID) payload["landing_page_id"] = LP_ID
              if (!payload["template_id"] && TEMPLATE_ID) payload["template_id"] = TEMPLATE_ID

              console.log('🔄 Submitting to customer-signup:', payload)

              const res = await fetch('/api/customer-signup', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
              })
              
              const data = await res.json()
              console.log('✅ Customer signup response:', data)

              if (!res.ok) {
                const msg = (data && (data.error || data.message)) ? (data.error || data.message) : ('Signup failed (' + res.status + ')')
                throw new Error(msg)
              }
              if (!data || !data.download_url) { 
                throw new Error('No download URL returned') 
              }

              const email = findEmailValue()
              const encodedEmail = encodeURIComponent(email || '')
              const passUrl = (data.download_url || '').replace('?t=', '.pkpass?t=')

              if (isMobile) {
                console.log('📱 Mobile detected - redirecting to pass download')
                window.location.href = passUrl
                setTimeout(() => { 
                  window.location.href = LOGIN_BASE + (encodedEmail ? ('?email=' + encodedEmail) : '')
                }, 8000)
              } else {
                console.log('💻 Desktop detected - opening pass in new tab')
                try { window.open(data.download_url, '_blank') } catch(_){}
                setTimeout(() => { 
                  window.location.href = LOGIN_BASE + (encodedEmail ? ('?email=' + encodedEmail) : '')
                }, 3000)
              }
              
              if (button) { button.textContent = 'Pass Created!' }
            } catch (err) {
              console.error('❌ WalletPush submit error:', err)
              alert(err && err.message ? err.message : 'An error occurred. Please try again.')
              resetUI()
            }
          }

          // Attach form handlers
          const forms = document.querySelectorAll('form')
          console.log('🔥 Found forms:', forms.length)
          
          forms.forEach((form, index) => {
            console.log('🔥 Attaching WalletPush handler to form', index)
            form.addEventListener('submit', async (e) => {
              try {
                e.preventDefault()
                await submitToWalletPush(form as HTMLFormElement)
              } catch(err) { 
                console.error('WalletPush submit error', err) 
              }
            })
          })
        }, 100) // Small delay to ensure DOM is updated
        
      } catch (err) {
        console.error('❌ Error loading landing page:', err)
        setError('Failed to load landing page')
        setLoading(false)
      }
    }
    
    loadLandingPage()
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading landing page...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Path: {params.slug.join('/')}</p>
          <a href="/" className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Go to Homepage
          </a>
        </div>
      </div>
    )
  }

  // Render the landing page HTML
  return (
    <div 
      className="landing-page-container"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}
