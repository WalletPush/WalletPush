import { ApplePassKitGenerator } from './apple-passkit-generator'

/**
 * ProperPassKitGenerator - A wrapper around ApplePassKitGenerator
 * This provides a simplified interface for generating passes with proper signing
 */
export class ProperPassKitGenerator {
  /**
   * Generate a properly signed Apple Pass
   */
  static async generatePass(options: {
    templateId: string
    formData: Record<string, any>
    userId?: string
    deviceType?: string
  }): Promise<Buffer> {
    const { templateId, formData, userId = 'anonymous', deviceType = 'mobile' } = options

    console.log('🎯 ProperPassKitGenerator: Generating pass...')
    console.log('📋 Template ID:', templateId)
    console.log('📋 Form Data:', formData)

    try {
      // Use the main ApplePassKitGenerator
      const result = await ApplePassKitGenerator.generateApplePass({
        templateId,
        formData,
        userId,
        deviceType
      })

      console.log('✅ ProperPassKitGenerator: Pass generated successfully')
      return result.passBuffer

    } catch (error) {
      console.error('❌ ProperPassKitGenerator: Error generating pass:', error)
      throw error
    }
  }

  /**
   * Generate a pass with default template for testing
   */
  static async generateTestPass(formData: Record<string, any> = {}): Promise<Buffer> {
    const defaultFormData = {
      name: 'Test User',
      balance: '$25.00',
      organizationName: 'WalletPush Test',
      description: 'Test Store Card',
      ...formData
    }

    return this.generatePass({
      templateId: 'ae76dc2a-e295-4219-b5ce-f6ecd8961de1', // Use the Blue Karma template
      formData: defaultFormData
    })
  }
}
