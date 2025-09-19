'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { SparklesIcon, PaperAirplaneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface ProgramData {
  programName: string
  tagline: string
  welcomeIncentive: string
  dataCapture: string[]
  tierStructure: string
  businessInfo: {
    name: string
    type: string
    location: string
    brandColors: string[]
    logoUrl?: string
    websiteUrl: string
  }
}

interface CrawlData {
  jobId: string
  status: 'scraping' | 'completed' | 'failed'
  data?: Array<{
    markdown: string
    metadata: {
      title: string
      description: string
      url: string
    }
  }>
  visualAssets?: {
    logos: string[]
    heroImages: string[]
    productImages: string[]
    allImages: string[]
    brandColors: string[]
    businessInfo: any
  }
}

export default function AICopilotChatPage() {
  const searchParams = useSearchParams()
  const websiteUrl = searchParams.get('website')
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [crawlData, setCrawlData] = useState<CrawlData | null>(null)
  const [crawlStatus, setCrawlStatus] = useState<'idle' | 'crawling' | 'analyzing' | 'ready' | 'error'>('idle')
  const [showCreateProgram, setShowCreateProgram] = useState(false)
  const [programData, setProgramData] = useState<ProgramData | null>(null)
  const [conversationSummary, setConversationSummary] = useState<any>(null)
  const [crawlStarted, setCrawlStarted] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const crawlProcessingRef = useRef(false)
  const aiProcessingRef = useRef(false)
  const pollCrawlRef = useRef(false)
  const recentMessagesRef = useRef(new Set<string>())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    addDebug(`🔄 useEffect triggered: websiteUrl=${!!websiteUrl}, crawlStarted=${crawlStarted}, crawlStatus=${crawlStatus}`)
    if (websiteUrl && !crawlStarted) {
      addDebug('✅ Starting crawl from useEffect')
      setCrawlStarted(true)
      startWebsiteCrawling()
    } else {
      addDebug('🚫 useEffect conditions not met')
    }
  }, [websiteUrl, crawlStarted])

  const formatMessageContent = (content: string) => {
    // Convert **text** to bold formatting
    const parts = content.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2)
        return <strong key={index}>{boldText}</strong>
      }
      return part
    })
  }

  const addDebug = (message: string) => {
    // Debug removed for production
  }

  const addMessage = (role: 'user' | 'assistant' | 'system', content: string, uniqueId?: string) => {
    addDebug(`🔥 addMessage called - ${role} - ${content.substring(0, 50)}...`)
    
    // Create unique key for this message
    const messageKey = `${role}:${content}`
    
    // SYNCHRONOUS duplicate check using ref
    if (recentMessagesRef.current.has(messageKey)) {
      addDebug(`🚫 DUPLICATE PREVENTED BY REF: ${content.substring(0, 50)}...`)
      return
    }
    
    // Add to recent messages set
    recentMessagesRef.current.add(messageKey)
    
    // Clean up old entries (keep only last 10)
    if (recentMessagesRef.current.size > 10) {
      const entries = Array.from(recentMessagesRef.current)
      recentMessagesRef.current.clear()
      entries.slice(-10).forEach(entry => recentMessagesRef.current.add(entry))
    }
    
    addDebug(`✅ ADDING MESSAGE: ${role} - ${content.substring(0, 50)}...`)
    
    setMessages(prev => {
      const newMessage: Message = {
        id: uniqueId || Date.now().toString(),
        role,
        content,
        timestamp: new Date()
      }
      return [...prev, newMessage]
    })
  }

  const startWebsiteCrawling = async () => {
    addDebug(`🚀 startWebsiteCrawling called, current status: ${crawlStatus}`)
    
    // Prevent multiple calls
    if (crawlStatus !== 'idle') {
      addDebug('🚫 Crawling already in progress, skipping...')
      return
    }

    addDebug('🎯 Starting crawl process...')
    setCrawlStatus('crawling')
    addMessage('system', `🔍 Starting analysis of ${websiteUrl}...`)
    addMessage('assistant', "Hi there! I'm your AI Copilot. I'm now gathering information about your website to understand your business better. This will take just a moment...")

    try {
      // Start crawling
      const crawlResponse = await fetch('/api/business/crawl-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl })
      })

      const crawlResult = await crawlResponse.json()

      if (!crawlResponse.ok) {
        console.error('❌ Crawl failed:', crawlResult)
        alert(`❌ Crawl failed: ${crawlResult.error || 'Unknown error'}\n\nDetails: ${crawlResult.details || 'No details'}\n\nFull response: ${JSON.stringify(crawlResult, null, 2)}`)
        throw new Error(crawlResult.error || 'Failed to start crawling')
      }

      setCrawlData({ jobId: crawlResult.jobId, status: 'scraping' })
      addMessage('system', '📡 Website crawling initiated. Waiting for data...')

      // Poll for results - with ref protection
      if (!pollCrawlRef.current) {
        pollCrawlRef.current = true
        addDebug('🎯 Starting pollCrawlStatus with REF protection...')
        pollCrawlStatus(crawlResult.jobId)
      } else {
        addDebug('🚫 POLL CRAWL BLOCKED BY REF!')
      }

    } catch (error: any) {
      console.error('Crawling error:', error)
      setCrawlStatus('error')
      addMessage('assistant', `I'm sorry, but I encountered an error while trying to analyze your website: ${error.message}. Would you like to try again or tell me about your business manually?`)
    }
  }

  const pollCrawlStatus = async (jobId: string) => {
    const maxAttempts = 30 // 5 minutes max
    let attempts = 0

    const checkStatus = async () => {
      try {
        const statusResponse = await fetch(`/api/business/crawl-website?jobId=${jobId}`)
        const statusData = await statusResponse.json()

        if (!statusResponse.ok) {
          console.error('❌ Status check failed:', statusData)
          alert(`❌ Status check failed: ${statusData.error || 'Unknown error'}\n\nDetails: ${statusData.details || 'No details'}\n\nResponse: ${JSON.stringify(statusData, null, 2)}`)
          throw new Error(statusData.error || 'Failed to check status')
        }

        console.log('Crawl status:', statusData.status)

        if (statusData.status === 'completed') {
          // Use REF to prevent multiple execution
          if (crawlProcessingRef.current) {
            addDebug('🚫 CRAWL PROCESSING BLOCKED BY REF!')
            return
          }
          
          crawlProcessingRef.current = true
          addDebug('🎯 Processing crawl completion with REF protection...')
          
          setCrawlData({ 
            jobId, 
            status: 'completed', 
            data: statusData.data,
            visualAssets: statusData.visualAssets 
          })
          setCrawlStatus('analyzing')
          addMessage('system', '✅ Website data gathered successfully!')
          
          // Show visual assets if found
          if (statusData.visualAssets) {
            const assets = statusData.visualAssets
            let assetSummary = '🎨 Visual assets discovered:\n'
            if (assets.logos?.length > 0) assetSummary += `• ${assets.logos.length} logo(s)\n`
            if (assets.heroImages?.length > 0) assetSummary += `• ${assets.heroImages.length} hero image(s)\n`
            if (assets.allImages?.length > 0) assetSummary += `• ${assets.allImages.length} total image(s)\n`
            if (assets.brandColors?.length > 0) assetSummary += `• ${assets.brandColors.length} brand color(s)\n`
            
            addMessage('system', assetSummary)
          }
          
          // Process the crawled data with AI
          await processWebsiteData(statusData.data, websiteUrl!, statusData.visualAssets)
          
        } else if (statusData.status === 'failed') {
          throw new Error('Website crawling failed')
          
        } else if (attempts < maxAttempts) {
          // Still in progress, check again in 10 seconds
          attempts++
          addMessage('system', `📊 Progress: ${statusData.completed || 0}/${statusData.total || 'unknown'} pages analyzed...`)
          setTimeout(checkStatus, 10000)
          
        } else {
          throw new Error('Crawling timed out')
        }

      } catch (error: any) {
        console.error('Status check error:', error)
        setCrawlStatus('error')
        addMessage('assistant', `I encountered an issue while gathering your website data: ${error.message}. Let's try a different approach - can you tell me what type of business you run?`)
      }
    }

    // Start checking status after 5 seconds
    setTimeout(checkStatus, 5000)
  }

  const processWebsiteData = async (crawledData: any[], websiteUrl: string, visualAssets?: any) => {
    // Use REF to prevent multiple execution
    if (aiProcessingRef.current) {
      addDebug('🚫 AI PROCESSING BLOCKED BY REF!')
      return
    }
    
    aiProcessingRef.current = true
    addDebug('🤖 Starting AI analysis with REF protection...')
    addMessage('system', '🤖 Analyzing your business with AI...')
    
    try {
      // Prepare the crawled content for AI analysis
      const websiteContent = crawledData.map(page => ({
        title: page.metadata?.title || 'Untitled',
        url: page.metadata?.url || '',
        content: page.markdown || ''
      }))

      // Send to AI for analysis
      const analysisResponse = await fetch('/api/business/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          websiteUrl, 
          websiteContent: websiteContent.slice(0, 5), // Limit to first 5 pages for token efficiency
          visualAssets // Include visual assets for AI analysis
        })
      })

      const analysisResult = await analysisResponse.json()

      if (!analysisResponse.ok) {
        throw new Error(analysisResult.error || 'Failed to analyze website')
      }

      setCrawlStatus('ready')
      addMessage('assistant', analysisResult.analysis)

    } catch (error: any) {
      console.error('AI analysis error:', error)
      setCrawlStatus('error')
      addMessage('assistant', `I had trouble analyzing your website content, but I can still help you create an amazing loyalty program! What type of business do you run?`)
    } finally {
      // Reset refs so function can be called again if needed
      aiProcessingRef.current = false
    }
  }

  const detectProgramReadyToCreate = (conversation: Message[]) => {
    // Look for key indicators that the program is ready to be created
    const lastFewMessages = conversation.slice(-10).map(m => m.content.toLowerCase())
    
    // Check if Claude has asked about creation options
    const hasCreationTrigger = lastFewMessages.some(content => 
      content.includes('what would you like me to create first') ||
      content.includes('option a') && content.includes('option b') ||
      content.includes('digital loyalty pass') ||
      content.includes('promotional landing page') ||
      content.includes('create program') // Manual trigger for testing
    )
    
    // Check if we have program details - DYNAMIC patterns
    const hasProgram = lastFewMessages.some(content => 
      content.includes('program') ||
      content.includes('club') ||
      content.includes('membership') ||
      content.includes('loyalty') ||
      content.includes('rewards')
    )
    
    const hasIncentive = lastFewMessages.some(content => 
      content.includes('free') ||
      content.includes('off') ||
      content.includes('discount') ||
      content.includes('complimentary') ||
      content.includes('bonus') ||
      content.includes('get') ||
      content.includes('%')
    )
    
    return hasCreationTrigger && hasProgram && hasIncentive
  }

  const extractProgramDataWithClaude = async (conversation: Message[]): Promise<ProgramData | null> => {
    try {
      const response = await fetch('/api/business/extract-program-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: conversation,
          websiteUrl,
          visualAssets: crawlData?.visualAssets,
          screenshot: crawlData?.screenshot // Pass screenshot for visual design matching
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Program extraction failed:', result)
        return null
      }

      console.log('Claude extraction successful:', result.programData, 'Confidence:', result.confidence)
      return result.programData

    } catch (error) {
      console.error('Program extraction error:', error)
      return null
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    addMessage('user', userMessage)
    setIsLoading(true)

    try {
      // Send message to AI chat endpoint
      const response = await fetch('/api/business/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          conversationHistory: messages,
          websiteUrl,
          crawlData: crawlData?.data
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get AI response')
      }

      const newMessage = result.response
      addMessage('assistant', newMessage)

      // Check if this response triggers program creation using the current messages state
      // We need to wait for the state to update, so we'll use the current messages + new ones
      setTimeout(async () => {
        const updatedMessages = [...messages, 
          { id: Date.now().toString(), role: 'user' as const, content: userMessage, timestamp: new Date() },
          { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: newMessage, timestamp: new Date() }
        ]
        
        if (detectProgramReadyToCreate(updatedMessages)) {
          const extracted = await extractProgramDataWithClaude(updatedMessages)
          if (extracted) {
            setProgramData(extracted)
            setShowCreateProgram(true)
          }
        }
      }, 100) // Small delay to let state update

    } catch (error: any) {
      console.error('Chat error:', error)
      addMessage('assistant', `I'm sorry, I encountered an error: ${error.message}. Please try again.`)
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleCreateProgram = async () => {
    if (!programData) return
    
    addMessage('system', `🚀 Creating your ${programData.programName} program...`)
    setIsLoading(true)
    
    try {
      // Generate the complete pass template with all assets
      const response = await fetch('/api/business/generate-pass-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programData: programData,
          businessId: 'current_business_id' // Will be determined by API from user auth
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create program')
      }
      
      // Generate landing page automatically with screenshot
      addMessage('system', '🌐 Generating promotional landing page...')
      
      // STAGE 2: Capture website screenshot for visual design matching
      let screenshotUrl = null
      try {
        addMessage('system', '📸 Capturing website screenshot for design matching...')
        
        const screenshotResponse = await fetch('/api/business/screenshot-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            websiteUrl: websiteUrl
          })
        })
        
        if (screenshotResponse.ok) {
          const screenshotResult = await screenshotResponse.json()
          screenshotUrl = screenshotResult.screenshotUrl
          addMessage('system', '✅ Screenshot captured! Creating visually matching landing page...')
        } else {
          addMessage('system', '⚠️ Screenshot failed, creating standard landing page...')
        }
      } catch (screenshotError) {
        console.warn('Screenshot capture failed:', screenshotError)
        addMessage('system', '⚠️ Screenshot failed, creating standard landing page...')
      }
      
      try {
        const landingResponse = await fetch('/api/business/generate-landing-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            programData: programData,
            businessId: result.businessId,
            templateId: result.templateId,
            programId: result.programId,
            screenshot: screenshotUrl // Pass screenshot URL for visual design matching
          })
        })
        
        const landingResult = await landingResponse.json()
        
        if (landingResponse.ok) {
          addMessage('assistant', `🎉 **INCREDIBLE!** I've successfully created your complete "${result.templateName}" loyalty program!\n\n✅ **Pass Template Generated** - Complete Pass Designer template ready for customization\n✅ **PassKit Configuration** - Apple Wallet-ready JSON generated\n✅ **Landing Page Created** - Beautiful promotional website generated\n✅ **Global Pass Type ID Assigned** - ${result.passTypeId}\n✅ **Assets Downloaded** - ${result.summary.assetsDownloaded}\n✅ **Member ID Format** - Example: ${result.summary.memberIdExample}\n\n**Your Program Details:**\n• **Organization:** ${result.summary.organizationName}\n• **Welcome Incentive:** ${result.summary.welcomeIncentive}\n• **Template ID:** ${result.templateId}\n• **Program ID:** ${result.programId}\n• **Landing Page:** ${landingResult.previewUrl || 'Generated'}\n\n**🚀 Your Complete Loyalty System is Ready!**\n\n🎨 **[Edit Pass Design](${result.passDesignerUrl})** - Customize colors, fields, and branding\n🌐 **[Preview Landing Page](${landingResult.previewUrl || '#'})** - See your promotional website\n📱 **[Start Distribution](${landingResult.publishUrl || '#'})** - Begin collecting members\n⚙️ **[Program Settings](/business/programs/${result.programId})** - Manage rewards and offers\n\n**Your loyalty program is now 100% ready to launch and start building customer relationships!** 🎉\n\nWould you like me to help you customize anything or guide you through the next steps?`)
        } else {
          addMessage('assistant', `🎉 **INCREDIBLE!** I've successfully created your "${result.templateName}" loyalty program!\n\n✅ **Pass Template Generated** - Complete Pass Designer template ready for customization\n✅ **PassKit Configuration** - Apple Wallet-ready JSON generated\n✅ **Global Pass Type ID Assigned** - ${result.passTypeId}\n✅ **Assets Downloaded** - ${result.summary.assetsDownloaded}\n✅ **Member ID Format** - Example: ${result.summary.memberIdExample}\n⚠️ **Landing Page** - Will be generated separately\n\n**Your Program Details:**\n• **Organization:** ${result.summary.organizationName}\n• **Welcome Incentive:** ${result.summary.welcomeIncentive}\n• **Template ID:** ${result.templateId}\n• **Program ID:** ${result.programId}\n\n**Ready for the next step?**\n\n🎨 **[Edit in Pass Designer](${result.passDesignerUrl})** - Customize colors, fields, and design\n🌐 **Generate Landing Page** - Create promotional website\n📱 **Start Distribution** - Begin collecting members\n\nYour loyalty program is now live and ready to build customer relationships! What would you like to do next?`)
        }
      } catch (landingError) {
        console.error('Landing page generation error:', landingError)
        addMessage('assistant', `🎉 **INCREDIBLE!** I've successfully created your "${result.templateName}" loyalty program!\n\n✅ **Pass Template Generated** - Complete Pass Designer template ready for customization\n✅ **PassKit Configuration** - Apple Wallet-ready JSON generated\n✅ **Global Pass Type ID Assigned** - ${result.passTypeId}\n✅ **Assets Downloaded** - ${result.summary.assetsDownloaded}\n✅ **Member ID Format** - Example: ${result.summary.memberIdExample}\n⚠️ **Landing Page** - Will be generated separately\n\n**Your Program Details:**\n• **Organization:** ${result.summary.organizationName}\n• **Welcome Incentive:** ${result.summary.welcomeIncentive}\n• **Template ID:** ${result.templateId}\n• **Program ID:** ${result.programId}\n\n**Ready for the next step?**\n\n🎨 **[Edit in Pass Designer](${result.passDesignerUrl})** - Customize colors, fields, and design\n🌐 **Generate Landing Page** - Create promotional website\n📱 **Start Distribution** - Begin collecting members\n\nYour loyalty program is now live and ready to build customer relationships! What would you like to do next?`)
      }
      
      setShowCreateProgram(false)
      
    } catch (error: any) {
      console.error('Program creation error:', error)
      addMessage('assistant', `I encountered an error while creating your program: ${error.message}. The system may need additional configuration or there could be a temporary issue. You can try again or contact support for assistance.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!websiteUrl) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Missing Website URL</h1>
          <p className="text-slate-600">Please provide a website URL to continue.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">AI Copilot</h1>
              <p className="text-sm text-slate-600">Analyzing: {websiteUrl}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              crawlStatus === 'ready' ? 'bg-green-500' : 
              crawlStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-slate-600 capitalize">{crawlStatus}</span>
          </div>
          {/* Debug Panel */}
          <div className="flex items-center">
          </div>
        </div>
      </div>


      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-green-100 text-green-900 border border-green-200' 
                  : message.role === 'system'
                  ? 'bg-slate-200 text-slate-700 text-sm'
                  : 'bg-white text-slate-900 border border-slate-200'
              }`}>
                <p className="whitespace-pre-wrap">{formatMessageContent(message.content)}</p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-green-600' : 'text-slate-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-slate-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {showCreateProgram && programData && (
            <div className="flex justify-center">
              <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-6 max-w-md mx-auto shadow-lg">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SparklesIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Ready to Create Your Program!</h3>
                  <p className="text-blue-800 text-sm mb-4">
                    I've gathered all the details for "{programData.programName}". 
                    Let me create your loyalty pass and landing page now!
                  </p>
                  <div className="bg-blue-100 rounded-lg p-3 mb-4 text-xs text-left">
                    <div className="space-y-1">
                      <div><strong>Program:</strong> {programData.programName}</div>
                      <div><strong>Incentive:</strong> {programData.welcomeIncentive}</div>
                      <div><strong>Business:</strong> {programData.businessInfo.name}</div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowCreateProgram(false)}
                      className="flex-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-300 transition-colors"
                    >
                      Not Yet
                    </button>
                    <button
                      onClick={handleCreateProgram}
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Create Program! 🚀
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={crawlStatus === 'ready' ? "Ask me anything about your loyalty program..." : "Please wait while I analyze your website..."}
                disabled={isLoading || crawlStatus === 'crawling'}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || crawlStatus === 'crawling'}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
