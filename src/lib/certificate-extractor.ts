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
   */
  static extractP12(p12Path: string, password: string, outputDir: string): { certPath: string; keyPath: string } {
    console.log(`🔐 Extracting P12 certificate using node-forge: ${p12Path}`)
    
    try {
      // Read P12 file
      const p12Buffer = readFileSync(p12Path)
      const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'))
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)
      
      // Find certificate and private key
      let certificate: forge.pki.Certificate | null = null
      let privateKey: forge.pki.PrivateKey | null = null
      
      // Extract certificate bags
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
      if (certBags[forge.pki.oids.certBag] && certBags[forge.pki.oids.certBag].length > 0) {
        certificate = certBags[forge.pki.oids.certBag][0].cert
        console.log('✅ Certificate found in P12')
      }
      
      // Extract private key bags
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
      if (keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] && keyBags[forge.pki.oids.pkcs8ShroudedKeyBag].length > 0) {
        privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key
        console.log('✅ Private key found in P12')
      }
      
      // Fallback: try other key bag types
      if (!privateKey) {
        const keyBags2 = p12.getBags({ bagType: forge.pki.oids.keyBag })
        if (keyBags2[forge.pki.oids.keyBag] && keyBags2[forge.pki.oids.keyBag].length > 0) {
          privateKey = keyBags2[forge.pki.oids.keyBag][0].key
          console.log('✅ Private key found in P12 (keyBag)')
        }
      }
      
      if (!certificate) {
        throw new Error('No certificate found in P12 file')
      }
      
      if (!privateKey) {
        throw new Error('No private key found in P12 file')
      }
      
      // Convert to PEM format
      const certPem = forge.pki.certificateToPem(certificate)
      const keyPem = forge.pki.privateKeyToPem(privateKey)
      
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
}
