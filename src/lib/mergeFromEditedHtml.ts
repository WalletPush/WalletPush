// Simple HTML parser implementation without external dependencies

export interface ContentModel {
  header?: {
    nav?: Array<{ label: string }>
    cta?: { label: string }
  }
  pricing?: {
    title?: string
    subtitle?: string
    footer?: string
  }
  footer?: {
    company?: {
      name?: string
      description?: string
    }
    links?: Array<{
      title?: string
      items?: string[]
    }>
    copyright?: string
  }
}

export function mergeFromEditedHtml(editedHtml: string, baselineModel?: ContentModel): {
  html_static: string
  content_model: ContentModel
} {
  console.log('🔄 Starting mergeFromEditedHtml...')
  
  const updates: Record<string, string> = {}
  let html_static = editedHtml

  // 1) Extract copy from data-wp-bind attributes using regex
  const bindRegex = /data-wp-bind="([^"]+)"[^>]*>([^<]+)</g
  let match
  
  while ((match = bindRegex.exec(editedHtml)) !== null) {
    const path = match[1]
    const text = match[2].trim()
    updates[path] = text
    console.log(`📝 Found binding: ${path} = "${text}"`)
  }

  // 2) Apply updates to a clone of the baseline content model
  const contentModel: ContentModel = structuredClone(baselineModel || {})
  
  // Helper function to set nested object values
  function setNestedValue(obj: any, path: string, value: string) {
    const keys = path.split('.')
    let current = obj
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/)
      
      if (arrayMatch) {
        const arrayKey = arrayMatch[1]
        const index = parseInt(arrayMatch[2])
        
        if (!current[arrayKey]) current[arrayKey] = []
        if (!current[arrayKey][index]) current[arrayKey][index] = {}
        current = current[arrayKey][index]
      } else {
        if (!current[key]) current[key] = {}
        current = current[key]
      }
    }
    
    const lastKey = keys[keys.length - 1]
    const arrayMatch = lastKey.match(/^(\w+)\[(\d+)\]$/)
    
    if (arrayMatch) {
      const arrayKey = arrayMatch[1]
      const index = parseInt(arrayMatch[2])
      
      if (!current[arrayKey]) current[arrayKey] = []
      current[arrayKey][index] = value
    } else {
      current[lastKey] = value
    }
  }

  // Apply all updates
  for (const [path, value] of Object.entries(updates)) {
    setNestedValue(contentModel, path, value)
  }

  // 3) Replace dynamic blocks with slot placeholders
  const slotRegex = /<[^>]+data-wp-slot="([^"]+)"[^>]*>[\s\S]*?<\/[^>]+>/g
  html_static = html_static.replace(slotRegex, (match, slotName) => {
    console.log(`🔌 Replaced slot: ${slotName}`)
    return `<div data-wp-slot="${slotName}"></div>`
  })

  // 4) Remove bind markers from static sections (optional cleanup)
  html_static = html_static.replace(/data-wp-bind="[^"]*"/g, '')
  html_static = html_static.replace(/data-wp-component="[^"]*"/g, '')
  
  console.log('✅ Merge complete:', {
    updatesCount: Object.keys(updates).length,
    contentModelKeys: Object.keys(contentModel),
    htmlLength: html_static.length
  })
  
  return { html_static, content_model: contentModel }
}

// Default content model for new agencies
export function getDefaultContentModel(): ContentModel {
  return {
    header: {
      nav: [
        { label: 'Home' },
        { label: 'Features' },
        { label: 'Pricing' }
      ],
      cta: { label: 'Get Started' }
    },
    pricing: {
      title: 'Simple, Transparent Pricing',
      subtitle: 'Choose the plan that fits your business. No hidden fees, no long-term contracts.',
      footer: 'All plans include 14-day free trial • No setup fees • Cancel anytime'
    },
    footer: {
      company: {
        name: 'WalletPush',
        description: 'Digital wallet solutions for modern businesses.'
      },
      links: [
        {
          title: 'Product',
          items: ['Features', 'Pricing']
        },
        {
          title: 'Support',
          items: ['Help Center', 'Contact']
        },
        {
          title: 'Legal',
          items: ['Privacy', 'Terms']
        }
      ],
      copyright: '© 2024 WalletPush. All rights reserved.'
    }
  }
}
