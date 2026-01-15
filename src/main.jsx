import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './styles/globals.css';
import './styles/civic-glass.css';
import './styles/glass.css';
import './styles/mobile-fixes.css';
import Home from './pages/Home';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ScanFlowProvider } from './context/ScanFlowContext';
import NotFound from './pages/NotFound';

// Hub Pages - Direct imports for main navigation entries
import ComparateursHub from './pages/ComparateursHub';
import ScannerHub from './pages/ScannerHub';
import AssistantIAHub from './pages/AssistantIAHub';
import CarteItinerairesHub from './pages/CarteItinerairesHub';
import SolidariteHub from './pages/SolidariteHub';
import ObservatoireHub from './pages/ObservatoireHub';

// Lazy load other pages for better performance with retry logic
const ChatIALocal = lazyWithRetry(() => import('./components/ChatIALocal'));
const ScanOCR = lazyWithRetry(() => import('./pages/ScanOCR'));
const ScanEAN = lazyWithRetry(() => import('./pages/ScanEAN'));
const ComparaisonEnseignes = lazyWithRetry(() => import('./pages/ComparaisonEnseignes'));
const Comparateur = lazyWithRetry(() => import('./pages/Comparateur'));
const Carte = lazyWithRetry(() => import('./pages/Carte'));
const Actualites = lazyWithRetry(() => import('./pages/Actualites'));
const Alertes = lazyWithRetry(() => import('./pages/Alertes'));
const APropos = lazyWithRetry(() => import('./pages/APropos'));
const Methodologie = lazyWithRetry(() => import('./pages/Methodologie'));
const Transparence = lazyWithRetry(() => import('./pages/Transparence'));
const MentionsLegales = lazyWithRetry(() => import('./pages/MentionsLegales'));
const DonneesPubliques = lazyWithRetry(() => import('./pages/DonneesPubliques'));
const MonCompte = lazyWithRetry(() => import('./pages/MonCompte'));
const Inscription = lazyWithRetry(() => import('./pages/Inscription'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'));
const ComprendrePrix = lazyWithRetry(() => import('./pages/ComprendrePrix'));
const ContribuerPrix = lazyWithRetry(() => import('./pages/ContribuerPrix'));
const SignalerAbus = lazyWithRetry(() => import('./pages/SignalerAbus'));
const Pricing = lazyWithRetry(() => import('./pages/Pricing.tsx'));
const PricingDetailed = lazyWithRetry(() => import('./pages/PricingDetailed'));
const Subscribe = lazyWithRetry(() => import('./pages/Subscribe'));
const LicenceInstitution = lazyWithRetry(() => import('./pages/LicenceInstitution'));
const ContactCollectivites = lazyWithRetry(() => import('./pages/ContactCollectivites'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
const IaConseiller = lazyWithRetry(() => import('./pages/IaConseiller'));
const TiPanie = lazyWithRetry(() => import('./pages/TiPanie'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const AIDashboard = lazyWithRetry(() => import('./pages/AIDashboard'));
const AiMarketInsights = lazyWithRetry(() => import('./pages/AiMarketInsights'));
const IEVR = lazyWithRetry(() => import('./pages/IEVR'));
const DossierMedia = lazyWithRetry(() => import('./pages/DossierMedia'));
const HistoriquePrix = lazyWithRetry(() => import('./pages/HistoriquePrix'));
const AlertesPrix = lazyWithRetry(() => import('./pages/AlertesPrix'));
const BudgetVital = lazyWithRetry(() => import('./pages/BudgetVital'));
const FauxBonsPlan = lazyWithRetry(() => import('./pages/FauxBonsPlan'));
const BudgetReelMensuel = lazyWithRetry(() => import('./pages/BudgetReelMensuel'));
const ComparateurFormats = lazyWithRetry(() => import('./pages/ComparateurFormats'));
const ListeCourses = lazyWithRetry(() => import('./pages/ListeCourses'));
const CivicModules = lazyWithRetry(() => import('./pages/CivicModules'));
const EvaluationCosmetique = lazyWithRetry(() => import('./pages/EvaluationCosmetique'));
const Observatoire = lazyWithRetry(() => import('./pages/Observatoire'));
const ObservatoireVivant = lazyWithRetry(() => import('./pages/ObservatoireVivant'));
const ObservatoireTempsReel = lazyWithRetry(() => import('./pages/ObservatoireTempsReel'));
const ObservatoryMethodology = lazyWithRetry(() => import('./pages/ObservatoryMethodology'));
const Perimetre = lazyWithRetry(() => import('./pages/Perimetre'));
const Versions = lazyWithRetry(() => import('./pages/Versions'));
const Gouvernance = lazyWithRetry(() => import('./pages/Gouvernance'));
const Contribuer = lazyWithRetry(() => import('./pages/Contribuer'));
const Presse = lazyWithRetry(() => import('./pages/Presse'));

const CompareSimple = lazyWithRetry(() => import('./pages/Compare'));
const NewsSimple = lazyWithRetry(() => import('./pages/News'));

// PR #1 - Assistant + FAQ étendue (v1.6.0)
const Faq = lazyWithRetry(() => import('./pages/Faq'));

// Comparateur Citoyen - Observatoire data
const ComparateurCitoyen = lazyWithRetry(() => import('./pages/ComparateurCitoyen'));
const ComparateurTerritoires = lazyWithRetry(() => import('./pages/ComparateurTerritoires'));

// Enhanced Comparator with real-time data
const EnhancedComparator = lazyWithRetry(() => import('./pages/EnhancedComparator'));

// Service Comparator (flights, boats, internet, mobile, water, electricity)
const ServiceComparator = lazyWithRetry(() => import('./pages/ServiceComparator'));

// Strategic Comparators - Priority 1
const FlightComparator = lazyWithRetry(() => import('./pages/FlightComparator'));
const BoatComparator = lazyWithRetry(() => import('./pages/BoatComparator'));

// Unified Scan Flow
const ScanFlow = lazyWithRetry(() => import('./pages/ScanFlow'));

// Product Photo Analysis
const ProductPhotoAnalysis = lazyWithRetry(() => import('./pages/ProductPhotoAnalysis'));

// OCR Hub - Unified entry point for all OCR features
// Direct imports (NO lazy loading) to prevent tree-shaking
import OCRHub from './pages/ocr/OCRHub';
import OCRHistory from './pages/ocr/OCRHistory';

// Store Detail Page with company info, graphs, and history
const StoreDetail = lazyWithRetry(() => import('./pages/StoreDetail'));

// Basket Comparison Page - PROMPT 4
const BasketComparison = lazyWithRetry(() => import('./pages/BasketComparison'));

// Unified Price Search Hub - Single entry point for all search modes
const RecherchePrix = lazyWithRetry(() => import('./pages/RecherchePrix'));

// Flight Price Module (feature flagged)
const AvionsPrix = lazyWithRetry(() => import('./pages/recherche-prix/Avions'));

// Boat/Ferry Price Module (feature flagged)
const BateauxPrix = lazyWithRetry(() => import('./pages/recherche-prix/Bateaux'));

// Mobile Plans Module (feature flagged)
const AbonnementsMobile = lazyWithRetry(() => import('./pages/recherche-prix/AbonnementsMobile'));

// Internet Plans Module (feature flagged)
const AbonnementsInternet = lazyWithRetry(() => import('./pages/recherche-prix/AbonnementsInternet'));

// Electricity Price Module (feature flagged)
const Electricite = lazyWithRetry(() => import('./pages/recherche-prix/Electricite'));

// Water Price Module (feature flagged)
const Eau = lazyWithRetry(() => import('./pages/recherche-prix/Eau'));

// Freight Price Module (feature flagged)
const Fret = lazyWithRetry(() => import('./pages/recherche-prix/Fret'));

// Air Freight Price Module (feature flagged)
const FretAerien = lazyWithRetry(() => import('./pages/recherche-prix/FretAerien'));

// Logistics Index Module (feature flagged) - PRIORITY 8
const IndiceLogistique = lazyWithRetry(() => import('./pages/recherche-prix/IndiceLogistique'));

// Logistics Delays & Tensions Module (feature flagged) - PRIORITY 9
const DelaisTensionsLogistiques = lazyWithRetry(() => import('./pages/recherche-prix/DelaisTensionsLogistiques'));

// Logistics Explanation Module (feature flagged) - PRIORITY 10
const PourquoiDelaisProduit = lazyWithRetry(() => import('./pages/recherche-prix/PourquoiDelaisProduit'));

// Logistics FAQ Module (feature flagged) - PRIORITY 12-13
const QuestionsLogistiqueDOM = lazyWithRetry(() => import('./pages/ressources/QuestionsLogistiqueDOM'));

// Price Variation Education Module (feature flagged) - PRIORITY 19
const PourquoiPrixVarieSansChangement = lazyWithRetry(() => import('./pages/ressources/PourquoiPrixVarieSansChangement'));

// Promotions Education Module (feature flagged) - PRIORITY 20
const ComprendrePromotionsPrixBarres = lazyWithRetry(() => import('./pages/ressources/ComprendrePromotionsPrixBarres'));

// Loading component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-950 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-white text-lg">Chargement...</p>
      </div>
    </div>
  );
}

// Lazy loading error handler to prevent black screens
function lazyWithRetry(componentImport) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error('Failed to load component:', error);
      // Return a fallback component instead of crashing
      return {
        default: () => (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md bg-slate-900 rounded-xl p-6 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-white mb-2">Module non disponible</h2>
              <p className="text-gray-300 mb-4">
                Cette fonctionnalité n'a pas pu être chargée. Veuillez rafraîchir la page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Rafraîchir
              </button>
            </div>
          </div>
        )
      };
    }
  });
}

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => {
        if (import.meta.env.DEV) {
          console.log('Service Worker enregistré');
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.warn('Erreur SW :', err);
        }
      });
  });
}

