/**
 * Configurator State Hook
 * Manages draft spec state and section mutations
 */

import { useState, useCallback } from 'react';
import { ProgramSpec, enableSection, disableSection, reorderSections, resetToDefaultSections, isSectionEnabled } from './spec-mutations';
import { SectionKey, ProgramType, getDefaultSections } from './section-catalog';

export type ConfiguratorStep = 'template' | 'program-type' | 'components' | 'branding' | 'publish';

export function useConfiguratorState() {
  const [currentStep, setCurrentStep] = useState<ConfiguratorStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateCapabilities, setTemplateCapabilities] = useState<string[]>([]);
  const [draftSpec, setDraftSpec] = useState<ProgramSpec | null>(null);

  // Initialize draft spec when template and program type are selected
  const initializeDraftSpec = useCallback((template: any, programType: ProgramType, capabilities: string[]) => {
    const baseSpec: ProgramSpec = {
      version: '1.0',
      program_id: `draft-${Date.now()}`,
      program_type: programType,
      template_id: template.id,
      currency: 'USD',
      copy: {
        program_name: template.programs?.name || `${programType} Program`,
        tagline: 'Your rewards await!',
      },
      ui_contract: {
        layout: `${programType}_dashboard_v1`,
        sections: []
      }
    };

    // Add default sections for the program type
    const defaultSections = getDefaultSections(programType, 'standard');
    const specWithDefaults = resetToDefaultSections(baseSpec, 'standard', capabilities);
    
    setDraftSpec(specWithDefaults);
    setTemplateCapabilities(capabilities);
  }, []);

  // Section mutation functions
  const toggleSection = useCallback((sectionKey: SectionKey) => {
    if (!draftSpec) return;

    const isEnabled = isSectionEnabled(draftSpec, sectionKey);
    const newSpec = isEnabled 
      ? disableSection(draftSpec, sectionKey)
      : enableSection(draftSpec, sectionKey, templateCapabilities);
    
    setDraftSpec(newSpec);
  }, [draftSpec, templateCapabilities]);

  const reorderDashboardSections = useCallback((newOrder: SectionKey[]) => {
    if (!draftSpec) return;
    
    const newSpec = reorderSections(draftSpec, newOrder);
    setDraftSpec(newSpec);
  }, [draftSpec]);

  const resetSections = useCallback((preset: 'minimal' | 'standard' | 'full' = 'standard') => {
    if (!draftSpec) return;
    
    const newSpec = resetToDefaultSections(draftSpec, preset, templateCapabilities);
    setDraftSpec(newSpec);
  }, [draftSpec, templateCapabilities]);

  const updateProgramConfig = useCallback((updates: Partial<ProgramSpec>) => {
    if (!draftSpec) return;
    
    setDraftSpec({
      ...draftSpec,
      ...updates
    });
  }, [draftSpec]);

  // Navigation functions
  const goToStep = useCallback((step: ConfiguratorStep) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    const steps: ConfiguratorStep[] = ['template', 'program-type', 'components', 'branding', 'preview'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    const steps: ConfiguratorStep[] = ['template', 'program-type', 'components', 'branding', 'preview'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  // Check if section is enabled
  const isSectionActive = useCallback((sectionKey: SectionKey): boolean => {
    if (!draftSpec) return false;
    return isSectionEnabled(draftSpec, sectionKey);
  }, [draftSpec]);

  // Get enabled sections
  const getEnabledSections = useCallback((): SectionKey[] => {
    if (!draftSpec) return [];
    return draftSpec.ui_contract.sections.map(s => s.type);
  }, [draftSpec]);

  // Update section configuration
  const updateSectionConfig = useCallback((sectionKey: SectionKey, configPath: string, value: any) => {
    if (!draftSpec) return;

    const newSpec = { ...draftSpec };

    // Handle rules updates (e.g., rules.loyalty.check_in.points)
    if (configPath.startsWith('rules.')) {
      const pathParts = configPath.replace('rules.', '').split('.');
      let current = newSpec.rules || {};
      newSpec.rules = current;

      // Navigate to the correct nested object
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      // Set the final value
      current[pathParts[pathParts.length - 1]] = value;
    }
    // Handle settings updates (e.g., settings.style, settings.showCooldown)
    else if (configPath.startsWith('settings.')) {
      const settingKey = configPath.replace('settings.', '');
      const sectionIndex = newSpec.ui_contract.sections.findIndex(s => s.type === sectionKey);
      
      if (sectionIndex !== -1) {
        const section = { ...newSpec.ui_contract.sections[sectionIndex] };
        section.settings = { ...section.settings, [settingKey]: value };
        newSpec.ui_contract.sections[sectionIndex] = section;
      }
    }

    setDraftSpec(newSpec);
  }, [draftSpec]);

  // Publish configuration
  const publishConfiguration = useCallback(async (programId: string) => {
    if (!draftSpec) {
      throw new Error('No draft specification to publish');
    }

    console.log('📤 Publishing configuration...', { programId, draftSpec });

    const response = await fetch('/api/program/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        programId,
        draftSpec
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to publish configuration');
    }

    console.log('✅ Configuration published successfully!', result);
    return result;
  }, [draftSpec]);

  return {
    // State
    currentStep,
    selectedTemplate,
    templateCapabilities,
    draftSpec,
    
    // Template selection
    setSelectedTemplate,
    
    // Spec initialization
    initializeDraftSpec,
    
    // Section management
    toggleSection,
    reorderDashboardSections,
    resetSections,
    updateProgramConfig,
    updateSectionConfig,
    
    // Navigation
    goToStep,
    nextStep,
    prevStep,
    
    // Queries
    isSectionActive,
    getEnabledSections,
    
    // Publishing
    publishConfiguration,
  };
}
