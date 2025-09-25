#!/usr/bin/env ts-node

import * as fs from 'fs'
import * as path from 'path'

const HARDCODED_BUSINESS_ID = 'be023bdf-c668-4cec-ac51-65d3c02ea191'

// Files that need the import added
const filesToUpdateImports = [
  'src/app/api/business/custom-fields/route.ts',
  'src/app/api/business/custom-fields/[id]/route.ts',
  'src/app/api/business/field-mappings/route.ts',
  'src/app/api/business/chat-edit/route.ts',
  'src/app/api/business/automations/[id]/route.ts',
  'src/app/api/business-settings/route.ts',
  'src/app/api/templates/route.ts',
  'src/app/api/pass-type-ids/route.ts',
  'src/app/api/landing-pages/route.ts',
  'src/app/api/generate-landing-page/route.ts',
  'src/app/api/customer-signup/route.ts',
  'src/lib/pass-type-id-store.ts',
  'src/lib/dev-storage.ts'
]

// Replacement patterns for different scenarios
const replacements = [
  {
    // Pattern 1: Simple hardcoded assignment
    pattern: /const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'/g,
    replacement: 'const businessId = await getCurrentBusinessId(request)\n    \n    if (!businessId) {\n      return NextResponse.json({ error: \'No business found for current user\' }, { status: 404 })\n    }'
  },
  {
    // Pattern 2: Assignment with comment
    pattern: /\/\/ For now, use the Blue Karma business ID.*\n.*const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'/g,
    replacement: '// Get business ID dynamically\n    const businessId = await getCurrentBusinessId(request)\n    \n    if (!businessId) {\n      return NextResponse.json({ error: \'No business found for current user\' }, { status: 404 })\n    }'
  },
  {
    // Pattern 3: Fallback assignments
    pattern: /businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'/g,
    replacement: 'businessId = await getCurrentBusinessId(request)'
  },
  {
    // Pattern 4: Direct field assignments
    pattern: /business_id = 'be023bdf-c668-4cec-ac51-65d3c02ea191'/g,
    replacement: 'business_id = await getCurrentBusinessId(request) || \'be023bdf-c668-4cec-ac51-65d3c02ea191\''
  },
  {
    // Pattern 5: account_id assignments
    pattern: /account_id: 'be023bdf-c668-4cec-ac51-65d3c02ea191'/g,
    replacement: 'account_id: await getCurrentBusinessId(request) || \'be023bdf-c668-4cec-ac51-65d3c02ea191\''
  },
  {
    // Pattern 6: Fallback with comment
    pattern: /\/\/ Fallback.*business_id = 'be023bdf-c668-4cec-ac51-65d3c02ea191'/g,
    replacement: 'business_id = await getCurrentBusinessId(request) || \'be023bdf-c668-4cec-ac51-65d3c02ea191\' // Fallback for development'
  }
]

function addImportToFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check if import already exists
    if (content.includes('getCurrentBusinessId')) {
      console.log(`✓ Import already exists in ${filePath}`)
      return
    }
    
    // Find the line with createClient import
    const lines = content.split('\n')
    let importLineIndex = -1
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('import { createClient }')) {
        importLineIndex = i
        break
      }
    }
    
    if (importLineIndex !== -1) {
      // Add the new import after the createClient import
      lines.splice(importLineIndex + 1, 0, "import { getCurrentBusinessId } from '@/lib/business-context'")
      
      const newContent = lines.join('\n')
      fs.writeFileSync(filePath, newContent, 'utf8')
      console.log(`✓ Added import to ${filePath}`)
    } else {
      console.log(`⚠️ Could not find createClient import in ${filePath}`)
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error)
  }
}

function replaceInFile(filePath: string): void {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let hasChanges = false
    
    // Apply all replacement patterns
    for (const { pattern, replacement } of replacements) {
      const newContent = content.replace(pattern, replacement)
      if (newContent !== content) {
        content = newContent
        hasChanges = true
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✓ Updated hardcoded business IDs in ${filePath}`)
    } else {
      console.log(`- No changes needed in ${filePath}`)
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error)
  }
}

function findAllFilesWithHardcodedId(dir: string): string[] {
  const result: string[] = []
  
  function search(currentDir: string) {
    const items = fs.readdirSync(currentDir)
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        search(fullPath)
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8')
          if (content.includes(HARDCODED_BUSINESS_ID)) {
            result.push(fullPath)
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }
  
  search(dir)
  return result
}

function main() {
  console.log('🔍 Finding all files with hardcoded business ID...')
  
  const allFiles = findAllFilesWithHardcodedId('src')
  console.log(`📁 Found ${allFiles.length} files with hardcoded business ID:`)
  allFiles.forEach(file => console.log(`  - ${file}`))
  
  console.log('\n📝 Adding imports to specified files...')
  for (const file of filesToUpdateImports) {
    if (fs.existsSync(file)) {
      addImportToFile(file)
    } else {
      console.log(`⚠️ File not found: ${file}`)
    }
  }
  
  console.log('\n🔄 Replacing hardcoded business IDs...')
  for (const file of allFiles) {
    replaceInFile(file)
  }
  
  console.log('\n✅ Bulk replacement complete!')
}

if (require.main === module) {
  main()
}
