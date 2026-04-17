import React from 'react';
import { Layout, Map, BarChart3 } from 'lucide-react';
const mockups = [
  {
    title: 'Dashboard',
    desc: 'Analyse en temps réel.',
    icon: <BarChart3 className="text-blue-400" />,
  },
  { title: 'Carte', desc: 'Points de vente GP.', icon: <Map className="text-emerald-400" /> },
  { title: 'Gestion', desc: 'Interface Créateur.', icon: <Layout className="text-purple-400" /> },
];
export default function ImageGallery() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
      {mockups.map((m) => (
        <div key={m.title} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
          <div className="mb-4 h-12 w-12 flex items-center justify-center rounded-xl bg-slate-800">
            {m.icon}
          </div>
          <h3 className="text-lg font-bold text-white">{m.title}</h3>
          <p className="text-sm text-slate-400 mt-2">{m.desc}</p>
        </div>
      ))}
    </div>
  );
}
