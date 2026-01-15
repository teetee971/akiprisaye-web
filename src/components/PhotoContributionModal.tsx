/**
 * Photo Contribution Modal
 * 
 * Modal for citizens to contribute product photos with GDPR compliance
 * 
 * Features:
 * - Image upload with preview
 * - Client-side compression
 * - GDPR consent checkbox
 * - Territory selection
 * - Product context (EAN, name)
 * - Geolocation (optional)
 * - Validation and error handling
 * 
 * @module PhotoContributionModal
 */

import React, { useState, useRef } from 'react';
import { compressWithPreset, validateImageFile, formatFileSize, type CompressionResult } from '../utils/imageCompression';
import type { TerritoryCode } from '../types/extensions';

interface PhotoContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productContext?: {
    name: string;
    barcode?: string;
    category?: string;
  };
  onSubmit?: (data: PhotoContribution) => Promise<void>;
}

export interface PhotoContribution {
  image: Blob;
  imageDataUrl: string;
  productName: string;
  barcode?: string;
  territory: TerritoryCode;
  storeName?: string;
  consentGiven: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  };
}

const TERRITORIES: { code: TerritoryCode; label: string }[] = [
  { code: '971', label: 'Guadeloupe (971)' },
  { code: '972', label: 'Martinique (972)' },
  { code: '973', label: 'Guyane (973)' },
  { code: '974', label: 'La Réunion (974)' },
  { code: '976', label: 'Mayotte (976)' },
  { code: '975', label: 'Saint-Pierre-et-Miquelon (975)' },
  { code: '977', label: 'Saint-Barthélemy (977)' },
  { code: '978', label: 'Saint-Martin (978)' },
  { code: '986', label: 'Wallis-et-Futuna (986)' },
  { code: '987', label: 'Polynésie française (987)' },
  { code: '988', label: 'Nouvelle-Calédonie (988)' }
];

export default function PhotoContributionModal({
  isOpen,
  onClose,
  productContext,
  onSubmit
}: PhotoContributionModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  
  const [productName, setProductName] = useState(productContext?.name || '');
  const [barcode, setBarcode] = useState(productContext?.barcode || '');
  const [territory, setTerritory] = useState<TerritoryCode>('971');
  const [storeName, setStoreName] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [useGeolocation, setUseGeolocation] = useState(false);
  
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file, 10);
    if (!validation.valid) {
      setError(validation.error || 'Fichier invalide');
      return;
    }

    setError(null);
    setImage(file);
    setIsCompressing(true);

    try {
      // Compress image
      const result = await compressWithPreset(file, 'upload');
      setCompressionResult(result);
      setImagePreview(result.dataUrl);
    } catch (err) {
      setError('Erreur lors de la compression de l\'image');
      console.error('Image compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    setCompressionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image || !compressionResult) {
      setError('Veuillez sélectionner une photo');
      return;
    }

    if (!productName.trim()) {
      setError('Veuillez indiquer le nom du produit');
      return;
    }

    if (!consentGiven) {
      setError('Vous devez accepter les conditions de contribution');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Trim values once
      const trimmedProductName = productName.trim();
      const trimmedBarcode = barcode.trim();
      const trimmedStoreName = storeName.trim();

      // Get geolocation if requested
      let location: { latitude: number; longitude: number } | undefined;
      if (useGeolocation && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (geoError) {
          console.warn('Failed to get geolocation:', geoError);
        }
      }

      const contribution: PhotoContribution = {
        image: compressionResult.blob,
        imageDataUrl: compressionResult.dataUrl,
        productName: trimmedProductName,
        barcode: trimmedBarcode || undefined,
        territory,
        storeName: trimmedStoreName || undefined,
        consentGiven: true,
        location,
        metadata: {
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.compressedSize,
          compressionRatio: compressionResult.compressionRatio
        }
      };

      if (onSubmit) {
        await onSubmit(contribution);
      }

      setSubmitted(true);

      // Reset and close after showing success message
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);

    } catch (err) {
      setError('Erreur lors de l\'envoi de la contribution');
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setImage(null);
    setImagePreview(null);
    setCompressionResult(null);
    setProductName(productContext?.name || '');
    setBarcode(productContext?.barcode || '');
    setStoreName('');
    setConsentGiven(false);
    setUseGeolocation(false);
    setSubmitted(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-modal-title"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 id="photo-modal-title" className="text-2xl font-bold text-gray-900 mb-2">
                📸 Contribuer une photo produit
              </h2>
              <p className="text-sm text-gray-600">
                Aidez la communauté en ajoutant une photo de ce produit
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {submitted ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Contribution envoyée !
              </h3>
              <p className="text-gray-600">
                Merci pour votre contribution. Elle sera vérifiée avant publication.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo du produit *
                </label>
                
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="photo-upload"
                      disabled={isCompressing}
                    />
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700 mb-1">
                        {isCompressing ? 'Compression en cours...' : 'Cliquez pour ajouter une photo'}
                      </span>
                      <span className="text-xs text-gray-500">
                        JPEG, PNG ou WebP - Max 10 MB
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="w-full h-64 object-contain rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      aria-label="Supprimer l'image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {compressionResult && (
                      <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                        <span>
                          Compression: {formatFileSize(compressionResult.originalSize)} → {formatFileSize(compressionResult.compressedSize)}
                        </span>
                        <span className="text-green-600 font-medium">
                          {Math.round((1 - compressionResult.compressionRatio) * 100)}% économisé
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du produit *
                </label>
                <input
                  id="product-name"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Lait demi-écrémé 1L"
                  required
                />
              </div>

              {/* Barcode */}
              <div>
                <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                  Code-barres (EAN)
                </label>
                <input
                  id="barcode"
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 3760123456789"
                  pattern="[0-9]{8,13}"
                />
              </div>

              {/* Territory */}
              <div>
                <label htmlFor="territory" className="block text-sm font-medium text-gray-700 mb-2">
                  Territoire *
                </label>
                <select
                  id="territory"
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value as TerritoryCode)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {TERRITORIES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Store Name */}
              <div>
                <label htmlFor="store-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du magasin (optionnel)
                </label>
                <input
                  id="store-name"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Carrefour Jarry"
                />
              </div>

              {/* Geolocation */}
              <div className="flex items-center">
                <input
                  id="geolocation"
                  type="checkbox"
                  checked={useGeolocation}
                  onChange={(e) => setUseGeolocation(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="geolocation" className="ml-2 text-sm text-gray-700">
                  📍 Partager ma position géographique (facultatif)
                </label>
              </div>

              {/* GDPR Consent */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <input
                    id="consent"
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="consent" className="ml-3 text-sm text-gray-700">
                    <span className="font-medium">J'accepte les conditions de contribution *</span>
                    <p className="mt-1 text-xs text-gray-600">
                      J'autorise la publication de cette photo pour enrichir la base de données publique.
                      Je certifie que cette photo a été prise par mes soins et ne contient aucune donnée personnelle.
                      Conformément au RGPD, je peux demander la suppression de cette contribution à tout moment.
                    </p>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !image || !consentGiven}
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer la contribution'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
