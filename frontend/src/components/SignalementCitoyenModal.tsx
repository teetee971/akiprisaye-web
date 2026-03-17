// src/components/SignalementCitoyenModal.tsx
// Citizen Observation Reporting Modal - local only, no backend
import React, { useState } from 'react'
import { useCitizenReport, type ObservationType } from '../hooks/useCitizenReport'

type SignalementCitoyenModalProps = {
  isOpen: boolean
  onClose: () => void
  productContext?: {
    name: string
    ean?: string
  }
}

/**
 * Get French label for observation type
 */
function getObservationTypeLabel(type: ObservationType): string {
  switch (type) {
    case 'price_different':
      return 'Prix différent constaté'
    case 'product_absent':
      return 'Produit absent'
    case 'reference_error':
      return 'Erreur de référence'
    case 'other_observation':
      return 'Autre observation terrain'
  }
}

export default function SignalementCitoyenModal({
  isOpen,
  onClose,
  productContext,
}: SignalementCitoyenModalProps) {
  const { addReport } = useCitizenReport()
  const [type, setType] = useState<ObservationType>('price_different')
  const [description, setDescription] = useState('')
  const [observationDate, setObservationDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [store, setStore] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Check feature flag
  const isEnabled = import.meta.env.VITE_FEATURE_CITIZEN_REPORT === 'true'

  if (!isOpen || !isEnabled) {
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      return
    }

    addReport({
      type,
      description: description.trim(),
      observationDate: `${observationDate}T12:00:00Z`,
      store: store.trim() || undefined,
    })

    setSubmitted(true)

    // Reset form after 2 seconds
    setTimeout(() => {
      setSubmitted(false)
      setDescription('')
      setStore('')
      setType('price_different')
      onClose()
    }, 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 cursor-default"
        onClick={onClose}
        tabIndex={-1}
        aria-label="Fermer le dialogue"
      />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.22)',
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 id="modal-title" className="text-2xl font-bold text-white mb-2">
                Signaler une observation
              </h2>
              {productContext && (
                <p className="text-sm text-white/70">
                  Produit : {productContext.name}
                  {productContext.ean && ` (${productContext.ean})`}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl leading-none"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          {submitted ? (
            /* Success message */
            <div className="py-12 text-center">
              <div className="text-6xl mb-4">✓</div>
              <div className="text-xl font-semibold text-white mb-3">
                Observation enregistrée localement
              </div>
              <p className="text-white/70 mb-2">
                Merci pour votre contribution citoyenne.
              </p>
              <p className="text-sm text-white/60">
                Aucun envoi réseau.
              </p>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit}>
              {/* Observation Type */}
              <div className="mb-4">
                <label htmlFor="observation-type" className="block text-sm font-medium text-white mb-2">
                  Type d'observation <span className="text-red-400">*</span>
                </label>
                <select
                  id="observation-type"
                  name="observationType"
                  value={type}
                  onChange={(e) => setType(e.target.value as ObservationType)}
                  className="w-full px-4 py-3 bg-white/[0.1] border border-white/[0.22] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="price_different" className="bg-gray-800">
                    {getObservationTypeLabel('price_different')}
                  </option>
                  <option value="product_absent" className="bg-gray-800">
                    {getObservationTypeLabel('product_absent')}
                  </option>
                  <option value="reference_error" className="bg-gray-800">
                    {getObservationTypeLabel('reference_error')}
                  </option>
                  <option value="other_observation" className="bg-gray-800">
                    {getObservationTypeLabel('other_observation')}
                  </option>
                </select>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  className="w-full px-4 py-3 bg-white/[0.1] border border-white/[0.22] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  maxLength={500}
                  placeholder="Décrivez votre observation..."
                  required
                />
                <div className="text-xs text-white/50 mt-1 text-right">
                  {description.length}/500 caractères
                </div>
              </div>

              {/* Observation Date */}
              <div className="mb-4">
                <label htmlFor="observation-date" className="block text-sm font-medium text-white mb-2">
                  Date d'observation (optionnel)
                </label>
                <input
                  type="date"
                  id="observation-date"
                  name="observationDate"
                  value={observationDate}
                  onChange={(e) => setObservationDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-white/[0.1] border border-white/[0.22] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Store */}
              <div className="mb-6">
                <label htmlFor="store" className="block text-sm font-medium text-white mb-2">
                  Enseigne (optionnel)
                </label>
                <input
                  type="text"
                  id="store"
                  name="store"
                  value={store}
                  onChange={(e) => setStore(e.target.value.slice(0, 100))}
                  className="w-full px-4 py-3 bg-white/[0.1] border border-white/[0.22] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom de l'enseigne..."
                  maxLength={100}
                />
              </div>

              {/* Institutional disclaimer (mandatory) */}
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-200">
                <p>
                  Les observations citoyennes ne constituent pas des données officielles et ne sont
                  pas intégrées aux calculs.
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 text-white/70 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!description.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Enregistrer localement
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
