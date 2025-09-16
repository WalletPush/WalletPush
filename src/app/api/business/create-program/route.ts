import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ProgramData {
  programName: string
  tagline: string
  welcomeIncentive: string
  dataCapture: string[]
  tierStructure: string
  businessInfo: {
    name: string
    type: string
    location: string
    brandColors: string[]
    logoUrl?: string
    websiteUrl: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user and account info
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const programData: ProgramData = await request.json()

    // Check if user has a business account (proper business owner)
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, business_type')
      .eq('owner_id', user.id)
      .single()

    if (businessError || !businessData) {
      return NextResponse.json({ 
        error: 'Business account required',
        details: 'You must be logged in as a business owner to use the AI Copilot'
      }, { status: 403 })
    }

    console.log('Business account found:', businessData.name, 'Type:', businessData.business_type)

    // Get a Global Pass Type ID for this demo
    const { data: passTypeIds, error: passTypeError } = await supabase
      .from('pass_type_ids')
      .select('id, pass_type_identifier')
      .eq('is_global', true)
      .limit(1)

    if (passTypeError || !passTypeIds || passTypeIds.length === 0) {
      return NextResponse.json({ error: 'No Global Pass Type ID available' }, { status: 500 })
    }

    const passTypeId = passTypeIds[0]

    // Create Pass Designer configuration (Store Card as requested)
    const passConfig = {
      programName: programData.programName,
      programType: 'store_card', // Always use store card unless specifically requested otherwise
      
      // Front Fields
      headerField: {
        label: 'Business',
        value: programData.businessInfo.name
      },
      primaryField: {
        label: 'Program',
        value: programData.programName
      },
      secondaryField: {
        label: 'Welcome Offer',
        value: programData.welcomeIncentive
      },
      auxiliaryField: {
        label: 'Member Since',
        value: new Date().toLocaleDateString()
      },
      
      // Back Fields - Form capture + business info
      backFields: [
        { label: 'Full Name', value: '${customer_name}' },
        { label: 'Email', value: '${customer_email}' },
        { label: 'Phone', value: '${customer_phone}' },
        { label: 'Address', value: programData.businessInfo.location },
        { label: 'Phone', value: programData.businessInfo.websiteUrl },
        { label: 'Website', value: programData.businessInfo.websiteUrl }
      ],
      
      // Design
      backgroundColor: programData.businessInfo.brandColors[0] || '#000000',
      textColor: programData.businessInfo.brandColors[1] || '#ffffff',
      logoUrl: programData.businessInfo.logoUrl || '/placeholder-logo.png',
      
      // Pass Type ID
      passTypeId: passTypeId.pass_type_identifier,
      
      // Metadata
      description: programData.tagline,
      organizationName: programData.businessInfo.name,
      serialNumber: `DEMO-${Date.now()}`
    }

    // Create Landing Page configuration
    const landingConfig = {
      programName: programData.programName,
      tagline: programData.tagline,
      welcomeIncentive: programData.welcomeIncentive,
      businessName: programData.businessInfo.name,
      businessType: programData.businessInfo.type,
      location: programData.businessInfo.location,
      brandColors: programData.businessInfo.brandColors,
      logoUrl: programData.businessInfo.logoUrl,
      websiteUrl: programData.businessInfo.websiteUrl,
      
      // Landing page content
      heroImage: programData.businessInfo.logoUrl || '/placeholder-hero.jpg',
      headline: `Join ${programData.programName}`,
      subheadline: programData.tagline,
      
      benefits: [
        programData.welcomeIncentive,
        'Exclusive member rewards',
        'Priority service',
        'Special member events'
      ],
      
      howItWorks: [
        'Sign up instantly',
        'Start earning rewards',
        'Enjoy exclusive perks'
      ]
    }

    // For this demo, we'll just log the configurations
    // In a real implementation, these would be saved to the database
    console.log('Pass Configuration:', passConfig)
    console.log('Landing Configuration:', landingConfig)

    return NextResponse.json({ 
      success: true,
      message: 'Program created successfully',
      programName: programData.programName,
      passTypeId: passTypeId.pass_type_identifier,
      passConfig,
      landingConfig
    })

  } catch (error) {
    console.error('Create program error:', error)
    return NextResponse.json({ 
      error: 'Failed to create program',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
