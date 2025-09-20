import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apnsService } from '@/lib/services/apns'

// Apple PassKit Web Service - Device Registration
// https://developer.apple.com/documentation/walletpasses/adding_a_web_service_to_update_passes

export async function POST(
  request: Request,
  { params }: { params: { deviceId: string; passTypeId: string; serialNumber: string } }
) {
  try {
    const { deviceId, passTypeId, serialNumber } = params
    const authToken = request.headers.get('Authorization')?.replace('ApplePass ', '')
    
    // Get push token from request body if provided
    const body = await request.json().catch(() => ({}))
    const pushToken = body.pushToken

    console.log(`📱 Apple PassKit Registration:`)
    console.log(`Device: ${deviceId}`)
    console.log(`Pass Type: ${passTypeId}`)
    console.log(`Serial: ${serialNumber}`)
    console.log(`Auth: ${authToken}`)
    console.log(`Push Token: ${pushToken ? 'provided' : 'not provided'}`)

    // Validate the authorization token matches the serial number
    if (authToken !== serialNumber) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Find the template and business for this pass
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select(`
        id,
        program_id,
        pass_type_identifier,
        programs!inner (
          id,
          name,
          account_id
        )
      `)
      .eq('pass_type_identifier', passTypeId)
      .single()

    if (templateError || !template) {
      console.error('❌ Template not found for pass type:', passTypeId)
      // Still register the device, but without template association
      await apnsService.registerDevice(
        'unknown',
        null,
        passTypeId,
        serialNumber,
        deviceId,
        pushToken
      )
    } else {
      // Register device with proper business and template association
      const accountId = (() => {
        const programs = template.programs
        if (Array.isArray(programs) && programs[0]) {
          return programs[0].account_id
        }
        return (programs as any)?.account_id
      })()
      
      await apnsService.registerDevice(
        accountId,
        template.id,
        passTypeId,
        serialNumber,
        deviceId,
        pushToken
      )
    }

    // Trigger webhook event for registration.created
    const webhookEvent = {
      event_type: 'registration.created' as const,
      pass_type_identifier: passTypeId,
      serial_number: serialNumber,
      device_library_identifier: deviceId,
      push_token: pushToken,
      timestamp: new Date().toISOString()
    }

    // Send webhook to our internal handler
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/apple-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookEvent)
      })
    } catch (webhookError) {
      console.error('❌ Error sending webhook:', webhookError)
      // Don't fail the registration if webhook fails
    }

    console.log('✅ Device registered for pass updates')

    return NextResponse.json({}, { status: 201 })

  } catch (error) {
    console.error('❌ PassKit Registration Error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { deviceId: string; passTypeId: string; serialNumber: string } }
) {
  try {
    const { deviceId, passTypeId, serialNumber } = params
    const authToken = request.headers.get('Authorization')?.replace('ApplePass ', '')

    console.log(`📱 Apple PassKit Unregistration:`)
    console.log(`Device: ${deviceId}`)
    console.log(`Pass Type: ${passTypeId}`)
    console.log(`Serial: ${serialNumber}`)

    // Validate the authorization token
    if (authToken !== serialNumber) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      )
    }

    // Unregister device using APNs service
    await apnsService.unregisterDevice(passTypeId, serialNumber, deviceId)

    // Trigger webhook event for registration.deleted
    const webhookEvent = {
      event_type: 'registration.deleted' as const,
      pass_type_identifier: passTypeId,
      serial_number: serialNumber,
      device_library_identifier: deviceId,
      timestamp: new Date().toISOString()
    }

    // Send webhook to our internal handler
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/apple-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookEvent)
      })
    } catch (webhookError) {
      console.error('❌ Error sending webhook:', webhookError)
      // Don't fail the unregistration if webhook fails
    }

    console.log('✅ Device unregistered from pass updates')

    return NextResponse.json({}, { status: 200 })

  } catch (error) {
    console.error('❌ PassKit Unregistration Error:', error)
    return NextResponse.json(
      { error: 'Unregistration failed' },
      { status: 500 }
    )
  }
}
