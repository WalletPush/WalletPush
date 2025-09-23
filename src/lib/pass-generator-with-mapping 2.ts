import { createClient } from '@/lib/supabase/server'

interface CustomFieldValue {
  field_key: string
  field_value: string
  field_type: string
}

interface FieldMapping {
  pass_field_key: string
  pass_field_label: string
  custom_field_id: string
  custom_field_key: string
  custom_field_label: string
  transform_type: 'direct' | 'format' | 'conditional'
  format_pattern?: string
}

export class PassGeneratorWithMapping {
  
  /**
   * Generate pass data with custom field values mapped to pass fields
   */
  static async generatePassWithCustomFields(params: {
    templateId: string
    customerId: string
    businessId: string
    formData?: Record<string, any>
  }) {
    const { templateId, customerId, businessId, formData = {} } = params
    
    try {
      const supabase = await createClient()
      
      console.log('🎫 Generating pass with custom field mapping:', {
        templateId,
        customerId,
        businessId
      })

      // 1. Get field mappings for this template
      const mappings = await this.getFieldMappings(templateId, businessId)
      console.log(`📊 Found ${mappings.length} field mappings`)

      // 2. Get customer's custom field values
      const customerValues = await this.getCustomerFieldValues(customerId, businessId)
      console.log(`👤 Found ${customerValues.length} customer field values`)

      // 3. Get member field values (if customer is a member)
      const memberValues = await this.getMemberFieldValues(customerId, businessId)
      console.log(`🎖️ Found ${memberValues.length} member field values`)

      // 4. Create resolved field data
      const resolvedFields = this.resolveFieldMappings(mappings, customerValues, memberValues)
      console.log(`✅ Resolved ${Object.keys(resolvedFields).length} pass fields`)

      // 5. Merge with form data (form data takes precedence)
      const finalPassData = {
        ...resolvedFields,
        ...formData
      }

      console.log('🎯 Final pass data:', finalPassData)

      return {
        success: true,
        passData: finalPassData,
        mappingsUsed: mappings.length,
        fieldsResolved: Object.keys(resolvedFields).length
      }

    } catch (error) {
      console.error('❌ Error generating pass with custom fields:', error)
      throw error
    }
  }

  /**
   * Get field mappings for a template
   */
  private static async getFieldMappings(templateId: string, businessId: string): Promise<FieldMapping[]> {
    const supabase = await createClient()
    
    const { data: mappings, error } = await supabase
      .from('v_field_mappings_with_details')
      .select('*')
      .eq('business_id', businessId)
      .eq('template_id', templateId)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching field mappings:', error)
      return []
    }

