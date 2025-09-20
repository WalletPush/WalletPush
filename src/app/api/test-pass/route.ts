import { NextResponse } from 'next/server'
import { ProperPassKitGenerator } from '../../../lib/proper-passkit-generator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { formData = {} } = body

    console.log('🎯 Creating test pass with proper signing process...')
    console.log('📋 Form data:', formData)

    // Use the proper PassKit generator that actually works
    const passBuffer = await ProperPassKitGenerator.generatePass({
      templateId: 'default-store-card',
      formData: formData || {
        name: 'Test User',
        balance: '$25.00',
        organizationName: 'WalletPush Test',
        description: 'Test Store Card'
      }
    })

    console.log('✅ Pass generated successfully')

    return new NextResponse(passBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="test-pass.pkpass"'
      }
    })

  } catch (error) {
    console.error('Error generating test pass:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate pass' },
      { status: 500 }
    )
  }
}
