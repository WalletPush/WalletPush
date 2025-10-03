'use client'

import React, { useState, useEffect } from 'react'
import { 
  SparklesIcon,
  EyeIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'
import { mergeFromEditedHtml, getDefaultContentModel } from '@/lib/mergeFromEditedHtml'
import { withPreviewCSS } from '@/lib/utils'

interface HomePageData {
  id: string
  page_name: string
  page_title: string
  page_subtitle: string
  html_content: string
  is_published: boolean
  updated_at: string
}

export default function SalesPageDesignerPage() {
  const [homePageData, setHomePageData] = useState<HomePageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [isChatting, setIsChatting] = useState(false)
  const [currentHtml, setCurrentHtml] = useState('')
  const [originalHtml, setOriginalHtml] = useState('') // Store the original dynamic HTML

  // For now, let's use a simpler approach: save the edited HTML as-is
  // This means the first agency to edit will "own" the template, 
  // but other agencies will still get the dynamic version until they edit it

  // Load the current home page on component mount
  useEffect(() => {
    loadHomePage()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadHomePage = async () => {
    console.log('🏠 Starting loadHomePage function...')
    setIsLoading(true)
    try {
      console.log('🔧 Creating Supabase client...')
      const supabase = createClient()
      
      console.log('🔐 Getting session...')
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('🔐 Session result:', { hasSession: !!session, userEmail: session?.user?.email })
      
      if (!session) {
        console.error('❌ Not authenticated')
        setIsLoading(false)
        return
      }

      // Get the agency account ID first
      console.log('🏢 Getting agency account...')
      const { data: agencyAccountId, error: agencyError } = await supabase.rpc('get_or_create_agency_account')
      
      console.log('🏢 Agency account result:', { agencyAccountId, error: agencyError?.message })
      
      if (agencyError || !agencyAccountId) {
        console.error('❌ Failed to get agency account:', agencyError)
        setIsLoading(false)
        return
      }

      // Look for existing home page (page_type = 'home' or page_slug = 'home' or 'index')
      const { data: existingHomePage, error: fetchError } = await supabase
        .from('agency_sales_pages')
        .select('*')
        .eq('agency_account_id', agencyAccountId)
        .or('page_type.eq.home,page_slug.eq.home,page_slug.eq.index')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching home page:', fetchError)
        setIsLoading(false)
        return
      }

      if (existingHomePage) {
        // Use preview API to fetch full styled HTML (agency-specific)
        const res = await fetch('/api/preview/get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agency_id: agencyAccountId })
        })
        const html = await res.text()
        console.log('✅ Preview HTML loaded for agency')
        setHomePageData(existingHomePage)
        setCurrentHtml(html)
      } else {
        // No agency page yet: load default preview HTML (golden row)
        console.log('📥 Loading default preview (golden row)')
        const res = await fetch('/api/preview/get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agency_id: null })
        })
        const html = await res.text()
        setCurrentHtml(html)
        const tempHomePageData = {
          id: 'temp-main-homepage',
          agency_account_id: agencyAccountId,
          page_name: 'Main Website Home Page (Global Template)',
          page_type: 'home',
          page_slug: 'home',
          page_title: 'Main Website Home Page',
          page_subtitle: 'This is the global template. Changes will be saved as agency-specific when you edit.',
          headline: 'Main Website Home Page',
          subheadline: 'This is the global template. Changes will be saved as agency-specific when you edit.',
          call_to_action: 'Edit This Page',
          html_content: html,
          is_published: false,
          updated_at: new Date().toISOString(),
          template_style: 'main-website',
          primary_color: '#2563eb',
          secondary_color: '#64748b',
          accent_color: '#10b981',
          font_family: 'Inter'
        }
        setHomePageData(tempHomePageData)
        return
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR in loadHomePage:', error)
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    } finally {
      console.log('🏁 loadHomePage finished, setting loading to false')
      setIsLoading(false)
    }
  }

  const generateDefaultHomePageHTML = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Our Agency</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 100px 0; text-align: center; }
        .hero h1 { font-size: 3.5rem; font-weight: 700; margin-bottom: 20px; }
        .hero p { font-size: 1.25rem; margin-bottom: 30px; opacity: 0.9; }
        .cta-button { display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: 600; transition: transform 0.3s; }
        .cta-button:hover { transform: translateY(-2px); }
        
        .features { padding: 80px 0; background: #f8f9fa; }
        .features h2 { text-align: center; font-size: 2.5rem; margin-bottom: 60px; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; }
        .feature-card { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; }
        .feature-card h3 { font-size: 1.5rem; margin-bottom: 15px; color: #667eea; }
        
        .contact { padding: 80px 0; text-align: center; }
        .contact h2 { font-size: 2.5rem; margin-bottom: 20px; }
        .contact p { font-size: 1.1rem; margin-bottom: 30px; color: #666; }
    </style>
</head>
<body>
    <section class="hero">
        <div class="container">
            <h1>Transform Your Business with Digital Wallet Technology</h1>
            <p>We help businesses create engaging loyalty programs and digital experiences that drive customer retention and growth.</p>
            <a href="#contact" class="cta-button">Get Started Today</a>
        </div>
    </section>
    
    <section class="features">
        <div class="container">
            <h2>Why Choose Our Agency?</h2>
            <div class="feature-grid">
                <div class="feature-card">
                    <h3>🎯 Expert Strategy</h3>
                    <p>Our team of digital marketing experts will craft the perfect loyalty program strategy for your business goals.</p>
                </div>
                <div class="feature-card">
                    <h3>🚀 Fast Implementation</h3>
                    <p>Get your digital wallet program up and running in days, not months, with our streamlined process.</p>
                </div>
                <div class="feature-card">
                    <h3>📈 Proven Results</h3>
                    <p>Our clients see an average 40% increase in customer retention and 25% boost in repeat purchases.</p>
                </div>
            </div>
        </div>
    </section>
    
    <section class="contact" id="contact">
        <div class="container">
            <h2>Ready to Get Started?</h2>
            <p>Let's discuss how we can help transform your customer experience with digital wallet technology.</p>
            <a href="mailto:hello@agency.com" class="cta-button">Contact Us Now</a>
        </div>
    </section>
</body>
</html>`
  }

  const handlePreview = () => {
    if (currentHtml) {
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(withPreviewCSS(currentHtml))
        newWindow.document.close()
      }
    }
  }

  const handleSaveAndPublish = async () => {
    if (!homePageData || !currentHtml) {
      alert('No home page data to save.')
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('You must be logged in to save the home page.')
        return
      }

      // Get the agency account ID
      const { data: agencyAccountId, error: agencyError } = await supabase.rpc('get_or_create_agency_account')
      
      if (agencyError || !agencyAccountId) {
        throw new Error('Failed to get agency account')
      }

      if (homePageData.id === 'temp-main-homepage') {
        // This is the global template - create a new agency-specific page
        console.log('💾 Creating new agency-specific home page from global template...')
        
        // Use merge function to extract content model from edited HTML
        const { html_static, content_model } = mergeFromEditedHtml(currentHtml, getDefaultContentModel())
        
        const newAgencyHomePage = {
          agency_account_id: agencyAccountId,
          page_name: 'Agency Home Page',
          page_type: 'home',
          page_slug: 'home',
          page_title: 'Agency Home Page',
          page_subtitle: 'Customized from main website',
          headline: 'Agency Home Page',
          subheadline: 'Customized version of the main website',
          call_to_action: 'Get Started Today',
          html_content: html_static, // Save the static HTML with slot placeholders
          content_model: JSON.stringify(content_model), // Store extracted content model
          is_published: true,
          meta_title: 'Agency Home Page',
          meta_description: 'Agency-specific home page',
          template_style: 'agency-custom',
          primary_color: '#2563eb',
          secondary_color: '#64748b',
          accent_color: '#10b981',
          font_family: 'Inter'
        }

        const { data: newHomePage, error: insertError } = await supabase
          .from('agency_sales_pages')
          .insert([newAgencyHomePage])
          .select()
          .single()

        if (insertError) {
          console.error('Error creating agency home page:', insertError)
          throw new Error(insertError.message)
        }

        console.log('✅ Created new agency home page:', newHomePage.id)
        setHomePageData(newHomePage)
        alert('Home page saved as agency-specific page and published successfully!')
        
      } else {
        // Update the existing agency-specific home page
        console.log('💾 Updating existing agency home page...')
        
        // Use merge function to extract content model from edited HTML
        const { html_static, content_model } = mergeFromEditedHtml(currentHtml, getDefaultContentModel())
        
        const { error: updateError } = await supabase
          .from('agency_sales_pages')
          .update({
            html_content: html_static, // Save the static HTML with slot placeholders
            content_model: JSON.stringify(content_model), // Store extracted content model
            is_published: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', homePageData.id)

        if (updateError) {
          console.error('Error updating home page:', updateError)
          throw new Error(updateError.message)
        }

        alert('Home page updated and published successfully!')
      }
      
      // Refresh the home page data
      await loadHomePage()
      
    } catch (error) {
      console.error('Error saving home page:', error)
      alert(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChatWithClaude = async () => {
    if (!chatMessage.trim() || !currentHtml) return
    
    setIsChatting(true)
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('You must be logged in to chat with Claude.')
        return
      }

      // Add user message to chat history
      const userMessage = { role: 'user' as const, content: chatMessage }
      setChatHistory(prev => [...prev, userMessage])
      const messageToSend = chatMessage
      setChatMessage('')

      const response = await fetch('/api/agency/chat-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: messageToSend,
          currentHtml: currentHtml,
          wizardData: { generatedHtml: currentHtml } // Provide minimal wizard data for compatibility
        })
      })

      const data = await response.json()
      
      if (data.error) {
        alert('Failed to get response from Claude. Please try again.')
        return
      }

      // Add Claude's response to chat history
      const assistantMessage = { role: 'assistant' as const, content: data.message }
      setChatHistory(prev => [...prev, assistantMessage])
      
      // Update the HTML if Claude provided an updated version
      if (data.updatedHtml) {
        console.log('🔄 Updating HTML with Claude response:', data.updatedHtml.substring(0, 200) + '...')
        setCurrentHtml(data.updatedHtml)
        console.log('✅ HTML updated successfully')
      } else {
        console.log('⚠️ No updatedHtml in response:', data)
      }
      
    } catch (error) {
      console.error('Chat error:', error)
      alert('Failed to chat with Claude. Please try again.')
    } finally {
      setIsChatting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your home page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-header">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Page Designer</h1>
          <p className="text-slate-600 mt-1">Edit your agency's main website home page</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6">
          {homePageData ? (
          <div className="space-y-6">
            {/* Page Info */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">{homePageData.page_name}</h2>
              <p className="text-slate-600 mb-4">{homePageData.page_subtitle}</p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>Status: {homePageData.is_published ? '✅ Published' : '⏸️ Draft'}</span>
                <span>Last updated: {new Date(homePageData.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Preview and Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Home Page Preview</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={handlePreview}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Preview in New Tab
                  </button>
                  <button 
                    onClick={handleSaveAndPublish}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <DocumentDuplicateIcon className="w-4 h-4" />
                        Save & Publish
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="border border-slate-200 rounded-lg h-[600px] bg-white">
                {currentHtml ? (
                  <iframe
                    srcDoc={withPreviewCSS(currentHtml)}
                    className="w-full h-full rounded-lg"
                    title="Home Page Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    Home page preview will appear here
                  </div>
                )}
              </div>
            </div>

            {/* Chat with Claude for Edits */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-blue-600" />
                Chat with Claude for Edits
              </h4>
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-lg p-4 min-h-[120px] max-h-[300px] overflow-y-auto">
                  {chatHistory.length === 0 ? (
                    <div className="text-sm text-slate-600">
                      <p className="mb-2">Ask Claude to make changes to your home page. For example:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>"Make the headline more compelling"</li>
                        <li>"Change the color scheme to blue and white"</li>
                        <li>"Add a testimonials section"</li>
                        <li>"Make the call-to-action button more prominent"</li>
                        <li>"Add our company logo to the header"</li>
                        <li>"Create a pricing section"</li>
                        <li>"Add a contact form"</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatHistory.map((msg, index) => (
                        <div key={index} className={`text-sm ${msg.role === 'user' ? 'text-blue-700 font-medium' : 'text-slate-700'}`}>
                          <span className="font-semibold">{msg.role === 'user' ? 'You:' : 'Claude:'}</span> {msg.content}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isChatting && handleChatWithClaude()}
                    placeholder="Ask Claude to make changes to your home page..."
                    className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isChatting}
                  />
                  <button 
                    onClick={handleChatWithClaude}
                    disabled={isChatting || !chatMessage.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isChatting ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        Asking...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="w-4 h-4" />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <SparklesIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Home Page Found</h2>
            <p className="text-slate-600 mb-4">We couldn't find or create your home page. Please try refreshing the page.</p>
            <button 
              onClick={loadHomePage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
