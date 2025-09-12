/**
 * Placeholder Validation System for WalletPush
 * 
 * This ensures that pass creation is bulletproof by:
 * 1. Extracting all placeholders from templates (${field_name} format)
 * 2. Validating form data matches required placeholders
 * 3. Providing clear error messages for missing mappings
 */

export interface PlaceholderInfo {
  name: string           // e.g., "First_Name" 
  originalText: string   // e.g., "${First_Name}"
  defaultValue?: string  // Default value from template
  isRequired: boolean    // Whether this placeholder must have a value
}

export interface ValidationResult {
  isValid: boolean
  missingPlaceholders: string[]
  unmatchedFormFields: string[]
  mappedData: Record<string, any>
  errors: string[]
}

/**
 * Extract placeholders from template JSON
 */
export function extractPlaceholdersFromTemplate(templateJson: any): PlaceholderInfo[] {
  const placeholders: PlaceholderInfo[] = []
  const placeholderPattern = /\$\{([^}]+)\}/g
  
  // Recursively search through template JSON for placeholder patterns
  function searchObject(obj: any, path: string = '') {
    if (typeof obj === 'string') {
      let match
      while ((match = placeholderPattern.exec(obj)) !== null) {
        const placeholderName = match[1]
        const existingPlaceholder = placeholders.find(p => p.name === placeholderName)
        
        if (!existingPlaceholder) {
          placeholders.push({
            name: placeholderName,
            originalText: match[0],
            defaultValue: undefined, // We'll check for defaults separately
            isRequired: true // Default to required unless explicitly set
          })
        }
      }
      // Reset regex lastIndex for next search
      placeholderPattern.lastIndex = 0
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => searchObject(item, `${path}[${index}]`))
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        searchObject(value, path ? `${path}.${key}` : key)
      })
    }
  }
  
  searchObject(templateJson)
  return placeholders
}

/**
 * Validate form data against template placeholders
 */
export function validatePlaceholderMapping(
  templateJson: any, 
  formData: Record<string, any>
): ValidationResult {
  const placeholders = extractPlaceholdersFromTemplate(templateJson)
  const errors: string[] = []
  const missingPlaceholders: string[] = []
  const unmatchedFormFields: string[] = []
  const mappedData: Record<string, any> = {}
  
  // Check if all required placeholders have matching form data
  placeholders.forEach(placeholder => {
    const formValue = formData[placeholder.name]
    
    if (placeholder.isRequired && (formValue === undefined || formValue === null || formValue === '')) {
      missingPlaceholders.push(placeholder.name)
      errors.push(`Missing required field: ${placeholder.name}`)
    } else if (formValue !== undefined) {
      // Map the form data to the placeholder
      mappedData[placeholder.name] = formValue
    }
  })
  
  // Check for form fields that don't match any placeholders (potential issues)
  Object.keys(formData).forEach(fieldName => {
    const hasMatchingPlaceholder = placeholders.some(p => p.name === fieldName)
    if (!hasMatchingPlaceholder && formData[fieldName] !== undefined) {
      unmatchedFormFields.push(fieldName)
      errors.push(`Form field "${fieldName}" does not match any template placeholder`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    missingPlaceholders,
    unmatchedFormFields,
    mappedData,
    errors
  }
}

/**
 * Generate standard form field mappings for common placeholder names
 */
export function getStandardFieldMappings(): Record<string, string> {
  return {
    'First_Name': 'firstName',
    'Last_Name': 'lastName', 
    'Email': 'email',
    'Phone': 'phone',
    'Company': 'company',
    'Member_ID': 'memberId',
    'Points': 'points',
    'Balance': 'balance'
  }
}

/**
 * Create JavaScript code for landing page form that matches template placeholders
 */
export function generateLandingPageJavaScript(
  templateId: string,
  placeholders: PlaceholderInfo[],
  webhookUrl?: string
): string {
  const fieldMappings = placeholders.map(p => `'${p.name}': form.${p.name}.value.trim()`).join(',\n        ')
  
  return `
// CONFIGURATION - WalletPush Template Integration
const WALLET_PUSH_TEMPLATE_ID = '${templateId}';
const WEBHOOK_URL = '${webhookUrl || 'YOUR_WEBHOOK_URL_HERE'}';

document.getElementById('walletPassForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const form = event.target;
    const button = form.querySelector('button[type="submit"]');
    const notification = form.querySelector('.loading-notification');
    
    // Extract form data matching template placeholders
    const formData = {
        ${fieldMappings}
    };
    
    // Validate required fields
    const missingFields = [];
    ${placeholders.filter(p => p.isRequired).map(p => `
    if (!formData.${p.name}) missingFields.push('${p.name}');`).join('')}
    
    if (missingFields.length > 0) {
        alert('Please fill out all required fields: ' + missingFields.join(', '));
        return;
    }
    
    button.innerHTML = 'Creating Your Pass<span class="loading-dots"></span>';
    button.disabled = true;
    notification.textContent = 'Please wait. Pass creation in progress...';
    notification.style.display = 'block';
    
    // Call WalletPush API
    const apiUrl = \`/api/create-pass/\${WALLET_PUSH_TEMPLATE_ID}\`;
    
    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (!data.url) throw new Error('Pass creation failed.');
        
        // Send to webhook if configured
        if (WEBHOOK_URL && WEBHOOK_URL !== 'YOUR_WEBHOOK_URL_HERE') {
            fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    serialNumber: data.serialNumber,
                    passTypeIdentifier: data.passTypeIdentifier,
                    url: data.url,
                    device: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
                })
            }).then(() => data);
        }
        
        notification.style.display = 'none';
        
        // Redirect to pass download
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            window.location.href = data.url.replace('?t=', '.pkpass?t=');
        } else {
            window.location.href = data.url;
        }
        button.textContent = 'Pass Created';
    })
    .catch(error => {
        console.error('Error:', error);
        notification.style.display = 'none';
        alert('An error occurred. Please try again.');
        button.textContent = 'Create My Pass';
        button.disabled = false;
    });
});`
}
