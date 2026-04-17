/**
 * Photo Service - v1.1.0
 *
 * Service for uploading, compressing and managing product photos
 * Mobile-first with automatic compression
 *
 * @module photoService
 */

import type { ProductPhoto, PhotoUploadConfig } from '../types/product';
import { safeLocalStorage } from '../utils/safeLocalStorage';

/**
 * Default photo upload configuration
 */
const DEFAULT_CONFIG: PhotoUploadConfig = {
  maxSizeMB: 2,
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.85,
  format: 'jpeg',
};

/**
 * Compress and resize image
 */
async function compressImage(
  file: File,
  config: PhotoUploadConfig = DEFAULT_CONFIG
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > config.maxWidth || height > config.maxHeight) {
          if (width > height) {
            height = (height / width) * config.maxWidth;
            width = config.maxWidth;
          } else {
            width = (width / height) * config.maxHeight;
            height = config.maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          `image/${config.format}`,
          config.quality
        );
      };

      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload photo to storage
 * Returns URL of uploaded photo
 */
export async function uploadPhoto(
  file: File,
  productId: string,
  config?: Partial<PhotoUploadConfig>
): Promise<ProductPhoto> {
  try {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };

    // Compress image
    const compressed = await compressImage(file, fullConfig);

    // In production, upload to cloud storage (Firebase, Cloudflare R2, etc.)
    // For now, create object URL (temporary)
    const url = URL.createObjectURL(compressed);

    const photo: ProductPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url,
      uploadedAt: new Date().toISOString(),
      isMain: false,
    };

    // Store in safeLocalStorage for demo
    const photos = getStoredPhotos(productId);
    photos.push(photo);
    safeLocalStorage.setItem(`photos_${productId}`, JSON.stringify(photos));

    return photo;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Photo upload failed:', error);
    }
    throw new Error("Erreur lors de l'upload de la photo");
  }
}

/**
 * Get stored photos for a product
 */
export function getStoredPhotos(productId: string): ProductPhoto[] {
  try {
    const stored = safeLocalStorage.getItem(`photos_${productId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Set main photo for product
 */
export function setMainPhoto(productId: string, photoId: string): void {
  const photos = getStoredPhotos(productId);
  const updated = photos.map((p) => ({
    ...p,
    isMain: p.id === photoId,
  }));
  safeLocalStorage.setItem(`photos_${productId}`, JSON.stringify(updated));
}

/**
 * Delete photo
 */
export function deletePhoto(productId: string, photoId: string): void {
  const photos = getStoredPhotos(productId);
  const filtered = photos.filter((p) => p.id !== photoId);
  safeLocalStorage.setItem(`photos_${productId}`, JSON.stringify(filtered));
}

/**
 * Validate file before upload
 */
export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Le fichier doit être une image' };
  }

  // Check file size (max 10MB before compression)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: "L'image est trop grande (max 10MB)" };
  }

  return { valid: true };
}
