import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

interface CertificateInfo {
  passTypeIdentifier: string
  teamIdentifier: string
  subject: string
  issuer: string
  validFrom: string
  validTo: string
}

/**
 * Certificate validation utilities to ensure pass identifiers match certificates
 */
export class CertificateValidator {
  
  /**
   * Extract certificate information from a P12 file
   */
  static async extractCertificateInfo(p12Path: string, password: string): Promise<CertificateInfo> {
    const tempDir = path.join(process.cwd(), 'temp', `cert-extract-${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })
    
    try {
      const certPath = path.join(tempDir, 'cert.pem')
      
      // Extract certificate from P12
      execSync(`openssl pkcs12 -legacy -in "${p12Path}" -clcerts -nokeys -out "${certPath}" -passin pass:${password}`)
      
      // Get certificate details
      const subject = execSync(`openssl x509 -in "${certPath}" -noout -subject -nameopt RFC2253`, { encoding: 'utf8' }).trim()
      const issuer = execSync(`openssl x509 -in "${certPath}" -noout -issuer -nameopt RFC2253`, { encoding: 'utf8' }).trim()
      const dates = execSync(`openssl x509 -in "${certPath}" -noout -dates`, { encoding: 'utf8' }).trim()
      
      // Extract Pass Type ID and Team ID from subject
      const passTypeMatch = subject.match(/UID=([^,]+)/)
      const teamMatch = subject.match(/OU=([^,]+)/)
      
      if (!passTypeMatch || !teamMatch) {
        throw new Error('Could not extract Pass Type ID or Team ID from certificate subject')
      }
      
      const passTypeIdentifier = passTypeMatch[1]
      const teamIdentifier = teamMatch[1]
      
      // Parse dates
      const validFromMatch = dates.match(/notBefore=(.+)/)
      const validToMatch = dates.match(/notAfter=(.+)/)
      
      return {
        passTypeIdentifier,
        teamIdentifier,
        subject: subject.replace('subject=', ''),
        issuer: issuer.replace('issuer=', ''),
        validFrom: validFromMatch ? validFromMatch[1] : 'Unknown',
        validTo: validToMatch ? validToMatch[1] : 'Unknown'
      }
      
    } finally {
      // Clean up temp directory
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    }
  }
  
  /**
   * Validate that pass.json identifiers match the certificate
   */
  static validatePassIdentifiers(passJson: any, certInfo: CertificateInfo): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (passJson.passTypeIdentifier !== certInfo.passTypeIdentifier) {
      errors.push(`Pass Type ID mismatch: pass.json has "${passJson.passTypeIdentifier}" but certificate has "${certInfo.passTypeIdentifier}"`)
    }
    
    if (passJson.teamIdentifier !== certInfo.teamIdentifier) {
      errors.push(`Team ID mismatch: pass.json has "${passJson.teamIdentifier}" but certificate has "${certInfo.teamIdentifier}"`)
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Check if certificate is valid (not expired)
   */
  static isCertificateValid(certInfo: CertificateInfo): { valid: boolean; message: string } {
    try {
      const validFrom = new Date(certInfo.validFrom)
      const validTo = new Date(certInfo.validTo)
      const now = new Date()
      
      if (now < validFrom) {
        return {
          valid: false,
          message: `Certificate is not yet valid. Valid from: ${certInfo.validFrom}`
        }
      }
      
      if (now > validTo) {
        return {
          valid: false,
          message: `Certificate has expired. Valid until: ${certInfo.validTo}`
        }
      }
      
      return {
        valid: true,
        message: `Certificate is valid until ${certInfo.validTo}`
      }
      
    } catch (error) {
      return {
        valid: false,
        message: `Could not parse certificate dates: ${error}`
      }
    }
  }
  
  /**
   * Validate that the certificate is issued by Apple
   */
  static isAppleIssuedCertificate(certInfo: CertificateInfo): boolean {
    return certInfo.issuer.includes('Apple Worldwide Developer Relations Certification Authority')
  }
  
  /**
   * Get a human-readable summary of certificate info
   */
  static getCertificateSummary(certInfo: CertificateInfo): string {
    const validity = this.isCertificateValid(certInfo)
    const isApple = this.isAppleIssuedCertificate(certInfo)
    
    return `
Certificate Summary:
  Pass Type ID: ${certInfo.passTypeIdentifier}
  Team ID: ${certInfo.teamIdentifier}
  Subject: ${certInfo.subject}
  Issuer: ${certInfo.issuer}
  Valid From: ${certInfo.validFrom}
  Valid To: ${certInfo.validTo}
  Status: ${validity.valid ? '✅ Valid' : '❌ Invalid'} - ${validity.message}
  Apple Issued: ${isApple ? '✅ Yes' : '❌ No'}
    `.trim()
  }
}
