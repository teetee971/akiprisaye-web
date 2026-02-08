/**
 * PriceSubmitForm Component
 * 
 * Form for submitting new prices with source selection and proof upload
 */

import React, { useState } from 'react';

type PriceSource = 'USER_SUBMISSION' | 'RECEIPT_SCAN' | 'STORE_OFFICIAL' | 'API_INTEGRATION' | 'COMMUNITY_VERIFIED' | 'ADMIN_OVERRIDE';

interface PriceSubmitFormProps {
  productId: string;
  storeId: string;
  onSubmit: (data: PriceSubmissionData) => Promise<void>;
  onCancel?: () => void;
}

export interface PriceSubmissionData {
  productId: string;
  storeId: string;
  price: number;
  source: PriceSource;
  proofUrl?: string;
  submittedBy?: string;
}

const PriceSubmitForm: React.FC<PriceSubmitFormProps> = ({
  productId,
  storeId,
  onSubmit,
  onCancel,
}) => {
  const [price, setPrice] = useState<string>('');
  const [source, setSource] = useState<PriceSource>('USER_SUBMISSION');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const sourceOptions: Array<{ value: PriceSource; label: string; description: string }> = [
    { value: 'USER_SUBMISSION', label: 'Soumission utilisateur', description: 'Prix observé en magasin' },
    { value: 'RECEIPT_SCAN', label: 'Scan de ticket', description: 'Prix scanné depuis un ticket de caisse' },
    { value: 'STORE_OFFICIAL', label: 'Site officiel', description: 'Prix depuis le site du magasin' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      setError('Veuillez entrer un prix valide');
      return;
    }

    if (priceValue > 1000000) {
      setError('Le prix ne peut pas dépasser 1 000 000€');
      return;
    }

    if (proofUrl && !isValidUrl(proofUrl)) {
      setError('L\'URL de preuve n\'est pas valide');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        productId,
        storeId,
        price: priceValue,
        source,
        proofUrl: proofUrl || undefined,
      });

      // Reset form on success
      setPrice('');
      setProofUrl('');
      setSource('USER_SUBMISSION');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la soumission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Soumettre un nouveau prix
        </h3>
      </div>

      {/* Price input */}
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
          Prix <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            max="1000000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={isSubmitting}
          />
          <span className="absolute right-3 top-2 text-gray-500">€</span>
        </div>
      </div>

      {/* Source selection */}
      <div>
        <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
          Source <span className="text-red-500">*</span>
        </label>
        <select
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value as PriceSource)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          disabled={isSubmitting}
        >
          {sourceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {sourceOptions.find(o => o.value === source)?.description}
        </p>
      </div>

      {/* Proof URL (optional) */}
      <div>
        <label htmlFor="proofUrl" className="block text-sm font-medium text-gray-700 mb-1">
          URL de preuve (optionnel)
        </label>
        <input
          id="proofUrl"
          type="url"
          value={proofUrl}
          onChange={(e) => setProofUrl(e.target.value)}
          placeholder="https://exemple.com/photo-ticket.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
        <p className="mt-1 text-xs text-gray-500">
          Photo de ticket, capture d'écran du site, etc.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Info message */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-700">
          <strong>ℹ️ Note:</strong> Votre soumission sera vérifiée par la communauté. 
          Plus vous fournissez de preuves, plus votre score de confiance sera élevé.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Soumission en cours...' : 'Soumettre le prix'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
};

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default PriceSubmitForm;
