import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
import { BrainCircuit, Activity, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const pulseStyle = `@keyframes predatorPulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }`;

const EspaceCreateur: React.FC = () => {
  const { isCreator, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Chargement...</div>;
  if (!isCreator) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <style>{pulseStyle}</style>
      <Helmet><title>Espace Créateur | Ultra V3.1</title></Helmet>

      {/* Radar Predator Indicator */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900/80 border border-fuchsia-500/30 px-3 py-1.5 rounded-full backdrop-blur-md">
        <div className="relative h-3 w-3">
          <div className="absolute inset-0 bg-fuchsia-500 rounded-full animate-ping opacity-75" />
          <div className="relative h-3 w-3 bg-fuchsia-400 rounded-full" />
        </div>
        <span className="text-[10px] font-bold text-fuchsia-100 tracking-widest uppercase">Predator Active</span>
      </div>

      <header className="mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/40">
            <Crown className="text-amber-400" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Tableau de Bord Ultra</h1>
            <p className="text-slate-400">Système Ghostwriter & Predator OS activés.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-fuchsia-400">
            <BrainCircuit size={20} /> Ghostwriter OS
          </h2>
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-sm italic text-slate-300">
             "Génération du post en cours... Les données sont fraîches." 🪷
          </div>
        </section>

        <section className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-400">
            <Activity size={20} /> Predator Radar
          </h2>
          <p className="text-sm text-slate-400">Scan du marché en cours. Aucune anomalie critique détectée sur les carburants ou les produits frais.</p>
        </section>
      </div>
    </div>
  );
};

export default EspaceCreateur;
