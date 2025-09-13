import { execSync } from 'child_process'
import { writeFileSync, readFileSync, mkdtempSync, existsSync, unlinkSync, readdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import * as crypto from 'crypto'

// APPLE WALLET SECURITY: Forbidden files that must NEVER be in .pkpass
const FORBIDDEN_EXT = /\.(pem|key|p12|cer|crt|der)$/i
const FORBIDDEN_NAMES = /^(pass-(cert|key)\.pem|certificate\.p12|wwdr\.cer)$/i

/**
 * Proper Apple Pass signing using the exact recipe that worked
 * Based on the successful ChatGPT solution
 */
export class ProperAppleSigning {
  
  /**
   * SECURITY GUARD: Assert no forbidden certificate/key files in payload
   */
  static assertNoForbiddenFiles(fileNames: string[]): void {
    const bad = fileNames.filter(f => FORBIDDEN_EXT.test(f) || FORBIDDEN_NAMES.test(f))
    if (bad.length) {
      throw new Error(`❌ SECURITY VIOLATION: Forbidden files in pass payload: ${bad.join(', ')}. Certificates/keys must NEVER be inside the .pkpass`)
    }
  }
  
  /**
   * Build manifest.json with SHA-1 hashes of all files except manifest.json and signature
   */
  static buildManifest(passDir: string): { [key: string]: string } {
    const fs = require('fs')
    const path = require('path')
    
    const files = fs.readdirSync(passDir).filter((f: string) => 
      f !== 'manifest.json' && f !== 'signature'
    )
    
    const manifest: { [key: string]: string } = {}
    
    for (const file of files) {
      const filePath = path.join(passDir, file)
      const fileBuffer = fs.readFileSync(filePath)
      const hash = crypto.createHash('sha1').update(fileBuffer).digest('hex')
      manifest[file] = hash
    }
    
    return manifest
  }

  /**
   * Extract certificate and private key from .p12 file
   */
  static extractP12Certificate(p12Path: string, password: string, outputDir: string) {
    console.log(`🔐 Extracting certificate from: ${p12Path}`)
    
    const certPath = join(outputDir, 'pass-cert.pem')
    const keyPath = join(outputDir, 'pass-key.pem')
    
    try {
      // Extract leaf certificate (use -legacy for modern OpenSSL)
      execSync(`openssl pkcs12 -legacy -in "${p12Path}" -clcerts -nokeys -out "${certPath}" -passin pass:${password}`)
      
      // Extract private key (unencrypted)
      execSync(`openssl pkcs12 -legacy -in "${p12Path}" -nocerts -nodes -out "${keyPath}" -passin pass:${password}`)
      
      console.log(`✅ Certificate extracted to: ${certPath}`)
      console.log(`✅ Private key extracted to: ${keyPath}`)
      
      return { certPath, keyPath }
      
    } catch (error) {
      console.error('❌ Failed to extract P12 certificate:', error)
      throw new Error(`P12 extraction failed: ${error}`)
    }
  }

  /**
   * Sign manifest.json with PKCS#7 detached signature
   */
  static signManifest(
    manifestPath: string, 
    certPath: string, 
    keyPath: string, 
    wwdrPath: string,
    outputPath: string
  ) {
    console.log(`🔏 Signing manifest with PKCS#7 detached signature`)
    
    try {
      const cmd = [
        'openssl', 'smime',
        '-binary',
        '-sign',
        '-signer', certPath,
        '-inkey', keyPath,
        '-certfile', wwdrPath,
        '-in', manifestPath,
        '-out', outputPath,
        '-outform', 'DER',
        '-md', 'sha256'
      ].join(' ')
      
      console.log(`📋 Signing command: ${cmd}`)
      execSync(cmd)
      
      const signatureSize = readFileSync(outputPath).length
      console.log(`✅ PKCS#7 signature created: ${signatureSize} bytes`)
      
      return signatureSize
      
    } catch (error) {
      console.error('❌ Failed to sign manifest:', error)
      throw new Error(`Manifest signing failed: ${error}`)
    }
  }

  /**
   * Verify the signature locally (OpenSSL verification)
   */
  static verifySignature(
    signaturePath: string,
    manifestPath: string,
    wwdrPath: string
  ): boolean {
    console.log(`🔍 Verifying PKCS#7 signature locally`)
    
    try {
      // Get Apple root certificates
      execSync('security find-certificate -a -p /System/Library/Keychains/SystemRootCertificates.keychain > /tmp/apple_roots.pem')
      
      const cmd = [
        'openssl', 'smime',
        '-verify',
        '-in', signaturePath,
        '-inform', 'DER',
        '-content', manifestPath,
        '-certfile', wwdrPath,
        '-CAfile', '/tmp/apple_roots.pem',
        '-purpose', 'any',
        '-out', '/tmp/verify_output'
      ].join(' ')
      
      execSync(cmd)
      console.log(`✅ Signature verification successful`)
      return true
      
    } catch (error) {
      console.error('❌ Signature verification failed:', error)
      return false
    }
  }

  /**
   * Create a properly signed .pkpass file using the exact working recipe
   */
  static async createSignedPass(
    passData: {
      passJson: any,
      images: { [filename: string]: Buffer }
    },
    p12Path: string,
    p12Password: string,
    wwdrPath: string
  ): Promise<Buffer> {
    
    console.log(`🎯 Creating properly signed .pkpass`)
    
    // Create temporary directory for pass payload (ONLY pass files)
    const payloadDir = mkdtempSync(join(tmpdir(), 'pkpass-payload-'))
    // Create separate directory for certificates (NEVER included in pass)
    const certDir = mkdtempSync(join(tmpdir(), 'pkpass-certs-'))
    
    try {
      // 1. Write ONLY pass payload files (no certificates!)
      writeFileSync(join(payloadDir, 'pass.json'), JSON.stringify(passData.passJson, null, 2))
      
      for (const [filename, buffer] of Object.entries(passData.images)) {
        writeFileSync(join(payloadDir, filename), buffer)
      }
      
      // 2. Build manifest.json from payload files ONLY
      console.log(`📋 Building manifest.json with SHA-1 hashes`)
      const manifest = this.buildManifest(payloadDir)
      writeFileSync(join(payloadDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
      
      // 3. Extract certificate and private key to SEPARATE directory (never in payload)
      const { certPath, keyPath } = this.extractP12Certificate(p12Path, p12Password, certDir)
      
      // 4. Sign manifest.json (PKCS#7, detached, DER, include WWDR)
      const signaturePath = join(payloadDir, 'signature')
      const manifestPath = join(payloadDir, 'manifest.json')
      
      this.signManifest(manifestPath, certPath, keyPath, wwdrPath, signaturePath)
      
      // 5. Verify signature locally
      const isValid = this.verifySignature(signaturePath, manifestPath, wwdrPath)
      if (!isValid) {
        throw new Error('Signature verification failed')
      }
      
      // 6. CRITICAL SECURITY CHECK: Verify no forbidden files in payload
      const payloadFiles = readdirSync(payloadDir)
      this.assertNoForbiddenFiles(payloadFiles)
      console.log(`🔒 Security check passed: No certificate/key files in payload`)
      
      // 7. Create ZIP file (files at ROOT, strip Mac metadata)
      console.log(`📦 Creating ZIP archive with proper structure`)
      const zipPath = join(payloadDir, '..', `signed-${Date.now()}.pkpass`)
      
      execSync(`cd "${payloadDir}" && zip -r -X "${zipPath}" .`)
      
      const zipBuffer = readFileSync(zipPath)
      console.log(`✅ Signed .pkpass created: ${zipBuffer.length} bytes`)
      
      return zipBuffer
      
    } finally {
      // Cleanup temp directories
      try {
        execSync(`rm -rf "${payloadDir}"`)
        execSync(`rm -rf "${certDir}"`)
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temp directories:', cleanupError)
      }
    }
  }

  /**
   * Validate that pass.json identifiers match the certificate
   */
  static validatePassIdentifiers(passJson: any, certPath: string): boolean {
    console.log(`🔍 Validating pass identifiers against certificate`)
    
    try {
      // Extract certificate details
      const certText = execSync(`openssl x509 -in "${certPath}" -text -noout`).toString()
      
      // Extract Team ID and Pass Type ID from certificate
      const teamIdMatch = certText.match(/OU=([A-Z0-9]{10})/)
      const passTypeMatch = certText.match(/CN=Pass Type ID: (.+?)(?:,|$)/)
      
      if (!teamIdMatch || !passTypeMatch) {
        console.error('❌ Could not extract identifiers from certificate')
        return false
      }
      
      const certTeamId = teamIdMatch[1]
      const certPassTypeId = passTypeMatch[1]
      
      console.log(`📋 Certificate Team ID: ${certTeamId}`)
      console.log(`📋 Certificate Pass Type ID: ${certPassTypeId}`)
      console.log(`📋 Pass JSON Team ID: ${passJson.teamIdentifier}`)
      console.log(`📋 Pass JSON Pass Type ID: ${passJson.passTypeIdentifier}`)
      
      const teamIdMatches = passJson.teamIdentifier === certTeamId
      const passTypeMatches = passJson.passTypeIdentifier === certPassTypeId
      
      if (!teamIdMatches) {
        console.error(`❌ Team ID mismatch: pass.json has "${passJson.teamIdentifier}", cert has "${certTeamId}"`)
      }
      
      if (!passTypeMatches) {
        console.error(`❌ Pass Type ID mismatch: pass.json has "${passJson.passTypeIdentifier}", cert has "${certPassTypeId}"`)
      }
      
      return teamIdMatches && passTypeMatches
      
    } catch (error) {
      console.error('❌ Failed to validate pass identifiers:', error)
      return false
    }
  }
}

