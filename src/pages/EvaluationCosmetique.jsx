/**
 * Page d'évaluation cosmétique
 * Module basé sur les données officielles uniquement
 */

import React, { Suspense, lazy } from 'react';

const CosmeticEvaluation = lazy(() => import('../components/CosmeticEvaluation'));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-950 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-white text-lg">Chargement du module d'évaluation...</p>
      </div>
    </div>
  );
}

export default function EvaluationCosmetiquePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CosmeticEvaluation />
    </Suspense>
  );
}
