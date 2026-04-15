import React from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import type { PredatorAlert } from '../../services/predatorService';

interface CreatorActivationGuideProps {
  predatorAlerts: PredatorAlert[];
  predatorScanning: boolean;
  onScan: () => void;
}

const CreatorActivationGuide: React.FC<CreatorActivationGuideProps> = ({
  predatorAlerts,
  predatorScanning,
  onScan,
}) => (
  <section className="bg-emerald-950/20 border border-emerald-500/20 p-6 rounded-3xl mb-8">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
        <Bell size={18} /> Alertes Predator
      </h3>
      <button
        onClick={onScan}
        disabled={predatorScanning}
        className="text-xs bg-emerald-700 px-3 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50"
      >
        <RefreshCw size={12} className={predatorScanning ? 'animate-spin' : ''} />{' '}
        {predatorScanning ? 'Scan...' : 'Scanner'}
      </button>
    </div>

    <div className="space-y-3">
      {predatorAlerts.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-6 border border-dashed border-slate-800 rounded-xl">
          Aucune alerte critique détectée sur le marché.
        </p>
      )}
      {predatorAlerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <span
              className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                alert.severity === 'high' ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-900'
              }`}
            >
              {alert.severity}
            </span>
            <p className="text-sm font-bold text-white">{alert.targetName}</p>
          </div>
          <p className="text-xs text-slate-400">{alert.message}</p>
        </div>
      ))}
    </div>
  </section>
);

export default CreatorActivationGuide;
