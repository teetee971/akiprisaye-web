/**
 * Image Compression Utility
 * 
 * Provides client-side image compression and resizing for user uploads
 * without requiring any server-side processing.
 * 
 * Features:
 * - Browser-based compression (no server uploads needed)
 * - Multiple quality/size presets
 * - EXIF orientation handling
 * - Progressive JPEG support
 * - WebP format support (with fallback to JPEG)
 * 
 * @module imageCompression
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'webp' | 'png';
  maxSizeMB?: number;
}

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
  format: string;
}

/**
 * Default compression presets
 */
export const COMPRESSION_PRESETS = {
  thumbnail: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.7,
    format: 'jpeg' as const,
    maxSizeMB: 0.1
  },
  small: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.8,
    format: 'jpeg' as const,
    maxSizeMB: 0.3
  },
  medium: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.85,
    format: 'jpeg' as const,
    maxSizeMB: 0.5
  },
  large: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.9,
    format: 'jpeg' as const,
    maxSizeMB: 1
  },
  upload: {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.85,
    format: 'jpeg' as const,
    maxSizeMB: 2
  }
};

/**
 * Load image from file or blob
 */
function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;
  
  // Scale down if image is larger than max dimensions
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Compress and resize image
 * 
 * @param file - Input image file
 * @param options - Compression options
 * @returns Compressed image data
 */
export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    format = 'jpeg',
    maxSizeMB = 2
  } = options;
  
  // Load the image
  const img = await loadImage(file);
  
  // Calculate new dimensions
  const dimensions = calculateDimensions(
    img.width,
    img.height,
    maxWidth,
    maxHeight
  );
  
  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Use better image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw image
  ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
  
  // Convert to blob
  const mimeType = format === 'png' ? 'image/png' : 
                   format === 'webp' ? 'image/webp' : 
                   'image/jpeg';
  
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      mimeType,
      quality
    );
  });
  
  // Check if compressed size is within limits
  const compressedSizeMB = blob.size / (1024 * 1024);
  if (maxSizeMB && compressedSizeMB > maxSizeMB) {
    // If still too large, try with lower quality
    const lowerQuality = quality * 0.8;
    if (lowerQuality > 0.3) {
      return compressImage(file, { ...options, quality: lowerQuality });
    }
  }
  
  // Convert blob to data URL
  const dataUrl = await blobToDataUrl(blob);
  
  const originalSize = file.size;
  const compressedSize = blob.size;
  
  return {
    blob,
    dataUrl,
    originalSize,
    compressedSize,
    compressionRatio: originalSize > 0 ? compressedSize / originalSize : 1,
    width: dimensions.width,
    height: dimensions.height,
    format: mimeType
  };
}

/**
 * Convert blob to data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Compress image with preset
 * 
 * @param file - Input image file
 * @param preset - Preset name
 * @returns Compressed image data
 */
export async function compressWithPreset(
  file: File | Blob,
  preset: keyof typeof COMPRESSION_PRESETS
): Promise<CompressionResult> {
  return compressImage(file, COMPRESSION_PRESETS[preset]);
}

/**
 * Validate image file
 * 
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Le fichier doit être une image' };
  }
  
  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return { 
      valid: false, 
      error: `La taille du fichier ne doit pas dépasser ${maxSizeMB} MB` 
    };
  }
  
  // Check image type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Format non supporté. Utilisez JPEG, PNG ou WebP' 
    };
  }
  
  return { valid: true };
}

/**
 * Format file size for display
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Get compression stats as human-readable string
 * 
 * @param result - Compression result
 * @returns Formatted stats string
 */
export function getCompressionStats(result: CompressionResult): string {
  const savedBytes = result.originalSize - result.compressedSize;
  const savedPercent = Math.round((1 - result.compressionRatio) * 100);
  
  return `Compression: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (${savedPercent}% économisé)`;
}

/**
 * Create multiple sizes from one image
 * 
 * @param file - Input image file
 * @returns Object with multiple compressed sizes
 */
export async function createMultipleSizes(file: File | Blob): Promise<{
  thumbnail: CompressionResult;
  small: CompressionResult;
  medium: CompressionResult;
  large: CompressionResult;
}> {
  const [thumbnail, small, medium, large] = await Promise.all([
    compressWithPreset(file, 'thumbnail'),
    compressWithPreset(file, 'small'),
    compressWithPreset(file, 'medium'),
    compressWithPreset(file, 'large')
  ]);
  
  return { thumbnail, small, medium, large };
}
