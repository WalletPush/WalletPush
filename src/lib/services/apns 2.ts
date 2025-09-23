// Apple Push Notification Service for PassKit
// Handles device registration and push notifications for pass updates

interface DeviceRegistration {
  businessId: string
  templateId: string | null
  passTypeIdentifier: string
  serialNumber: string
  deviceId: string
  pushToken?: string
  registeredAt: string
}

class APNSService {
  private registrations = new Map<string, DeviceRegistration>()

  async registerDevice(
    businessId: string,
    templateId: string | null,
    passTypeIdentifier: string,
    serialNumber: string,
    deviceId: string,
    pushToken?: string
  ): Promise<void> {
    const registrationKey = `${deviceId}-${passTypeIdentifier}-${serialNumber}`
    
    const registration: DeviceRegistration = {
      businessId,
      templateId,
      passTypeIdentifier,
      serialNumber,
      deviceId,
      pushToken,
      registeredAt: new Date().toISOString()
    }

    this.registrations.set(registrationKey, registration)
    
    console.log(`📱 Device registered: ${deviceId} for pass ${serialNumber}`)
    console.log(`🏢 Business: ${businessId}`)
    console.log(`📋 Template: ${templateId}`)
    console.log(`🔔 Push Token: ${pushToken ? 'provided' : 'not provided'}`)
    
    // TODO: Store in database for persistence
    // TODO: Set up actual APNs connection for push notifications
  }

  async unregisterDevice(
    passTypeIdentifier: string,
    serialNumber: string,
    deviceId: string
  ): Promise<void> {
    const registrationKey = `${deviceId}-${passTypeIdentifier}-${serialNumber}`
    
    if (this.registrations.has(registrationKey)) {
      this.registrations.delete(registrationKey)
      console.log(`📱 Device unregistered: ${deviceId} for pass ${serialNumber}`)
    } else {
      console.log(`⚠️ Device registration not found: ${deviceId} for pass ${serialNumber}`)
    }
    
    // TODO: Remove from database
    // TODO: Clean up APNs registration
  }

  async sendPushNotification(
    passTypeIdentifier: string,
    serialNumber: string,
    message?: string
  ): Promise<void> {
    console.log(`🔔 Sending push notification for pass ${serialNumber}`)
    console.log(`📱 Pass Type: ${passTypeIdentifier}`)
    console.log(`💬 Message: ${message || 'Pass updated'}`)
    
    // Find all devices registered for this pass
    const registeredDevices = Array.from(this.registrations.values())
      .filter(reg => 
        reg.passTypeIdentifier === passTypeIdentifier && 
        reg.serialNumber === serialNumber
      )

    console.log(`📱 Found ${registeredDevices.length} registered devices`)

    for (const device of registeredDevices) {
      if (device.pushToken) {
        console.log(`🔔 Sending push to device: ${device.deviceId}`)
        // TODO: Send actual APNs push notification
        // For now, just log that we would send it
        console.log(`📱 Would send APNs push to token: ${device.pushToken.substring(0, 8)}...`)
      } else {
        console.log(`⚠️ No push token for device: ${device.deviceId}`)
      }
    }
  }

  getRegisteredDevices(passTypeIdentifier: string, serialNumber: string): DeviceRegistration[] {
    return Array.from(this.registrations.values())
      .filter(reg => 
        reg.passTypeIdentifier === passTypeIdentifier && 
        reg.serialNumber === serialNumber
      )
  }

  getAllRegistrations(): DeviceRegistration[] {
    return Array.from(this.registrations.values())
  }
}

// Export singleton instance
export const apnsService = new APNSService()

// Export types
export type { DeviceRegistration }
