import React, { useState, useEffect } from 'react';
import { Camera, Search, Barcode, Receipt } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReceiptScanner from '../components/ReceiptScanner';
import uxMonitor from '../utils/uxMonitor';
import type { ReceiptAnalysisResult } from '../services/receiptScanService';
import { safeLocalStorage } from '../utils/safeLocalStorage';

/**
 * UNIFIED PRICE SEARCH HUB
 * 
 * Single entry point merging:
 * - Text-based product search
 * - Barcode (EAN) scanning  
 * - Product photo scanning
 * - Receipt (ticket de caisse) scanning
 * 
 * All paths converge to the SAME comparison result view.
 * 16 "wow effect" components are contextual enhancements shown conditionally.
 */

type SearchMode = 'text' | 'barcode' | 'photo' | 'receipt';

export default function RecherchePrix() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchMode, setSearchMode] = useState<SearchMode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptAnalysis, setReceiptAnalysis] = useState<ReceiptAnalysisResult | null>(null);
  const [showQuickScan, setShowQuickScan] = useState(false);
  
  // Check for source parameter (e.g., ?source=ticket)
  useEffect(() => {
    const source = searchParams.get('source');
    if (source === 'ticket') {
      setSearchMode('receipt');
    }
  }, [searchParams]);

  // OPTIMIZATION #1: Smart default - Show quick scan if camera available and no preference
  useEffect(() => {
    const preferredMode = safeLocalStorage.getItem('preferredSearchMode');
    const hasCamera = typeof navigator !== 'undefined' && 'mediaDevices' in navigator;
    
    // Show quick scan shortcut for first-time users with camera
    if (!preferredMode && hasCamera && !searchMode) {
      setShowQuickScan(true);
    }
    
    // PROMPT 4: Monitor page view
    uxMonitor.pageView('/recherche-prix');
  }, [searchMode]);

  const handleSearchModeSelect = (mode: SearchMode) => {
    setSearchMode(mode);
    
    // Remember user preference for next time
    safeLocalStorage.setItem('preferredSearchMode', mode);
    
    // PROMPT 4: Monitor search mode selection
    uxMonitor.searchModeSelected(mode);
    if (showQuickScan && mode === 'barcode') {
      uxMonitor.quickScanUsed();
    }
    
    // Redirect to appropriate scan interface if needed
    switch (mode) {
      case 'barcode':
        navigate('/scan-ean?from=recherche-prix');
        break;
      case 'photo':
        navigate('/analyse-photo-produit?from=recherche-prix');
        break;
      case 'receipt':
        // Stay on this page - render ReceiptScanner component
        break;
      case 'text':
        // Stay on this page for text search
        break;
    }
  };
  
  const handleReceiptAnalysisComplete = (result: ReceiptAnalysisResult) => {
    setReceiptAnalysis(result);
    // TODO: Navigate to comparison view with receipt data
    // For now, just log it
    console.log('Receipt analysis complete:', result);
  };

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to comparator with search query
      navigate(`/comparateur?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <Helmet>
        <title>Recherche de prix | A KI PRI SA YÉ</title>
        <meta 
          name="description" 
          content="Point d'entrée unique pour rechercher, scanner et comparer les prix. Recherche par nom, code-barres, photo produit ou ticket de caisse." 
        />
      </Helmet>

      <div className="min-h-screen bg-slate-950 dark:bg-slate-900 pt-20 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          
          {/* Receipt Scanner Mode */}
          {searchMode === 'receipt' ? (
            <ReceiptScanner 
              onAnalysisComplete={handleReceiptAnalysisComplete}
              onClose={() => setSearchMode(null)}
            />
          ) : (
            <>
              {/* Header - Sticky */}
              <div className="sticky top-16 z-10 bg-slate-950/95 backdrop-blur-sm pb-6 mb-8 border-b border-slate-800">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">
                  Que souhaitez-vous comparer ?
                </h1>
                <p className="text-base text-gray-400 text-center">
                  Choisissez votre mode de recherche
                </p>
              </div>

          {/* Main Search Input - Text Search */}
          <div className="glass-container mb-8">
            <form onSubmit={handleTextSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔎 Rechercher un produit par nom..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  aria-label="Recherche de produit par nom"
                />
              </div>
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                aria-label="Lancer la recherche"
              >
                Rechercher
              </button>
            </form>
          </div>

          {/* OPTIMIZATION #1: Quick Scan Shortcut for first-time users */}
          {showQuickScan && (
            <div className="mb-6 animate-slide-up">
              <button
                onClick={() => handleSearchModeSelect('barcode')}
                className="w-full py-6 px-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-2xl shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
                aria-label="Scanner rapidement un code-barres"
              >
                <div className="absolute top-0 right-0 px-3 py-1 bg-yellow-400 text-green-900 text-xs font-bold rounded-bl-xl">
                  LE PLUS RAPIDE
                </div>
                <Barcode className="w-12 h-12 mx-auto mb-3 text-white group-hover:scale-110 transition-transform" />
                <span className="block text-xl font-bold text-white mb-1">
                  Scanner maintenant
                </span>
                <span className="block text-sm text-white/80">
                  Un seul tap pour comparer les prix
                </span>
              </button>
              
              <button
                onClick={() => setShowQuickScan(false)}
                className="w-full mt-3 text-sm text-gray-400 hover:text-gray-300 py-2"
              >
                Voir tous les modes de recherche ↓
              </button>
            </div>
          )}

          {/* 4 Visual Actions - Aligned (collapsed when quick scan shown) */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 ${showQuickScan ? 'opacity-50 pointer-events-none' : ''}`}>
            
            {/* 1. Text Search */}
            <button
              onClick={() => handleSearchModeSelect('text')}
              className="glass-card p-6 hover:bg-blue-600/10 transition-all group border border-blue-500/30 hover:border-blue-500/60"
              aria-label="Recherche par nom"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:bg-blue-500/30 transition-colors">
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-center mb-1">
                🔎 Nom du produit
              </h3>
              <p className="text-xs text-gray-400 text-center">
                Recherche par texte
              </p>
            </button>

            {/* 2. Barcode Scan */}
            <button
              onClick={() => handleSearchModeSelect('barcode')}
              className="glass-card p-6 hover:bg-green-600/10 transition-all group border border-green-500/30 hover:border-green-500/60"
              aria-label="Scanner code-barres"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:bg-green-500/30 transition-colors">
                <Barcode className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-white font-semibold text-center mb-1">
                📦 Code-barres
              </h3>
              <p className="text-xs text-gray-400 text-center">
                Scanner EAN/UPC
              </p>
            </button>

            {/* 3. Photo Scan */}
            <button
              onClick={() => handleSearchModeSelect('photo')}
              className="glass-card p-6 hover:bg-purple-600/10 transition-all group border border-purple-500/30 hover:border-purple-500/60"
              aria-label="Photographier produit"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:bg-purple-500/30 transition-colors">
                <Camera className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold text-center mb-1">
                📸 Photo produit
              </h3>
              <p className="text-xs text-gray-400 text-center">
                Recherche par image
              </p>
            </button>

            {/* 4. Receipt Scan - PROMINENT */}
            <button
              onClick={() => handleSearchModeSelect('receipt')}
              className="glass-card p-6 hover:bg-orange-600/10 transition-all group border-2 border-orange-500/50 hover:border-orange-500/80 relative"
              aria-label="Scanner ticket de caisse"
            >
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">
                NOUVEAU
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:bg-orange-500/30 transition-colors">
                <Receipt className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-white font-semibold text-center mb-1">
                🧾 Ticket de caisse
              </h3>
              <p className="text-xs text-gray-400 text-center">
                Analyse complète
              </p>
            </button>

          </div>

          {/* Micro-reassurance Banner */}
          <div className="glass-card p-6 border border-blue-500/30 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 text-xl">ℹ️</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">
                  Outil d'information citoyenne
                </h3>
                <p className="text-sm text-gray-300 mb-3">
                  <strong>Données indicatives issues d'observations publiques</strong>
                  <br />Aucun conseil d'achat • Outil d'information citoyenne
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>✓ Traitement 100% local • Aucune donnée transmise</li>
                  <li>✓ Transparence totale • Méthodologie accessible</li>
                  <li>✓ RGPD compliant • Pas de tracking utilisateur</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Comment ça marche ?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-400">1</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Recherchez</h3>
                <p className="text-sm text-gray-400">
                  Par nom, code-barres, photo ou ticket de caisse
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-400">2</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Comparez</h3>
                <p className="text-sm text-gray-400">
                  Consultez les prix dans votre territoire
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-400">3</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Économisez</h3>
                <p className="text-sm text-gray-400">
                  Trouvez les meilleurs prix et optimisez vos courses
                </p>
              </div>

            </div>
          </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