    return mappings?.map(m => ({
      pass_field_key: m.pass_field_key,
      pass_field_label: m.pass_field_label,
      custom_field_id: m.custom_field_id,
      custom_field_key: m.custom_field_key,
      custom_field_label: m.custom_field_label,
      transform_type: m.transform_type,
      format_pattern: m.format_pattern
    })) || []
  }

  /**
   * Get customer's custom field values
   */
  private static async getCustomerFieldValues(customerId: string, businessId: string): Promise<CustomFieldValue[]> {
    const supabase = await createClient()
    
    const { data: values, error } = await supabase
      .from('custom_field_values')
      .select(`
        field_value,
        custom_field:custom_fields(field_key, field_type)
      `)
      .eq('entity_id', customerId)
      .eq('entity_type', 'customer')
      .in('custom_field.business_id', [businessId])

    if (error) {
      console.error('Error fetching customer field values:', error)
      return []
    }

    return values?.map(v => ({
      field_key: Array.isArray(v.custom_field) ? v.custom_field[0]?.field_key : (v.custom_field as any)?.field_key,
      field_value: v.field_value,
      field_type: Array.isArray(v.custom_field) ? v.custom_field[0]?.field_type : (v.custom_field as any)?.field_type
    })) || []
  }

  /**
   * Get member's custom field values  
   */
  private static async getMemberFieldValues(customerId: string, businessId: string): Promise<CustomFieldValue[]> {
    const supabase = await createClient()
    
    // First find the member record for this customer
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('customer_id', customerId)
      .eq('business_id', businessId)
      .single()

    if (memberError || !member) {
      console.log('No member record found for customer:', customerId)
      return []
    }

    const { data: values, error } = await supabase
      .from('custom_field_values')
      .select(`
        field_value,
        custom_field:custom_fields(field_key, field_type)
      `)
      .eq('entity_id', member.id)
      .eq('entity_type', 'member')
      .in('custom_field.business_id', [businessId])

    if (error) {
      console.error('Error fetching member field values:', error)
      return []
    }

    return values?.map(v => ({
      field_key: Array.isArray(v.custom_field) ? v.custom_field[0]?.field_key : (v.custom_field as any)?.field_key,
      field_value: v.field_value,
      field_type: Array.isArray(v.custom_field) ? v.custom_field[0]?.field_type : (v.custom_field as any)?.field_type
    })) || []
  }

  /**
   * Resolve field mappings into pass data
   */
  private static resolveFieldMappings(
    mappings: FieldMapping[], 
    customerValues: CustomFieldValue[], 
    memberValues: CustomFieldValue[]
  ): Record<string, any> {
    const resolved: Record<string, any> = {}
    
    // Combine all field values
    const allValues = [...customerValues, ...memberValues]
    
    for (const mapping of mappings) {
      // Find the custom field value
      const fieldValue = allValues.find(v => v.field_key === mapping.custom_field_key)
      
      if (fieldValue) {
        const transformedValue = this.transformFieldValue(
          fieldValue.field_value,
          fieldValue.field_type,
          mapping.transform_type,
          mapping.format_pattern
        )
        
        // Use the pass field key as the key in the resolved data
        resolved[mapping.pass_field_key] = transformedValue
        
        console.log(`🔄 Mapped: ${mapping.custom_field_key} (${fieldValue.field_value}) → ${mapping.pass_field_key} (${transformedValue})`)
      } else {
        console.log(`⚠️ No value found for custom field: ${mapping.custom_field_key}`)
      }
    }
    
    return resolved
  }

  /**
   * Transform field value based on mapping configuration
   */
  private static transformFieldValue(
    value: string, 
    fieldType: string, 
    transformType: string, 
    formatPattern?: string
  ): any {
    if (!value) return ''
    
    switch (transformType) {
      case 'format':
        return this.formatValue(value, fieldType, formatPattern)
      
      case 'conditional':
        // TODO: Implement conditional logic based on rules
        return value
      
      case 'direct':
      default:
        return this.convertByType(value, fieldType)
    }
  }

  /**
   * Format value according to pattern
   */
  private static formatValue(value: string, fieldType: string, pattern?: string): string {
    if (!pattern) return value
    
    switch (fieldType) {
      case 'date':
        try {
          const date = new Date(value)
          if (pattern === 'short') return date.toLocaleDateString()
          if (pattern === 'long') return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
          return value
        } catch {
          return value
        }
      
      case 'number':
        try {
          const num = parseFloat(value)
          if (pattern === 'currency') return `$${num.toFixed(2)}`
          if (pattern === 'points') return `${num} pts`
          return value
        } catch {
          return value
        }
      
      case 'phone':
        if (pattern === 'format' && value.length === 10) {
          return `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6)}`
        }
        return value
      
      default:
        return value
    }
  }

  /**
   * Convert value based on field type
   */
  private static convertByType(value: string, fieldType: string): any {
    switch (fieldType) {
      case 'number':
        return parseFloat(value) || 0
      
      case 'boolean':
        return value.toLowerCase() === 'true' || value === '1'
      
      case 'date':
        return value // Keep as string for pass generation
      
      default:
        return value
    }
  }

  /**
   * Get available placeholder mappings for a template
   */
  static async getAvailableMappings(templateId: string, businessId: string) {
    try {
      const supabase = await createClient()
      
      // Get template to find available pass fields
      const { data: template, error: templateError } = await supabase
        .from('pass_templates')
        .select('template_json')
        .eq('id', templateId)
        .single()

      if (templateError || !template) {
        throw new Error('Template not found')
      }

      // Extract pass fields from template
      const passFields = this.extractPassFields(template.template_json)
      
      // Get available custom fields
      const { data: customFields, error: fieldsError } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_visible', true)

      if (fieldsError) {
        throw new Error('Failed to fetch custom fields')
      }

      // Get existing mappings
      const { data: existingMappings, error: mappingsError } = await supabase
        .from('field_mappings')
        .select('*')
        .eq('business_id', businessId)
        .eq('template_id', templateId)
        .eq('is_active', true)

      if (mappingsError) {
        throw new Error('Failed to fetch existing mappings')
      }

      return {
        passFields,
        customFields: customFields || [],
        existingMappings: existingMappings || []
      }

    } catch (error) {
      console.error('Error getting available mappings:', error)
      throw error
    }
  }

  /**
   * Extract pass fields from template JSON
   */
  private static extractPassFields(templateJson: any): any[] {
    const fields: any[] = []
    
    try {
      const parsed = typeof templateJson === 'string' ? JSON.parse(templateJson) : templateJson
      
      // Extract fields from different sections
      const sections = ['headerFields', 'primaryFields', 'secondaryFields', 'auxiliaryFields', 'backFields']
      
      for (const section of sections) {
        if (parsed[section]) {
          parsed[section].forEach((field: any, index: number) => {
            fields.push({
              id: `${section}_${index}`,
              type: section,
              label: field.label || field.key || 'Unnamed Field',
              key: field.key || `${section}_${index}`,
              value: field.value || ''
            })
          })
        }
      }
      
    } catch (error) {
      console.error('Error parsing template JSON:', error)
    }
    
    return fields
  }
}

