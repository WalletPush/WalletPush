// Apple Wallet Pass Image Specifications
export const APPLE_IMAGE_SPECS = {
  icon: {
    base: { width: 29, height: 29 },
    x2: { width: 58, height: 58 },
    x3: { width: 87, height: 87 }
  },
  logo: {
    base: { width: 160, height: 50 },
    x2: { width: 320, height: 100 },
    x3: { width: 480, height: 150 }
  },
  strip: {
    base: { width: 375, height: 123 },
    x2: { width: 750, height: 246 },
    x3: { width: 1125, height: 369 }
  },
  background: {
    base: { width: 180, height: 220 },
    x2: { width: 360, height: 440 },
    x3: { width: 540, height: 660 }
  },
  footer: {
    base: { width: 286, height: 15 },
    x2: { width: 572, height: 30 },
    x3: { width: 858, height: 45 }
  },
  thumbnail: {
    base: { width: 90, height: 90 },
    x2: { width: 180, height: 180 },
    x3: { width: 270, height: 270 }
  }
}

export interface ProcessedImage {
  file: File
  x1: string // Base64 1x resolution
  x2: string // Base64 2x resolution  
  x3: string // Base64 3x resolution
}

// Resize image to specific dimensions
function resizeImage(file: File, targetWidth: number, targetHeight: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = targetWidth
      canvas.height = targetHeight
      
      // Use high-quality image scaling
      if (ctx) {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
        
        // Convert to base64 with high quality
        const base64 = canvas.toDataURL('image/png', 0.95)
        resolve(base64)
      } else {
        reject(new Error('Canvas context not available'))
      }
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

// Process image for Apple Wallet (generate 1x, 2x, 3x versions)
export async function processImageForWallet(
  file: File, 
  imageType: keyof typeof APPLE_IMAGE_SPECS
): Promise<ProcessedImage> {
  try {
    const specs = APPLE_IMAGE_SPECS[imageType]
    
    // Generate all three resolutions
    const [x1, x2, x3] = await Promise.all([
      resizeImage(file, specs.base.width, specs.base.height),
      resizeImage(file, specs.x2.width, specs.x2.height),
      resizeImage(file, specs.x3.width, specs.x3.height)
    ])
    
    return {
      file,
      x1,
      x2,
      x3
    }
  } catch (error) {
    console.error('Error processing image:', error)
    throw error
  }
}

// Crop image with user-defined area
export function cropImage(
  file: File,
  cropArea: { x: number, y: number, width: number, height: number }
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = cropArea.width
      canvas.height = cropArea.height
      
      if (ctx) {
        ctx.drawImage(
          img,
          cropArea.x, cropArea.y, cropArea.width, cropArea.height,
          0, 0, cropArea.width, cropArea.height
        )
        
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], file.name, { type: file.type })
            resolve(croppedFile)
          } else {
            reject(new Error('Failed to crop image'))
          }
        }, file.type, 0.95)
      } else {
        reject(new Error('Canvas context not available'))
      }
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

// Generate preview URL from ProcessedImage
export function getImagePreviewUrl(processedImage: ProcessedImage): string {
  const file: any = processedImage?.file
  // If we still have a File/Blob (fresh upload), create an object URL
  if (file && (file instanceof File || file instanceof Blob)) {
    try {
      return URL.createObjectURL(file)
    } catch {
      // fall through to base64
    }
  }
  // Fallback: use the generated base64 (x1) preview
  const base = processedImage?.x1
  if (typeof base === 'string') {
    if (base.startsWith('data:')) return base
    return `data:image/png;base64,${base}`
  }
  return ''
}
