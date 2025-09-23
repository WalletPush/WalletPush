import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import forge from 'node-forge'

/**
 * Pure JavaScript P12 certificate extractor using node-forge
 * Avoids OpenSSL system dependency issues
 */
export class CertificateExtractor {
  
  /**
   * Extract certificate and private key from P12 file using node-forge
   * Based on GPT's recommended approach for Vercel compatibility
   */
  static extractP12(p12Path: string, password: string, outputDir: string): { certPath: string; keyPath: string } {
    console.log(`🔐 Extracting P12 certificate using node-forge: ${p12Path}`)
    
    try {
      // Read P12 file as buffer
      const p12Buffer = readFileSync(p12Path)
      
      // Extract using the GPT-recommended approach
      const { certPem, keyPem } = this.extractFromP12Buffer(p12Buffer, password)
      
      // Write to files
      const certPath = join(outputDir, 'pass-cert.pem')
      const keyPath = join(outputDir, 'pass-key.pem')
      
      writeFileSync(certPath, certPem)
      writeFileSync(keyPath, keyPem)
      
      console.log(`✅ Certificate extracted to: ${certPath}`)
      console.log(`✅ Private key extracted to: ${keyPath}`)
      
      return { certPath, keyPath }
      
    } catch (error) {
      console.error('❌ P12 extraction failed:', error)
      throw new Error(`P12 extraction failed: ${error instanceof Error ? error.message : error}`)
    }
  }

  /**
   * GPT's recommended pure Node.js P12 extraction function
   */
  private static extractFromP12Buffer(p12Buffer: Buffer, passphrase: string): { certPem: string; keyPem: string } {
    // p12Buffer is a Node Buffer of the .p12 file
    const der = forge.util.createBuffer(p12Buffer.toString('binary'))
    const asn1 = forge.asn1.fromDer(der)
    const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, passphrase)

    let certPem: string | null = null
    let keyPem: string | null = null

    for (const safeContent of p12.safeContents) {
      for (const bag of safeContent.safeBags) {
        if (bag.type === forge.pki.oids.certBag && !certPem) {
          certPem = forge.pki.certificateToPem(bag.cert!)
        }
        if (bag.type === forge.pki.oids.pkcs8ShroudedKeyBag && !keyPem) {
          keyPem = forge.pki.privateKeyToPem(bag.key!)
        }
      }
    }
    
    if (!certPem || !keyPem) {
      throw new Error('Failed to extract certificate or key from P12')
    }
    
    return { certPem, keyPem }
  }
}
