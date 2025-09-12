/**
 * Temporary in-memory store for Pass Type IDs during development
 * In production, this would be replaced with Supabase database operations
 */

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

// Development store with default WalletPush certificate
const devPassTypeIDs: PassTypeID[] = [
  {
    id: 'default-walletpush-1',
    identifier: 'pass.com.walletpush.default',
    description: 'WalletPush Default Certificate',
    team_identifier: 'NC4W34D5LD',
    certificate_file_name: 'walletpush_default.p12',
    certificate_expiry: '2026-05-03T08:51:00Z',
    status: 'active',
    is_default: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    business_id: 'be023bdf-c668-4cec-ac51-65d3c02ea191'
  }
]

export class PassTypeIDStore {
  static getAll(): PassTypeID[] {
    return [...devPassTypeIDs]
  }

  static findById(id: string): PassTypeID | undefined {
    return devPassTypeIDs.find(pt => pt.id === id)
  }

  static findByIdentifier(identifier: string): PassTypeID | undefined {
    return devPassTypeIDs.find(pt => pt.identifier === identifier)
  }

  static add(passTypeID: PassTypeID): void {
    // If this is the first user-uploaded certificate, make it default
    if (devPassTypeIDs.filter(pt => !pt.identifier.includes('walletpush.default')).length === 0) {
      // Set all existing as non-default
      devPassTypeIDs.forEach(pt => pt.is_default = false)
      passTypeID.is_default = true
    }

    devPassTypeIDs.push(passTypeID)
  }

  static remove(id: string): boolean {
    const index = devPassTypeIDs.findIndex(pt => pt.id === id)
    
    if (index === -1) {
      return false
    }

    const passTypeID = devPassTypeIDs[index]

    // Prevent deletion if it's the only one
    if (devPassTypeIDs.length === 1) {
      throw new Error('Cannot delete the only remaining Pass Type ID')
    }

    // If deleting the default, set another one as default
    if (passTypeID.is_default) {
      const remaining = devPassTypeIDs.filter(pt => pt.id !== id)
      if (remaining.length > 0) {
        const nextIndex = devPassTypeIDs.findIndex(pt => pt.id === remaining[0].id)
        if (nextIndex !== -1) {
          devPassTypeIDs[nextIndex].is_default = true
          devPassTypeIDs[nextIndex].updated_at = new Date().toISOString()
        }
      }
    }

    devPassTypeIDs.splice(index, 1)
    return true
  }

  static setDefault(id: string): boolean {
    const passTypeID = devPassTypeIDs.find(pt => pt.id === id)
    
    if (!passTypeID) {
      return false
    }

    if (passTypeID.status !== 'active') {
      throw new Error('Cannot set an inactive certificate as default')
    }

    // Set all others as non-default
    devPassTypeIDs.forEach(pt => {
      pt.is_default = false
      pt.updated_at = new Date().toISOString()
    })

    // Set this one as default
    passTypeID.is_default = true
    passTypeID.updated_at = new Date().toISOString()

    return true
  }

  static getDefault(): PassTypeID | undefined {
    return devPassTypeIDs.find(pt => pt.is_default)
  }
}
