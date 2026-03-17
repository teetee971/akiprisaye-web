/**
 * ⑪ 🔔 ALERTE BAISSE DE PRIX (SANS COMPTE)
 * Permet aux utilisateurs de définir des alertes prix sans créer de compte
 */

import { useState } from "react";
import { GlassCard } from "../ui/glass-card";
import { safeLocalStorage } from '../../utils/safeLocalStorage';

interface PriceAlert {
  productId: string;
  territory: string;
  targetPrice: number | null;
  targetPercentDrop: number | null;
  createdAt: number;
  lastNotifiedAt: number | null;
}

interface PriceAlertButtonProps {
  productId: string;
  productName: string;
  currentPrice: number;
  territory?: string;
}

export function PriceAlertButton({
  productId,
  productName,
  currentPrice,
  territory = "GP"
}: PriceAlertButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [alertType, setAlertType] = useState<"price" | "percent">("price");
  const [targetPrice, setTargetPrice] = useState(currentPrice * 0.9);
  const [targetPercent, setTargetPercent] = useState(10);

  const handleSaveAlert = () => {
    const alerts = safeLocalStorage.getJSON<PriceAlert[]>('priceAlerts:v1', []);
    
    const newAlert: PriceAlert = {
      productId,
      territory,
      targetPrice: alertType === "price" ? targetPrice : null,
      targetPercentDrop: alertType === "percent" ? targetPercent : null,
      createdAt: Date.now(),
      lastNotifiedAt: null
    };

    alerts.push(newAlert);
    safeLocalStorage.setJSON('priceAlerts:v1', alerts);
    
    setShowModal(false);
    
    // Show success toast
    const event = new CustomEvent('show-toast', {
      detail: {
        message: '✅ Alerte créée ! Vous serez notifié lors de votre prochaine visite.',
        type: 'success'
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/40 rounded-lg text-yellow-300 font-medium transition-all hover:scale-105"
        aria-label={`Créer une alerte de baisse de prix pour ${productName}`}
      >
        <span className="text-lg">🔔</span>
        <span>Alerte baisse de prix</span>
      </button>

      {showModal && (
        <div 
          className="fixed inset-0 z-modal flex items-center justify-center p-4 animate-fade-in"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 cursor-default"
            onClick={() => setShowModal(false)}
            tabIndex={-1}
            aria-label="Fermer"
          />
          <GlassCard 
            className="relative z-10 max-w-md w-full animate-scale-in"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-yellow-300 mb-1">
                    🔔 Alerte baisse de prix
                  </h3>
                  <p className="text-sm text-gray-400">{productName}</p>
                  <p className="text-xs text-gray-500 mt-1">Prix actuel : {currentPrice.toFixed(2)} €</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>

              {/* Type d'alerte */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-300">Type d'alerte</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAlertType("price")}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      alertType === "price"
                        ? "bg-yellow-600 text-white"
                        : "bg-slate-800/50 text-gray-400 hover:bg-slate-800/70"
                    }`}
                  >
                    Prix cible
                  </button>
                  <button
                    onClick={() => setAlertType("percent")}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      alertType === "percent"
                        ? "bg-yellow-600 text-white"
                        : "bg-slate-800/50 text-gray-400 hover:bg-slate-800/70"
                    }`}
                  >
                    Baisse %
                  </button>
                </div>
              </div>

              {/* Seuil */}
              {alertType === "price" ? (
                <div className="space-y-2">
                  <label htmlFor="targetPrice" className="text-sm font-semibold text-gray-300">
                    Me prévenir si le prix descend à :
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="targetPrice"
                      type="number"
                      step="0.01"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                      className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                    />
                    <span className="text-gray-400 font-semibold">€</span>
                  </div>
                  {targetPrice < currentPrice && (
                    <p className="text-xs text-green-400">
                      ✓ Économie potentielle : {(currentPrice - targetPrice).toFixed(2)} €
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="targetPercent" className="text-sm font-semibold text-gray-300">
                    Me prévenir si baisse d'au moins :
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="targetPercent"
                      type="number"
                      min="1"
                      max="99"
                      value={targetPercent}
                      onChange={(e) => setTargetPercent(parseInt(e.target.value))}
                      className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                    />
                    <span className="text-gray-400 font-semibold">%</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Prix cible : ≤ {(currentPrice * (1 - targetPercent / 100)).toFixed(2)} €
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  <span className="font-semibold">ℹ️ Comment ça marche ?</span><br />
                  À votre prochaine visite, si le prix a atteint votre seuil, vous verrez une notification.
                  Aucun compte requis, les alertes sont stockées localement.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveAlert}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  Créer l'alerte
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </>
  );
}
