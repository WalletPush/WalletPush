/**
 * HTML Optimization utilities for reducing token usage in AI requests
 */

export interface HTMLSection {
  name: string
  content: string
  startIndex: number
  endIndex: number
}

export interface OptimizedHTML {
  sections: HTMLSection[]
  cssBlocks: string[]
  cssLinks: string[]
  scriptBlocks: string[]
  optimizedHtml: string
  compressionRatio: number
}

/**
 * Determines if the user wants to edit the full page or specific sections
 */
export function isFullPageEdit(message: string): boolean {
  const message_lower = message.toLowerCase()
  
  // Full page edit indicators
  const fullPageKeywords = [
    /\b(all|entire|whole|complete|full)\s+(page|site|content|copy|text)\b/,
    /\breplace\s+all\b/,
    /\bchange\s+all\b/,
    /\bevery\s+(instance|occurrence)\b/,
    /\bthroughout\s+the\s+(page|site)\b/,
    /\ball\s+instances?\s+of\b/,
    /\bglobal(ly)?\s+(replace|change)\b/,
    /\bsite-?wide\b/,
    /\brebrand/,
    /\bcompany\s+name/,
    /\bbrand\s+name/
  ]
  
  return fullPageKeywords.some(pattern => pattern.test(message_lower))
}

/**
 * Identifies which section of the HTML the user likely wants to edit based on their message
 */
export function identifyTargetSection(message: string): string[] {
  // If it's a full page edit, return empty array to indicate no section filtering
  if (isFullPageEdit(message)) {
    return []
  }
  
  const message_lower = message.toLowerCase()
  const sections: string[] = []
  
  // Header/Navigation keywords
  if (message_lower.match(/\b(header|nav|navigation|menu|logo|top)\b/)) {
    sections.push('header')
  }
  
  // Hero/Main section keywords
  if (message_lower.match(/\b(hero|main|title|headline|tagline|banner|intro)\b/)) {
    sections.push('hero')
  }
  
  // Features section keywords
  if (message_lower.match(/\b(feature|benefit|service|card|grid)\b/)) {
    sections.push('features')
  }
  
  // Pricing section keywords
  if (message_lower.match(/\b(pric|plan|cost|package|tier|subscription)\b/)) {
    sections.push('pricing')
  }
  
  // Footer keywords
  if (message_lower.match(/\b(footer|bottom|contact|copyright|link)\b/)) {
    sections.push('footer')
  }
  
  // If no specific section identified, include all major sections
  if (sections.length === 0) {
    sections.push('hero', 'features', 'pricing')
  }
  
  return sections
}

/**
 * Extracts major sections from HTML based on common patterns
 */
export function extractHTMLSections(html: string): HTMLSection[] {
  const sections: HTMLSection[] = []
  
  // Define section patterns
  const sectionPatterns = [
    { name: 'header', regex: /<header[\s\S]*?<\/header>/gi },
    { name: 'hero', regex: /<section[^>]*class="[^"]*hero[^"]*"[\s\S]*?<\/section>/gi },
    { name: 'features', regex: /<section[^>]*class="[^"]*feature[^"]*"[\s\S]*?<\/section>/gi },
    { name: 'pricing', regex: /<section[^>]*id="pricing[^"]*"[\s\S]*?<\/section>/gi },
    { name: 'footer', regex: /<footer[\s\S]*?<\/footer>/gi }
  ]
  
  // Also look for sections by content patterns
  const contentPatterns = [
    { name: 'hero', regex: /<section[^>]*>[\s\S]*?<h1[\s\S]*?<\/h1>[\s\S]*?<\/section>/gi },
    { name: 'pricing', regex: /<section[^>]*>[\s\S]*?\$\d+[\s\S]*?<\/section>/gi }
  ]
  
  sectionPatterns.concat(contentPatterns).forEach(pattern => {
    let match
    while ((match = pattern.regex.exec(html)) !== null) {
      // Avoid duplicates
      if (!sections.find(s => s.name === pattern.name && s.startIndex === match.index)) {
        sections.push({
          name: pattern.name,
          content: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length
        })
      }
    }
  })
  
  return sections.sort((a, b) => a.startIndex - b.startIndex)
}

