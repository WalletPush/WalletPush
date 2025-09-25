'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
        
        // Set the HTML content
        setHtmlContent(landingPage.generated_html || '<p>No content available</p>')
        setLoading(false)
        
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
