import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import forge from 'node-forge'

/**
 * Pure Node.js PKCS#7 manifest signer using node-forge
 * Replaces: openssl smime -binary -sign -outform DER -md sha256
 * GPT's recommended Vercel-safe approach
 */
export class ManifestSigner {
  
  /**
   * Load Apple WWDR certificate (can be PEM or DER format)
   */
  private static loadAppleWWDRCert(appleWWDRPath: string): forge.pki.Certificate {
    const buf = readFileSync(appleWWDRPath)
    const text = buf.toString('utf8')
    
    if (text.includes('BEGIN CERTIFICATE')) {
      // PEM format
      return forge.pki.certificateFromPem(text)
    }
    
    // DER format (.cer file)
    const asn1 = forge.asn1.fromDer(forge.util.createBuffer(buf.toString('binary')))
    return forge.pki.certificateFromAsn1(asn1)
  }

  /**
   * Create a detached PKCS#7 signature (DER) over manifest.json
   * Mirrors: openssl smime -binary -sign -outform DER -md sha256
   */
  static async signManifest({
    manifestPath,
    certPem,
    keyPem,
    appleWWDRPath,
    outPath
  }: {
    manifestPath: string
    certPem: string
    keyPem: string
    appleWWDRPath: string
    outPath: string
  }): Promise<string> {
    
    console.log(`🔐 Signing manifest using node-forge: ${manifestPath}`)
    
    try {
      // Read manifest and load Apple WWDR certificate
      const manifestBuf = readFileSync(manifestPath)
      const wwdrCert = this.loadAppleWWDRCert(appleWWDRPath)
      
      // Parse signer materials
      const signerCert = forge.pki.certificateFromPem(certPem)
      const signerKey = forge.pki.privateKeyFromPem(keyPem)
      
      // Build PKCS#7 SignedData (detached)
      const p7 = forge.pkcs7.createSignedData()
      
      // Treat content as binary (equivalent to openssl -binary)
      p7.content = forge.util.createBuffer(manifestBuf.toString('binary'))
      
      // Include signer cert + Apple WWDR intermediate
      p7.addCertificate(signerCert)
      p7.addCertificate(wwdrCert)
      
      p7.addSigner({
        key: signerKey,
        certificate: signerCert,
        digestAlgorithm: forge.pki.oids.sha256, // -md sha256
        authenticatedAttributes: [
          { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
          { type: forge.pki.oids.messageDigest }, // forge fills this
          { type: forge.pki.oids.signingTime, value: new Date().toISOString() }
        ]
      })
      
      p7.sign({ detached: true })
      
      // Output DER (binary) like: -outform DER
      const derBytes = forge.asn1.toDer(p7.toAsn1()).getBytes()
      const derBuf = Buffer.from(derBytes, 'binary')
      
      writeFileSync(outPath, derBuf)
      
      console.log(`✅ Manifest signature created: ${outPath}`)
      return outPath
      
    } catch (error) {
      console.error('❌ Manifest signing failed:', error)
      throw new Error(`Manifest signing failed: ${error instanceof Error ? error.message : error}`)
    }
  }

  /**
   * Sign manifest with certificate and key file paths
   */
  static async signManifestWithFiles({
    manifestPath,
    certPath,
    keyPath,
    appleWWDRPath,
    outPath
  }: {
    manifestPath: string
    certPath: string
    keyPath: string
    appleWWDRPath: string
    outPath: string
  }): Promise<string> {
    
    // Read certificate and key PEM files
    const certPem = readFileSync(certPath, 'utf8')
    const keyPem = readFileSync(keyPath, 'utf8')
    
    return this.signManifest({
      manifestPath,
      certPem,
      keyPem,
      appleWWDRPath,
      outPath
    })
  }
}
