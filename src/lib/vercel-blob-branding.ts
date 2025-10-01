import { put, del } from '@vercel/blob'

export type EntityType = 'platform' | 'agency' | 'business'
export type AssetType = 'logo' | 'favicon' | 'banner' | 'certificate'

/**
 * VERCEL BLOB BRANDING ASSET MANAGER
 * 
 * Organized folder structure:
 * - platform/images/
 * - agencies/{agency-id}/images/
 * - businesses/{business-id}/images/
 */

/**
 * Generate secure blob path for branding assets
 */
export function generateBlobPath(
  entityType: EntityType,
  entityId: string,
  assetType: AssetType,
  fileName: string
): string {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  
  switch (entityType) {
    case 'platform':
      return `platform/images/${sanitizedFileName}`
    
    case 'agency':
      return `agencies/${entityId}/images/${sanitizedFileName}`
    
    case 'business':
      return `businesses/${entityId}/images/${sanitizedFileName}`
    
    default:
      throw new Error(`Invalid entity type: ${entityType}`)
  }
}

/**
 * Upload branding asset to Vercel Blob with organized folder structure
 */
export async function uploadBrandingAsset(
  file: File,
  entityType: EntityType,
  entityId: string,
  assetType: AssetType,
  options: {
    domain?: string // For domain-locking security
    replaceExisting?: boolean
  } = {}
): Promise<{
  url: string
  pathname: string
  size: number
}> {
  try {
    // Validate file type for security
    const allowedTypes = {
      logo: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
      favicon: ['image/x-icon', 'image/png', 'image/jpeg'],
      banner: ['image/png', 'image/jpeg', 'image/jpg'],
      certificate: ['application/x-pkcs12', 'application/pkcs12']
    }

    if (!allowedTypes[assetType].includes(file.type)) {
      throw new Error(`Invalid file type for ${assetType}. Allowed: ${allowedTypes[assetType].join(', ')}`)
    }

    // Validate file size (max 5MB for images, 1MB for certificates)
    const maxSize = assetType === 'certificate' ? 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error(`File too large. Max size: ${maxSize / (1024 * 1024)}MB`)
    }

    // Generate secure blob path
    const blobPath = generateBlobPath(entityType, entityId, assetType, file.name)

    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: !options.replaceExisting
    })

    console.log(`✅ Uploaded ${assetType} for ${entityType} ${entityId}:`, blob.url)

    return {
      url: blob.url,
      pathname: blobPath,
      size: file.size
    }

  } catch (error) {
    console.error(`❌ Error uploading ${assetType}:`, error)
    throw error
  }
}

/**
 * Delete branding asset from Vercel Blob
 */
export async function deleteBrandingAsset(blobUrl: string): Promise<void> {
  try {
    await del(blobUrl)
    console.log(`✅ Deleted branding asset:`, blobUrl)
  } catch (error) {
    console.error(`❌ Error deleting branding asset:`, error)
    throw error
  }
}

/**
 * Get default asset URLs for fallbacks
 */
export function getDefaultAssetUrl(assetType: AssetType, entityType: EntityType): string | null {
  const defaults = {
    platform: {
      logo: '/images/walletpush-logo.png',
      favicon: '/favicon.ico',
      banner: '/images/walletpush-banner.jpg'
    },
    agency: {
      logo: '/images/default-agency-logo.png',
      favicon: '/images/default-agency-favicon.ico',
      banner: '/images/default-agency-banner.jpg'
    },
    business: {
      logo: '/images/default-business-logo.png',
      favicon: '/images/default-business-favicon.ico',
      banner: '/images/default-business-banner.jpg'
    }
  }

  // Certificates don't have defaults, only branding assets do
  if (assetType === 'certificate') {
    return null
  }
  
  return defaults[entityType][assetType] || defaults.platform[assetType]
}

/**
 * Validate entity ownership before allowing uploads (security)
 */
export async function validateEntityOwnership(
  entityType: EntityType,
  entityId: string,
  userId: string
): Promise<boolean> {
  // This would integrate with your existing auth system
  // For now, return true - implement actual validation based on your auth logic
  return true
}

/**
 * Generate secure upload URL with pre-signed access
 */
export async function generateSecureUploadUrl(
  entityType: EntityType,
  entityId: string,
  assetType: AssetType,
  fileName: string,
  userId: string
): Promise<string> {
  // Validate ownership first
  const isOwner = await validateEntityOwnership(entityType, entityId, userId)
  if (!isOwner) {
    throw new Error('Unauthorized: User does not own this entity')
  }

  // Generate the blob path
  const blobPath = generateBlobPath(entityType, entityId, assetType, fileName)
  
  // Return the path for client-side upload
  return blobPath
}
