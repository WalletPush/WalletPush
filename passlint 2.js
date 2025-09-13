#!/usr/bin/env node

/**
 * PassLint - Apple Wallet .pkpass Security Validator
 * Ensures .pkpass files follow Apple Wallet best practices
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const FORBIDDEN_EXT = /\.(pem|key|p12|cer|crt|der)$/i
const FORBIDDEN_NAMES = /^(pass-(cert|key)\.pem|certificate\.p12|wwdr\.cer)$/i

function validatePkpass(pkpassPath) {
  console.log(`🔍 Validating: ${pkpassPath}`)
  
  try {
    // Extract to temp directory
    const tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'passlint-'))
    execSync(`unzip -q "${pkpassPath}" -d "${tempDir}"`)
    
    // Get file list
    const files = fs.readdirSync(tempDir)
    console.log(`📁 Files in pass:`, files)
    
    // Check for forbidden files
    const forbidden = files.filter(f => FORBIDDEN_EXT.test(f) || FORBIDDEN_NAMES.test(f))
    if (forbidden.length > 0) {
      console.error(`❌ SECURITY VIOLATION: Found forbidden files: ${forbidden.join(', ')}`)
      console.error(`   Certificates/keys must NEVER be inside .pkpass files`)
      return false
    }
    
    // Check required files
    const required = ['pass.json', 'manifest.json', 'signature']
    const missing = required.filter(f => !files.includes(f))
    if (missing.length > 0) {
      console.error(`❌ Missing required files: ${missing.join(', ')}`)
      return false
    }
    
    // Check pass.json
    const passJsonPath = path.join(tempDir, 'pass.json')
    const passJson = JSON.parse(fs.readFileSync(passJsonPath, 'utf8'))
    
    const forbiddenJsonKeys = [
      'certificate', 'certificatePem', 'privateKey', 'privateKeyPem',
      'p12', 'p12Base64', 'wwdr', 'wwdrCert', 'certificate_chain'
    ]
    
    const badKeys = forbiddenJsonKeys.filter(k => k in passJson)
    if (badKeys.length > 0) {
      console.error(`❌ SECURITY VIOLATION: Found forbidden JSON keys: ${badKeys.join(', ')}`)
      return false
    }
    
    // Check for icon
    const hasIcon = files.some(f => f.startsWith('icon.'))
    if (!hasIcon) {
      console.warn(`⚠️  No icon found - pass may not display properly`)
    }
    
    // Post-build security checks
    console.log(`🔍 Running post-build security checks...`)
    
    // Check 1: No forbidden files in ZIP listing
    try {
      const zipListing = execSync(`unzip -l "${pkpassPath}"`, { encoding: 'utf8' })
      const forbiddenInZip = zipListing.match(/\.(pem|cer|key|p12|crt|der)|__MACOSX|\.DS_Store/gi)
      if (forbiddenInZip) {
        console.error(`❌ SECURITY VIOLATION: Found forbidden files in ZIP: ${forbiddenInZip.join(', ')}`)
        return false
      }
    } catch (error) {
      console.error(`❌ Failed to check ZIP listing:`, error.message)
      return false
    }
    
    // Check 2: No certificate references in manifest.json
    try {
      const manifestPath = path.join(tempDir, 'manifest.json')
      const manifestContent = fs.readFileSync(manifestPath, 'utf8')
      const certRefsInManifest = manifestContent.match(/"[^"]+\.(pem|cer|key|p12|crt|der)"/gi)
      if (certRefsInManifest) {
        console.error(`❌ SECURITY VIOLATION: Found certificate references in manifest.json: ${certRefsInManifest.join(', ')}`)
        return false
      }
    } catch (error) {
      console.error(`❌ Failed to check manifest.json:`, error.message)
      return false
    }
    
    console.log(`✅ Pass validation PASSED`)
    console.log(`🔒 Security: No certificate/key leaks detected`)
    console.log(`📋 Structure: All required files present`)
    console.log(`🛡️ Post-build: ZIP and manifest security checks passed`)
    
    // Cleanup
    execSync(`rm -rf "${tempDir}"`)
    return true
    
  } catch (error) {
    console.error(`❌ Validation failed:`, error.message)
    return false
  }
}

// CLI usage
if (require.main === module) {
  const pkpassPath = process.argv[2]
  if (!pkpassPath) {
    console.log('Usage: node passlint.js <path-to-pass.pkpass>')
    process.exit(1)
  }
  
  const isValid = validatePkpass(pkpassPath)
  process.exit(isValid ? 0 : 1)
}

module.exports = { validatePkpass }
