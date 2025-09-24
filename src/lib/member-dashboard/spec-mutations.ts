/**
 * Spec Mutation Functions
 * Pure functions for enabling/disabling dashboard sections
 */

import { ProgramType, SectionKey, SECTION_CATALOG, getCatalogItem } from './section-catalog';

export type UISection = {
  type: SectionKey;
  props: string[];
};

export type UIContract = {
  layout: string;
  sections: UISection[];
  kpis?: string[];
};

export type ProgramSpec = {
  version: string;
  program_id: string;
  program_type: ProgramType;
  template_id?: string;
  currency?: string;
  // Program-specific configs
  earning?: any;
  tiers?: any;
  membership?: any;
  billing?: any;
  redemption?: any;
  stored_value?: any;
  // Content and UI
  branding?: {
    businessLogo?: string;
    [key: string]: any;
  };
  rules?: {
    [key: string]: any;
  };
  copy?: {
    program_name?: string;
    tagline?: string;
    how_it_works?: string;
    fine_print?: string;
  };
  ui_contract: UIContract;
};

/**
 * Enable a section in the UI contract
 */
export function enableSection(
  spec: ProgramSpec, 
  sectionKey: SectionKey, 
  capabilities: string[] = []
): ProgramSpec {
  const item = getCatalogItem(sectionKey);
  if (!item) {
    console.warn(`Unknown section key: ${sectionKey}`);
    return spec;
  }

  // Check if this section is compatible with the program type
  if (!item.programTypes.includes(spec.program_type)) {
    console.warn(`Section ${sectionKey} not compatible with program type ${spec.program_type}`);
    return spec;
  }

  // Check if we have required capabilities
  if (item.requiredCapabilities?.some(cap => !capabilities.includes(cap))) {
    console.warn(`Section ${sectionKey} requires capabilities: ${item.requiredCapabilities?.join(', ')}`);
    return spec;
  }

  // Already present? No-op
  if (spec.ui_contract.sections.some(s => s.type === sectionKey)) {
    return spec;
  }

  // Build section with default props
  const section: UISection = {
    type: sectionKey,
    props: [...item.defaultProps]
  };

  // Decide insertion point
  const after = item.insertAfter;
  let insertIndex = spec.ui_contract.sections.length;

  if (after === 'top') {
    insertIndex = 0;
  } else if (after) {
    const afterIndex = spec.ui_contract.sections.findIndex(s => s.type === after);
    if (afterIndex !== -1) {
      insertIndex = afterIndex + 1;
    }
  }

  // Create new spec with updated sections
  const newSections = [...spec.ui_contract.sections];
  newSections.splice(insertIndex, 0, section);

  return {
    ...spec,
    ui_contract: {
      ...spec.ui_contract,
      sections: newSections
    }
  };
}

/**
 * Disable a section in the UI contract
 */
export function disableSection(spec: ProgramSpec, sectionKey: SectionKey): ProgramSpec {
  return {
    ...spec,
    ui_contract: {
      ...spec.ui_contract,
      sections: spec.ui_contract.sections.filter(s => s.type !== sectionKey)
    }
  };
}

/**
 * Enable multiple sections at once
 */
export function enableSections(
  spec: ProgramSpec, 
  sectionKeys: SectionKey[], 
  capabilities: string[] = []
): ProgramSpec {
  return sectionKeys.reduce((currentSpec, sectionKey) => {
    return enableSection(currentSpec, sectionKey, capabilities);
  }, spec);
}

/**
 * Disable multiple sections at once
 */
export function disableSections(spec: ProgramSpec, sectionKeys: SectionKey[]): ProgramSpec {
  return sectionKeys.reduce((currentSpec, sectionKey) => {
    return disableSection(currentSpec, sectionKey);
  }, spec);
}

/**
 * Check if a section is currently enabled
 */
export function isSectionEnabled(spec: ProgramSpec, sectionKey: SectionKey): boolean {
  return spec.ui_contract.sections.some(s => s.type === sectionKey);
}

/**
 * Reorder sections in the UI contract
 */
export function reorderSections(spec: ProgramSpec, newOrder: SectionKey[]): ProgramSpec {
  const existingSections = spec.ui_contract.sections;
  
  // Build new sections array in the specified order
  const reorderedSections: UISection[] = [];
  
  // Add sections in the new order
  newOrder.forEach(sectionKey => {
    const existingSection = existingSections.find(s => s.type === sectionKey);
    if (existingSection) {
      reorderedSections.push(existingSection);
    }
  });
  
  // Add any remaining sections that weren't in the new order
  existingSections.forEach(section => {
    if (!newOrder.includes(section.type)) {
      reorderedSections.push(section);
    }
  });

  return {
    ...spec,
    ui_contract: {
      ...spec.ui_contract,
      sections: reorderedSections
    }
  };
}

/**
 * Update props for a specific section
 */
export function updateSectionProps(
  spec: ProgramSpec, 
  sectionKey: SectionKey, 
  newProps: string[]
): ProgramSpec {
  return {
    ...spec,
    ui_contract: {
      ...spec.ui_contract,
      sections: spec.ui_contract.sections.map(section => 
        section.type === sectionKey 
          ? { ...section, props: [...newProps] }
          : section
      )
    }
  };
}

/**
 * Reset spec to default sections for the program type
 */
export function resetToDefaultSections(
  spec: ProgramSpec, 
  preset: 'minimal' | 'standard' | 'full' = 'standard',
  capabilities: string[] = []
): ProgramSpec {
  // Clear existing sections
  const clearedSpec: ProgramSpec = {
    ...spec,
    ui_contract: {
      ...spec.ui_contract,
      sections: []
    }
  };

  // Get default sections for this program type
  const defaultSections = getDefaultSectionsForType(spec.program_type, preset);
  
  // Enable all default sections
  return enableSections(clearedSpec, defaultSections, capabilities);
}

function getDefaultSectionsForType(programType: ProgramType, preset: 'minimal' | 'standard' | 'full'): SectionKey[] {
  const defaults = {
    loyalty: {
      minimal: ['balanceHeader', 'activityFeed'] as SectionKey[],
      standard: ['balanceHeader', 'rewardsGrid', 'offersStrip', 'activityFeed'] as SectionKey[],
      full: ['balanceHeader', 'progressNextTier', 'rewardsGrid', 'howToEarn', 'offersStrip', 'qrCheckInButton', 'activityFeed'] as SectionKey[]
    },
    membership: {
      minimal: ['membershipHeader', 'renewalCard'] as SectionKey[],
      standard: ['membershipHeader', 'renewalCard', 'perksGrid', 'offersStrip'] as SectionKey[],
      full: ['membershipHeader', 'renewalCard', 'allowancesList', 'creditWallet', 'perksGrid', 'offersStrip', 'qrCheckInButton', 'activityFeed'] as SectionKey[]
    },
    store_card: {
      minimal: ['storeCardHeader', 'balanceCard'] as SectionKey[],
      standard: ['storeCardHeader', 'balanceCard', 'redeemGrid'] as SectionKey[],
      full: ['storeCardHeader', 'balanceCard', 'redeemGrid', 'offersStrip', 'qrCheckInButton', 'activityFeed'] as SectionKey[]
    }
  };

  return defaults[programType][preset];
}
