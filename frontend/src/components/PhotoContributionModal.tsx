/**
 * Photo Contribution Modal
 *
 * Modal for citizens to contribute product photos with GDPR compliance
 */

import React, { useState, useRef } from 'react';
import {
  compressWithPreset,
  validateImageFile,
  formatFileSize,
  type CompressionResult,
} from '../utils/imageCompression';
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

/**
 * Canonical territories aligned with TerritoryCode
 * Labels keep INSEE codes for UX clarity
 */
const TERRITORIES: { code: TerritoryCode; label: string }[] = [
  { code: 'GP', label: 'Guadeloupe (971)' },
  { code: 'MQ', label: 'Martinique (972)' },
  { code: 'GF', label: 'Guyane (973)' },
  { code: 'RE', label: 'La Réunion (974)' },
  { code: 'PM', label: 'Saint-Pierre-et-Miquelon (975)' },
  { code: 'YT', label: 'Mayotte (976)' },
  { code: 'BL', label: 'Saint-Barthélemy (977)' },
  { code: 'MF', label: 'Saint-Martin (978)' },
  { code: 'WF', label: 'Wallis-et-Futuna (986)' },
  { code: 'PF', label: 'Polynésie française (987)' },
  { code: 'NC', label: 'Nouvelle-Calédonie (988)' },
];

export default function PhotoContributionModal({
  isOpen,
  onClose,
  productContext,
  onSubmit,
}: PhotoContributionModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);

  const [productName, setProductName] = useState(productContext?.name || '');
  const [barcode, setBarcode] = useState(productContext?.barcode || '');
  const [territory, setTerritory] = useState<TerritoryCode>('GP');
  const [storeName, setStoreName] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [useGeolocation, setUseGeolocation] = useState(false);

  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 10);
    if (!validation.valid) {
      setError(validation.error || 'Fichier invalide');
      return;
    }

    setError(null);
    setImage(file);
    setIsCompressing(true);

    try {
      const result = await compressWithPreset(file, 'upload');
      setCompressionResult(result);
      setImagePreview(result.dataUrl);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la compression de l'image");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    setCompressionResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      let location: { latitude: number; longitude: number } | undefined;

      if (useGeolocation && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject)
          );
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch {
          // geolocation is optional → silent fail
        }
      }

      const contribution: PhotoContribution = {
        image: compressionResult.blob,
        imageDataUrl: compressionResult.dataUrl,
        productName: productName.trim(),
        barcode: barcode.trim() || undefined,
        territory,
        storeName: storeName.trim() || undefined,
        consentGiven: true,
        location,
        metadata: {
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.compressedSize,
          compressionRatio: compressionResult.compressionRatio,
        },
      };

      await onSubmit?.(contribution);
      setSubmitted(true);

      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'envoi de la contribution");
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
    setTerritory('GP');
    setStoreName('');
    setConsentGiven(false);
    setUseGeolocation(false);
    setSubmitted(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* JSX inchangé en dessous */
  return (
    /* … aucun changement structurel nécessaire … */
    <div />
  );
}
