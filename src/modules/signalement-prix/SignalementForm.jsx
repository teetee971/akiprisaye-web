import { useState } from 'react';

/**
 * Signalement Form Component
 * Allows citizens to report observed prices with legal safeguards
 * NO automatic publication, NO accusations, LOCAL storage only
 * @param {Function} onSubmit - Callback when signalement is saved locally
 */
export default function SignalementForm({ onSubmit = null }) {
  const [step, setStep] = useState(1); // 1: form, 2: confirmation
  const [formData, setFormData] = useState({
    territory: 'guadeloupe',
    store: '',
    product: '',
    price: '',
    proof: null,
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});
  const [hasAccepted, setHasAccepted] = useState(false);

  // Predefined options
  const territories = [
    { id: 'guadeloupe', label: 'Guadeloupe' },
    { id: 'martinique', label: 'Martinique' },
    { id: 'guyane', label: 'Guyane' },
    { id: 'reunion', label: 'La Réunion' },
  ];

  const commonProducts = [
    'Riz 1 kg',
    'Sucre 1 kg',
    'Lait 1 litre',
    'Huile 1 litre',
    'Pâtes 500g',
    'Farine 1 kg',
    'Pain 400g',
    'Café 250g',
    'Autre (à préciser)',
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.store.trim()) {
      newErrors.store = 'Le nom du magasin est obligatoire';
    }

    if (!formData.product.trim()) {
      newErrors.product = 'Le produit est obligatoire';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Le prix doit être supérieur à 0';
    }

    if (!hasAccepted) {
      newErrors.acceptance = 'Vous devez confirmer l\'exactitude de vos informations';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleProofUpload = (proofData) => {
    setFormData((prev) => ({ ...prev, proof: proofData }));
  };

  const handleNext = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSaveLocally = () => {
    // Generate unique ID
    const signalementId = `sig-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    
    const signalement = {
      id: signalementId,
      date: formData.date,
      territory: formData.territory,
      store: formData.store,
      product: formData.product,
      price: parseFloat(formData.price),
      proof: formData.proof
        ? {
            type: 'photo',
            file: formData.proof.name || 'uploaded_photo.jpg',
            data: formData.proof.data, // base64 or blob URL
          }
        : null,
      status: 'non_verifie',
      timestamp: new Date().toISOString(),
    };

    // Save to localStorage
    try {
      const existingData = JSON.parse(localStorage.getItem('signalements_en_attente') || '[]');
      existingData.push(signalement);
      localStorage.setItem('signalements_en_attente', JSON.stringify(existingData));

      // Call parent callback if provided
      if (onSubmit) {
        onSubmit(signalement);
      }

      // Reset form
      setFormData({
        territory: 'guadeloupe',
        store: '',
        product: '',
        price: '',
        proof: null,
        date: new Date().toISOString().split('T')[0],
      });
      setHasAccepted(false);
      setStep(1);

      // Show success message (consider upgrading to toast notification in future)
      if (window.confirm('✅ Signalement enregistré localement. Merci de votre contribution !')) {
        // User acknowledged
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      // Show error message (consider upgrading to toast notification in future)
      if (window.confirm('❌ Erreur lors de l\'enregistrement. Veuillez réessayer.')) {
        // User acknowledged
      }
    }
  };

  if (step === 2) {
    return (
      <SignalementConfirmation
        data={formData}
        onBack={handleBack}
        onConfirm={handleSaveLocally}
        hasAccepted={hasAccepted}
        onAcceptChange={setHasAccepted}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📝 Signaler un prix observé
        </h2>
        <p className="text-sm text-gray-600">
          Contribution citoyenne encadrée
        </p>
      </div>

      {/* Legal Warning */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium mb-2">
          ℹ️ Information importante
        </p>
        <p className="text-sm text-blue-800">
          Ce signalement correspond à une <strong>observation ponctuelle</strong> effectuée par un citoyen.
          Il ne constitue ni une accusation, ni une preuve juridique, ni une analyse économique.
          Les données ne seront <strong>pas publiées automatiquement</strong> et feront l'objet d'une vérification.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        {/* Territory Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Territoire *
          </label>
          <select
            value={formData.territory}
            onChange={(e) => handleInputChange('territory', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {territories.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Store Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du magasin *
          </label>
          <input
            type="text"
            value={formData.store}
            onChange={(e) => handleInputChange('store', e.target.value)}
            placeholder="Ex: Carrefour Baie-Mahault"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.store ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.store && (
            <p className="mt-1 text-sm text-red-600">{errors.store}</p>
          )}
        </div>

        {/* Product */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Produit *
          </label>
          <select
            value={formData.product}
            onChange={(e) => handleInputChange('product', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.product ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">-- Sélectionner un produit --</option>
            {commonProducts.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.product && (
            <p className="mt-1 text-sm text-red-600">{errors.product}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prix observé (€) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            placeholder="Ex: 1.89"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.price ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date d'observation *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Photo Upload */}
        <UploadPreuve onUpload={handleProofUpload} currentProof={formData.proof} />

        {/* Acceptance Checkbox */}
        <div className="pt-4 border-t border-gray-200">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasAccepted}
              onChange={(e) => setHasAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              <strong>☑ Je confirme</strong> que ces informations correspondent à une observation personnelle 
              et que je comprends qu'elles ne seront pas publiées automatiquement.
            </span>
          </label>
          {errors.acceptance && (
            <p className="mt-2 text-sm text-red-600">{errors.acceptance}</p>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continuer →
          </button>
        </div>
      </div>
    </div>
  );
}
