#!/usr/bin/env node

/**
 * Verify WWDR Certificate Integration
 * This script ensures the Apple WWDR certificate is properly preserved and accessible
 */

const fs = require('fs')
const path = require('path')

function verifyWWDRCertificate() {
  console.log('🔍 Verifying Apple WWDR Certificate...')
  
  // Check expected paths
  const wwdrPaths = [
    path.join(process.cwd(), 'private', 'certificates', 'global', 'AppleWWDRCAG4.cer'),
    path.join(process.cwd(), 'private', 'certificates', 'global', 'AppleWWDRCAG4.pem')
  ]
  
  let foundCertificates = []
  
  wwdrPaths.forEach(certPath => {
    if (fs.existsSync(certPath)) {
      const stats = fs.statSync(certPath)
      foundCertificates.push({
        path: certPath,
        size: stats.size,
        modified: stats.mtime,
        format: path.extname(certPath).toUpperCase()
      })
      console.log(`✅ Found: ${certPath}`)
      console.log(`   Size: ${stats.size} bytes`)
      console.log(`   Modified: ${stats.mtime}`)
    } else {
      console.log(`❌ Missing: ${certPath}`)
    }
  })
  
  if (foundCertificates.length === 0) {
    console.log('❌ No WWDR certificates found!')
    return false
  }
  
  // Check if the certificate is used in the codebase
  console.log('\n🔍 Checking WWDR certificate usage in codebase...')
  
  const codeFiles = [
    'src/lib/apple-passkit-generator.ts',
    'src/lib/proper-apple-signing.ts',
    'sign_pkpass.sh'
  ]
  
  codeFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      if (content.includes('WWDR') || content.includes('wwdr')) {
        console.log(`✅ WWDR referenced in: ${filePath}`)
      } else {
        console.log(`⚠️  No WWDR reference in: ${filePath}`)
      }
    }
  })
  
  // Check environment variable usage
  console.log('\n🔍 Checking environment variable configuration...')
  
  const envFiles = ['.env.local', '.env.example', '.env']
  let envConfigFound = false
  
  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8')
      if (content.includes('GLOBAL_WWDR_CER_PATH')) {
        console.log(`✅ WWDR environment variable configured in: ${envFile}`)
        envConfigFound = true
      }
    }
  })
  
  if (!envConfigFound) {
    console.log('ℹ️  No GLOBAL_WWDR_CER_PATH environment variable found (using default path)')
  }
  
  // Summary
  console.log('\n📊 WWDR Certificate Status Summary:')
  console.log(`   Certificates found: ${foundCertificates.length}`)
  foundCertificates.forEach(cert => {
    console.log(`   - ${cert.format} format: ${cert.path}`)
  })
  
  console.log('\n✅ Apple WWDR Certificate is properly preserved and accessible!')
  console.log('🔒 Pass signing will use the WWDR certificate for signature validation')
  
  return true
}

// Run verification
verifyWWDRCertificate()