// Global error handler to prevent black screens
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Prevent default behavior that might cause black screen
  if (import.meta.env.PROD) {
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent default behavior
  if (import.meta.env.PROD) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <AuthProvider>
            <ScanFlowProvider>
              <BrowserRouter>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path='/' element={<Layout />}>
                  <Route index element={<Home />} />
                  
                  {/* HUB ROUTES - Main navigation entries (7 hubs) */}
                  <Route path='comparateurs' element={<ComparateursHub />} />
                  <Route path='scanner' element={<ScannerHub />} />
                  <Route path='carte-itineraires' element={<CarteItinerairesHub />} />
                  <Route path='assistant-ia' element={<AssistantIAHub />} />
                  <Route path='solidarite' element={<SolidariteHub />} />
                  <Route path='observatoire-hub' element={<ObservatoireHub />} />
                  
                  {/* Legacy Carte route kept for backward compatibility */}
                  <Route path='carte' element={<Carte />} />
                  
                  <Route path='chat' element={<ChatIALocal />} />
                  
                  {/* OCR ROUTES - Direct imports (no lazy loading) */}
                  <Route path='ocr' element={<OCRHub />} />
                  <Route path='ocr/history' element={<OCRHistory />} />
                  
                  <Route path='scan' element={<ScanOCR />} />
                  <Route path='scan-ean' element={<ScanEAN />} />
                  <Route path='scanner-produit' element={<ScanFlow />} />
                  <Route path='analyse-photo-produit' element={<ProductPhotoAnalysis />} />
                  <Route path='comparaison-enseignes' element={<ComparaisonEnseignes />} />
                  <Route path='comparateur' element={<Comparateur />} />
                  <Route path='actualites' element={<NewsSimple />} />
                  <Route path='alertes' element={<Alertes />} />
                  <Route path='a-propos' element={<APropos />} />
                  <Route path='methodologie' element={<Methodologie />} />
                  <Route path='perimetre' element={<Perimetre />} />
                  <Route path='versions' element={<Versions />} />
                  <Route path='gouvernance' element={<Gouvernance />} />
                  <Route path='presse' element={<Presse />} />
                  <Route path='mentions-legales' element={<MentionsLegales />} />
                  <Route path='donnees-publiques' element={<DonneesPubliques />} />
                  <Route path='mon-compte' element={<MonCompte />} />
                  <Route path='inscription' element={<Inscription />} />
                  <Route path='login' element={<Login />} />
                  <Route path='connexion' element={<Login />} />
                  <Route path='reset-password' element={<ResetPassword />} />
                  <Route path='comprendre-prix' element={<ComprendrePrix />} />
                  <Route path='contribuer-prix' element={<ContribuerPrix />} />
                  <Route path='signaler-abus' element={<SignalerAbus />} />
                  <Route path='pricing' element={<Pricing />} />
                  <Route path='pricing-detailed' element={<PricingDetailed />} />
                  <Route path='subscribe' element={<Subscribe />} />
                  <Route path='licence-institution' element={<LicenceInstitution />} />
                  <Route path='contact-collectivites' element={<ContactCollectivites />} />
                  <Route path='contact' element={<Contact />} />
                  <Route path='ia-conseiller' element={<IaConseiller />} />
                  <Route path='ti-panie' element={<TiPanie />} />
                  <Route path='admin/dashboard' element={<AdminDashboard />} />
                  <Route path='admin/ai-dashboard' element={<AIDashboard />} />
                  <Route path='admin/ai-market-insights' element={<AiMarketInsights />} />
                  <Route path='ievr' element={<IEVR />} />
                  <Route path='dossier-media' element={<DossierMedia />} />
                  <Route path='historique-prix' element={<HistoriquePrix />} />
                  <Route path='alertes-prix' element={<AlertesPrix />} />
                  
                  <Route path='budget-vital' element={<BudgetVital />} />
                  <Route path='faux-bons-plans' element={<FauxBonsPlan />} />
                  <Route path='budget-reel-mensuel' element={<BudgetReelMensuel />} />
                  <Route path='comparateur-formats' element={<ComparateurFormats />} />
                  <Route path='liste-courses' element={<ListeCourses />} />
                  <Route path='civic-modules' element={<CivicModules />} />
                  <Route path='evaluation-cosmetique' element={<EvaluationCosmetique />} />
                  <Route path='observatoire' element={<Observatoire />} />
                  <Route path='observatoire-vivant' element={<ObservatoireVivant />} />
                  <Route path='observatoire-temps-reel' element={<ObservatoireTempsReel />} />
                  <Route path='transparence' element={<Transparence />} />
                  <Route path='contribuer' element={<Contribuer />} />
                  <Route path='observatoire/methodologie' element={<ObservatoryMethodology />} />
                  <Route path='comparateur-citoyen' element={<ComparateurCitoyen />} />
                  <Route path='comparateur-territoires' element={<ComparateurTerritoires />} />
                  
                  {/* Enhanced Comparator with real-time data and reliability scoring */}
                  <Route path='comparateur-intelligent' element={<EnhancedComparator />} />
                  
                  {/* Service Comparator (flights, boats, telecoms, utilities) */}
                  <Route path='comparateur-services' element={<ServiceComparator />} />
                  <Route path='services' element={<ServiceComparator />} />
                  
                  {/* Strategic Comparators - Priority 1: Vital Transport */}
                  <Route path='comparateur-vols' element={<FlightComparator />} />
                  <Route path='vols' element={<FlightComparator />} />
                  <Route path='comparateur-bateaux' element={<BoatComparator />} />
                  <Route path='bateaux' element={<BoatComparator />} />
                  <Route path='ferries' element={<BoatComparator />} />
                  
                  {/* Store Detail Page - Fiche enseigne avec graphs, filiales, etc. */}
                  <Route path='enseigne/:storeId' element={<StoreDetail />} />
                  
                  {/* Basket Comparison Page - PROMPT 4 */}
                  <Route path='comparer-panier' element={<BasketComparison />} />
                  
                  {/* Unified Price Search Hub - Single entry point */}
                  <Route path='recherche-prix' element={<RecherchePrix />} />
                  
                  {/* Flight Price Module (feature flagged) */}
                  <Route 
                    path='recherche-prix/avions' 
                    element={
                      import.meta.env.VITE_FEATURE_FLIGHTS === 'true' ? (
                        <AvionsPrix />
                      ) : (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center max-w-md">
                            <h2 className="text-xl font-semibold text-gray-100 mb-2">
                              Module en préparation
                            </h2>
                            <p className="text-gray-400 text-sm">
                              Le comparateur de prix de billets d'avion sera bientôt disponible.
                            </p>
                          </div>
                        </div>
                      )
                    } 
                  />
                  
                  {/* Boat/Ferry Price Module (feature flagged) */}
                  <Route 
                    path='recherche-prix/bateaux' 
                    element={
                      import.meta.env.VITE_FEATURE_BOATS === 'true' ? (
                        <BateauxPrix />
                      ) : (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center max-w-md">
                            <h2 className="text-xl font-semibold text-gray-100 mb-2">
                              Module en préparation
                            </h2>
                            <p className="text-gray-400 text-sm">
                              Le comparateur de prix de bateaux/ferries sera bientôt disponible.
                            </p>
                          </div>
                        </div>
                      )
                    } 
                  />
                  
                  {/* Mobile Plans Module (feature flagged) */}
                  <Route 
                    path='recherche-prix/abonnements/mobile' 
                    element={
                      import.meta.env.VITE_FEATURE_MOBILE_PLANS === 'true' ? (
                        <AbonnementsMobile />
                      ) : (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center max-w-md">
                            <h2 className="text-xl font-semibold text-gray-100 mb-2">
                              Module en préparation
                            </h2>
                            <p className="text-gray-400 text-sm">
                              Le comparateur de prix des abonnements mobiles sera bientôt disponible.
                            </p>
                          </div>
                        </div>
                      )
                    } 
                  />
                  
                  {/* Internet Plans Module (feature flagged) */}
                  <Route 
                    path='recherche-prix/abonnements/internet' 
                    element={
                      import.meta.env.VITE_FEATURE_INTERNET_PLANS === 'true' ? (
                        <AbonnementsInternet />
                      ) : (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center max-w-md">
                            <h2 className="text-xl font-semibold text-gray-100 mb-2">
                              Module en préparation
                            </h2>
                            <p className="text-gray-400 text-sm">
                              Le comparateur de prix des abonnements Internet sera bientôt disponible.
                            </p>
                          </div>
                        </div>
                      )
                    } 
                  />
                  
                  {/* Electricity Price Module (feature flagged) */}
                  <Route 
                    path='recherche-prix/energie/electricite' 
                    element={
                      import.meta.env.VITE_FEATURE_ELECTRICITY === 'true' ? (
                        <Electricite />
                      ) : (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center max-w-md">
                            <h2 className="text-xl font-semibold text-gray-100 mb-2">
                              Module en préparation
                            </h2>
                            <p className="text-gray-400 text-sm">
                              Le comparateur de prix de l'électricité sera bientôt disponible.
                            </p>
                          </div>
                        </div>
                      )
                    } 
                  />
                  
                  {/* Water Price Module (feature flagged) */}
                  <Route 
                    path='recherche-prix/energie/eau' 
                    element={
                      import.meta.env.VITE_FEATURE_WATER === 'true' ? (
                        <Eau />
                      ) : (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center max-w-md">
                            <h2 className="text-xl font-semibold text-gray-100 mb-2">
                              Module en préparation
                            </h2>
                            <p className="text-gray-400 text-sm">
                              Le comparateur de prix de l'eau sera bientôt disponible.
                            </p>
                          </div>
                        </div>
                      )
                    } 
                  />
                  
                  {/* Freight Price Module (feature flagged) */}
                  <Route 
                    path='recherche-prix/fret' 
                    element={
                      import.meta.env.VITE_FEATURE_FREIGHT === 'true' ? (
                        <Fret />
                      ) : (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center max-w-md">
                            <h2 className="text-xl font-semibold text-gray-100 mb-2">
                              Module en préparation
                            </h2>
                            <p className="text-gray-400 text-sm">
                              Le comparateur de coûts de fret maritime sera bientôt disponible.
                            </p>
                          </div>
                        </div>
                      )
                    } 
                  />
                  
                  {/* Air Freight Price Module (feature flagged) */}
                  <Route 
                    path='recherche-prix/fret-aerien' 
                    element={
                      import.meta.env.VITE_FEATURE_FRET_AERIEN === 'true' ? (
                        <FretAerien />
                      ) : (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center max-w-md">
                            <h2 className="text-xl font-semibold text-gray-100 mb-2">
                              Module en préparation
                            </h2>
                            <p className="text-gray-400 text-sm">
                              Le comparateur de coûts de fret aérien sera bientôt disponible.
                            </p>
                          </div>
                        </div>
                      )
                    } 
                  />
                  
                  {/* Logistics Index Module (feature flagged) - PRIORITY 8 */}
                  <Route 
                    path='recherche-prix/indice-logistique' 
                    element={
                      import.meta.env.VITE_FEATURE_LOGISTICS_INDEX === 'true' ? (
                        <IndiceLogistique />
                      ) : (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center max-w-md">
                            <h2 className="text-xl font-semibold text-gray-100 mb-2">
                              Module en préparation
                            </h2>
                            <p className="text-gray-400 text-sm">
                              L'indice logistique DOM sera bientôt disponible.
                            </p>
                          </div>
                        </div>
                      )
                    } 
                  />
                  
                  {/* Logistics Delays & Tensions Module (feature flagged) - PRIORITY 9 */}
                  <Route 
                    path='recherche-prix/delais-logistiques' 
                    element={
                      import.meta.env.VITE_FEATURE_LOGISTICS_DELAYS === 'true' ? (
                        <DelaisTensionsLogistiques />
                      ) : (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center max-w-md">
                            <h2 className="text-xl font-semibold text-gray-100 mb-2">
                              Module en préparation
                            </h2>
                            <p className="text-gray-400 text-sm">
                              Le module délais & tensions logistiques sera bientôt disponible.
                            </p>
                          </div>
                        </div>
                      )
                    } 
                  />
                  
                  {/* Logistics Explanation Module (feature flagged) - PRIORITY 10 */}
                  <Route 
                    path='recherche-prix/pourquoi-delais-produit' 
                    element={
                      import.meta.env.VITE_FEATURE_LOGISTICS_EXPLANATION === 'true' ? (
                        <PourquoiDelaisProduit />
                      ) : (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center max-w-md">
                            <h2 className="text-xl font-semibold text-gray-100 mb-2">
                              Module en préparation
                            </h2>
                            <p className="text-gray-400 text-sm">
                              Le module d'explication des délais produits sera bientôt disponible.
                            </p>
                          </div>
                        </div>
                      )
                    } 
                  />
                  
                  {/* Logistics FAQ Module (feature flagged) - PRIORITY 12-13 */}
                  <Route 
                    path='ressources/questions-logistique-dom' 
                    element={
                      import.meta.env.VITE_FEATURE_LOGISTICS_FAQ === 'true' ? (
                        <QuestionsLogistiqueDOM />
                      ) : (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center max-w-md">
                            <h2 className="text-xl font-semibold text-gray-100 mb-2">
                              Module en préparation
                            </h2>
                            <p className="text-gray-400 text-sm">
                              La FAQ logistique DOM sera bientôt disponible.
                            </p>
                          </div>
                        </div>
                      )
                    } 
                  />
                  
                  {/* Price Variation Education Module (feature flagged) - PRIORITY 19 */}
                  <Route 
                    path='ressources/pourquoi-prix-varie-sans-changement' 
                    element={
                      import.meta.env.VITE_FEATURE_PRICE_VARIATION_EDU === 'true' ? (
                        <PourquoiPrixVarieSansChangement />
                      ) : (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center max-w-md">
                            <h2 className="text-xl font-semibold text-gray-100 mb-2">
                              Module en préparation
                            </h2>
                            <p className="text-gray-400 text-sm">
                              Le module éducatif sur les variations de prix sera bientôt disponible.
                            </p>
                          </div>
                        </div>
                      )
                    } 
                  />
                  
                  {/* Promotions Education Module (feature flagged) - PRIORITY 20 */}
                  <Route 
                    path='ressources/comprendre-promotions-prix-barres' 
                    element={
                      import.meta.env.VITE_FEATURE_PROMOTIONS_EDU === 'true' ? (
                        <ComprendrePromotionsPrixBarres />
                      ) : (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center max-w-md">
                            <h2 className="text-xl font-semibold text-gray-100 mb-2">
                              Module en préparation
                            </h2>
                            <p className="text-gray-400 text-sm">
                              Le module éducatif sur les promotions et prix barrés sera bientôt disponible.
                            </p>
                          </div>
                        </div>
                      )
                    } 
                  />
                  
                  {/* New simplified pages for automatic generation */}
                  <Route path='comparer' element={<CompareSimple />} />
                  <Route path='tarifs' element={<Pricing />} />
                  
                  {/* PR #1 - Assistant + FAQ étendue (v1.6.0) */}
                  <Route path='faq' element={<Faq />} />
                  
                  <Route path='*' element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ScanFlowProvider>
      </AuthProvider>
    </ThemeProvider>
  </HelmetProvider>
  </ErrorBoundary>
</React.StrictMode>,
);
