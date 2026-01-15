/**
 * Price Alerts Page
 * Manage price alerts for products
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertForm } from '../components/AlertForm';
import { Bell, CheckCircle, Info } from 'lucide-react';

export default function PriceAlertsPage() {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = (alertData: any) => {
    console.log('Alert created:', alertData);
    // TODO: Implement actual alert creation with backend
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  const handleCancel = () => {
    console.log('Alert creation cancelled');
  };

  return (
    <>
      <Helmet>
        <title>Alertes Prix - A KI PRI SA YÉ</title>
        <meta 
          name="description" 
          content="Recevez une alerte lorsqu'un prix évolue significativement dans votre territoire" 
        />
      </Helmet>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Texte introductif */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              Alertes Prix
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
              Recevez une alerte lorsqu'un prix évolue significativement
            </p>
            
            {/* Texte rassurant */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Les alertes sont basées sur les données réellement observées et vérifiées dans votre territoire.
                  Vous ne recevrez que des notifications pertinentes et fiables.
                </p>
              </div>
            </div>
          </div>

          {/* Message de confirmation visuelle */}
          {showSuccess && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Alerte créée avec succès !
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Vous serez notifié dès qu'une variation significative sera détectée
                  </p>
                </div>
              </div>
            </div>
          )}

          <AlertForm onSave={handleSave} onCancel={handleCancel} />

          {/* Section "Aucune alerte active" (TODO: afficher seulement si liste vide) */}
          <div className="mt-8 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
            <Bell className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Aucune alerte active pour le moment
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Créez votre première alerte ci-dessus pour commencer à suivre les prix
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
