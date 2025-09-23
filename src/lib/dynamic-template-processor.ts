/**
 * Dynamic Template Processor for WalletPush
 * 
 * This handles any business template structure dynamically by:
 * 1. Extracting placeholders from any template JSON structure
 * 2. Mapping form data to template fields automatically
 * 3. Generating passes with proper field values for any business
 */

export interface TemplateField {
  id: string
  key: string
  label: string
  value: string
  type: string
  placeholder?: string
}

export interface ProcessedTemplate {
  templateId: string
  businessId: string
  placeholders: Record<string, string>
  fieldMappings: Record<string, string>
  templateStructure: any
}

export interface FormDataMapping {
  [key: string]: string | number | boolean
}

/**
 * Extract placeholders from any template structure
 */
export function extractPlaceholdersFromTemplate(templateJson: any): Record<string, string> {
  const placeholders: Record<string, string> = {}
  const placeholderPattern = /\$\{([^}]+)\}/g
  
  function searchForPlaceholders(obj: any, path: string = ''): void {
    if (typeof obj === 'string') {
      let match
      while ((match = placeholderPattern.exec(obj)) !== null) {
        const placeholderName = match[1]
        
        // Don't override if we already found this placeholder
        if (!placeholders[placeholderName]) {
          // Try to determine a default value or use placeholder name as hint
          placeholders[placeholderName] = getDefaultValueForPlaceholder(placeholderName)
        }
      }
      // Reset regex for next use
      placeholderPattern.lastIndex = 0
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        searchForPlaceholders(item, `${path}[${index}]`)
      })
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        searchForPlaceholders(value, path ? `${path}.${key}` : key)
      })
    }
  }
  
  searchForPlaceholders(templateJson)
  return placeholders
}

/**
 * Get sensible default values for common placeholder names
 */
function getDefaultValueForPlaceholder(placeholderName: string): string {
  const lowerName = placeholderName.toLowerCase()
  
  // Common field mappings
  if (lowerName.includes('first') && lowerName.includes('name')) return 'John'
  if (lowerName.includes('last') && lowerName.includes('name')) return 'Doe'
  if (lowerName.includes('email')) return 'customer@example.com'
  if (lowerName.includes('phone')) return '+1-234-567-8900'
  if (lowerName.includes('member') && lowerName.includes('id')) return 'MB001'
  if (lowerName.includes('points')) return '0'
  if (lowerName.includes('balance')) return '0.00'
  if (lowerName.includes('tier') || lowerName.includes('level')) return 'Standard'
  if (lowerName.includes('offer')) return 'Welcome bonus'
  if (lowerName.includes('expiry') || lowerName.includes('expires')) return '12/31/2024'
  
  // Default fallback
  return `Sample ${placeholderName}`
}

/**
 * Map form data to template placeholders intelligently
 */
export function mapFormDataToPlaceholders(
  formData: FormDataMapping, 
  templatePlaceholders: Record<string, string>
): Record<string, string> {
  const mappedData: Record<string, string> = {}
  
  // First, try exact matches (case-sensitive)
  Object.keys(templatePlaceholders).forEach(placeholder => {
    if (formData[placeholder] !== undefined) {
      mappedData[placeholder] = String(formData[placeholder])
    }
  })
  
  // Then try case-insensitive matches
  Object.keys(templatePlaceholders).forEach(placeholder => {
    if (mappedData[placeholder]) return // Already mapped
    
    const lowerPlaceholder = placeholder.toLowerCase()
    const matchingFormField = Object.keys(formData).find(field => 
      field.toLowerCase() === lowerPlaceholder
    )
    
    if (matchingFormField && formData[matchingFormField] !== undefined) {
      mappedData[placeholder] = String(formData[matchingFormField])
    }
  })
  
  // Finally, try intelligent field name mapping
  Object.keys(templatePlaceholders).forEach(placeholder => {
    if (mappedData[placeholder]) return // Already mapped
    
    const mappedFormField = getIntelligentFieldMapping(placeholder, Object.keys(formData))
    if (mappedFormField && formData[mappedFormField] !== undefined) {
      mappedData[placeholder] = String(formData[mappedFormField])
    }
  })
  
  // Fill in defaults for unmapped placeholders
  Object.keys(templatePlaceholders).forEach(placeholder => {
    if (!mappedData[placeholder]) {
      mappedData[placeholder] = templatePlaceholders[placeholder]
    }
  })
  
  return mappedData
}

/**
 * Intelligent mapping between template placeholders and form field names
 */
