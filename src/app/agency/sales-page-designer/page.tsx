'use client'

import React, { useState, useEffect } from 'react'
import { 
  SparklesIcon,
  EyeIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'
import { getDefaultContentModel } from '@/lib/mergeFromEditedHtml'
import { withPreviewCSS } from '@/lib/utils'

interface HomePageData {
  id: string
  page_name: string
  page_title: string
  page_subtitle: string
  html_content: string
  is_published: boolean
  updated_at: string
  agency_account_id?: string | null
}

export default function SalesPageDesignerPage() {
  const [homePageData, setHomePageData] = useState<HomePageData | null>(null)
  const [agencyAccountId, setAgencyAccountId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [isChatting, setIsChatting] = useState(false)
  const [currentHtml, setCurrentHtml] = useState('')
  const [originalHtml, setOriginalHtml] = useState('') // Store the original dynamic HTML
  const [hasClaudeEdited, setHasClaudeEdited] = useState(false) // Track if Claude has made edits

  // For now, let's use a simpler approach: save the edited HTML as-is
  // This means the first agency to edit will "own" the template, 
  // but other agencies will still get the dynamic version until they edit it

  // Load the current home page on component mount
  useEffect(() => {
    loadHomePage()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 🚀 CLICK-TO-EDIT: Listen for text edit requests from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TEXT_UPDATED') {
        const { elementId, newText } = event.data
        
        console.log('✅ Cool in-preview popup updated text:', {
          elementId,
          newText: newText.substring(0, 50) + (newText.length > 50 ? '...' : '')
        })
        
        // Update the HTML state with the new text
        setCurrentHtml(prevHtml => {
          const updatedHtml = prevHtml.replace(
            new RegExp(`data-edit-id="${elementId}"[^>]*>([^<]*)<`, 'g'),
            `data-edit-id="${elementId}">${newText}<`
          )
          return updatedHtml
        })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // 🚀 CLICK-TO-EDIT: Inject JavaScript to make text editable
  const injectClickToEditScript = (html: string): string => {
    if (!hasClaudeEdited) return html // Only enable after Claude has made edits
    
    const script = `
    <script>
      (function() {
        let editCounter = 0;
        
        function makeTextEditable() {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: function(node) {
                // Skip script tags, style tags, and very short text
                const parent = node.parentElement;
                if (!parent || 
                    parent.tagName === 'SCRIPT' || 
                    parent.tagName === 'STYLE' ||
                    parent.tagName === 'NOSCRIPT' ||
                    node.textContent.trim().length < 3) {
                  return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
              }
            }
          );
          
          const textNodes = [];
          let node;
          while (node = walker.nextNode()) {
            textNodes.push(node);
          }
          
          textNodes.forEach(textNode => {
            const parent = textNode.parentElement;
            if (parent && !parent.hasAttribute('data-edit-id')) {
              const editId = 'edit-' + (++editCounter);
              parent.setAttribute('data-edit-id', editId);
              parent.style.cursor = 'pointer';
              parent.style.outline = '1px dashed transparent';
              parent.title = 'Click to edit this text';
              
              parent.addEventListener('mouseenter', () => {
                parent.style.outline = '1px dashed #3b82f6';
                parent.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              });
              
              parent.addEventListener('mouseleave', () => {
                parent.style.outline = '1px dashed transparent';
                parent.style.backgroundColor = 'transparent';
              });
              
                    parent.addEventListener('click', (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      const text = parent.textContent || '';
                      
                      // 🚀 COOL IN-PREVIEW POPUP: Create custom popup in iframe
                      const popup = document.createElement('div');
                      popup.style.cssText = \`
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: white;
                        border: 2px solid #3b82f6;
                        border-radius: 12px;
                        padding: 20px;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                        z-index: 10000;
                        min-width: 400px;
                        max-width: 600px;
                        font-family: system-ui, -apple-system, sans-serif;
                      \`;
                      
                      popup.innerHTML = \`
                        <div style="margin-bottom: 15px;">
                          <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Edit Text</h3>
                          <p style="margin: 0; color: #6b7280; font-size: 14px;">Make your changes and click Save to update the text.</p>
                        </div>
                        <textarea 
                          id="edit-textarea-\${editId}" 
                          style="
                            width: 100%; 
                            height: 120px; 
                            padding: 12px; 
                            border: 1px solid #d1d5db; 
                            border-radius: 8px; 
                            font-size: 14px; 
                            font-family: inherit;
                            resize: vertical;
                            outline: none;
                            transition: border-color 0.2s;
                          "
                          placeholder="Enter your text here..."
                        >\${text}</textarea>
                        <div style="display: flex; gap: 10px; margin-top: 15px; justify-content: flex-end;">
                          <button 
                            id="cancel-btn-\${editId}"
                            style="
                              padding: 8px 16px; 
                              background: #f3f4f6; 
                              color: #374151; 
                              border: none; 
                              border-radius: 6px; 
                              cursor: pointer; 
                              font-size: 14px;
                              font-weight: 500;
                              transition: background-color 0.2s;
                            "
                          >Cancel</button>
                          <button 
                            id="save-btn-\${editId}"
                            style="
                              padding: 8px 16px; 
                              background: #3b82f6; 
                              color: white; 
                              border: none; 
                              border-radius: 6px; 
                              cursor: pointer; 
                              font-size: 14px;
                              font-weight: 500;
                              transition: background-color 0.2s;
                            "
                          >Save Changes</button>
                        </div>
                      \`;
                      
                      // Add hover effects
                      const textarea = popup.querySelector('textarea');
                      textarea.addEventListener('focus', () => {
                        textarea.style.borderColor = '#3b82f6';
                        textarea.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      });
                      textarea.addEventListener('blur', () => {
                        textarea.style.borderColor = '#d1d5db';
                        textarea.style.boxShadow = 'none';
                      });
                      
                      const saveBtn = popup.querySelector('#save-btn-' + editId);
                      const cancelBtn = popup.querySelector('#cancel-btn-' + editId);
                      
                      saveBtn.addEventListener('mouseenter', () => {
                        saveBtn.style.backgroundColor = '#2563eb';
                      });
                      saveBtn.addEventListener('mouseleave', () => {
                        saveBtn.style.backgroundColor = '#3b82f6';
                      });
                      
                      cancelBtn.addEventListener('mouseenter', () => {
                        cancelBtn.style.backgroundColor = '#e5e7eb';
                      });
                      cancelBtn.addEventListener('mouseleave', () => {
                        cancelBtn.style.backgroundColor = '#f3f4f6';
                      });
                      
                      // Handle save
                      saveBtn.addEventListener('click', () => {
                        const newText = textarea.value;
                        parent.textContent = newText;
                        document.body.removeChild(popup);
                        
                        // Notify parent window of the change
                        window.parent.postMessage({
                          type: 'TEXT_UPDATED',
                          elementId: editId,
                          newText: newText
                        }, '*');
                      });
                      
                      // Handle cancel
                      cancelBtn.addEventListener('click', () => {
                        document.body.removeChild(popup);
                      });
                      
                      // Handle escape key
                      document.addEventListener('keydown', function escapeHandler(e) {
                        if (e.key === 'Escape') {
                          document.body.removeChild(popup);
                          document.removeEventListener('keydown', escapeHandler);
                        }
                      });
                      
                      document.body.appendChild(popup);
                      textarea.focus();
                      textarea.select();
                    });
            }
          });
        }
        
        // Note: Text updates are now handled directly by the in-preview popup
        // No need for message passing since the popup updates the DOM directly
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', makeTextEditable);
        } else {
          makeTextEditable();
        }
      })();
    </script>
    `;
    
    // Inject the script before the closing </body> tag
    return html.replace('</body>', script + '</body>');
  };

  const loadHomePage = async () => {
    console.log('🏠 Starting loadHomePage function...')
    setIsLoading(true)
    try {
      // Get agency account ID from server (handles auth internally)
      const accountRes = await fetch('/api/agency/account')
      if (!accountRes.ok) {
        console.error('❌ Failed to get agency account')
        setIsLoading(false)
        return
      }
      const accountData = await accountRes.json()
      const fetchedAgencyAccountId = accountData.agency?.id || null
      setAgencyAccountId(fetchedAgencyAccountId)

      // Fire-and-forget: ensure agency has homepage row (server handles auth)
      if (fetchedAgencyAccountId) {
        fetch(`/api/agency/ensure-homepage?agency_account_id=${fetchedAgencyAccountId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => {}) // ignore errors, it's just a bootstrap
      }

    // Load preview HTML with correct agency_account_id parameter
    const previewUrl = `/api/preview/get?agency_account_id=${encodeURIComponent(fetchedAgencyAccountId || '')}&_=${Date.now()}`
    const previewRes = await fetch(previewUrl)
    const html = await previewRes.text()
    setCurrentHtml(html)

      // Create temp homepage data for UI
      const tempHomePageData = {
        id: fetchedAgencyAccountId ? 'agency-homepage' : 'temp-main-homepage',
        agency_account_id: fetchedAgencyAccountId,
        page_name: fetchedAgencyAccountId ? 'Agency Home Page' : 'Main Website Home Page (Global Template)',
        page_title: fetchedAgencyAccountId ? 'Agency Home Page' : 'Main Website Home Page',
        page_subtitle: fetchedAgencyAccountId ? 'Your customized homepage' : 'This is the global template. Changes will be saved as agency-specific when you edit.',
        html_content: html,
        is_published: false,
        updated_at: new Date().toISOString()
      }
      setHomePageData(tempHomePageData)
      
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
      // Use server-side save API (handles auth and database operations)
      const saveRes = await fetch('/api/agency/sales-pages/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_account_id: agencyAccountId,
          edited_html: currentHtml,
          baseline_content_model: getDefaultContentModel()
        })
      })

      if (!saveRes.ok) {
        const errorData = await saveRes.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Save failed')
      }

      const result = await saveRes.json()
      console.log('✅ Save successful:', result)
      
      alert('Home page saved and published successfully!')
      
      // 🚀 CRITICAL FIX: Load the SAVED agency template, not the main template
      console.log('🔄 Loading saved agency template after successful save...')
      
      // Load the saved agency homepage (not the main template)
      const previewUrl = `/api/preview/get?agency_account_id=${encodeURIComponent(agencyAccountId || '')}&_=${Date.now()}`
      const previewRes = await fetch(previewUrl)
      const savedHtml = await previewRes.text()
      
      setCurrentHtml(savedHtml)
      console.log('✅ Loaded saved agency template in preview:', {
        htmlLength: savedHtml.length,
        containsBlueKarma: savedHtml.includes('Blue Karma'),
        containsWalletPush: savedHtml.includes('WalletPush')
      })
      
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
      // Add user message to chat history
      const userMessage = { role: 'user' as const, content: chatMessage }
      setChatHistory(prev => [...prev, userMessage])
      const messageToSend = chatMessage
      setChatMessage('')

      const response = await fetch('/api/agency/chat-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
        setHasClaudeEdited(true) // 🚀 Enable click-to-edit after Claude edits
        console.log('✅ HTML updated successfully, click-to-edit enabled')
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
                    srcDoc={injectClickToEditScript(currentHtml)}
                    className="w-full h-full rounded-lg"
                    title="Home Page Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      Loading preview...
                    </div>
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
