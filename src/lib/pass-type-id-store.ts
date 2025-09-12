/**
 * Persistent file-based store for Pass Type IDs during development
 * In production, this would be replaced with Supabase database operations
 */

import { savePassTypeIDs, loadPassTypeIDs } from './dev-storage'

interface PassTypeID {
  id: string
  identifier: string
  description: string
  team_identifier: string
  certificate_file_name: string
  certificate_expiry: string
  status: 'active' | 'expired' | 'pending'
  is_default: boolean
  created_at: string
  updated_at: string
  business_id: string
}

// Cache for the current session
let cachedPassTypeIDs: PassTypeID[] | null = null

export class PassTypeIDStore {
  static async getAll(): Promise<PassTypeID[]> {
    if (!cachedPassTypeIDs) {
      cachedPassTypeIDs = await loadPassTypeIDs()
    }
    return [...cachedPassTypeIDs]
  }

  static async findById(id: string): Promise<PassTypeID | undefined> {
    const passTypeIDs = await this.getAll()
    return passTypeIDs.find(pt => pt.id === id)
  }

  static async findByIdentifier(identifier: string): Promise<PassTypeID | undefined> {
    const passTypeIDs = await this.getAll()
    return passTypeIDs.find(pt => pt.identifier === identifier)
  }

  static async add(passTypeID: PassTypeID): Promise<void> {
    const passTypeIDs = await this.getAll()
    
    // If this is the first user-uploaded certificate, make it default
    if (passTypeIDs.filter(pt => !pt.identifier.includes('walletpush.default')).length === 0) {
      // Set all existing as non-default
      passTypeIDs.forEach(pt => pt.is_default = false)
      passTypeID.is_default = true
    }

    passTypeIDs.push(passTypeID)
    cachedPassTypeIDs = passTypeIDs
    await savePassTypeIDs(passTypeIDs)
  }

  static async remove(id: string): Promise<boolean> {
    const passTypeIDs = await this.getAll()
    const index = passTypeIDs.findIndex(pt => pt.id === id)
    
    if (index === -1) {
      return false
    }

    const passTypeID = passTypeIDs[index]

    // Prevent deletion if it's the only one
    if (passTypeIDs.length === 1) {
      throw new Error('Cannot delete the only remaining Pass Type ID')
    }

    // If deleting the default, set another one as default
    if (passTypeID.is_default) {
      const remaining = passTypeIDs.filter(pt => pt.id !== id)
      if (remaining.length > 0) {
        const nextIndex = passTypeIDs.findIndex(pt => pt.id === remaining[0].id)
        if (nextIndex !== -1) {
          passTypeIDs[nextIndex].is_default = true
          passTypeIDs[nextIndex].updated_at = new Date().toISOString()
        }
      }
    }

    passTypeIDs.splice(index, 1)
    cachedPassTypeIDs = passTypeIDs
    await savePassTypeIDs(passTypeIDs)
    return true
  }

  static async setDefault(id: string): Promise<boolean> {
    const passTypeIDs = await this.getAll()
    const passTypeID = passTypeIDs.find(pt => pt.id === id)
    
    if (!passTypeID) {
      return false
    }

    if (passTypeID.status !== 'active') {
      throw new Error('Cannot set an inactive certificate as default')
    }

    // Set all others as non-default
    passTypeIDs.forEach(pt => {
      pt.is_default = false
      pt.updated_at = new Date().toISOString()
    })

    // Set this one as default
    passTypeID.is_default = true
    passTypeID.updated_at = new Date().toISOString()

    cachedPassTypeIDs = passTypeIDs
    await savePassTypeIDs(passTypeIDs)
    return true
  }

  static async getDefault(): Promise<PassTypeID | undefined> {
    const passTypeIDs = await this.getAll()
    return passTypeIDs.find(pt => pt.is_default)
  }
}