function getIntelligentFieldMapping(placeholder: string, formFields: string[]): string | null {
  const lowerPlaceholder = placeholder.toLowerCase()
  
  // Define common mappings
  const mappings: Record<string, string[]> = {
    'first_name': ['firstName', 'first_name', 'fname', 'givenName'],
    'last_name': ['lastName', 'last_name', 'lname', 'surname', 'familyName'],
    'email': ['email', 'email_address', 'emailAddress', 'mail'],
    'phone': ['phone', 'phoneNumber', 'phone_number', 'mobile', 'tel'],
    'member_id': ['memberId', 'memberNumber', 'member_number', 'id'],
    'points': ['points', 'loyaltyPoints', 'rewardPoints'],
    'balance': ['balance', 'account_balance', 'accountBalance'],
    'company': ['company', 'organization', 'business_name'],
    'address': ['address', 'street_address', 'streetAddress'],
    'city': ['city', 'locality'],
    'state': ['state', 'region', 'province'],
    'zip': ['zip', 'zipCode', 'postal_code', 'postalCode'],
    'date_of_birth': ['dateOfBirth', 'dob', 'birthDate']
  }
  
  // Check if placeholder matches any mapping pattern
  for (const [pattern, candidates] of Object.entries(mappings)) {
    if (lowerPlaceholder.includes(pattern.replace('_', ''))) {
      const matchingField = formFields.find(field => 
        candidates.some(candidate => field.toLowerCase() === candidate.toLowerCase())
      )
      if (matchingField) return matchingField
    }
  }
  
  // Try partial matches
  const partialMatch = formFields.find(field => {
    const lowerField = field.toLowerCase()
    const placeholderParts = lowerPlaceholder.split('_')
    return placeholderParts.some(part => lowerField.includes(part) && part.length > 2)
  })
  
  return partialMatch || null
}

/**
 * Process template and form data for pass generation
 */
export async function processTemplateForPassGeneration(
  templateId: string,
  formData: FormDataMapping,
  supabaseClient: any
): Promise<{ processedData: Record<string, string>, template: any } | null> {
  try {
    // Fetch template from database
    const { data: template, error } = await supabaseClient
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single()
    
    if (error || !template) {
      console.error('❌ Template not found:', templateId, error)
      return null
    }
    
    // Extract placeholders from template structure
    let templatePlaceholders: Record<string, string> = {}
    
    // 🔍 CRITICAL FIX: Get placeholders from Pass Designer defaults
    if (template.passkit_json?.placeholders && Array.isArray(template.passkit_json.placeholders)) {
      // Convert Pass Designer placeholders array to key-value pairs
      template.passkit_json.placeholders.forEach((placeholder: any) => {
        if (placeholder.key && placeholder.defaultValue !== undefined) {
          templatePlaceholders[placeholder.key] = placeholder.defaultValue
        }
      })
      console.log('🎯 Using Pass Designer placeholder defaults:', templatePlaceholders)
    } else if (template.passkit_json) {
      // Extract from the entire passkit_json structure
      templatePlaceholders = extractPlaceholdersFromTemplate(template.passkit_json)
      console.log('🔍 Extracted placeholders from passkit_json structure:', templatePlaceholders)
    } else if (template.template_json) {
      // Fallback to template_json
      templatePlaceholders = extractPlaceholdersFromTemplate(template.template_json)
      console.log('🔍 Extracted placeholders from template_json structure:', templatePlaceholders)
    }
    
    // 🔍 DEBUG: Log what we found
    console.log('🔍 Template passkit_json.placeholders exists:', !!template.passkit_json?.placeholders)
    console.log('🔍 Template passkit_json.placeholders type:', typeof template.passkit_json?.placeholders)
    console.log('🔍 Template passkit_json.placeholders length:', template.passkit_json?.placeholders?.length)
    
    console.log('🔍 Found template placeholders:', Object.keys(templatePlaceholders))
    console.log('📝 Form data received:', Object.keys(formData))
    
    // Map form data to template placeholders
    const processedData = mapFormDataToPlaceholders(formData, templatePlaceholders)
    
    console.log('✅ Mapped data for pass generation:', processedData)
    
    return { processedData, template }
    
  } catch (error) {
    console.error('❌ Error processing template:', error)
    return null
  }
}

/**
 * Validate that all required placeholders have values
 */
export function validateTemplateData(
  processedData: Record<string, string>,
  requiredFields: string[] = []
): { isValid: boolean, missingFields: string[], errors: string[] } {
  const missingFields: string[] = []
  const errors: string[] = []
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!processedData[field] || processedData[field].trim() === '') {
      missingFields.push(field)
      errors.push(`Missing required field: ${field}`)
    }
  })
  
  // Check for obviously invalid data
  Object.entries(processedData).forEach(([key, value]) => {
    if (key.toLowerCase().includes('email') && value.includes('@')) {
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`Invalid email format: ${value}`)
      }
    }
  })
  
  return {
    isValid: errors.length === 0,
    missingFields,
    errors
  }
}

const DynamicTemplateProcessor = {
  extractPlaceholdersFromTemplate,
  mapFormDataToPlaceholders,
  processTemplateForPassGeneration,
  validateTemplateData
};

export default DynamicTemplateProcessor;
