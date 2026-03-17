 
/**
 * Contribution Form Component
 * 
 * Generic form for citizen contributions to comparators.
 * Highly customizable with dynamic fields.
 * 
 * Features:
 * - Dynamic field rendering
 * - Real-time validation
 * - File upload support
 * - Territory selection
 * - GDPR consent
 * - Anonymous option
 */

import React, { useState, useCallback } from 'react';
import { Send, Check, AlertCircle, Lock } from 'lucide-react';
import type { ContributionField, Territory } from '../../types/comparatorCommon';
import { validateContribution } from '../../utils/dataValidator';
import type { ValidationResult } from '../../types/comparatorCommon';
import { getAllTerritories } from '../../utils/territoryMapper';

export interface ContributionFormProps {
  /** Type of comparator */
  comparatorType: string;
  /** Form fields definition */
  fields: ContributionField[];
  /** Submit callback */
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  /** Require proof/evidence */
  requireProof?: boolean;
  /** Allow anonymous submissions */
  allowAnonymous?: boolean;
}

/**
 * Contribution Form Component
 */
export const ContributionForm: React.FC<ContributionFormProps> = ({
  comparatorType,
  fields,
  onSubmit,
  requireProof = false,
  allowAnonymous = true,
}) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const territories = getAllTerritories();

  /**
   * Handle field change
   */
  const handleFieldChange = useCallback((fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Handle file upload
   */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProofFile(file);
  }, []);

  /**
   * Validate form
   */
  const validateForm = useCallback((): boolean => {
    const validationErrors: Record<string, string> = {};

    // Validate each required field
    for (const field of fields) {
      if (field.required && !formData[field.name]) {
        validationErrors[field.name] = `Le champ "${field.label}" est requis`;
      }

      // Custom validation
      if (field.validation && formData[field.name]) {
        if (!field.validation(formData[field.name])) {
          validationErrors[field.name] = `Le champ "${field.label}" n'est pas valide`;
        }
      }
    }

    // Validate proof requirement
    if (requireProof && !proofFile) {
      validationErrors.proof = 'Une preuve est requise pour cette contribution';
    }

    // Validate consent
    if (!consentGiven) {
      validationErrors.consent = 'Vous devez accepter les conditions d\'utilisation';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [fields, formData, proofFile, requireProof, consentGiven]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setSubmitting(true);

      try {
        const contributionData = {
          ...formData,
          comparatorType,
          anonymous,
          consentGiven,
          proof: proofFile,
          timestamp: new Date().toISOString(),
        };

        await onSubmit(contributionData);
        setSubmitted(true);
      } catch (err) {
        setErrors({
          submit: err instanceof Error ? err.message : 'Erreur lors de la soumission',
        });
      } finally {
        setSubmitting(false);
      }
    },
    [validateForm, formData, comparatorType, anonymous, consentGiven, proofFile, onSubmit]
  );

  /**
   * Render field based on type
   */
  const renderField = (field: ContributionField) => {
    const value = formData[field.name];
    const error = errors[field.name];

    switch (field.type) {
      case 'text':
        return (
          <input
            id={field.name}
            name={field.name}
            type="text"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-invalid={!!error}
            aria-describedby={error ? `${field.name}-error` : undefined}
          />
        );

      case 'number':
        return (
          <input
            id={field.name}
            name={field.name}
            type="number"
            value={(value as number) || ''}
            onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value))}
            placeholder={field.placeholder}
            step="0.01"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-invalid={!!error}
            aria-describedby={error ? `${field.name}-error` : undefined}
          />
        );

      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-invalid={!!error}
            aria-describedby={error ? `${field.name}-error` : undefined}
          >
            <option value="">Sélectionner...</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'territory':
        return (
          <select
            id={field.name}
            name={field.name}
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-invalid={!!error}
            aria-describedby={error ? `${field.name}-error` : undefined}
          >
            <option value="">Sélectionner un territoire...</option>
            {territories.map((territory) => (
              <option key={territory.code} value={territory.code}>
                {territory.name}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            id={field.name}
            name={field.name}
            type="date"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-invalid={!!error}
            aria-describedby={error ? `${field.name}-error` : undefined}
          />
        );

      default:
        return null;
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8 text-center">
        <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-100 mb-2">
          Contribution envoyée !
        </h3>
        <p className="text-gray-300 mb-4">
          Merci pour votre contribution citoyenne. Elle sera vérifiée avant publication.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData({});
            setProofFile(null);
            setConsentGiven(false);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Faire une autre contribution
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Fields */}
      {fields.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className="block text-sm font-medium text-gray-300 mb-2">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          {renderField(field)}
          {field.helpText && (
            <p className="mt-1 text-xs text-gray-400">{field.helpText}</p>
          )}
          {errors[field.name] && (
            <p id={`${field.name}-error`} className="mt-1 text-xs text-red-400">
              {errors[field.name]}
            </p>
          )}
        </div>
      ))}

      {/* Proof Upload */}
      {requireProof && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preuve (photo, facture, etc.) <span className="text-red-400">*</span>
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
          {errors.proof && (
            <p className="mt-1 text-xs text-red-400">{errors.proof}</p>
          )}
        </div>
      )}

      {/* Anonymous Option */}
      {allowAnonymous && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="anonymous"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800"
          />
          <label htmlFor="anonymous" className="text-sm text-gray-300">
            Contribution anonyme
          </label>
        </div>
      )}

      {/* Consent */}
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="consent"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800"
          />
          <label htmlFor="consent" className="text-xs text-gray-300">
            J'accepte que mes données soient utilisées pour améliorer ce comparateur citoyen
            (RGPD - Données traitées de manière anonymisée)
          </label>
        </div>
        {errors.consent && (
          <p className="text-xs text-red-400 ml-6">{errors.consent}</p>
        )}
      </div>

      {/* Privacy Note */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <div className="flex gap-2">
          <Lock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-200">
            Vos données sont protégées et seront modérées avant publication
          </p>
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
      >
        {submitting ? (
          <>
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            Envoi en cours...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Envoyer la contribution
          </>
        )}
      </button>
    </form>
  );
};

export default ContributionForm;
