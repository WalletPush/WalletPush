import { PassTypeIDStore } from './pass-type-id-store'
import { extractPlaceholdersFromTemplate, validatePlaceholderMapping } from './placeholder-validator'
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
// @ts-ignore - archiver doesn't have TypeScript types
import archiver from 'archiver'
import forge from 'node-forge'

interface PassData {
  templateId: string
  formData: { [key: string]: string }
  userId?: string
  deviceType?: 'mobile' | 'desktop'
}

interface PassKitColors {
  backgroundColor?: string
  foregroundColor?: string
  labelColor?: string
}

interface PassKitField {
  key: string
  label?: string
  value: string
  textAlignment?: 'PKTextAlignmentLeft' | 'PKTextAlignmentCenter' | 'PKTextAlignmentRight'
  changeMessage?: string
}

interface PassKitBarcode {
  message: string
  format: 'PKBarcodeFormatQR' | 'PKBarcodeFormatPDF417' | 'PKBarcodeFormatAztec' | 'PKBarcodeFormatCode128'
  messageEncoding: 'iso-8859-1'
  altText?: string
}

export class PassKitGenerator {
  /**
   * Generate a .pkpass file from template and form data
   */
  static async generatePass(passData: PassData): Promise<Buffer> {
    const { templateId, formData, userId, deviceType } = passData

    // 1. Get the template from storage
    const template = await this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    // 2. Get the default Pass Type ID and certificate
    const passTypeID = await PassTypeIDStore.getDefault()
    if (!passTypeID) {
      throw new Error('No default Pass Type ID configured')
    }

    // 3. Validate placeholders
    const requiredPlaceholders = extractPlaceholdersFromTemplate(template.template_json)
    const validationResult = validatePlaceholderMapping(template.template_json, formData)
    
    if (!validationResult.isValid) {
      throw new Error(`Missing required data: ${validationResult.missingPlaceholders.join(', ')}`)
    }

    // 4. Create pass.json
    const passJson = await this.createPassJson(template, passTypeID, formData, userId, deviceType)

    // 5. Prepare pass assets
    const assets = await this.preparePassAssets(template)

    // 6. Generate the .pkpass file
    const pkpassBuffer = await this.createPkpassFile(passJson, assets, passTypeID)

    return pkpassBuffer
  }

  /**
   * Get template from storage (simulated for now)
   */
  private static async getTemplate(templateId: string) {
    // In production, this would fetch from your templates store
    // For now, we'll simulate with a basic structure
    return {
      id: templateId,
      template_json: {
        name: 'Sample Pass',
        passStyle: 'storeCard',
        description: 'Sample loyalty pass',
        fields: [
          {
            key: 'member',
            label: 'Member',
            value: '${First_Name} ${Last_Name}',
            textAlignment: 'left'
          },
          {
            key: 'points',
            label: 'Points',
            value: '${Points}',
            textAlignment: 'right'
          }
        ],
        colors: {
          backgroundColor: '#1a1a1a',
          foregroundColor: '#ffffff',
          labelColor: '#cccccc'
        },
        barcodes: [
          {
            message: '${Email}',
            format: 'PKBarcodeFormatQR',
            messageEncoding: 'iso-8859-1',
            altText: '${Email}'
          }
        ]
      }
    }
  }

  /**
   * Create the pass.json content
   */
  private static async createPassJson(
    template: any,
    passTypeID: any,
    formData: { [key: string]: string },
    userId?: string,
    deviceType?: string
  ) {
    const serialNumber = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const templateData = template.template_json

    // Process fields and replace placeholders
    const processedFields = templateData.fields?.map((field: any) => ({
      key: field.key,
      label: field.label || field.key,
      value: this.replacePlaceholders(field.value || '', formData),
      textAlignment: field.textAlignment || 'PKTextAlignmentLeft',
      changeMessage: field.changeMessage ? this.replacePlaceholders(field.changeMessage, formData) : undefined
    })) || []

    // Process barcodes
    const processedBarcodes = templateData.barcodes?.map((barcode: any) => ({
      message: this.replacePlaceholders(barcode.message || '', formData),
      format: barcode.format || 'PKBarcodeFormatQR',
      messageEncoding: barcode.messageEncoding || 'iso-8859-1',
      altText: barcode.altText ? this.replacePlaceholders(barcode.altText, formData) : undefined
    })) || []

    // Create the pass.json structure
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: passTypeID.identifier,
      serialNumber: serialNumber,
      teamIdentifier: passTypeID.team_identifier,
      organizationName: 'WalletPush',
      description: this.replacePlaceholders(templateData.description || 'Digital Pass', formData),
      
      // Pass style specific content
      ...(templateData.passStyle === 'storeCard' && {
        storeCard: {
          headerFields: processedFields.filter((f: any) => f.key.includes('header')),
          primaryFields: processedFields.filter((f: any) => f.key.includes('primary') || f.key === 'member'),
          secondaryFields: processedFields.filter((f: any) => f.key.includes('secondary') || f.key === 'points'),
          auxiliaryFields: processedFields.filter((f: any) => f.key.includes('auxiliary')),
          backFields: processedFields.filter((f: any) => f.key.includes('back'))
        }
      }),

      ...(templateData.passStyle === 'generic' && {
        generic: {
          headerFields: processedFields.filter((f: any) => f.key.includes('header')),
          primaryFields: processedFields.filter((f: any) => f.key.includes('primary')),
          secondaryFields: processedFields.filter((f: any) => f.key.includes('secondary')),
          auxiliaryFields: processedFields.filter((f: any) => f.key.includes('auxiliary')),
          backFields: processedFields.filter((f: any) => f.key.includes('back'))
        }
      }),

      // Colors
      backgroundColor: templateData.colors?.backgroundColor || '#1a1a1a',
      foregroundColor: templateData.colors?.foregroundColor || '#ffffff',
      labelColor: templateData.colors?.labelColor || '#cccccc',

      // Barcodes
      barcodes: processedBarcodes,

      // Web service URLs (for updates)
      webServiceURL: process.env.NEXT_PUBLIC_SITE_URL || 'https://app.walletpush.io',
      authenticationToken: serialNumber,

      // User info for tracking
      userInfo: {
        userId: userId || 'anonymous',
        templateId: template.id,
        deviceType: deviceType || 'unknown',
        createdAt: new Date().toISOString()
      }
    }

