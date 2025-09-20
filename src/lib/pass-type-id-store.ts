/**
 * Database-based store for Pass Type IDs
 * Uses Supabase database operations
 */

import { createClient } from './supabase/server'

interface PassTypeID {
  id: string
  identifier: string
  description: string
  team_identifier: string
  certificate_file_name: string
  certificate_file_path?: string
  certificate_password?: string
  certificate_expiry: string
  status: 'active' | 'expired' | 'pending'
  is_default: boolean
  is_global?: boolean
  created_at: string
  updated_at: string
  business_id?: string
}

export class PassTypeIDStore {
  /**
   * Get all Pass Type IDs (both business and global)
   */
  static async getAll(): Promise<PassTypeID[]> {
    try {
      const supabase = await createClient()
      const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191' // TODO: Get from context
      
      // Get both business and global Pass Type IDs
      const { data: passTypeIds, error } = await supabase
        .from('pass_type_ids')
        .select('*')
        .or(`account_id.eq.${businessId},is_global.eq.true`)
        .order('is_global', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Failed to fetch Pass Type IDs:', error)
        return []
      }
      
      // Transform database result to interface
      const transformedData = (passTypeIds || []).map(item => ({
        id: item.id,
        identifier: item.pass_type_identifier,
        description: item.label,
        team_identifier: item.team_id,
        certificate_file_name: item.p12_path ? item.p12_path.split('/').pop() : 'Not uploaded',
        certificate_file_path: item.p12_path,
        certificate_password: item.p12_password_enc,
        certificate_expiry: '2026-12-10', // Default since not in DB
        status: item.is_validated ? 'active' : 'pending',
        is_default: item.is_global || false, // Global certificates are default
        is_global: item.is_global || false,
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
        business_id: item.account_id
      } as PassTypeID))
      
      return transformedData
      
    } catch (error) {
      console.error('❌ Error fetching Pass Type IDs:', error)
      return []
    }
  }

  /**
   * Find Pass Type ID by database ID
   */
  static async findById(id: string): Promise<PassTypeID | undefined> {
    try {
      const supabase = await createClient()
      
      const { data: passTypeId, error } = await supabase
        .from('pass_type_ids')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error || !passTypeId) {
        console.error('❌ Failed to fetch Pass Type ID by ID:', error)
        return undefined
      }
      
      return {
        id: passTypeId.id,
        identifier: passTypeId.pass_type_identifier,
        description: passTypeId.label,
        team_identifier: passTypeId.team_id,
        certificate_file_name: passTypeId.p12_path ? passTypeId.p12_path.split('/').pop() : 'Not uploaded',
        certificate_file_path: passTypeId.p12_path,
        certificate_password: passTypeId.p12_password_enc,
        certificate_expiry: '2026-12-10',
        status: passTypeId.is_validated ? 'active' : 'pending',
        is_default: passTypeId.is_global || false,
        is_global: passTypeId.is_global || false,
        created_at: passTypeId.created_at,
        updated_at: passTypeId.updated_at || passTypeId.created_at,
        business_id: passTypeId.tenant_id
      }
      
    } catch (error) {
      console.error('❌ Error fetching Pass Type ID by ID:', error)
      return undefined
    }
  }

  /**
   * Find Pass Type ID by identifier
   */
  static async findByIdentifier(identifier: string): Promise<PassTypeID | undefined> {
    const passTypeIDs = await this.getAll()
    return passTypeIDs.find(pt => pt.identifier === identifier)
  }

  /**
   * Get Pass Type ID associated with a specific template
   */
  static async getForTemplate(templateId: string): Promise<PassTypeID | undefined> {
    try {
      const supabase = await createClient()
      
      // Get the template's program and its associated Pass Type ID
      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .select(`
          id,
          program_id,
          programs!inner (
            id,
            pass_type_ids_id,
            pass_type_ids!inner (
              id,
              label,
              pass_type_identifier,
              team_id,
              p12_path,
              p12_password_enc,
              is_validated,
              is_global,
              created_at,
              updated_at,
              tenant_id
            )
          )
        `)
        .eq('id', templateId)
        .single()
      
      if (templateError || !templateData) {
        console.error('❌ Failed to fetch template Pass Type ID:', templateError)
        return await this.getDefault() // Fallback to default
      }
      
      const passTypeData = Array.isArray(templateData.programs) 
        ? templateData.programs[0]?.pass_type_ids 
        : (templateData.programs as any)?.pass_type_ids
      
      return {
        id: passTypeData.id,
        identifier: passTypeData.pass_type_identifier,
        description: passTypeData.label,
        team_identifier: passTypeData.team_id,
        certificate_file_name: passTypeData.p12_path ? passTypeData.p12_path.split('/').pop() : 'Not uploaded',
        certificate_file_path: passTypeData.p12_path,
        certificate_password: passTypeData.p12_password_enc,
        certificate_expiry: '2026-12-10',
        status: passTypeData.is_validated ? 'active' : 'pending',
        is_default: passTypeData.is_global || false,
        is_global: passTypeData.is_global || false,
        created_at: passTypeData.created_at,
        updated_at: passTypeData.updated_at || passTypeData.created_at,
        business_id: passTypeData.tenant_id
      }
      
    } catch (error) {
      console.error('❌ Error fetching template Pass Type ID:', error)
      return await this.getDefault() // Fallback to default
    }
  }

  /**
   * Get the default Pass Type ID (preferably global)
   */
  static async getDefault(): Promise<PassTypeID | undefined> {
    const passTypeIDs = await this.getAll()
    
    // First try to get a global Pass Type ID
    const globalPassType = passTypeIDs.find(pt => pt.is_global && pt.status === 'active')
    if (globalPassType) {
      return globalPassType
    }
    
    // Fallback to any active Pass Type ID
    return passTypeIDs.find(pt => pt.status === 'active')
  }
}

// Export the interface for use in other modules
export type { PassTypeID }