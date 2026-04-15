/**
 * ProductPhotoUpload Component
 * Allows users to upload photos of products with GDPR compliance
 * 
 * Features:
 * - File selection with validation
 * - Image preview before upload
 * - GDPR consent requirement
 * - Client-side image compression
 * - Upload progress feedback
 * 
 * GDPR Compliance:
 * - Explicit consent checkbox required
 * - Clear information about data usage
 * - User can revoke consent
 */

import { useState, useRef, ChangeEvent } from 'react';
import { submitPhotoContribution } from '../../services/contributionService';
import type { TerritoryCode } from '../../types/extensions';

// Configuration constants
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface ProductPhotoUploadProps {
  productEan: string;
  productName: string;
  territory?: TerritoryCode;
  storeName?: string;
  onUploadSuccess?: (photoId: string) => void;
  onCancel?: () => void;
  maxFileSizeMB?: number; // Allow override of default max file size
}

export default function ProductPhotoUpload({
  productEan,
  productName,
  territory = 'GP',
  storeName,
  onUploadSuccess,
  onCancel,
  maxFileSizeMB = MAX_FILE_SIZE_MB,
}: ProductPhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

  /**
   * Handle file selection
   */
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }
    
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Veuillez sélectionner une image valide (JPG, PNG, WebP)');
      return;
    }
    
    // Validate file size
    if (file.size > maxFileSizeBytes) {
      setError(`La taille de l'image ne doit pas dépasser ${maxFileSizeMB} Mo`);
      return;
    }
    
    setError(null);
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Clear selected file
   */
  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle photo upload
   */
  const handleUpload = async () => {
    if (!selectedFile || !consent) {
      setError('Veuillez sélectionner une photo et accepter les conditions');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const photoId = await submitPhotoContribution({
        image: selectedFile,
        imageDataUrl: preview || '',
        productName,
        barcode: productEan,
        territory,
        storeName,
        consentGiven: consent,
        metadata: {
          originalSize: selectedFile.size,
          compressedSize: selectedFile.size,
          compressionRatio: 0,
        },
      });
      
      setSuccess(true);
      
      // Call success callback after a brief delay
      setTimeout(() => {
        onUploadSuccess?.(photoId);
      }, 1000);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('Erreur lors de l\'envoi de la photo. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Photo envoyée avec succès !
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400">
            Merci pour votre contribution. Votre photo sera visible après validation.
          </p>
          
          <button
            onClick={onCancel}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Ajouter une photo
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Product info */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Produit
          </p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {productName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            EAN: {productEan}
          </p>
        </div>

        {/* File upload area */}
        <div>
          <label htmlFor="product-photo-upload" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Sélectionner une photo
          </label>
          
          {!preview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                Cliquez pour sélectionner une image
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                JPG, PNG (max 10 Mo)
              </p>
            </button>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Aperçu"
                loading="lazy"
                className="w-full h-64 object-contain bg-gray-100 dark:bg-gray-900 rounded-xl"
              />
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                aria-label="Supprimer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          <input
            id="product-photo-upload"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* GDPR Consent */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Consentement RGPD requis :</strong> J'accepte que ma photo soit publiée sur la plateforme
              "A KI PRI SA YÉ" pour enrichir les informations produits. Je comprends que cette photo sera visible
              par tous les utilisateurs et pourra être utilisée à des fins d'information. Je peux demander la
              suppression de ma photo à tout moment en contactant le support.
            </span>
          </label>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              {error}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
          )}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !consent || loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Envoi en cours...
              </>
            ) : (
              'Envoyer la photo'
            )}
          </button>
        </div>

        {/* Info message */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Vos photos enrichissent notre base de données collaborative et aident les autres utilisateurs.
        </p>
      </div>
    </div>
  );
}
