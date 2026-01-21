import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import './styles/globals.css';
import './styles/civic-glass.css';
import './styles/glass.css';
import './styles/mobile-fixes.css';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { ToastProvider } from './components/Toast/ToastProvider';

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
              <h2 className="text-xl font-semibold text-white mb-2">Bientôt disponible</h2>
              <p className="text-gray-300 mb-4">
                Cette fonctionnalité n'est pas encore disponible. Revenez bientôt.
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

// Lazy load other pages for better performance with retry logic
const ChatIALocal = lazyWithRetry(() => import('./components/ChatIALocal'));
const ScanOCR = lazyWithRetry(() => import('./pages/ScanOCR'));
const ScanEAN = lazyWithRetry(() => import('./pages/ScanEAN'));
const ComparaisonEnseignes = lazyWithRetry(() => import('./pages/ComparaisonEnseignes'));
const Comparateur = lazyWithRetry(() => import('./pages/Comparateur'));
const Comparateurs = lazyWithRetry(() => import('./pages/Comparateurs'));
const Carte = lazyWithRetry(() => import('./pages/Carte'));
const Alertes = lazyWithRetry(() => import('./pages/Alertes'));
const Actualites = lazyWithRetry(() => import('./pages/Actualites'));
const APropos = lazyWithRetry(() => import('./pages/APropos'));
const Methodologie = lazyWithRetry(() => import('./pages/Methodologie'));
const MentionsLegales = lazyWithRetry(() => import('./pages/MentionsLegales'));
const MonCompte = lazyWithRetry(() => import('./pages/MonCompte'));
const Inscription = lazyWithRetry(() => import('./pages/Inscription'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'));
const ComprendrePrix = lazyWithRetry(() => import('./pages/ComprendrePrix'));
const ContribuerPrix = lazyWithRetry(() => import('./pages/ContribuerPrix'));
const SignalerAbus = lazyWithRetry(() => import('./pages/SignalerAbus'));
const PricingDetailed = lazyWithRetry(() => import('./pages/PricingDetailed'));
const Subscribe = lazyWithRetry(() => import('./pages/Subscribe'));
const LicenceInstitution = lazyWithRetry(() => import('./pages/LicenceInstitution'));
const ContactCollectivites = lazyWithRetry(() => import('./pages/ContactCollectivites'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
const IaConseiller = lazyWithRetry(() => import('./pages/IaConseiller'));
const TiPanie = lazyWithRetry(() => import('./pages/TiPanie'));
const Transparence = lazyWithRetry(() => import('./pages/Transparence'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const AIDashboard = lazyWithRetry(() => import('./pages/AIDashboard'));
const AiMarketInsights = lazyWithRetry(() => import('./pages/AiMarketInsights'));
const IEVR = lazyWithRetry(() => import('./pages/IEVR'));
const DossierMedia = lazyWithRetry(() => import('./pages/DossierMedia'));
const Presse = lazyWithRetry(() => import('./pages/Presse'));
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
const ObservatoireHub = lazyWithRetry(() => import('./pages/ObservatoireHub'));
const ObservatoireTempsReel = lazyWithRetry(() => import('./pages/ObservatoireTempsReel'));
const ObservatoireVivant = lazyWithRetry(() => import('./pages/ObservatoireVivant'));
const ObservatoryMethodology = lazyWithRetry(() => import('./pages/ObservatoryMethodology'));
const InflationDashboardPage = lazyWithRetry(() => import('./pages/InflationDashboardPage'));
const Pricing = lazyWithRetry(() => import('./pages/Pricing'));
const RechercheProduits = lazyWithRetry(() => import('./pages/RechercheProduits'));
const RecherchePrix = lazyWithRetry(() => import('./pages/RecherchePrix'));
const ProductPhotoAnalysis = lazyWithRetry(() => import('./pages/ProductPhotoAnalysis'));
const TerritoryHub = lazyWithRetry(() => import('./pages/TerritoryHub'));
const TerritoryScanner = lazyWithRetry(() => import('./pages/TerritoryScanner'));
const TerritoryComparateurs = lazyWithRetry(() => import('./pages/TerritoryComparateurs'));
const OCRHub = lazyWithRetry(() => import('./pages/ocr/OCRHub'));
const OCRHistory = lazyWithRetry(() => import('./pages/ocr/OCRHistory'));
const QuestionsLogistiqueDOM = lazyWithRetry(() => import('./pages/ressources/QuestionsLogistiqueDOM'));
const ComprendrePromotionsPrixBarres = lazyWithRetry(() => import('./pages/ressources/ComprendrePromotionsPrixBarres'));
const PourquoiPrixVarieSansChangement = lazyWithRetry(() => import('./pages/ressources/PourquoiPrixVarieSansChangement'));
const ComingSoonPage = lazyWithRetry(() => import('./components/ComingSoonPage'));
const Settings = lazy(() => import('./pages/Settings'));
const Home = lazyWithRetry(() => import('./pages/Home'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));

// New simplified pages for automatic generation
const HomeSimple = lazyWithRetry(() => import('./pages/Home.tsx'));
const CompareSimple = lazyWithRetry(() => import('./pages/Compare.tsx'));

// PR #1 - Assistant + FAQ étendue (v1.6.0)
const Faq = lazyWithRetry(() => import('./pages/Faq'));

// Comparateur Citoyen - Observatoire data
const ComparateurCitoyen = lazyWithRetry(() => import('./pages/ComparateurCitoyen'));

// Mission M-B - Multi-territory price comparison
const ComparaisonPage = lazyWithRetry(() => import('./pages/ComparaisonPage'));
const RechercheHub = lazyWithRetry(() => import('./pages/RechercheHub'));
const SearchCompareHub = lazyWithRetry(() => import('./pages/SearchCompareHub'));

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

// Global error handlers - production only to avoid interfering with development
if (import.meta.env.PROD) {
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    event.preventDefault();
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PerformanceMonitor />
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Analytics />
              <Routes>
                <Route path='/' element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path='chat' element={<ChatIALocal />} />
                  <Route path='scan' element={<Navigate to="/observatoire" replace />} />
                  <Route path='scanner/*' element={<ScanOCR />} />
                  <Route path='scanner-produit' element={<Navigate to="/scanner" replace />} />
                  <Route path='scan-ean' element={<ScanEAN />} />
                  <Route path='comparaison-enseignes' element={<ComparaisonEnseignes />} />
                  <Route path='comparateur' element={<Comparateur />} />
                  <Route path='comparateurs/*' element={<Comparateurs />} />
                  <Route path='comparaison' element={<Navigate to="/comparateur" replace />} />
                  <Route path='comparateur-vols' element={<Navigate to="/observatoire" replace />} />
                  <Route path='comparateur-bateaux' element={<Navigate to="/observatoire" replace />} />
                  <Route path='recherche-produits' element={<RechercheProduits />} />
                  <Route path='recherche-prix' element={<RecherchePrix />} />
                  <Route path='recherche-prix/indice-logistique' element={<ComingSoonPage title="Indice logistique DOM" description="Une vue explicative des contraintes logistiques par territoire arrive bientôt." status="En préparation" />} />
                  <Route path='recherche-prix/delais-logistiques' element={<ComingSoonPage title="Délais logistiques" description="Cette page détaillera les étapes logistiques et leurs impacts sur les délais." status="En préparation" />} />
                  <Route path='recherche-prix/pourquoi-delais-produit' element={<ComingSoonPage title="Délais par produit" description="Des explications pédagogiques par catégorie de produits seront disponibles prochainement." status="En préparation" />} />
                  <Route path='carte' element={<Carte />} />
                  <Route path='carte-itineraires/*' element={<Carte />} />
                  <Route path='actualites' element={<Actualites />} />
                  <Route path='alertes' element={<Alertes />} />
                  <Route path='a-propos' element={<APropos />} />
                  <Route path='methodologie' element={<Methodologie />} />
                  <Route path='donnees-publiques' element={<Navigate to="/observatoire" replace />} />
                  <Route path='mentions-legales' element={<MentionsLegales />} />
                  <Route path='mon-compte' element={<MonCompte />} />
                  <Route path='parametres' element={<Settings />} />
                  <Route path='inscription' element={<Inscription />} />
                  <Route path='login' element={<Login />} />
                  <Route path='connexion' element={<Navigate to="/login" replace />} />
                  <Route path='reset-password' element={<ResetPassword />} />
                  <Route path='comprendre-prix' element={<ComprendrePrix />} />
                  <Route path='contribuer-prix' element={<ContribuerPrix />} />
                  <Route path='contribuer' element={<Navigate to="/contribuer-prix" replace />} />
                  <Route path='signaler-abus' element={<SignalerAbus />} />
                  <Route path='signalement' element={<Navigate to="/signaler-abus" replace />} />
                  <Route path='pricing' element={<Pricing />} />
                  <Route path='tarifs' element={<Navigate to="/pricing" replace />} />
                  <Route path='solidarite' element={<ComingSoonPage title="Solidarité" description="Le programme de solidarité est en préparation pour accompagner les foyers." status="En construction" />} />
                  <Route path='pricing-detailed' element={<PricingDetailed />} />
                  <Route path='subscribe' element={<Subscribe />} />
                  <Route path='licence-institution' element={<LicenceInstitution />} />
                  <Route path='contact-collectivites' element={<ContactCollectivites />} />
                  <Route path='contact' element={<Contact />} />
                  <Route path='ia-conseiller' element={<IaConseiller />} />
                  <Route path='assistant-ia/*' element={<IaConseiller />} />
                  <Route path='ti-panie' element={<TiPanie />} />
                  <Route path='admin/dashboard' element={<AdminDashboard />} />
                  <Route path='admin/ai-dashboard' element={<AIDashboard />} />
                  <Route path='admin/ai-market-insights' element={<AiMarketInsights />} />
                  <Route path='ievr' element={<IEVR />} />
                  <Route path='dossier-media' element={<DossierMedia />} />
                  <Route path='presse' element={<Presse />} />
                  <Route path='historique-prix' element={<HistoriquePrix />} />
                  <Route path='historique-prix-new' element={<Navigate to="/observatoire" replace />} />
                  <Route path='alertes-prix' element={<AlertesPrix />} />
                  <Route path='budget-vital' element={<BudgetVital />} />
                  <Route path='faux-bons-plans' element={<FauxBonsPlan />} />
                  <Route path='budget-reel-mensuel' element={<BudgetReelMensuel />} />
                  <Route path='comparateur-formats' element={<ComparateurFormats />} />
                  <Route path='liste-courses' element={<ListeCourses />} />
                  <Route path='civic-modules' element={<CivicModules />} />
                  <Route path='evaluation-cosmetique' element={<EvaluationCosmetique />} />
                  <Route path='observatoire' element={<Observatoire />} />
                  <Route path='observatoire-prix' element={<Navigate to="/observatoire" replace />} />
                  <Route path='observatoire-hub' element={<ObservatoireHub />} />
                  <Route path='observatoire/methodologie' element={<ObservatoryMethodology />} />
                  <Route path='observatoire-temps-reel' element={<ObservatoireTempsReel />} />
                  <Route path='observatoire-vivant' element={<ObservatoireVivant />} />
                  <Route path='transparence' element={<Transparence />} />
                  <Route path='inflation' element={<InflationDashboardPage />} />
                  <Route path='ocr' element={<OCRHub />} />
                  <Route path='ocr/history' element={<OCRHistory />} />
                  <Route path='comparateur-citoyen' element={<ComparateurCitoyen />} />
                  <Route path=':territory/scanner' element={<TerritoryScanner />} />
                  <Route path=':territory/comparateurs' element={<TerritoryComparateurs />} />
                  <Route path=':territory' element={<TerritoryHub />} />
                  {/* Mission M-B - Multi-territory comparison */}
                  <Route path='comparateur/comparer' element={<ComparaisonPage />} />
                  {/* New simplified pages for automatic generation */}
                  <Route path='comparer' element={<CompareSimple />} />
                  <Route path='recherche' element={<RechercheHub />} />
                  <Route path='recherche-prix-observes' element={<SearchCompareHub />} />
                  <Route path='analyse-photo-produit' element={<ProductPhotoAnalysis />} />
                  <Route path='ressources/questions-logistique-dom' element={<QuestionsLogistiqueDOM />} />
                  <Route path='ressources/pourquoi-prix-varie-sans-changement' element={<PourquoiPrixVarieSansChangement />} />
                  <Route path='ressources/comprendre-promotions-prix-barres' element={<ComprendrePromotionsPrixBarres />} />
                  <Route path='ressources/guide-consommateur' element={<ComingSoonPage title="Guide consommateur" description="Le guide consommateur arrive bientôt avec des conseils pratiques pour acheter au juste prix." status="En préparation" />} />
                  <Route path='ressources/glossaire-logistique-dom' element={<ComingSoonPage title="Glossaire logistique DOM" description="Un glossaire pédagogique des termes logistiques sera publié prochainement." status="En préparation" />} />
                  {/* PR #1 - Assistant + FAQ étendue (v1.6.0) */}
                  <Route path='faq' element={<Faq />} />
                  <Route path='*' element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
        <ToastProvider />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
