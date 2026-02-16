/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Layout synchronously to prevent loading block
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { LanguageProvider } from './context/LanguageProvider';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import OnboardingTour from './components/OnboardingTour';
import OnboardingAutoStart from './components/OnboardingAutoStart';
import HelpButton from './components/HelpButton';
import AnalyticsTracker from './components/analytics/AnalyticsTracker';
import { StoreSelectionProvider } from './context/StoreSelectionContext';
import { logDebug } from './utils/logger';

const lazyPage = <T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T }>
) => React.lazy(loader);

const prefetch = (loader: () => Promise<unknown>) => {
  const run = () => loader().catch(() => undefined);

  if (typeof window === 'undefined') return;

  if ('requestIdleCallback' in window) {
    (window as Window & {
      requestIdleCallback: (callback: IdleRequestCallback) => number;
    }).requestIdleCallback(run);
    return;
  }

  window.setTimeout(run, 1500);
};

// Lazy-loaded pages - Main routes
const Home = lazyPage(() => import('./pages/Home'));
const Carte = lazyPage(() => import('./pages/Carte'));
const MapPage = lazyPage(() => import('./pages/MapPage'));
const AdminDashboard = lazyPage(() => import('./pages/AdminDashboard'));
const Comparateur = lazyPage(() => import('./pages/Comparateur'));
const AdminRoutes = lazyPage(() => import('./pages/admin/AdminRoutes'));
const ObservatoireHub = lazyPage(() => import('./pages/ObservatoireHub'));
const Methodologie = lazyPage(() => import('./pages/Methodologie'));
const Faq = lazyPage(() => import('./pages/Faq'));
const Contact = lazyPage(() => import('./pages/Contact'));
const MentionsLegales = lazyPage(() => import('./pages/MentionsLegales'));

// Additional feature pages
const DonneesPubliques = lazyPage(() => import('./pages/DonneesPubliques'));
const Contribuer = lazyPage(() => import('./pages/Contribuer'));
const ContribuerPrix = lazyPage(() => import('./pages/ContribuerPrix'));
const Comparateurs = lazyPage(() => import('./pages/Comparateurs'));
const CarteItinerairesHub = lazyPage(() => import('./pages/CarteItinerairesHub'));
const ComparateurCitoyen = lazyPage(() => import('./pages/ComparateurCitoyen'));
const LutteVieChere = lazyPage(() => import('./pages/LutteVieChereIndexPage'));

// Scanner & OCR pages
const ScannerHub = lazyPage(() => import('./pages/ScannerHub'));
const OCRHub = lazyPage(() => import('./pages/ocr/OCRHub'));
const ScanEAN = lazyPage(() => import('./pages/ScanEAN'));
const ProductPhotoAnalysis = lazyPage(() => import('./pages/ProductPhotoAnalysis'));
const ComparaisonEnseignes = lazyPage(() => import('./pages/ComparaisonEnseignes'));
const BasketComparison = lazyPage(() => import('./pages/BasketComparison'));

// Settings & History
const Settings = lazyPage(() => import('./pages/Settings'));
const HistoriquePrix = lazyPage(() => import('./pages/HistoriquePrix'));
const RecherchePrix = lazyPage(() => import('./pages/RecherchePrix'));
const ProductDetailPage = lazyPage(() => import('./pages/ProductDetail'));
const Alertes = lazyPage(() => import('./pages/Alertes'));
const AlerteDetail = lazyPage(() => import('./pages/AlerteDetail'));
const Promos = lazyPage(() => import('./pages/Promos'));
const MesListes = lazyPage(() => import('./pages/MesListes'));

// Savings Dashboard
const MesEconomies = lazyPage(() => import('./pages/MesEconomies'));

// Auth pages
const Login = lazyPage(() => import('./pages/Login'));
const Inscription = lazyPage(() => import('./pages/Inscription'));
const ResetPassword = lazyPage(() => import('./pages/ResetPassword'));
const MonCompte = lazyPage(() => import('./pages/MonCompte'));
const AuthHub = lazyPage(() => import('./pages/AuthHub'));

// Pricing & Subscription
const Pricing = lazyPage(() => import('./pages/Pricing'));
const Subscribe = lazyPage(() => import('./pages/Subscribe'));

// Observatory real-time
const ObservatoireTempsReel = lazyPage(() => import('./pages/ObservatoireTempsReel'));

// Transparency & reporting
const Transparence = lazyPage(() => import('./pages/Transparence'));
const SignalerAbus = lazyPage(() => import('./pages/SignalerAbus'));

// i18n Test page (for development/testing)
const I18nTest = lazyPage(() => import('./pages/I18nTest'));

function LoadingFallback() {
  const [showTimeout, setShowTimeout] = useState(false);
  
  useEffect(() => {
    logDebug('⏳ LoadingFallback: Displayed');
    const timer = setTimeout(() => {
      console.error('⚠️ Application timeout - Loading blocked for 10+ seconds');
      setShowTimeout(true);
    }, 10000);
    return () => {
      logDebug('✅ LoadingFallback: Hidden (component loaded successfully)');
      clearTimeout(timer);
    };
  }, []);

  if (showTimeout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <img src="/logo-akiprisaye.svg" alt="Logo" className="h-16 mb-4" />
        <h1 className="text-xl font-bold mb-2">Chargement bloqué</h1>
        <p className="text-slate-400 mb-4">L'application met trop de temps à charger.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Recharger la page
        </button>
        <p className="text-xs text-slate-500 mt-4">
          Si le problème persiste, videz le cache du navigateur.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="animate-pulse text-lg text-white">
        Chargement…
      </div>
    </div>
  );
}