/**
 * Optimizes HTML by extracting CSS, scripts, and focusing on relevant sections
 */
export function optimizeHTMLForAI(html: string, targetSections?: string[]): OptimizedHTML {
  let optimizedHtml = html
  const cssBlocks: string[] = []
  const cssLinks: string[] = []
  const scriptBlocks: string[] = []
  
  // Extract CSS blocks
  const cssRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let match
  while ((match = cssRegex.exec(html)) !== null) {
    cssBlocks.push(match[1])
    optimizedHtml = optimizedHtml.replace(match[0], `<style>/* CSS_BLOCK_${cssBlocks.length - 1} */</style>`)
  }
  
  // Extract external CSS links
  const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*>/gi
  optimizedHtml = optimizedHtml.replace(linkRegex, (match) => {
    cssLinks.push(match)
    return `<!-- CSS_LINK_${cssLinks.length - 1} -->`
  })
  
  // Extract script tags
  const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>/gi
  optimizedHtml = optimizedHtml.replace(scriptRegex, (match) => {
    scriptBlocks.push(match)
    return `<!-- SCRIPT_BLOCK_${scriptBlocks.length - 1} -->`
  })
  
  // Extract sections
  const sections = extractHTMLSections(html)
  
  // If target sections specified, focus on those
  if (targetSections && targetSections.length > 0) {
    const relevantSections = sections.filter(s => targetSections.includes(s.name))
    if (relevantSections.length > 0) {
      // Create a focused HTML with just the relevant sections
      const focusedContent = relevantSections.map(s => s.content).join('\n\n')
      optimizedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sales Page</title>
  ${cssLinks.map((_, i) => `<!-- CSS_LINK_${i} -->`).join('\n  ')}
  ${cssBlocks.map((_, i) => `<style>/* CSS_BLOCK_${i} */</style>`).join('\n  ')}
</head>
<body>
${focusedContent}
${scriptBlocks.map((_, i) => `<!-- SCRIPT_BLOCK_${i} -->`).join('\n')}
</body>
</html>`
    }
  }
  
  const compressionRatio = Math.round((optimizedHtml.length / html.length) * 100)
  
  return {
    sections,
    cssBlocks,
    cssLinks,
    scriptBlocks,
    optimizedHtml,
    compressionRatio
  }
}

/**
 * Restores the original CSS and scripts to the optimized HTML
 */
export function restoreOptimizedHTML(
  optimizedHtml: string, 
  cssBlocks: string[], 
  cssLinks: string[], 
  scriptBlocks: string[]
): string {
  let restoredHtml = optimizedHtml
  
  // Restore CSS blocks
  cssBlocks.forEach((css, index) => {
    restoredHtml = restoredHtml.replace(
      `<style>/* CSS_BLOCK_${index} */</style>`,
      `<style>${css}</style>`
    )
  })
  
  // Restore CSS links
  cssLinks.forEach((link, index) => {
    restoredHtml = restoredHtml.replace(
      `<!-- CSS_LINK_${index} -->`,
      link
    )
  })
  
  // Restore script blocks
  scriptBlocks.forEach((script, index) => {
    restoredHtml = restoredHtml.replace(
      `<!-- SCRIPT_BLOCK_${index} -->`,
      script
    )
  })
  
  return restoredHtml
}

/**
 * Merges changes from a focused section back into the full HTML
 */
export function mergeChangesIntoFullHTML(
  originalHtml: string,
  modifiedSectionHtml: string,
  targetSections: string[]
): string {
  let mergedHtml = originalHtml
  const originalSections = extractHTMLSections(originalHtml)
  const modifiedSections = extractHTMLSections(modifiedSectionHtml)
  
  // Replace each target section with its modified version
  targetSections.forEach(sectionName => {
    const originalSection = originalSections.find(s => s.name === sectionName)
    const modifiedSection = modifiedSections.find(s => s.name === sectionName)
    
    if (originalSection && modifiedSection) {
      mergedHtml = mergedHtml.replace(originalSection.content, modifiedSection.content)
    }
  })
  
  return mergedHtml
}
