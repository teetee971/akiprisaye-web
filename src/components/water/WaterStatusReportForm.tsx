/**
 * Water Status Report Form
 * Formulaire de contribution citoyenne pour signaler l'état de l'eau
 */

import React, { useState } from 'react';
import type { WaterStatus } from '../../types/waterComparison';
import { reportWaterStatus } from '../../services/waterAvailabilityService';

interface WaterStatusReportFormProps {
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export default function WaterStatusReportForm({
  onSubmitSuccess,
  onCancel,
}: WaterStatusReportFormProps) {
  const [formData, setFormData] = useState({
    commune: '',
    quartier: '',
    address: '',
    status: 'available' as WaterStatus,
    since: new Date().toISOString().slice(0, 16), // datetime-local format
    duration: '',
    scheduledEnd: '',
  });

  const [useGeolocation, setUseGeolocation] = useState(false);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get user's location
  function requestGeolocation() {
    if ('geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates([position.coords.longitude, position.coords.latitude]);
          setUseGeolocation(true);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError('Impossible d\'obtenir votre position');
          setLoading(false);
        }
      );
    } else {
      setError('Géolocalisation non disponible');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Use coordinates or default fallback
      const coords: [number, number] = coordinates || [0, 0];

      await reportWaterStatus({
        location: {
          commune: formData.commune,
          quartier: formData.quartier || undefined,
          address: formData.address || undefined,
          coordinates: coords,
        },
        status: formData.status,
        since: formData.since,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        scheduledEnd: formData.scheduledEnd || undefined,
        reportedBy: 'user',
        contributorId: 'anonymous', // In real app, would use authenticated user ID
      });

      setSuccess(true);
      setTimeout(() => {
        onSubmitSuccess?.();
      }, 2000);
    } catch (err) {
      console.error('Error submitting report:', err);
      setError('Erreur lors de l\'envoi du signalement');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-green-400 mb-2">
          Signalement envoyé !
        </h3>
        <p className="text-green-300">
          Merci pour votre contribution. Votre signalement sera vérifié prochainement.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4">
          Signaler l'état de l'eau chez vous
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          Vos contributions aident la communauté à connaître la situation en temps réel
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Location */}
      <div className="space-y-4">
        <div>
          <label htmlFor="commune" className="block text-sm font-medium text-slate-300 mb-2">
            Commune <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="commune"
            required
            value={formData.commune}
            onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Ex: Mamoudzou, Pointe-à-Pitre..."
          />
        </div>

        <div>
          <label htmlFor="quartier" className="block text-sm font-medium text-slate-300 mb-2">
            Quartier (optionnel)
          </label>
          <input
            type="text"
            id="quartier"
            value={formData.quartier}
            onChange={(e) => setFormData({ ...formData, quartier: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Ex: Kawéni, Bergevin..."
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-300 mb-2">
            Adresse (optionnel)
          </label>
          <input
            type="text"
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Votre adresse..."
          />
        </div>

        <div>
          <button
            type="button"
            onClick={requestGeolocation}
            disabled={loading || useGeolocation}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 text-white rounded-lg transition-colors text-sm"
          >
            📍 {useGeolocation ? 'Position enregistrée' : 'Utiliser ma position GPS'}
          </button>
          {coordinates && (
            <p className="text-xs text-slate-400 mt-2">
              Coordonnées: {coordinates[1].toFixed(4)}, {coordinates[0].toFixed(4)}
            </p>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-2">
          État de l'eau <span className="text-red-400">*</span>
        </label>
        <select
          id="status"
          required
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as WaterStatus })}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="available">🟢 Eau disponible</option>
          <option value="low_pressure">🟡 Faible pression</option>
          <option value="scheduled_cut">🟠 Coupure programmée</option>
          <option value="cut">🔴 Coupure en cours</option>
        </select>
      </div>

      {/* Timing */}
      <div>
        <label htmlFor="since" className="block text-sm font-medium text-slate-300 mb-2">
          Depuis quand ? <span className="text-red-400">*</span>
        </label>
        <input
          type="datetime-local"
          id="since"
          required
          value={formData.since}
          onChange={(e) => setFormData({ ...formData, since: e.target.value })}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {(formData.status === 'cut' || formData.status === 'low_pressure') && (
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-slate-300 mb-2">
            Durée estimée (minutes)
          </label>
          <input
            type="number"
            id="duration"
            min="0"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Ex: 480 (8 heures)"
          />
        </div>
      )}

      {formData.status === 'scheduled_cut' && (
        <div>
          <label htmlFor="scheduledEnd" className="block text-sm font-medium text-slate-300 mb-2">
            Fin prévue
          </label>
          <input
            type="datetime-local"
            id="scheduledEnd"
            value={formData.scheduledEnd}
            onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Envoi en cours...' : 'Envoyer le signalement'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
