/**
 * IEVR Page - Indice d'Écart de Vie Réelle
 * 
 * Flagship module showing the Real Life Cost Gap Index
 */

import IEVR from '../components/IEVR';

export default function IEVRPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <IEVR />
      </div>
    </div>
  );
}
