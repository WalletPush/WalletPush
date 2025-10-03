'use client'

import { useState } from 'react'
import { mergeFromEditedHtml, getDefaultContentModel } from '@/lib/mergeFromEditedHtml'

export default function TestSlotSystem() {
  const [testHtml, setTestHtml] = useState(`<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <!-- WP:DYNAMIC-START header -->
  <header data-wp-component="Header" data-wp-slot="header">
    <img src="/placeholder-logo.png" alt="Logo" />
    <nav>
      <a href="#" data-wp-bind="header.nav[0].label">Home</a>
      <a href="#" data-wp-bind="header.nav[1].label">Features</a>
      <a href="#" data-wp-bind="header.cta.label">Get Started</a>
    </nav>
  </header>
  <!-- WP:DYNAMIC-END header -->
  
  <main>
    <h1>Welcome to our amazing product!</h1>
    <p>This is a test of the slot system.</p>
  </main>
  
  <!-- WP:DYNAMIC-START pricing -->
  <section data-wp-component="PricingTable" data-wp-slot="pricing">
    <h2 data-wp-bind="pricing.title">Simple Pricing</h2>
    <p data-wp-bind="pricing.subtitle">Choose your plan</p>
  </section>
  <!-- WP:DYNAMIC-END pricing -->
</body>
</html>`)

  const [result, setResult] = useState<any>(null)

  const testMerge = () => {
    console.log('🧪 Testing slot system merge...')
    const { html_static, content_model } = mergeFromEditedHtml(testHtml, getDefaultContentModel())
    setResult({ html_static, content_model })
    console.log('✅ Test complete:', { html_static, content_model })
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Slot System Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Input HTML (with slots)</h2>
          <textarea
            value={testHtml}
            onChange={(e) => setTestHtml(e.target.value)}
            className="w-full h-96 p-4 border rounded font-mono text-sm"
          />
          <button
            onClick={testMerge}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Merge
          </button>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          {result && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Static HTML (with slot placeholders):</h3>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-48">
                  {result.html_static}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Content Model (extracted data):</h3>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(result.content_model, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
