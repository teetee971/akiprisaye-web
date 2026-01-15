/**
 * AddMissingProduct Component
 * Allows users to add products not found in the database
 * 
 * Features:
 * - Product details form (name, brand, category)
 * - Optional photo upload
 * - EAN code capture
 * - Validation before submission
 * 
 * Workflow:
 * 1. User scans unknown EAN
 * 2. System shows "not found"
 * 3. User can contribute product info
 * 4. Goes through moderation
 * 5. Published after validation
 */

import { useState } from 'react';
import ProductPhotoUpload from './ProductPhotoUpload';

interface AddMissingProductProps {
  ean: string;
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  'Alimentation',
  'Boissons',
  'Hygiène',
  'Entretien',
  'Bébé',
  'Cosmétiques',
  'Textile',
  'Électronique',
  'Autre',
];

export default function AddMissingProduct({
  ean,
  onSuccess,
  onCancel,
}: AddMissingProductProps) {
  const [step, setStep] = useState<'form' | 'photo' | 'success'>('form');
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    size: '',
    description: '',
  });
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate form data
   */
  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Le nom du produit est requis';
    }
    if (formData.name.length < 3) {
      return 'Le nom du produit doit contenir au moins 3 caractères';
    }
    if (!formData.category) {
      return 'Veuillez sélectionner une catégorie';
    }
    return null;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would:
      // 1. Create pending product entry
      // 2. Link photo if provided
      // 3. Send for moderation
      // 4. Return product ID
      
      const productData = {
        ean,
        ...formData,
        photoId,
        status: 'pending_moderation',
        source: 'contribution_citoyenne',
        submittedAt: new Date().toISOString(),
      };
      
      console.log('Product contribution submitted:', productData);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const mockProductId = `product-${Date.now()}`;
      
      setStep('success');
      
      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess?.(mockProductId);
      }, 2000);
      
    } catch (err) {
      console.error('Product submission error:', err);
      setError('Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle photo upload completion
   */
  const handlePhotoUpload = (uploadedPhotoId: string) => {
    setPhotoId(uploadedPhotoId);
    setStep('form');
  };

  // Photo upload step
  if (step === 'photo') {
    return (
      <ProductPhotoUpload
        productEan={ean}
        productName={formData.name || 'Nouveau produit'}
        onUploadSuccess={handlePhotoUpload}
        onCancel={() => setStep('form')}
      />
    );
  }

  // Success step
  if (step === 'success') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Produit ajouté avec succès !
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400">
            Merci pour votre contribution ! Le produit sera visible après validation par notre équipe.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Prochaines étapes :</strong>
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1 list-disc list-inside">
              <li>Vérification des informations (24-48h)</li>
              <li>Validation et publication</li>
              <li>Le produit apparaîtra dans les recherches</li>
            </ul>
          </div>
          
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

  // Form step
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Ajouter un produit manquant
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
        {/* EAN display */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Code EAN scanné
          </p>
          <code className="font-mono text-lg font-bold text-gray-900 dark:text-white">
            {ean}
          </code>
        </div>

        {/* Product name */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Nom du produit <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Lait demi-écrémé 1L"
            maxLength={200}
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Marque
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="Ex: Lactel, Président, etc."
            maxLength={100}
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Catégorie <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Sélectionner --</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Size/Quantity */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Contenance / Quantité
          </label>
          <input
            type="text"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            placeholder="Ex: 1L, 500g, 250ml, etc."
            maxLength={50}
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Description (optionnel)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Informations complémentaires..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.description.length}/500 caractères
          </p>
        </div>

        {/* Photo section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white">
              Photo du produit
            </label>
            {photoId && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Photo ajoutée
              </span>
            )}
          </div>
          <button
            onClick={() => setStep('photo')}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {photoId ? 'Changer la photo' : 'Ajouter une photo'}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Une photo aide à valider le produit plus rapidement
          </p>
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
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.category}
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
              'Soumettre le produit'
            )}
          </button>
        </div>

        {/* Info message */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-xs text-gray-700 dark:text-gray-300">
            <strong>ℹ️ Information :</strong> Votre contribution sera vérifiée avant publication.
            Cela peut prendre 24 à 48 heures. Vous enrichissez notre base de données collaborative !
          </p>
        </div>
      </div>
    </div>
  );
}
