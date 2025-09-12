import { promises as fs } from 'fs'
import path from 'path'

const DEV_STORAGE_DIR = path.join(process.cwd(), '.dev-storage')
const PASS_TYPE_IDS_FILE = path.join(DEV_STORAGE_DIR, 'pass-type-ids.json')

// Ensure storage directory exists
async function ensureStorageDir() {
  try {
    await fs.mkdir(DEV_STORAGE_DIR, { recursive: true })
  } catch (error) {
    // Directory already exists
  }
}

export async function savePassTypeIDs(passTypeIDs: any[]) {
  try {
    await ensureStorageDir()
    await fs.writeFile(PASS_TYPE_IDS_FILE, JSON.stringify(passTypeIDs, null, 2))
  } catch (error) {
    console.error('Failed to save Pass Type IDs:', error)
  }
}

export async function loadPassTypeIDs(): Promise<any[]> {
  try {
    await ensureStorageDir()
    const data = await fs.readFile(PASS_TYPE_IDS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // File doesn't exist or is invalid, return default
    const defaultPassTypeIDs = [
      {
        id: 'default-walletpush-1',
        identifier: 'pass.com.walletpush.default',
        description: 'WalletPush Default Certificate',
        team_identifier: 'NC4W34D5LD',
        certificate_file_name: 'walletpush_default.p12',
        certificate_expiry: '2026-05-03T08:51:00Z',
        status: 'active',
        is_default: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        business_id: 'be023bdf-c668-4cec-ac51-65d3c02ea191'
      }
    ]
    
    // Save the default for next time
    await savePassTypeIDs(defaultPassTypeIDs)
    return defaultPassTypeIDs
  }
}
