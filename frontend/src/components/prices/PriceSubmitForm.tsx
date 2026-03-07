 
/**
 * Price Submit Form Component
 * Form for submitting new price observations
 */

import React, { useState } from 'react';

export interface PriceSubmitFormProps {
  productId: string;
  storeId: string;
  onSubmit?: (result: any) => void;
  onCancel?: () => void;
}

type PriceSource =
  | 'OCR_TICKET'
  | 'OFFICIAL_API'
  | 'OPEN_PRICES'
  | 'MANUAL_ENTRY'
  | 'CROWDSOURCED'
  | 'SCRAPING_AUTHORIZED';

const PriceSubmitForm: React.FC<PriceSubmitFormProps> = ({
  productId,
  storeId,
  onSubmit,
  onCancel,
}) => {
  const [price, setPrice] = useState('');
  const [source, setSource] = useState<PriceSource>('MANUAL_ENTRY');
  const [observedAt, setObservedAt] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const priceValue = parseFloat(price);
      if (isNaN(priceValue) || priceValue <= 0) {
        throw new Error('Prix invalide');
      }

      const payload = {
        productId,
        storeId,
        price: priceValue,
        observedAt: new Date(observedAt).toISOString(),
        source,
      };

      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit price');
      }

      const result = await response.json();
      setSuccess(result.message || 'Prix soumis avec succès');
      setPrice('');
      
      if (onSubmit) {
        onSubmit(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Signaler un prix
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Prix (€) *
          </label>
          <input
            type="number"
            id="price"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="9.99"
          />
        </div>

        <div>
          <label
            htmlFor="observedAt"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date d'observation *
          </label>
          <input
            type="date"
            id="observedAt"
            value={observedAt}
            onChange={(e) => setObservedAt(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="source"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Source *
          </label>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value as PriceSource)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="MANUAL_ENTRY">Saisie manuelle</option>
            <option value="OCR_TICKET">Scan de ticket</option>
            <option value="CROWDSOURCED">Contribution citoyenne</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Envoi...' : 'Soumettre'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PriceSubmitForm;
