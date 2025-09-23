/**
 * Template Validation System (TVS)
 * Analyzes pass templates to determine available program capabilities
 */

export interface TemplateCapabilities {
  placeholders: string[];
  capabilities: string[];
  allowedProgramTypes: ProgramType[];
}

export type ProgramType = 'loyalty' | 'membership' | 'store_card';

/**
 * Analyzes a template's placeholders to determine what program types are possible
 */
export function analyzeTemplate(template: any): TemplateCapabilities {
  const placeholders = extractPlaceholders(template);
  const capabilities = deriveCapabilities(placeholders);
  const allowedProgramTypes = determineAllowedProgramTypes(capabilities);
  
  return {
    placeholders,
    capabilities,
    allowedProgramTypes
  };
}

/**
 * Extracts placeholder names from template
 */
function extractPlaceholders(template: any): string[] {
  if (!template?.passkit_json?.placeholders) {
    return [];
  }
  
  const placeholders = template.passkit_json.placeholders;
  
  // Handle both object and array formats
  if (Array.isArray(placeholders)) {
    return placeholders.map(p => p.key || p.name || p).filter(Boolean);
  } else if (typeof placeholders === 'object') {
    return Object.keys(placeholders);
  }
  
  return [];
}

/**
 * Maps placeholders to program capabilities
 */
function deriveCapabilities(placeholders: string[]): string[] {
  const capabilities = new Set<string>();
  
  // Normalize placeholder names (case insensitive)
  const normalizedPlaceholders = placeholders.map(p => p.toLowerCase());
  
  // Map placeholders to capabilities
  const placeholderMap = {
    // Points-based capabilities
    'points': 'points',
    'point': 'points',
    'rewards': 'points',
    
    // Tier capabilities
    'tier': 'tiers',
    'level': 'tiers',
    'status': 'tiers',
    
    // Membership capabilities
    'membership': 'membership',
    'member': 'membership',
    'subscription': 'membership',
    'plan': 'membership',
    
    // Store card capabilities (balance can be points or stored value, prioritize stored value)
    'credit': 'stored_value',
    'balance': 'stored_value',
    'money': 'stored_value',
    'cash': 'stored_value',
    'value': 'stored_value',
    
    // Allowances (membership feature)
    'allowance': 'allowances',
    'quota': 'allowances',
    'limit': 'allowances',
    
    // Offers
    'offer': 'offers',
    'deal': 'offers',
    'promotion': 'offers',
    'discount': 'offers',
    
    // Check-in capabilities
    'checkin': 'qr_check_in',
    'check_in': 'qr_check_in',
    'visit': 'qr_check_in',
    'stamp': 'check_in'
  };
  
  // Check each placeholder against the map
  normalizedPlaceholders.forEach(placeholder => {
    Object.entries(placeholderMap).forEach(([key, capability]) => {
      if (placeholder.includes(key)) {
        capabilities.add(capability);
      }
    });
  });
  
  return Array.from(capabilities);
}

/**
 * Determines which program types are allowed based on capabilities
 */
function determineAllowedProgramTypes(capabilities: string[]): ProgramType[] {
  const allowedTypes: ProgramType[] = [];
  
  // Loyalty requires points (tiers optional)
  if (capabilities.includes('points')) {
    allowedTypes.push('loyalty');
  }
  
  // Membership requires membership indicator (allowances/credit optional)
  if (capabilities.includes('membership') || capabilities.includes('allowances')) {
    allowedTypes.push('membership');
  }
  
  // Store Card requires stored_value
  if (capabilities.includes('stored_value')) {
    allowedTypes.push('store_card');
  }
  
  // If no specific capabilities detected, allow loyalty as default
  if (allowedTypes.length === 0) {
    allowedTypes.push('loyalty');
  }
  
  return allowedTypes;
}

/**
 * Gets program type recommendations with reasoning
 */
export function getRecommendations(template: any): {
  programType: ProgramType;
  confidence: number;
  reasoning: string;
}[] {
  const { capabilities, allowedProgramTypes } = analyzeTemplate(template);
  const recommendations = [];
  
  for (const programType of allowedProgramTypes) {
    let confidence = 0.5; // Base confidence
    let reasoning = '';
    
    switch (programType) {
      case 'loyalty':
        if (capabilities.includes('points')) confidence += 0.4;
        if (capabilities.includes('tiers')) confidence += 0.2;
        if (capabilities.includes('offers')) confidence += 0.1;
        reasoning = `Template has ${capabilities.filter(c => ['points', 'tiers', 'offers'].includes(c)).join(', ')} placeholders`;
        break;
        
      case 'membership':
        if (capabilities.includes('membership')) confidence += 0.4;
        if (capabilities.includes('allowances')) confidence += 0.3;
        reasoning = `Template has membership-related placeholders`;
        break;
        
      case 'store_card':
        if (capabilities.includes('stored_value')) confidence += 0.5;
        reasoning = `Template has stored value placeholders`;
        break;
    }
    
    recommendations.push({ programType, confidence, reasoning });
  }
  
  // Sort by confidence
  return recommendations.sort((a, b) => b.confidence - a.confidence);
}
