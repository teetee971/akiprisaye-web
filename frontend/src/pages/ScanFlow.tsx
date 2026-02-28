/**
 * Unified Scan Flow Page - v1.0.0
 * 
 * Page unifiée pour le flux de scan et comparaison
 * Parcours utilisateur: Capture → Comprendre → Comparer
 * 
 * Principes:
 * - Un seul point d'entrée: "Scanner un produit"
 * - Progression automatique entre les étapes
 * - Réutilisation des composants existants
 * - Aucune donnée stockée sur serveur
 * - Messages clairs sur limites et fiabilité
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Image as ImageIcon, Receipt } from 'lucide-react';
import { useScanFlow } from '../context/ScanFlowContext';
import { GlassCard } from '../components/ui/glass-card';
import type { ScanSource } from '../types/scanFlow';

export default function ScanFlow() {
  const {
    currentStep,
    scannedProduct,
    isProcessing,
    error,
    startScan,
    reset,
    previousStep,
  } = useScanFlow();
  const navigate = useNavigate();

  /**
   * Gestion de la navigation automatique vers le comparateur
   * Quand un produit est scanné et compris, on passe automatiquement à la comparaison
   */
  useEffect(() => {
    if (currentStep === 'comparison' && scannedProduct && scannedProduct.ean) {
      // Redirection vers le comparateur avec le contexte
      const params = new URLSearchParams({
        ean: scannedProduct.ean,
        source: scannedProduct.source,
        confidence: scannedProduct.confidenceScore.toString(),
      });

      if (scannedProduct.detectedPrice) {
        params.append('referencePrice', scannedProduct.detectedPrice.toString());
      }

      if (scannedProduct.detectedStore) {
        params.append('referenceStore', scannedProduct.detectedStore);
      }

      navigate(`/comparateur-intelligent?${params.toString()}`);
    }
  }, [currentStep, scannedProduct, navigate]);

  /**
   * Démarrer un scan avec une source spécifique
   */
  const handleStartScan = (source: ScanSource) => {
    startScan(source);

    // Rediriger vers la page appropriée selon la source
    if (source === 'ean') {
      navigate('/scan-ean?flow=unified');
    } else if (source === 'photo') {
      // Navigate to new comprehensive product photo analysis
      navigate('/analyse-photo-produit');
    } else if (source === 'ticket') {
      navigate('/scanner?flow=unified');
    }
  };

  /**
   * Retour en arrière
   */
  const handleBack = () => {
    if (currentStep === 'capture') {
      navigate(-1);
    } else {
      previousStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header avec navigation */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Scanner un Produit</h1>
            <p className="text-gray-400 text-sm mt-1">
              Parcours unifié: Capture → Comprendre → Comparer
            </p>
          </div>
        </div>

        {/* Indicateur de progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <StepIndicator
              label="Capture"
              active={currentStep === 'capture'}
              completed={currentStep !== 'capture'}
              number={1}
            />
            <div className="flex-1 h-1 bg-slate-700 mx-2">
              <div
                className={`h-full bg-blue-500 transition-all duration-500 ${
                  currentStep === 'capture' ? 'w-0' : currentStep === 'understanding' ? 'w-1/2' : 'w-full'
                }`}
              />
            </div>
            <StepIndicator
              label="Comprendre"
              active={currentStep === 'understanding'}
              completed={currentStep === 'comparison'}
              number={2}
            />
            <div className="flex-1 h-1 bg-slate-700 mx-2">
              <div
                className={`h-full bg-blue-500 transition-all duration-500 ${
                  currentStep === 'comparison' ? 'w-full' : 'w-0'
                }`}
              />
            </div>
            <StepIndicator
              label="Comparer"
              active={currentStep === 'comparison'}
              completed={false}
              number={3}
            />
          </div>
        </div>

        {/* Message d'information institutionnel */}
        <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <p className="text-blue-200 text-sm">
            <strong>ℹ️ Observatoire citoyen</strong> - Les données affichées sont issues d'observations
            réelles, publiques et traçables. Ce service est informatif et non contractuel.
          </p>
        </div>

        {/* Affichage d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-200 text-sm">
              <strong>⚠️ Erreur</strong> - {error}
            </p>
          </div>
        )}

        {/* Étape 1: Capture */}
        {currentStep === 'capture' && (
          <div className="space-y-4">
            <GlassCard>
              <h2 className="text-xl font-semibold text-white mb-4">
                Choisissez votre méthode de scan
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Sélectionnez comment vous souhaitez identifier votre produit
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Option 1: Scan code-barres */}
                <button
                  onClick={() => handleStartScan('ean')}
                  disabled={isProcessing}
                  className="p-6 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-blue-500 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                  <h3 className="text-white font-semibold mb-2">Code-barres</h3>
                  <p className="text-gray-400 text-xs">
                    Scanner le code EAN avec votre caméra
                  </p>
                  <div className="mt-3 text-green-400 text-xs">
                    ✓ Rapide et précis
                  </div>
                </button>

                {/* Option 2: Photo produit */}
                <button
                  onClick={() => handleStartScan('photo')}
                  disabled={isProcessing}
                  className="p-6 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-blue-500 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                  <h3 className="text-white font-semibold mb-2">Analyse Complète</h3>
                  <p className="text-gray-400 text-xs">
                    Ingrédients, nutrition, prix, tendances
                  </p>
                  <div className="mt-3 text-green-400 text-xs">
                    ✓ Fiche produit détaillée
                  </div>
                </button>

                {/* Option 3: Ticket de caisse */}
                <button
                  onClick={() => handleStartScan('ticket')}
                  disabled={isProcessing}
                  className="p-6 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-blue-500 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Receipt className="w-12 h-12 mx-auto mb-3 text-orange-400" />
                  <h3 className="text-white font-semibold mb-2">Ticket de caisse</h3>
                  <p className="text-gray-400 text-xs">
                    Scanner un ticket pour extraire les prix
                  </p>
                  <div className="mt-3 text-yellow-400 text-xs">
                    ⚠️ OCR (peut nécessiter validation)
                  </div>
                </button>
              </div>
            </GlassCard>

            {/* Informations sur les limites */}
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <h3 className="text-white font-semibold mb-3 text-sm">
                📋 Limites et fiabilité
              </h3>
              <ul className="text-gray-400 text-xs space-y-2 list-disc list-inside">
                <li>
                  <strong>Code-barres:</strong> Détection automatique rapide et fiable (95%+)
                </li>
                <li>
                  <strong>Analyse complète:</strong> OCR ingrédients, nutrition, prix, tendances (75-85% fiabilité)
                </li>
                <li>
                  <strong>Ticket:</strong> OCR avec limites selon qualité (60-80% fiabilité)
                </li>
                <li>
                  Aucune donnée personnelle n'est stockée ou transmise à des tiers
                </li>
                <li>
                  Les prix et informations affichées sont informatifs et non contractuels
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Étape 2: Comprendre (affichée temporairement pendant le traitement) */}
        {currentStep === 'understanding' && (
          <GlassCard>
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
              <h2 className="text-white text-xl font-semibold mb-2">
                Analyse en cours...
              </h2>
              <p className="text-gray-400 text-sm">
                Normalisation des données et identification du produit
              </p>
              {scannedProduct && (
                <div className="mt-4 text-xs text-gray-500">
                  Source: {scannedProduct.source} | Confiance: {scannedProduct.confidenceScore}%
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Étape 3: Comparaison (redirection automatique vers le comparateur) */}
        {currentStep === 'comparison' && (
          <GlassCard>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔄</div>
              <h2 className="text-white text-xl font-semibold mb-2">
                Redirection vers le comparateur...
              </h2>
              <p className="text-gray-400 text-sm">
                Chargement des données de comparaison
              </p>
            </div>
          </GlassCard>
        )}

        {/* Bouton de réinitialisation */}
        {(error || currentStep !== 'capture') && !isProcessing && (
          <div className="mt-6 text-center">
            <button
              onClick={reset}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              Recommencer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Composant indicateur d'étape
 */
interface StepIndicatorProps {
  label: string;
  active: boolean;
  completed: boolean;
  number: number;
}

function StepIndicator({ label, active, completed, number }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
          transition-all duration-300
          ${completed ? 'bg-green-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-400'}
        `}
      >
        {completed ? '✓' : number}
      </div>
      <span
        className={`
          mt-2 text-xs font-medium
          ${active || completed ? 'text-white' : 'text-gray-500'}
        `}
      >
        {label}
      </span>
    </div>
  );
}