    return passJson
  }

  /**
   * Replace placeholders in text with actual values
   */
  private static replacePlaceholders(text: string, formData: { [key: string]: string }): string {
    let result = text
    
    // Replace ${PlaceholderName} with actual values
    for (const [key, value] of Object.entries(formData)) {
      const placeholder = `\${${key}}`
      result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value || '')
    }
    
    return result
  }

  /**
   * Prepare pass assets (icons, logos, etc.)
   */
  private static async preparePassAssets(template: any) {
    const assets: { [filename: string]: Buffer } = {}

    // For now, we'll create placeholder assets
    // In production, these would come from your template's stored images
    
    // Create a simple icon (required by Apple)
    const iconSvg = `
      <svg width="58" height="58" viewBox="0 0 58 58" xmlns="http://www.w3.org/2000/svg">
        <rect width="58" height="58" fill="#1a1a1a" rx="8"/>
        <text x="29" y="35" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">WP</text>
      </svg>
    `
    
    // Convert SVG to PNG buffer (simplified - in production use a proper image library)
    assets['icon.png'] = Buffer.from(iconSvg)
    assets['icon@2x.png'] = Buffer.from(iconSvg)
    assets['icon@3x.png'] = Buffer.from(iconSvg)

    // Add logo if available
    if (template.template_json.images?.logo) {
      // In production, load the actual logo file
      assets['logo.png'] = Buffer.from('placeholder-logo-data')
      assets['logo@2x.png'] = Buffer.from('placeholder-logo-data')
      assets['logo@3x.png'] = Buffer.from('placeholder-logo-data')
    }

    return assets
  }

  /**
   * Create the final .pkpass file
   */
  private static async createPkpassFile(
    passJson: any,
    assets: { [filename: string]: Buffer },
    passTypeID: any
  ): Promise<Buffer> {
    // 1. Create manifest with checksums
    const manifest: { [filename: string]: string } = {}
    
    // Add pass.json to manifest
    const passJsonBuffer = Buffer.from(JSON.stringify(passJson))
    manifest['pass.json'] = createHash('sha1').update(passJsonBuffer).digest('hex')
    
    // Add assets to manifest
    for (const [filename, buffer] of Object.entries(assets)) {
      manifest[filename] = createHash('sha1').update(buffer).digest('hex')
    }

    // 2. Create and sign the manifest
    const manifestBuffer = Buffer.from(JSON.stringify(manifest))
    const signature = await this.signManifest(manifestBuffer, passTypeID)

    // 3. Create the .pkpass archive
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } })
      const chunks: Buffer[] = []

      archive.on('data', (chunk: Buffer) => chunks.push(chunk))
      archive.on('end', () => resolve(Buffer.concat(chunks)))
      archive.on('error', reject)

      // Add files to archive
      archive.append(passJsonBuffer, { name: 'pass.json' })
      archive.append(manifestBuffer, { name: 'manifest.json' })
      archive.append(signature, { name: 'signature' })

      // Add assets
      for (const [filename, buffer] of Object.entries(assets)) {
        archive.append(buffer, { name: filename })
      }

      archive.finalize()
    })
  }

  /**
   * Sign the manifest using the Pass Type ID certificate
   */
  private static async signManifest(manifestBuffer: Buffer, passTypeID: any): Promise<Buffer> {
    // For now, return a mock signature
    // In production, this would use the actual certificate to sign the manifest
    
    console.log(`Signing manifest with Pass Type ID: ${passTypeID.identifier}`)
    console.log(`Certificate: ${passTypeID.certificate_file_name}`)
    
    // Mock signature - in production this would be:
    // 1. Load the certificate from secure storage
    // 2. Use forge or another crypto library to sign the manifest
    // 3. Return the proper PKCS#7 signature
    
    const mockSignature = Buffer.from('MOCK_SIGNATURE_FOR_DEVELOPMENT')
    return mockSignature
  }

  /**
   * Generate a URL for downloading the pass
   */
  static generatePassUrl(serialNumber: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    return `${baseUrl}/api/passes/${serialNumber}/download`
  }
}