export default function App() {
  const [providerError, setProviderError] = useState<Error | null>(null);

  useEffect(() => {
    logDebug('🚀 App: Starting initialization');
    logDebug('📍 App: Environment:', import.meta.env.MODE);
    logDebug('📍 App: Firebase configured:', import.meta.env.VITE_FIREBASE_API_KEY ? 'Yes' : 'No');
    const fallback = document.getElementById('loading-fallback');
    if (fallback) {
      fallback.style.display = 'none';
      logDebug('✅ App: HTML loading fallback hidden');
    }
  }, []);

  useEffect(() => {
    prefetch(() => import('./pages/Comparateur'));
    prefetch(() => import('./pages/ObservatoireHub'));
  }, []);

  if (providerError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <img src="/logo-akiprisaye.svg" alt="Logo" className="h-16 mb-4" />
        <h1 className="text-xl font-bold mb-2">Erreur d'initialisation</h1>
        <p className="text-red-400 mb-4">{providerError.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Recharger
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <OnboardingProvider>
              <StoreSelectionProvider>
              <BrowserRouter>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {/* Admin routes as isolated lazy bundle */}
                    <Route path="/admin/*" element={<AdminRoutes />} />
                    
                    {/* Main site routes with Layout */}
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Home />} />
                      <Route path="carte" element={<Carte />} />
                      <Route path="carte-interactive" element={<MapPage />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="home" element={<Home />} />
                      <Route path="comparateur" element={<Comparateur />} />
                      <Route path="observatoire" element={<ObservatoireHub />} />
                      <Route path="vie-chere" element={<LutteVieChere />} />
                      <Route path="methodologie" element={<Methodologie />} />
                      <Route path="faq" element={<Faq />} />
                      <Route path="contact" element={<Contact />} />
                      <Route path="mentions-legales" element={<MentionsLegales />} />
                      
                      {/* Additional feature routes */}
                      <Route path="donnees-publiques" element={<DonneesPubliques />} />
                      <Route path="contribuer" element={<Contribuer />} />
                      <Route path="contribuer-prix" element={<ContribuerPrix />} />
                      <Route path="comparateurs" element={<Comparateurs />} />
                      <Route path="carte-itineraires" element={<CarteItinerairesHub />} />
                      <Route path="comparateur-citoyen" element={<ComparateurCitoyen />} />
                      
                      {/* Scanner & OCR routes */}
                      <Route path="scan" element={<ScannerHub />} />
                      <Route path="scanner" element={<ScannerHub />} />
                      <Route path="scan-ean" element={<ScanEAN />} />
                      <Route path="analyse-photo-produit" element={<ProductPhotoAnalysis />} />
                      <Route path="ocr" element={<OCRHub />} />
                      
                      {/* Comparison & Reporting */}
                      <Route path="comparaison-enseignes" element={<ComparaisonEnseignes />} />
                      <Route path="comparaison-panier" element={<BasketComparison />} />
                      <Route path="signalement" element={<SignalerAbus />} />
                      
                      {/* Settings & History */}
                      <Route path="parametres" element={<Settings />} />
                      <Route path="historique-prix" element={<HistoriquePrix />} />
                      <Route path="historique" element={<HistoriquePrix />} />
                      <Route path="p/:id" element={<ProductDetailPage />} />
                      <Route path="recherche-prix" element={<RecherchePrix />} />
                      <Route path="alertes" element={<Alertes />} />
                      <Route path="alertes/:id" element={<AlerteDetail />} />
                      <Route path="promos" element={<Promos />} />
                      <Route path="mes-listes" element={<MesListes />} />
                      
                      {/* Savings Dashboard */}
                      <Route path="mes-economies" element={<MesEconomies />} />
                      <Route path="tableau-de-bord" element={<MesEconomies />} />
                      
                      {/* Auth routes */}
                      <Route path="login" element={<Login />} />
                      <Route path="connexion" element={<Login />} />
                      <Route path="inscription" element={<Inscription />} />
                      <Route path="reset-password" element={<ResetPassword />} />
                      <Route path="auth" element={<AuthHub />} />
                      <Route path="mon-compte" element={<MonCompte />} />
                      
                      {/* Pricing & Subscription */}
                      <Route path="pricing" element={<Pricing />} />
                      <Route path="subscribe" element={<Subscribe />} />
                      <Route path="subscribe/success" element={<Subscribe />} />
                      
                      {/* Observatory real-time */}
                      <Route path="observatoire-temps-reel" element={<ObservatoireTempsReel />} />
                      
                      {/* Transparency & reporting */}
                      <Route path="transparence" element={<Transparence />} />
                      <Route path="signaler-abus" element={<SignalerAbus />} />
                      
                      {/* i18n Test (development/testing) */}
                      <Route path="test-i18n" element={<I18nTest />} />
                      
                      {/* Catch-all route - redirect to home */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                  </Routes>
                  <AnalyticsTracker />
                  <PerformanceMonitor />
                  <OnboardingAutoStart />
                  <OnboardingTour />
                  <HelpButton />
                </Suspense>
              </BrowserRouter>
              </StoreSelectionProvider>
            </OnboardingProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
