/**
 * EspaceCreateur.tsx - Version Ultra 3.1 STABLE
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import {
  Crown, Shield, Zap, Code2, Database, Users, BarChart3,
  Settings, Lock, CheckCircle, AlertCircle, Copy, ExternalLink, Radar,
  Terminal, BookOpen, Sparkles, Globe, Key, ChevronDown, ChevronUp,
  TrendingUp, Bell, Download, FileText, Wrench, RefreshCw,
  LogOut, Star, Building2, Smartphone, BrainCircuit, Activity, Clock3, Eye, MapPinned,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserStats } from '../hooks/useUserStats';
import { getConversionStats, getDailyStats } from '../utils/priceClickTracker';
import { generateDailyPost } from '../services/ghostwriterService';
import { useVisitorStats } from '../hooks/useVisitorStats';

const pulseStyle = `@keyframes pulse-radar { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.5; } }`;

const EspaceCreateur: React.FC = () => {
  const { isCreator, loading } = useAuth();
  const [ghostwriterCopied, setGhostwriterCopied] = useState(false);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Chargement...</div>;
  if (!isCreator) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4">
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

      <h1 className="text-2xl font-bold mb-6">Tableau de Bord Ultra</h1>
      
      {/* Reste du contenu simplifié pour le fix */}
      <div className="grid gap-6">
        <section className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BrainCircuit className="text-fuchsia-400" /> Ghostwriter OS
            </h2>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm">
                Prévisualisation du post quotidien... 🪷
            </div>
        </section>
      </div>
    </div>
  );
};

export default EspaceCreateur;
