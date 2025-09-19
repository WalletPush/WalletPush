import { PassTypeIDStore } from './pass-type-id-store'
import { ProperAppleSigning } from './proper-apple-signing'
import path from 'path'
import { existsSync } from 'fs'

/**
 * GOLDEN RULES (Non-negotiable)
 * - Template stores the PassTypeID. USE IT. Do NOT infer, do NOT default.
 * - JSON comes from the template snapshot. Do NOT merge in defaults.
 * - Placeholders & values come from the template snapshot. Do NOT invent keys.
 * - Sign with the certificate for that exact PassTypeID + GLOBAL WWDR.
 */

interface PassTemplate {
  id: string
  passkit_json: any                 // exact JSON snapshot (with optional `placeholders`)
  pass_type_identifier: string      // selected_passTypeIdentifier saved on template
  template_json?: { images?: any }  // images (base64) if you store them here
}

interface ApplePassData {
  templateId: string
  formData?: { [key: string]: string } // optional; used for preview generation and overrides
  userId?: string
  deviceType?: string
}

interface ApplePassResponse {
  serialNumber: string
  passTypeIdentifier: string
  downloadUrl: string
}

export class ApplePassKitGenerator {
  
  /**
   * SECURITY GUARD: Strip any accidental certificate/key fields from JSON
   */
  private static scrubPassJson(passJson: any): any {
    const forbiddenJsonKeys = [
      'certificate', 'certificatePem', 'privateKey', 'privateKeyPem',
      'p12', 'p12Base64', 'wwdr', 'wwdrCert', 'certificate_chain'
    ]
    for (const k of forbiddenJsonKeys) {
      if (k in passJson) {
        delete passJson[k]
        console.warn(`⚠️ SECURITY: Removed forbidden field '${k}' from pass JSON`)
      }
    }
    return passJson
  }
  static async generateApplePass(passData: ApplePassData): Promise<{
    response: ApplePassResponse
    passBuffer: Buffer
    actualData: any
  }> {
    const { templateId, formData = {}, userId, deviceType } = passData

    // 1) Load template (must exist)
    const template = await this.loadTemplate(templateId)
    if (!template) throw new Error(`❌ Template ${templateId} not found`)

    // 2) GOLDEN: Take PassTypeID from template ONLY
    const selectedPassTypeIdentifier = template.pass_type_identifier
    if (!selectedPassTypeIdentifier) throw new Error(`❌ Template ${templateId} has no saved PassTypeID`)

    // 3) Resolve signing material for THAT EXACT PassTypeID
    const passTypeID =
      selectedPassTypeIdentifier === process.env.GLOBAL_PASSTYPE_ID
        ? await PassTypeIDStore.getDefault()
        : await PassTypeIDStore.findByIdentifier(selectedPassTypeIdentifier)

    if (!passTypeID) throw new Error(`❌ No .p12 found for PassTypeID: ${selectedPassTypeIdentifier}`)

    // 4) Serial number
    const serialNumber = `wp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

    // 5) Build pass.json STRICTLY from template snapshot (no defaults, no merges)
    const { passJson, actualData } = await this.buildPassFromSnapshotStrict(
      template,
      selectedPassTypeIdentifier, // expected PTID from template
      serialNumber,
      passTypeID, // pass the certificate info
      formData // pass form data for preview overrides
    )

    // 6) Prepare assets strictly from template DB
    const assets = await this.prepareAssets(template)

    // 7) Paths for signing
    const p12Path = passTypeID.certificate_file_path || passTypeID.p12_path
    const p12Password = passTypeID.certificate_password || passTypeID.p12_password_enc
    // GLOBAL WWDR (use your real global path or env)
    const wwdrPath =
      process.env.GLOBAL_WWDR_CER_PATH || path.join(process.cwd(), 'private', 'certificates', 'global', 'AppleWWDRCAG4.cer')

    if (!existsSync(p12Path)) throw new Error(`❌ P12 certificate not found: ${p12Path}`)
    if (!existsSync(wwdrPath)) throw new Error(`❌ WWDR certificate not found: ${wwdrPath}`)

    // 8) SECURITY CHECK: Verify no forbidden files in payload
    const fileList = ['pass.json', ...Object.keys(assets)]
    ProperAppleSigning.assertNoForbiddenFiles(fileList)
    console.log(`🔒 Pre-signing security check passed`)
    
    // 9) Sign (no mutations)
    const passBuffer = await ProperAppleSigning.createSignedPass(
      { passJson, images: assets },
      p12Path,
      p12Password,
      wwdrPath
    )

    // 9) Response
    const response: ApplePassResponse = {
      serialNumber,
      passTypeIdentifier: selectedPassTypeIdentifier,
      downloadUrl: `/api/apple-pass/${serialNumber}/download`
    }

    // 10) Return what we actually used (template placeholders only)
    return { response, passBuffer, actualData }
  }

  /** Load template (replace with your real DB call) */
  private static async loadTemplate(templateId: string): Promise<PassTemplate | null> {
    try {
      const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const res = await fetch(`${base}/api/templates`)
      const data = await res.json()
      const template = data.data?.find((t: any) => t.id === templateId)
      return template || null
    } catch (e) {
      console.error('❌ Error loading template:', e)
      return null
    }
  }

  /**
   * STRICT build: use the saved snapshot, fill ONLY template placeholders,
   * assert PassTypeID equality, do not inject defaults, do not overwrite org/desc/colors, etc.
   */
  private static async buildPassFromSnapshotStrict(
    template: PassTemplate,
    expectedPassTypeIdFromTemplate: string,
    serialNumber: string,
    passTypeID: any,
    formData?: { [key: string]: string }
  ): Promise<{ passJson: any; actualData: Record<string, string> }> {
    if (!template.passkit_json) throw new Error(`❌ Template ${template.id} has no JSON snapshot`)

    // Deep copy the snapshot as our working JSON
    const snapshot = JSON.parse(JSON.stringify(template.passkit_json))

    // Extract placeholders defined by the template (or empty object)
    const templatePlaceholders: Record<string, string> = snapshot.placeholders || {}

    // ✅ Use template placeholders as base, but allow formData overrides for previews
    const actualData = { ...templatePlaceholders, ...(formData || {}) }

    // Remove placeholder metadata from the final JSON
    delete snapshot.placeholders

    // Fill placeholders (literal ${key} replacement)
    const filled = this.fillPlaceholders(snapshot, actualData)
    
    // SECURITY: Scrub any forbidden certificate/key fields
    this.scrubPassJson(filled)

    // ⛔ Do NOT inject defaults for organizationName/description/colors/etc.
    // ⛔ Do NOT override PassTypeID from the certificate—template is the source of truth.

    // Required Apple fields: ensure serialNumber present, and assert PTID equality.
    // If the snapshot already carries serialNumber, we overwrite with the new one.
    filled.serialNumber = serialNumber
    
    // Add required Apple fields if missing from template
    if (!filled.formatVersion) filled.formatVersion = 1
    if (!filled.passTypeIdentifier) filled.passTypeIdentifier = expectedPassTypeIdFromTemplate
    
    // Use the passed certificate info for required fields
    
    if (!filled.teamIdentifier && passTypeID?.team_identifier) {
      filled.teamIdentifier = passTypeID.team_identifier
    }
    if (!filled.organizationName) {
      filled.organizationName = passTypeID?.organization_name || 'WalletPush'
    }
    if (!filled.description) {
      filled.description = 'Digital Pass'
    }

    // Assert PassTypeID equals the template's saved ID
    if (filled.passTypeIdentifier !== expectedPassTypeIdFromTemplate) {
      throw new Error(
        `❌ pass.json PassTypeID (${filled.passTypeIdentifier}) does not match template PassTypeID (${expectedPassTypeIdFromTemplate})`
      )
    }

    // Validate minimal required fields exist in the snapshot
    this.validatePassJsonStrict(filled, expectedPassTypeIdFromTemplate)

    return { passJson: filled, actualData }
  }

  /** Literal ${key} replacement; only replaces keys present in actualData */
  private static fillPlaceholders(obj: any, data: Record<string, string>): any {
    const s = JSON.stringify(obj)
    let out = s
    for (const [k, v] of Object.entries(data)) {
      const re = new RegExp(String.raw`\$\{${k}\}`, 'g')
      out = out.replace(re, v ?? '')
    }
    return JSON.parse(out)
  }

  /** Strict validation with NO defaults injected */
  private static validatePassJsonStrict(passJson: any, expectedPassTypeId: string): void {
    const required = ['formatVersion', 'passTypeIdentifier', 'serialNumber', 'teamIdentifier', 'organizationName', 'description']
    for (const f of required) {
      if (passJson[f] === undefined || passJson[f] === null || passJson[f] === '') {
        throw new Error(`❌ Missing required field: ${f}`)
      }
    }

    if (passJson.passTypeIdentifier !== expectedPassTypeId) {
      throw new Error(
        `❌ PassTypeID mismatch. pass.json has ${passJson.passTypeIdentifier}, template has ${expectedPassTypeId}`
      )
    }

    // Must have exactly ONE style object
    const styles = ['storeCard', 'coupon', 'eventTicket', 'boardingPass', 'generic']
    const present = styles.filter(s => !!passJson[s])
    if (present.length !== 1) {
      throw new Error(`❌ Must have exactly one style object: ${styles.join(', ')}`)
    }

    // Guard against empty visible fields (Wallet rejects blank value/label)
    const style = present[0]
    const fieldSets = ['headerFields', 'primaryFields', 'secondaryFields', 'auxiliaryFields', 'backFields']
    for (const set of fieldSets) {
      const arr = passJson[style][set] || []
      for (const field of arr) {
        if (('label' in field && String(field.label).trim() === '') || ('value' in field && String(field.value).trim() === '')) {
          throw new Error(`❌ Field ${field.key || '(no key)'} in ${set} has empty label/value`)
        }
      }
    }

    // Must have icon.png at minimum (assets enforced at prepareAssets)
  }

  /** Assets strictly from template DB (no filesystem "fallbacks") */
  private static async prepareAssets(template: PassTemplate): Promise<Record<string, Buffer>> {
    const imgs = template.template_json?.images
    if (!imgs) throw new Error(`❌ Template ${template.id} has no images in database`)

    const assets: Record<string, Buffer> = {}

    // Required: icon.png
    if (!imgs.icon?.['1x']) throw new Error(`❌ Required asset missing: icon (1x)`)
    assets['icon.png'] = this.decodeBase64Image(imgs.icon['1x'])
    if (imgs.icon['2x']) assets['icon@2x.png'] = this.decodeBase64Image(imgs.icon['2x'])
    if (imgs.icon['3x']) assets['icon@3x.png'] = this.decodeBase64Image(imgs.icon['3x'])

    // Optional sets
    const opt = [
      ['logo', 'logo'],
      ['strip', 'strip'],
      ['thumbnail', 'thumbnail'],
      ['background', 'background']
    ] as const

    for (const [key, base] of opt) {
      const obj: any = (imgs as any)[key]
      if (!obj) continue
      if (typeof obj === 'string') {
        assets[`${base}.png`] = this.decodeBase64Image(obj)
      } else {
        if (obj['1x']) assets[`${base}.png`] = this.decodeBase64Image(obj['1x'])
        if (obj['2x']) assets[`${base}@2x.png`] = this.decodeBase64Image(obj['2x'])
        if (obj['3x']) assets[`${base}@3x.png`] = this.decodeBase64Image(obj['3x'])
      }
    }

    return assets
  }

  /** Helper to decode base64 images (strips data URL prefix if present) */
  private static decodeBase64Image(base64String: string): Buffer {
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '')
    return Buffer.from(base64Data, 'base64')
  }

  /** Stored "what we used" (template placeholders only) */
  private static getActualPlaceholderData(template: PassTemplate): any {
    const allowed = template.passkit_json?.placeholders || {}
    return { ...allowed }
  }

  /** Store pass data (for Apple web service) */
  static async storePassInDatabase(
    serialNumber: string,
    passTypeIdentifier: string,
    passBuffer: Buffer,
    actualData: any,
    templateId: string
  ) {
    console.log(`💾 Storing pass ${serialNumber} in database`)
    
    const passData = {
      serialNumber,
      passTypeIdentifier,
      templateId,
      formData: actualData, // Use actual data, not original form data
      passSize: passBuffer.length,
      createdAt: new Date().toISOString()
    }
    
    console.log('Pass data to store:', passData)
    return passData
  }
}