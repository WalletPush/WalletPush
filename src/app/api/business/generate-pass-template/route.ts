import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PassTemplateRequest {
  programData: any
  businessId?: string // Optional - will be determined from user if not provided
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { programData, businessId: providedBusinessId }: PassTemplateRequest = await request.json()

    // Get business ID through the account_members → accounts → businesses chain
    const { data: userAccounts, error: accountsError } = await supabase
      .from('account_members')
      .select(`
        account_id,
        role,
        accounts!inner (
          id,
          type,
          name
        )
      `)
      .eq('user_id', user.id)

    if (accountsError || !userAccounts || userAccounts.length === 0) {
      return NextResponse.json({ error: 'No business account found for this user' }, { status: 404 })
    }

    // Find the business account (type = 'business')
    const businessAccount = userAccounts.find(ua => ua.accounts.type === 'business')
    if (!businessAccount) {
      return NextResponse.json({ error: 'User does not have access to a business account' }, { status: 403 })
    }

    const accountId = businessAccount.account_id

    // Get business data using the account_id
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, slug')
      .eq('id', accountId) // businesses.id corresponds to accounts.id
      .single()

    if (businessError || !businessData) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const businessId = businessData.id

    console.log('Generating pass template for business:', businessId, businessData.name)
    console.log('Program data:', programData.templateName)

    // Get a Global Pass Type ID for this template
    const { data: passTypeIds, error: passTypeError } = await supabase
      .from('pass_type_ids')
      .select('id, pass_type_identifier')
      .eq('is_global', true)
      .limit(1)

    if (passTypeError || !passTypeIds || passTypeIds.length === 0) {
      return NextResponse.json({ error: 'No Global Pass Type ID available' }, { status: 500 })
    }

    const passTypeId = passTypeIds[0]

    // Generate complete Pass Designer template JSON
    const templateJson = {
      // Basic Template Info
      templateName: programData.templateName,
      organizationName: programData.organizationName,
      description: programData.description,
      passType: 'store_card',
      
      // Pass Design
      backgroundColor: programData.backgroundColor, // #FFFFFF
      textColor: programData.textColor, // Brand color
      logoUrl: programData.logoUrl, // Downloaded logo path
      stripImageUrl: programData.stripImageUrl, // Downloaded strip image path
      iconUrl: programData.iconUrl, // W icon
      
      // Front Fields Configuration
      frontFields: {
        headerField: {
          label: programData.frontFields.headerField.label,
          placeholder: programData.frontFields.headerField.placeholder,
          defaultValue: programData.frontFields.headerField.defaultValue
        },
        primaryField: null, // No primary field as per requirements
        secondaryField: {
          label: programData.frontFields.secondaryField.label,
          placeholder: '${Current_Offer}', // DYNAMIC PLACEHOLDER
          value: '${Current_Offer}' // DYNAMIC PLACEHOLDER VALUE
        }
      },
      
      // Barcode Configuration
      barcode: {
        type: programData.barcode.type, // QR
        content: programData.barcode.content, // ${MEMBER_ID}
        altText: programData.barcode.altText // ${MEMBER_ID}
      },
      
      // Back Fields Configuration
      backFields: programData.backFields,
      
      // Pass Type ID Assignment
      passTypeId: passTypeId.pass_type_identifier,
      
      // AI Generated Metadata
      aiGenerated: true,
      generatedAt: new Date().toISOString(),
      memberIdPrefix: programData.memberIdPrefix || 'MB',
      defaultMemberId: programData.defaultMemberId,
      
      // CRITICAL: Placeholders with default values for dynamic content
      placeholders: [
        // Current Offer placeholder with the actual incentive as default
        {
          key: 'Current_Offer', // NO ${} wrapper in keys
          label: 'Current Offer',
          defaultValue: programData.frontFields.secondaryField.value, // The actual incentive
          type: 'text'
        },
        // Member ID placeholder with generated ID as default
        {
          key: 'MEMBER_ID', // NO ${} wrapper in keys
          label: 'Member ID', 
          defaultValue: programData.defaultMemberId, // Generated member ID
          type: 'text'
        },
        // Form capture fields (empty defaults for user input)
        ...programData.backFields.map((field: any) => ({
          key: field.placeholder?.replace(/\$\{|\}/g, '') || field.label.replace(/\s+/g, '_'), // Strip ${} wrapper
          label: field.label,
          defaultValue: '', // Empty for form input
          type: 'text'
        }))
      ]
    }

    // Generate complete PassKit JSON for Apple Wallet
    const passkitJson = {
      formatVersion: 1,
      passTypeIdentifier: passTypeId.pass_type_identifier,
      serialNumber: `AI-${businessId}-${Date.now()}`,
      organizationName: programData.organizationName,
      teamIdentifier: process.env.APPLE_TEAM_ID || 'YOUR_TEAM_ID',
      description: programData.description,
      logoText: programData.templateName,
      
      // Store Card specific configuration
      storeCard: {
        // Header Field (Points)
        headerFields: [{
          key: 'points',
          label: programData.frontFields.headerField.label,
          value: programData.frontFields.headerField.defaultValue
        }],
        
        // Secondary Field (Welcome Offer) - USE PLACEHOLDER NOT HARDCODED VALUE
        secondaryFields: [{
          key: 'offer',
          label: programData.frontFields.secondaryField.label,
          value: '${Current_Offer}' // DYNAMIC PLACEHOLDER
        }],
        
        // Back Fields - USE PLACEHOLDERS NOT HARDCODED VALUES
        backFields: programData.backFields.map((field: any, index: number) => ({
          key: `back_field_${index}`,
          label: field.label,
          value: field.placeholder // This should already be ${First_Name}, ${Last_Name}, etc.
        }))
      },
      
      // Barcode - USE PLACEHOLDER NOT HARDCODED VALUE
      barcodes: [{
        message: '${MEMBER_ID}', // DYNAMIC PLACEHOLDER
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: '${MEMBER_ID}' // DYNAMIC PLACEHOLDER
      }],
      
      // Visual Design
      backgroundColor: programData.backgroundColor,
      foregroundColor: programData.textColor,
      labelColor: programData.textColor,
      
      // Relevance and behavior
      relevantDate: new Date().toISOString(),
      maxDistance: 1000,
      
      // Associated Store Application (if any)
      associatedStoreIdentifiers: []
    }

    console.log('Generated template JSON:', templateJson.templateName)
    console.log('Generated PassKit JSON for pass type:', passTypeId.pass_type_identifier)

    // Get the global Pass Type ID for assignment
    const { data: globalPassType, error: globalPassTypeError } = await supabase
      .from('pass_type_ids')
      .select('id')
      .eq('pass_type_identifier', 'pass.come.globalwalletpush')
      .single()

    if (globalPassTypeError || !globalPassType) {
      console.error('Failed to get global Pass Type ID:', globalPassTypeError)
      return NextResponse.json({ error: 'Pass Type ID not found' }, { status: 500 })
    }

    // Create a program first with correct schema (modes not mode!)
    const { data: newProgram, error: programError } = await supabase
      .from('programs')
      .insert({
        business_id: businessId,
        name: `AI Generated - ${programData.templateName}`,
        modes: { loyalty: false, membership: false, store_card: true }, // Note: "modes" not "mode"
        pass_type_ids_id: globalPassType.id,
        account_id: businessId
      })
      .select()
      .single()

    if (programError) {
      console.error('Failed to create program:', programError)
      return NextResponse.json({ error: 'Failed to create program', details: programError.message }, { status: 500 })
    }

    console.log('Program created successfully with ID:', newProgram.id)

    // Save to templates table with correct structure
    console.log('💾 Saving template with account_id:', businessId)
    const templateInsert = {
      program_id: newProgram.id, // Use the actual program UUID
      template_json: templateJson,
      passkit_json: passkitJson,
      pass_type_identifier: passTypeId.pass_type_identifier,
      account_id: businessId // account_id comes from businesses table
      // Note: tenant_id left as NULL since it references a different table
    }
    console.log('💾 Template insert data:', templateInsert)
    
    const { data: savedTemplate, error: saveError } = await supabase
      .from('templates')
      .insert(templateInsert)
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save template:', saveError)
      return NextResponse.json({ error: 'Failed to save template', details: saveError.message }, { status: 500 })
    }

    console.log('Template saved successfully with ID:', savedTemplate.id)
    console.log('Linked to program ID:', newProgram.id)

    // Prepare response with all generated data
    const response = {
      success: true,
      message: `AI Generated pass template "${programData.templateName}" created successfully!`,
      templateId: savedTemplate.id,
      programId: newProgram.id,
      templateName: programData.templateName,
      businessId: businessId,
      businessName: businessData.name,
      passTypeId: passTypeId.pass_type_identifier,
      
      // Generated configurations
      templateJson: templateJson,
      passkitJson: passkitJson,
      
      // Asset information
      assets: {
        logoUrl: programData.logoUrl,
        stripImageUrl: programData.stripImageUrl,
        iconUrl: programData.iconUrl,
        allDownloadedAssets: programData.allDownloadedAssets
      },
      
      // Pass Designer integration
      passDesignerUrl: `/business/pass-designer?template=${savedTemplate.id}`,
      
      // Summary for user
      summary: {
        templateName: programData.templateName,
        organizationName: programData.organizationName,
        welcomeIncentive: programData.frontFields.secondaryField.value,
        memberIdExample: programData.defaultMemberId,
        passTypeAssigned: passTypeId.pass_type_identifier,
        assetsDownloaded: programData.allDownloadedAssets ? 
          `${programData.allDownloadedAssets.logos.successful} logos, ${programData.allDownloadedAssets.heroImages.successful} images` :
          'No assets downloaded'
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Template generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate pass template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
