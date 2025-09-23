/**
 * Shared pass store for the application
 * Moved to separate module to avoid Next.js route export restrictions
 */

export interface PassStoreEntry {
  templateId: string
  formData: any
  passBuffer?: Buffer
  createdAt: Date
}

// Global pass store
export const passStore = new Map<string, PassStoreEntry>()

// Helper functions
export function getPassFromStore(serialNumber: string): PassStoreEntry | undefined {
  return passStore.get(serialNumber)
}

export function setPassInStore(serialNumber: string, entry: PassStoreEntry): void {
  passStore.set(serialNumber, entry)
}

export function getPassStoreSize(): number {
  return passStore.size
}

export function clearPassStore(): void {
  passStore.clear()
}
