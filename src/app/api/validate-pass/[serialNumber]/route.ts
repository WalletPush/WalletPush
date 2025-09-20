import { NextResponse } from 'next/server'
// @ts-ignore - archiver doesn't have TypeScript types
import archiver from 'archiver'

export async function GET(
  request: Request,
  { params }: { params: { serialNumber: string } }
) {
  try {
    const { serialNumber } = params

    console.log(`🔍 Validating pass: ${serialNumber}`)

    // Fetch the pass using the correct download URL
    const passResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/apple-pass/${serialNumber}/download`)
    
    if (!passResponse.ok) {
      throw new Error(`Failed to fetch pass: ${passResponse.status}`)
    }

    const passBuffer = await passResponse.arrayBuffer()
    const buffer = Buffer.from(passBuffer)
    
    console.log(`📦 Pass size: ${buffer.length} bytes`)
    
    // Try to validate it's a proper ZIP
    const JSZip = require('jszip')
    const zip = new JSZip()
    
    try {
      const zipContent = await zip.loadAsync(buffer)
      const files = Object.keys(zipContent.files)
      
      console.log(`✅ Valid ZIP with ${files.length} files:`, files)
      
      // Check required PassKit files
      const requiredFiles = ['pass.json', 'manifest.json', 'signature']
      const missingFiles = requiredFiles.filter(file => !files.includes(file))
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing required files: ${missingFiles.join(', ')}`)
      }
      
      // Try to parse pass.json
      const passJsonFile = zipContent.files['pass.json']
      const passJsonContent = await passJsonFile.async('text')
      const passJson = JSON.parse(passJsonContent)
      
      console.log(`✅ Valid pass.json with passTypeIdentifier: ${passJson.passTypeIdentifier}`)
      
      // Check Apple Wallet specific requirements
      const validation = {
        hasRequiredFields: !!(passJson.formatVersion && passJson.passTypeIdentifier && passJson.serialNumber && passJson.teamIdentifier),
        hasPassStyle: !!(passJson.storeCard || passJson.generic || passJson.coupon || passJson.eventTicket || passJson.boardingPass),
        hasAtLeastOneField: false,
        barcodeValid: true,
        signatureSize: 0
      }
      
      // Check if pass has at least one field
      if (passJson.storeCard) {
        const totalFields = (passJson.storeCard.headerFields?.length || 0) + 
                          (passJson.storeCard.primaryFields?.length || 0) + 
                          (passJson.storeCard.secondaryFields?.length || 0) + 
                          (passJson.storeCard.auxiliaryFields?.length || 0) + 
                          (passJson.storeCard.backFields?.length || 0)
        validation.hasAtLeastOneField = totalFields > 0
      }
      
      // Check barcode format
      if (passJson.barcodes && passJson.barcodes.length > 0) {
        const barcode = passJson.barcodes[0]
        validation.barcodeValid = !!(barcode.format && barcode.message && barcode.messageEncoding)
      }
      
      // Check signature size
      if (zipContent.files['signature']) {
        const signatureBuffer = await zipContent.files['signature'].async('uint8array')
        validation.signatureSize = signatureBuffer.length
      }
      
      const isFullyValid = validation.hasRequiredFields && 
                          validation.hasPassStyle && 
                          validation.hasAtLeastOneField && 
                          validation.barcodeValid &&
                          validation.signatureSize > 1000 // Reasonable signature size
      
      return NextResponse.json({
        valid: true,
        appleWalletReady: isFullyValid,
        size: buffer.length,
        files: files,
        passTypeIdentifier: passJson.passTypeIdentifier,
        serialNumber: passJson.serialNumber,
        teamIdentifier: passJson.teamIdentifier,
        organizationName: passJson.organizationName,
        validation: validation,
        issues: isFullyValid ? [] : [
          !validation.hasRequiredFields && "Missing required fields (formatVersion, passTypeIdentifier, serialNumber, teamIdentifier)",
          !validation.hasPassStyle && "Missing pass style (storeCard, generic, etc.)",
          !validation.hasAtLeastOneField && "Pass has no fields",
          !validation.barcodeValid && "Invalid barcode configuration",
          validation.signatureSize <= 1000 && `Signature too small (${validation.signatureSize} bytes)`
        ].filter(Boolean)
      })
      
    } catch (zipError) {
      console.error('❌ ZIP validation failed:', zipError)
      
      return NextResponse.json({
        valid: false,
        error: 'Invalid ZIP format',
        details: zipError instanceof Error ? zipError.message : String(zipError),
        size: buffer.length
      })
    }

  } catch (error) {
    console.error('❌ Pass validation error:', error)
    
    return NextResponse.json({
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
