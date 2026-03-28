import { OfflineBanner } from "./components/OfflineBanner";
 
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { lazyPage } from './router/lazy';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Layout synchronously to prevent loading block
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { ToastProvider } from './components/Toast/ToastProvider';
import { StoreSelectionProvider } from './context/StoreSelectionContext';
import RequireAuth from './components/auth/RequireAuth';
import RequireCreator from './components/auth/RequireCreator';
import RequireAdmin from './components/auth/RequireAdmin';
import { logDebug } from './utils/logger';

// ── Parallel preloading ──────────────────────────────────────────────────────
// LanguageProvider (i18next, ~21 kB gzip): preloaded eagerly so text content
// is available on first render without a Suspense waterfall.
// AuthProvider (Firebase, ~144 kB gzip) and EntitlementProvider (billing) are
// NOT preloaded eagerly — their downloads now start when React first hits the
// Suspense boundary (not at module-eval time).  This avoids competing for
// bandwidth with the LCP image and critical JS on throttled mobile connections.
// The Suspense phase is slightly longer but FCP/LCP improve on slow networks.
const _langProviderImport = import('./context/LanguageProvider');

const LanguageProvider = lazy(() =>
  _langProviderImport.then((m) => ({ default: m.LanguageProvider }))
);

// Heavy providers — lazy-loaded so Firebase (485 kB) doesn't block first paint.
const AuthProvider = lazy(() =>
  import('./contexts/AuthContext').then((m) => ({ default: m.AuthProvider }))
);
const EntitlementProvider = lazy(() =>
  import('./billing/EntitlementProvider').then((m) => ({ default: m.EntitlementProvider }))
);

// Non-critical UI/tracking — lazy-loaded so they don't block initial paint
const PerformanceMonitor = lazy(() =>
  import('./components/PerformanceMonitor').then((m) => ({ default: m.PerformanceMonitor }))
);
const OnboardingTour = lazy(() => import('./components/OnboardingTour'));
const AuthDebugPanel = lazy(() => import('./components/AuthDebugPanel'));
const OnboardingAutoStart = lazy(() => import('./components/OnboardingAutoStart'));
const HelpButton = lazy(() => import('./components/HelpButton'));
const AnalyticsTracker = lazy(() => import('./components/analytics/AnalyticsTracker'));
const BuildInfo = lazy(() =>
  import('./components/BuildInfo').then((m) => ({ default: m.BuildInfo }))
);

// Lazy-loaded pages - Main routes
const Home = lazy(() => import('./pages/Home'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const Carte = lazy(() => import('./pages/Carte'));
const MapPage = lazy(() => import('./pages/MapPage'));
const PublicStoreDetail = lazy(() => import('./pages/StoreDetail'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Comparateur = lazy(() => import('./pages/Comparateur'));

// New Admin pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboardNew = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminUsersPanel = lazy(() => import('./pages/admin/AdminUsersPanel'));
const AdminAudience = lazy(() => import('./pages/admin/AdminAudience'));
const StoreList = lazy(() => import('./pages/admin/stores/StoreList'));
const StoreForm = lazy(() => import('./pages/admin/stores/StoreForm'));
const StoreDetail = lazy(() => import('./pages/admin/stores/StoreDetail'));
const ProductList = lazy(() => import('./pages/admin/products/ProductList').then((m) => ({ default: m.ProductList })));
const ProductForm = lazy(() => import('./pages/admin/products/ProductForm').then((m) => ({ default: m.ProductForm })));
const ProductDetail = lazy(() => import('./pages/admin/products/ProductDetail').then((m) => ({ default: m.ProductDetail })));
const ImportPage = lazy(() => import('./pages/admin/import/ImportPage').then((m) => ({ default: m.ImportPage })));
const ObservatoireHub = lazy(() => import('./pages/ObservatoireHub'));
const Methodologie = lazy(() => import('./pages/Methodologie'));
const Faq = lazy(() => import('./pages/Faq'));
const Contact = lazy(() => import('./pages/Contact'));
const MentionsLegales = lazy(() => import('./pages/MentionsLegales'));
const Actualites = lazy(() => import('./pages/Actualites'));

// Additional feature pages
const DonneesPubliques = lazy(() => import('./pages/DonneesPubliques'));
const Contribuer = lazy(() => import('./pages/Contribuer'));
const ContribuerPrix = lazy(() => import('./pages/ContribuerPrix'));
const ComparateursHub = lazy(() => import('./pages/ComparateursHub'));
const CarteItinerairesHub = lazy(() => import('./pages/CarteItinerairesHub'));
const ComparateurCitoyen = lazy(() => import('./pages/ComparateurCitoyen'));
const LutteVieChere = lazy(() => import('./pages/LutteVieChereIndexPage'));
const SolidariteHub = lazy(() => import('./pages/SolidariteHub'));
const InscriptionPro = lazy(() => import('./pages/InscriptionPro'));
const EspacePro = lazy(() => import('./pages/EspacePro'));
const EspaceCreateur = lazy(() => import('./pages/EspaceCreateur'));
const ActivationCreateur = lazy(() => import('./pages/ActivationCreateur'));

// Scanner & OCR pages
const ScannerHub = lazy(() => import('./pages/ScannerHub'));
const OCRHub = lazy(() => import('./pages/ocr/OCRHub'));
const ScanEAN = lazy(() => import('./pages/ScanEAN'));
const ProductPhotoAnalysis = lazy(() => import('./pages/ProductPhotoAnalysis'));
const ProductPhotoSearch = lazy(() => import('./pages/ProductPhotoSearch'));
const ProductScanResult = lazy(() => import('./pages/ProductScanResult'));
const ComparaisonEnseignes = lazy(() => import('./pages/ComparaisonEnseignes'));
const BasketComparison = lazy(() => import('./pages/BasketComparison'));

// Settings & History
const Settings = lazy(() => import('./pages/Settings'));
const HistoriquePrix = lazy(() => import('./pages/HistoriquePrix'));
const RecherchePrix = lazy(() => import('./pages/RecherchePrix'));
const RechercheProduits = lazy(() => import('./pages/RechercheProduits'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetail'));
const ProduitPage = lazy(() => import('./pages/ProduitPage'));
const Alertes = lazy(() => import('./pages/Alertes'));
const AlerteDetail = lazy(() => import('./pages/AlerteDetail'));
const Promos = lazy(() => import('./pages/Promos'));
const MesListes = lazy(() => import('./pages/MesListes'));
const ListePage = lazy(() => import('./pages/ListePage'));
const UpgradePage = lazy(() => import('./pages/UpgradePage'));

// Savings Dashboard
const MesEconomies = lazy(() => import('./pages/MesEconomies'));

// Advanced feature pages (v7.0.0)
const PriceAlertsPage = lazy(() => import('./pages/PriceAlertsPage'));
const PriceHistoryPage = lazy(() => import('./pages/PriceHistoryPage'));
const SmartShoppingListPage = lazy(() => import('./pages/SmartShoppingListPage'));
const InflationDashboardPage = lazy(() => import('./pages/InflationDashboardPage'));
const GamificationProfilePage = lazy(() => import('./pages/GamificationProfilePage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const BadgesPage = lazy(() => import('./pages/BadgesPage'));

// Auth pages
const Login = lazy(() => import('./pages/Login'));
const Inscription = lazy(() => import('./pages/Inscription'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const MonCompte = lazy(() => import('./pages/MonCompte'));
const AuthHub = lazy(() => import('./pages/AuthHub'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));

// Pricing & Subscription
const Pricing = lazy(() => import('./pages/Pricing'));
const Subscribe = lazy(() => import('./pages/Subscribe'));

// Observatory real-time
const ObservatoireTempsReel = lazy(() => import('./pages/ObservatoireTempsReel'));

// Transparency & reporting
const Transparence = lazy(() => import('./pages/Transparence'));
const SignalerAbus = lazy(() => import('./pages/SignalerAbus'));

// Admin Sync Dashboard
const SyncDashboard = lazy(() => import('./pages/admin/sync/SyncDashboard'));
const SignalementModeration = lazy(() => import('./pages/admin/moderation/SignalementModeration'));

// i18n Test page (for development/testing)
const I18nTest = lazy(() => import('./pages/I18nTest'));

// About & institutional pages
const APropos = lazy(() => import('./pages/APropos'));
const PricingDetailed = lazy(() => import('./pages/PricingDetailed'));
const ComparatifConcurrence = lazy(() => import('./pages/ComparatifConcurrence'));
const LicenceInstitution = lazy(() => import('./pages/LicenceInstitution'));

// Specialised comparators
const FlightComparator = lazy(() => import('./pages/FlightComparator'));
const BoatComparator = lazy(() => import('./pages/BoatComparator'));
const FreightComparator = lazy(() => import('./pages/FreightComparator'));
const FuelComparator = lazy(() => import('./pages/FuelComparator'));
const StationsProximite = lazy(() => import('./pages/StationsProximite'));
const ProductPriceLookup = lazy(() => import('./pages/ProductPriceLookup'));
const ESLScannerPage = lazy(() => import('./pages/ESLScannerPage'));
const EnqueteCarburants = lazy(() => import('./pages/EnqueteCarburants'));
const ConferenceCarburants = lazy(() => import('./pages/ConferenceCarburants'));
const EnqueteOctroiMer = lazy(() => import('./pages/EnqueteOctroiMer'));
const ConferenceOctroiMer = lazy(() => import('./pages/ConferenceOctroiMer'));
const EnqueteEau = lazy(() => import('./pages/EnqueteEau'));
const ConferenceEau = lazy(() => import('./pages/ConferenceEau'));
const InsuranceComparator = lazy(() => import('./pages/InsuranceComparator'));
const TrainingComparator = lazy(() => import('./pages/TrainingComparator'));
const ServiceComparator = lazy(() => import('./pages/ServiceComparator'));
const CarRentalComparator = lazy(() => import('./pages/CarRentalComparator'));
const BuildingMaterialsComparator = lazy(() => import('./pages/BuildingMaterialsComparator'));

// Cosmetic evaluation
const EvaluationCosmetique = lazy(() => import('./pages/EvaluationCosmetique'));

// Additional comparators (previously unrouted)
const EnhancedComparator = lazy(() => import('./pages/EnhancedComparator'));
const Compare = lazy(() => import('./pages/Compare'));
const ComparateursPage = lazy(() => import('./pages/Comparateurs'));
const AIDashboard = lazy(() => import('./pages/AIDashboard'));

// 404 Not Found
const NotFound = lazy(() => import('./pages/NotFound'));

// OCR history
const OCRHistory = lazy(() => import('./pages/ocr/OCRHistory'));

// Observatory methodology
const ObservatoryMethodology = lazy(() => import('./pages/ObservatoryMethodology'));

// Recherche-prix sub-pages
const DelaisTensionsLogistiques = lazy(() => import('./pages/recherche-prix/DelaisTensionsLogistiques'));
const IndiceLogistique = lazy(() => import('./pages/recherche-prix/IndiceLogistique'));
const PourquoiDelaisProduit = lazy(() => import('./pages/recherche-prix/PourquoiDelaisProduit'));
const RechercheAvions = lazy(() => import('./pages/recherche-prix/Avions'));
const RechercheBateaux = lazy(() => import('./pages/recherche-prix/Bateaux'));
const RechercheEau = lazy(() => import('./pages/recherche-prix/Eau'));
const RechercheElectricite = lazy(() => import('./pages/recherche-prix/Electricite'));
const RechercheFret = lazy(() => import('./pages/recherche-prix/Fret'));
const RechercheFretAerien = lazy(() => import('./pages/recherche-prix/FretAerien'));
const RechercheAbonnementsInternet = lazy(() => import('./pages/recherche-prix/AbonnementsInternet'));
const RechercheAbonnementsMobile = lazy(() => import('./pages/recherche-prix/AbonnementsMobile'));

// Ressources pages
const QuestionsLogistiqueDOM = lazy(() => import('./pages/ressources/QuestionsLogistiqueDOM'));
const GlossaireLogistiqueDOM = lazy(() => import('./pages/ressources/GlossaireLogistiqueDOM'));
const ComprendrePromotionsPrixBarres = lazy(() => import('./pages/ressources/ComprendrePromotionsPrixBarres'));
const PourquoiPrixVarieSansChangement = lazy(() => import('./pages/ressources/PourquoiPrixVarieSansChangement'));

// ── Nouvelles pages : historique, comparateur inter-territoires, inflation, couverture ──
const CrossTerritoryComparator = lazy(() => import('./pages/CrossTerritoryComparator'));
const ComparaisonTerritoires = lazy(() => import('./pages/ComparaisonTerritoires'));
const InflationRateTracker = lazy(() => import('./pages/InflationRateTracker'));
const TerritoryCoverageReport = lazy(() => import('./pages/TerritoryCoverageReport'));

// ── Pages supplémentaires sans itinéraire ──
const ContactCollectivites = lazy(() => import('./pages/ContactCollectivites'));
const DossierMedia = lazy(() => import('./pages/DossierMedia'));
const BudgetReelMensuel = lazy(() => import('./pages/BudgetReelMensuel'));
const RechercheHub = lazy(() => import('./pages/RechercheHub'));
const SearchCompareHub = lazy(() => import('./pages/SearchCompareHub'));

// ── Pages institutionnelles & civiques manquantes ──
const TiPanie = lazy(() => import('./pages/TiPanie'));
const Gouvernance = lazy(() => import('./pages/Gouvernance'));
const Presse = lazy(() => import('./pages/Presse'));
const ComprendrePrix = lazy(() => import('./pages/ComprendrePrix'));
const ConferencePrix = lazy(() => import('./pages/ConferencePrix'));
const LettreHebdoIA = lazy(() => import('./pages/LettreHebdoIA'));
const LettreJourIA = lazy(() => import('./pages/LettreJourIA'));
const InnovationLab = lazy(() => import('./pages/InnovationLab'));
const CalculateurOctroi = lazy(() => import('./pages/CalculateurOctroi'));
const CalculateurBatiment = lazy(() => import('./pages/CalculateurBatiment'));
const SimulateurBudgetFamilial = lazy(() => import('./pages/SimulateurBudgetFamilial'));
const AlertesRupture = lazy(() => import('./pages/AlertesRupture'));
const ReclamationIA = lazy(() => import('./pages/ReclamationIA'));
const RapportCitoyen = lazy(() => import('./pages/RapportCitoyen'));
const PlanificateurRepas = lazy(() => import('./pages/PlanificateurRepas'));
const DLCAntigaspi = lazy(() => import('./pages/DLCAntigaspi'));
const AnalyseNutri = lazy(() => import('./pages/AnalyseNutri'));
const AnalyseConcurrence = lazy(() => import('./pages/AnalyseConcurrence'));
const CivicModules = lazy(() => import('./pages/CivicModules'));
const ObservatoireVivant = lazy(() => import('./pages/ObservatoireVivant'));
const AssistantIAHub = lazy(() => import('./pages/AssistantIAHub'));
const Suggestions = lazy(() => import('./pages/Suggestions'));
const MesDemandes = lazy(() => import('./pages/MesDemandes'));
const Promotions = lazy(() => import('./pages/Promotions'));
const BudgetVital = lazy(() => import('./pages/BudgetVital'));
const IEVRPage = lazy(() => import('./pages/IEVR'));
const Versions = lazy(() => import('./pages/Versions'));
const VersionPage = lazy(() => import('./pages/VersionPage'));
const ScanOCR = lazy(() => import('./pages/ScanOCR'));

// Messagerie interne
const Messagerie = lazy(() => import('./pages/Messagerie'));

// Groupes de Parole Citoyens
const GroupesParole = lazy(() => import('./pages/GroupesParole'));
// Marketplace Enseignes
const MerchantOnboarding = lazy(() => import('./pages/marketplace/MerchantOnboarding'));
const MerchantDashboard = lazy(() => import('./pages/marketplace/MerchantDashboard'));
const AdminMarketplace = lazy(() => import('./pages/admin/marketplace/AdminMarketplace'));

// Devis IA (Issue #501) + Roadmap (Issue #492) + Dossier Investisseurs (Issue #503)
const DevisIA = lazy(() => import('./pages/DevisIA'));
const DevisTracking = lazy(() => import('./pages/DevisTracking'));
const AdminDevis = lazy(() => import('./pages/admin/AdminDevis'));
const AdminCalculsBatiment = lazy(() => import('./pages/admin/AdminCalculsBatiment'));
// Marketplace Pros Bâtiment
const InscriptionProBatiment = lazy(() => import('./pages/InscriptionProBatiment'));
const AdminInseeImport = lazy(() => import('./pages/admin/AdminInseeImport'));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));
const DossierInvestisseurs = lazy(() => import('./pages/DossierInvestisseurs'));
const ChecklistProduction = lazy(() => import('./pages/ChecklistProduction'));
const ModuleAuditPage = lazy(() => import('./pages/ModuleAuditPage'));
const AudiencePage = lazy(() => import('./pages/AudiencePage'));
const StatutPage   = lazy(() => import('./pages/StatutPage'));
const Perimetre = lazy(() => import('./pages/Perimetre'));
const Predictions = lazy(() => import('./pages/Predictions'));
const IaConseiller = lazy(() => import('./pages/IaConseiller'));
const AiMarketInsights = lazy(() => import('./pages/AiMarketInsights'));
const TerritoryHub = lazy(() => import('./pages/TerritoryHub'));
const TerritoryScanner = lazy(() => import('./pages/TerritoryScanner'));

// ── Nouvelles pages V3 ─────────────────────────────────────────────────────
const GuideIntelligentTerritoires = lazy(() => import('./pages/GuideIntelligentTerritoires'));
const ARScannerPage = lazy(() => import('./pages/ARScannerPage'));
const ChaineFourniture = lazy(() => import('./pages/ChaineFourniture'));
const CommerceSocial = lazy(() => import('./pages/CommerceSocial'));
const PetitsCommerces = lazy(() => import('./pages/PetitsCommerces'));
const ProducteursLocaux = lazy(() => import('./pages/ProducteursLocaux'));
const MarchesLocaux = lazy(() => import('./pages/MarchesLocaux'));
const AnalyseFactures = lazy(() => import('./pages/AnalyseFactures'));
const DetectionFraude = lazy(() => import('./pages/DetectionFraude'));
const EvaluationMagasins = lazy(() => import('./pages/EvaluationMagasins'));
const PortailDeveloppeurs = lazy(() => import('./pages/PortailDeveloppeurs'));
const ChocsPrixPage = lazy(() => import('./pages/ChocsPrixPage'));
const NewsletterHubPage = lazy(() => import('./pages/NewsletterHubPage'));
const MonitoringIAPage = lazy(() => import('./pages/MonitoringIAPage'));
const OrganigrammeGBH = lazy(() => import('./pages/OrganigrammeGBH'));

// ── SEO & Growth Pages ───────────────────────────────────────────────────────
const SEOProductPage = lazy(() => import('./pages/SEOProductPage'));
const SEOCategoryPage = lazy(() => import('./pages/SEOCategoryPage'));
const SEOPrixLocalPage = lazy(() => import('./pages/SEOPrixLocalPage'));
const SEOComparaisonPage = lazy(() => import('./pages/SEOComparaisonPage'));
const SEOInflationPage = lazy(() => import('./pages/SEOInflationPage'));
const SEOMoinsChersPage = lazy(() => import('./pages/SEOMoinsChersPage'));
const SEOBrandPage = lazy(() => import('./pages/SEOBrandPage'));
const SEOEnseignePrixPage = lazy(() => import('./pages/SEOEnseignePrixPage'));
const SEOGuidePrixPage = lazy(() => import('./pages/SEOGuidePrixPage'));
const SEOComparateurSlugPage = lazy(() => import('./pages/SEOComparateurSlugPage'));
const LandingPage   = lazy(() => import('./pages/LandingPage'));
const PartnerPage   = lazy(() => import('./pages/PartnerPage'));
const GuidePrixAlimentaireDOM = lazy(() => import('./pages/pillar/GuidePrixAlimentaireDOM'));
const ComparateurSuperMarchesDOM = lazy(() => import('./pages/pillar/ComparateurSuperMarchesDOM'));
const InflationAlimentaireDOMAnalyse = lazy(() => import('./pages/pillar/InflationAlimentaireDOMAnalyse'));
const OuFaireCoursesDOMPage = lazy(() => import('./pages/pillar/OuFaireCoursesDOMPage'));
const StatsDashboard = lazy(() => import('./pages/StatsDashboard'));
const SeoMonitoringPage = lazy(() => import('./pages/SeoMonitoringPage'));
const OutreachDashboardPage = lazy(() => import('./pages/OutreachDashboardPage'));
const CRODashboardPage = lazy(() => import('./pages/CRODashboardPage'));
const SeoLoopDashboardPage = lazy(() => import('./pages/SeoLoopDashboardPage'));
const RevenueDashboardPage = lazy(() => import('./pages/RevenueDashboardPage'));
const ExpansionDashboardPage = lazy(() => import('./pages/ExpansionDashboardPage'));
const AuthorityDashboardPage = lazy(() => import('./pages/AuthorityDashboardPage'));
const GlobalDashboardPage = lazy(() => import('./pages/GlobalDashboardPage'));
const AutoSeoDashboardPage = lazy(() => import('./pages/AutoSeoDashboardPage'));
const SEOCompetitorComparisonPage = lazy(() => import('./pages/SEOCompetitorComparisonPage'));
const TopEconomiesPage = lazy(() => import('./pages/TopEconomiesPage'));
const TendancesPage = lazy(() => import('./pages/TendancesPage'));
const PopulairesPage = lazy(() => import('./pages/PopulairesPage'));
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage'));
const ExecutiveDashboardPage = lazy(() => import('./pages/ExecutiveDashboardPage'));
const TopDealsDuJourPage = lazy(() => import('./pages/TopDealsDuJourPage'));

/**
 * IMPORTANT — NE PAS SUPPRIMER
 * Les tests CI vérifient la présence LITTÉRALE de certaines routes alias
 * (deep-links legacy) dans le code source. Elles sont donc écrites explicitement
 * ci-dessous pour stabiliser la CI et éviter d'y revenir.
 *
 * Tu ajoutes un alias ? Ajoute 1 ligne ici. Point final.
 */
const LEGACY_ALIAS_ROUTES = (
  <>
    {/* Actualités */}
    <Route path="actus" element={<Navigate to="/actualites" replace />} />
    <Route path="panier" element={<Navigate to="/liste" replace />} />
    <Route path="cart" element={<Navigate to="/liste" replace />} />
    <Route path="checkout" element={<Navigate to="/liste" replace />} />
    <Route path="news" element={<Navigate to="/actualites" replace />} />

    {/* Scanner */}
    <Route path="scan" element={<Navigate to="/scanner" replace />} />

    {/* Offres / Tarifs (aliases utiles si un lien pointe vers /offres) */}
    <Route path="offres" element={<Navigate to="/pricing" replace />} />
    <Route path="tarifs" element={<Navigate to="/pricing" replace />} />
    <Route path="abonnements" element={<Navigate to="/pricing" replace />} />

    {/* Auth: login (legacy deep-links) */}
    <Route path="Login" element={<Navigate to="/login" replace />} />
    <Route path="auth/login" element={<Navigate to="/login" replace />} />
    <Route path="signin" element={<Navigate to="/login" replace />} />

    {/* Auth: register */}
    <Route path="auth/register" element={<Navigate to="/inscription" replace />} />
    <Route path="signup" element={<Navigate to="/inscription" replace />} />

    {/* Auth: reset */}
    <Route path="auth/reset-password" element={<Navigate to="/reset-password" replace />} />
    <Route path="forgot-password" element={<Navigate to="/reset-password" replace />} />

    {/* Account */}
    <Route path="moncompte" element={<Navigate to="/mon-compte" replace />} />
    <Route path="account" element={<Navigate to="/mon-compte" replace />} />
  </>
);

function LoadingFallback() {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    logDebug('⏳ LoadingFallback: Displayed');
    const timer = window.setTimeout(() => {
      console.error('⚠️ Application timeout - Loading blocked for 10+ seconds');
      setShowTimeout(true);
    }, 10000);

    return () => {
      logDebug('✅ LoadingFallback: Hidden (component loaded successfully)');
      window.clearTimeout(timer);
    };
  }, []);

  if (showTimeout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4"> 
 <OfflineBanner />
        <img src={`${import.meta.env.BASE_URL}logo-akiprisaye.svg`} alt="Logo" className="h-16 mb-4" width="64" height="64" />
        <h1 className="text-xl font-bold mb-2">Chargement bloqué</h1>
        <p className="text-slate-400 mb-4">L'application met trop de temps à charger.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700">
          Recharger la page
        </button>
        <p className="text-xs text-slate-500 mt-4">Si le problème persiste, videz le cache du navigateur.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="animate-pulse text-lg text-white">Chargement…</div>
    </div>
  );
}

export default function App() {
  // Gardé intentionnellement : permet d'afficher une erreur “providers/init” sans white-screen.
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

  if (providerError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <img src={`${import.meta.env.BASE_URL}logo-akiprisaye.svg`} alt="Logo" className="h-16 mb-4" width="64" height="64" />
        <h1 className="text-xl font-bold mb-2">Erreur d'initialisation</h1>
        <p className="text-red-400 mb-4">{providerError.message}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700">
          Recharger
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* Single top-level Suspense: LanguageProvider (vendor-i18n 21kB), AuthProvider (Firebase
          485kB) and EntitlementProvider all download in parallel thanks to the pre-evaluated
          import promises above.  The LoadingFallback replaces the HTML #loading-fallback div. */}
      <Suspense fallback={<LoadingFallback />}>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <OnboardingProvider>
                <StoreSelectionProvider>
                  {/* EntitlementProvider also imports Firebase (Firestore); already preloaded. */}
                  <Suspense fallback={null}>
                    <EntitlementProvider>
                      <BrowserRouter basename={import.meta.env.BASE_URL}>
                        <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                        {/* Admin routes — RequireAdmin guard: redirects non-admin users to / */}
                        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                          <Route index element={<AdminDashboardNew />} />
                          <Route path="users" element={<AdminUsersPanel />} />
                          <Route path="audience" element={<AdminAudience />} />
                          <Route path="stores" element={<StoreList />} />
                          <Route path="stores/new" element={<StoreForm />} />
                          <Route path="stores/:id" element={<StoreDetail />} />
                          <Route path="stores/:id/edit" element={<StoreForm />} />
                          <Route path="products" element={<ProductList />} />
                          <Route path="products/new" element={<ProductForm />} />
                          <Route path="products/:id" element={<ProductDetail />} />
                          <Route path="products/:id/edit" element={<ProductForm />} />
                          <Route path="import" element={<ImportPage />} />
                          <Route path="sync" element={<SyncDashboard />} />
                          <Route path="moderation" element={<SignalementModeration />} />
                          <Route path="marketplace" element={<AdminMarketplace />} />
                          {/* Devis IA admin pipeline */}
                          <Route path="devis" element={<AdminDevis />} />
                          {/* Calculs bâtiment admin */}
                          <Route path="calculs-batiment" element={<AdminCalculsBatiment />} />
                          {/* Pros bâtiment — import INSEE */}
                          <Route path="insee-import" element={<AdminInseeImport />} />
                        </Route>

                        {/* Main site routes with Layout */}
                        <Route path="/auth/callback" element={<AuthCallbackPage />} />
                        <Route path="/" element={<Layout />}>
                          <Route index element={<Home />} />
                          <Route path="carte" element={<Carte />} />
                          <Route path="carte-interactive" element={<MapPage />} />
                          <Route path="enseigne/:storeId" element={<PublicStoreDetail />} />
                          <Route path="dashboard" element={<AdminDashboard />} />
                          <Route path="home" element={<Home />} />
                          <Route path="comparateur" element={<Comparateur />} />
                          <Route path="search" element={<SearchPage />} />
                          <Route path="observatoire" element={<ObservatoireHub />} />
                          <Route path="vie-chere" element={<LutteVieChere />} />
                          <Route path="methodologie" element={<Methodologie />} />
                          <Route path="faq" element={<Faq />} />
                          <Route path="contact" element={<Contact />} />
                          <Route path="actualites" element={<Actualites />} />
                          <Route path="mentions-legales" element={<MentionsLegales />} />
                          <Route path="privacy" element={<Transparence />} />

                          {/* Solidarité & Entraide */}
                          <Route path="solidarite" element={<SolidariteHub />} />

                          {/* Espace Professionnel */}
                          <Route path="inscription-pro" element={<InscriptionPro />} />
                          <Route path="espace-pro" element={<EspacePro />} />
                          <Route path="espace-pro-batiment" element={<Navigate to="/espace-pro" replace />} />
                          <Route path="espace-createur" element={<RequireCreator><Suspense fallback={<div style={{color:'white', padding:'20px'}}>Chargement...</div>}><EspaceCreateur /></Suspense></RequireCreator>} />
                          <Route path="activation-createur" element={<ActivationCreateur />} />

                          {/* Additional feature routes */}
                          <Route path="donnees-publiques" element={<DonneesPubliques />} />
                          <Route path="contribuer" element={<Contribuer />} />
                          <Route path="contribuer-prix" element={<ContribuerPrix />} />
                          <Route path="comparateurs" element={<ComparateursHub />} />
                          <Route path="comparateurs-hub" element={<Navigate to="/comparateurs" replace />} />
                          <Route path="carte-itineraires" element={<CarteItinerairesHub />} />
                          <Route path="comparateur-citoyen" element={<ComparateurCitoyen />} />

                          {/* Scanner & OCR routes */}
                          <Route path="scanner" element={<ScannerHub />} />
                          <Route path="scan-ean" element={<ScanEAN />} />
                          <Route path="scan-ocr" element={<ScanOCR />} />
                          <Route path="scan-photo" element={<ProductPhotoSearch />} />
                          <Route path="analyse-photo-produit" element={<ProductPhotoAnalysis />} />
                          <Route path="product/:barcode" element={<ProductScanResult />} />
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
                          <Route path="produit/:ean" element={<ProduitPage />} />
                          <Route path="recherche-prix" element={<RecherchePrix />} />
                          <Route path="recherche-produits" element={<RechercheProduits />} />
                          <Route path="alertes" element={<Alertes />} />
                          <Route path="alertes/:id" element={<AlerteDetail />} />
                          <Route path="promos" element={<Promos />} />
                          <Route path="mes-listes" element={<MesListes />} />
                          <Route path="liste" element={<ListePage />} />
                          <Route path="upgrade" element={<UpgradePage />} />

                          {/* Savings Dashboard */}
                          <Route path="mes-economies" element={<MesEconomies />} />
                          <Route path="tableau-de-bord" element={<MesEconomies />} />

                          {/* Advanced features (v7.0.0) */}
                          <Route path="alertes-prix" element={<PriceAlertsPage />} />
                          <Route path="prix-historique" element={<PriceHistoryPage />} />
                          <Route path="liste-intelligente" element={<SmartShoppingListPage />} />
                          <Route path="tableau-inflation" element={<InflationDashboardPage />} />
                          <Route path="gamification" element={<GamificationProfilePage />} />
                          <Route path="gamification/leaderboard" element={<LeaderboardPage />} />
                          <Route path="gamification/badges" element={<BadgesPage />} />

                          {/* Auth routes (canoniques) */}
                          <Route path="login" element={<Login />} />
                          <Route path="connexion" element={<Login />} />
                          <Route path="inscription" element={<Inscription />} />
                          <Route path="reset-password" element={<ResetPassword />} />
                          <Route path="auth" element={<AuthHub />} />
                          <Route
                            path="mon-compte"
                            element={
                              <RequireAuth>
                                <MonCompte />
                              </RequireAuth>
                            }
                          />

                          {/* Aliases legacy (stables CI) */}
                          {LEGACY_ALIAS_ROUTES}

                          {/* Pricing & Subscription */}
                          <Route path="pricing" element={<Pricing />} />
                          <Route path="subscribe" element={<Subscribe />} />
                          <Route path="subscribe/success" element={<Subscribe />} />

                          {/* Observatory real-time */}
                          <Route path="observatoire-temps-reel" element={<ObservatoireTempsReel />} />

                          {/* Transparency & reporting */}
                          <Route path="transparence" element={<Transparence />} />
                          <Route path="signaler-abus" element={<SignalerAbus />} />

                          {/* Admin routes */}
                          <Route path="admin/sync" element={<SyncDashboard />} />

                          {/* i18n Test (development/testing) */}
                          <Route path="test-i18n" element={<I18nTest />} />

                          {/* À propos & institutional */}
                          <Route path="a-propos" element={<APropos />} />
                          <Route path="tarifs-details" element={<PricingDetailed />} />
                          <Route path="comparatif-concurrence" element={<ComparatifConcurrence />} />
                          <Route path="licence-institution" element={<LicenceInstitution />} />
                          <Route path="inflation" element={<Navigate to="/tableau-inflation" replace />} />

                          {/* Comparateurs spécialisés */}
                          <Route path="comparateur-vols" element={<FlightComparator />} />
                          <Route path="comparateur-bateaux" element={<BoatComparator />} />
                          <Route path="comparateur-fret" element={<FreightComparator />} />
                          <Route path="comparateur-carburants" element={<FuelComparator />} />
                          <Route path="stations-proximite" element={<StationsProximite />} />
                          <Route path="prix-produit" element={<ProductPriceLookup />} />
                          <Route path="scan-eeg" element={<ESLScannerPage />} />
                          <Route path="enquete-carburants" element={<EnqueteCarburants />} />
                          <Route path="conference-carburants" element={<ConferenceCarburants />} />
                          <Route path="comparateur-assurances" element={<InsuranceComparator />} />
                          <Route path="comparateur-formations" element={<TrainingComparator />} />
                          <Route path="comparateur-services" element={<ServiceComparator />} />
                          <Route path="comparateur-location-voiture" element={<CarRentalComparator />} />
                          <Route path="comparateur-materiaux-batiment" element={<BuildingMaterialsComparator />} />

                          {/* Évaluation cosmétique */}
                          <Route path="evaluation-cosmetique" element={<EvaluationCosmetique />} />

                          {/* Comparateurs supplémentaires — pages précédemment sans itinéraire */}
                          <Route path="comparateur-avance" element={<EnhancedComparator />} />
                          <Route path="compare" element={<Compare />} />
                          <Route path="comparateurs-prix" element={<ComparateursPage />} />
                          <Route path="ai-dashboard" element={<AIDashboard />} />

                          {/* OCR history */}
                          <Route path="ocr/history" element={<OCRHistory />} />

                          {/* Observatory methodology */}
                          <Route path="observatoire/methodologie" element={<ObservatoryMethodology />} />

                          {/* Recherche-prix sous-pages */}
                          <Route path="recherche-prix/delais-logistiques" element={<DelaisTensionsLogistiques />} />
                          <Route path="recherche-prix/indice-logistique" element={<IndiceLogistique />} />
                          <Route path="recherche-prix/pourquoi-delais-produit" element={<PourquoiDelaisProduit />} />
                          <Route path="recherche-prix/avions" element={<RechercheAvions />} />
                          <Route path="recherche-prix/bateaux" element={<RechercheBateaux />} />
                          <Route path="recherche-prix/eau" element={<RechercheEau />} />
                          <Route path="recherche-prix/electricite" element={<RechercheElectricite />} />
                          <Route path="recherche-prix/fret" element={<RechercheFret />} />
                          <Route path="recherche-prix/fret-aerien" element={<RechercheFretAerien />} />
                          <Route path="recherche-prix/abonnements-internet" element={<RechercheAbonnementsInternet />} />
                          <Route path="recherche-prix/abonnements-mobile" element={<RechercheAbonnementsMobile />} />

                          {/* Ressources pédagogiques */}
                          <Route path="ressources/questions-logistique-dom" element={<QuestionsLogistiqueDOM />} />
                          <Route path="ressources/glossaire-logistique-dom" element={<GlossaireLogistiqueDOM />} />
                          <Route path="ressources/comprendre-promotions-prix-barres" element={<ComprendrePromotionsPrixBarres />} />
                          <Route path="ressources/pourquoi-prix-varie-sans-changement" element={<PourquoiPrixVarieSansChangement />} />

                          {/* ── Nouvelles pages observatoire enrichi ── */}
                          <Route path="comparateur-territoires" element={<CrossTerritoryComparator />} />
                          <Route path="comparaison-territoires" element={<ComparaisonTerritoires />} />
                          <Route path="inflation-categories" element={<InflationRateTracker />} />
                          <Route path="couverture-territoires" element={<TerritoryCoverageReport />} />

                          {/* ── Itinéraires pour pages supplémentaires ── */}
                          <Route path="contact-collectivites" element={<ContactCollectivites />} />
                          <Route path="dossier-media" element={<DossierMedia />} />
                          <Route path="budget-reel-mensuel" element={<BudgetReelMensuel />} />
                          <Route path="recherche-hub" element={<RechercheHub />} />
                          <Route path="recherche-avancee" element={<SearchCompareHub />} />
                          <Route path="ressources/comprendre-prix" element={<Navigate to="/comprendre-prix" replace />} />

                          {/* ── Pages institutionnelles & civiques ── */}
                          <Route path="ti-panie" element={<TiPanie />} />
                          <Route path="gouvernance" element={<Gouvernance />} />
                          <Route path="presse" element={<Presse />} />
                          <Route path="comprendre-prix" element={<ComprendrePrix />} />
                          <Route path="conference-prix" element={<ConferencePrix />} />
                          <Route path="lettre-hebdo" element={<LettreHebdoIA />} />
                          <Route path="lettre-jour" element={<LettreJourIA />} />
                          <Route path="innovation-lab" element={<InnovationLab />} />
                          <Route path="calculateur-octroi" element={<CalculateurOctroi />} />
                          <Route path="enquete-octroi-mer" element={<EnqueteOctroiMer />} />
                          <Route path="conference-octroi-mer" element={<ConferenceOctroiMer />} />
                          <Route path="enquete-eau" element={<EnqueteEau />} />
                          <Route path="conference-eau" element={<ConferenceEau />} />
                          <Route path="calculateur-batiment" element={<CalculateurBatiment />} />
                          <Route path="simulateur-budget" element={<SimulateurBudgetFamilial />} />
                          <Route path="alertes-rupture" element={<AlertesRupture />} />
                          <Route path="ia-reclamation" element={<ReclamationIA />} />
                          <Route path="rapport-citoyen" element={<RapportCitoyen />} />
                          <Route path="planificateur-repas" element={<PlanificateurRepas />} />
                          <Route path="dlc-antigaspi" element={<DLCAntigaspi />} />
                          <Route path="analyse-nutri" element={<AnalyseNutri />} />
                          <Route path="analyse-concurrence" element={<AnalyseConcurrence />} />
                          <Route path="civic-modules" element={<CivicModules />} />
                          <Route path="observatoire-vivant" element={<ObservatoireVivant />} />
                          <Route path="assistant-ia" element={<AssistantIAHub />} />
                          <Route path="suggestions" element={<Suggestions />} />
                          <Route path="mes-demandes" element={<MesDemandes />} />
                          <Route path="promotions" element={<Promotions />} />
                          <Route path="budget-vital" element={<BudgetVital />} />
                          <Route path="ievr" element={<IEVRPage />} />
                          <Route path="versions" element={<Versions />} />
                          <Route path="version" element={<VersionPage />} />

                          {/* Messagerie interne */}
                          <Route path="messagerie" element={<Messagerie />} />

                          {/* Groupes de Parole Citoyens */}
                          <Route path="groupes-parole" element={<GroupesParole />} />
                          <Route path="groupes-parole/:groupId" element={<GroupesParole />} />
                          {/* Marketplace Enseignes */}
                          <Route path="marketplace/inscription" element={<MerchantOnboarding />} />
                          <Route path="marketplace/dashboard" element={<MerchantDashboard />} />

                          {/* Devis IA — Issue #501 */}
                          <Route path="devis-ia" element={<DevisIA />} />
                          <Route path="devis-ia/:devisId" element={<DevisTracking />} />
                          <Route path="mes-devis" element={<DevisTracking />} />

                          {/* Roadmap & Architecture — Issue #492 */}
                          <Route path="roadmap" element={<RoadmapPage />} />

                          {/* Dossier Investisseurs — Issue #503 */}
                          <Route path="dossier-investisseurs" element={<DossierInvestisseurs />} />

                          {/* Checklist Production — siriste à faire pour la mise en production */}
                          <Route path="checklist-prod" element={<ChecklistProduction />} />

                          {/* Audit des modules — comprehensive module audit */}
                          <Route path="module-audit" element={<ModuleAuditPage />} />

                          {/* Audience temps réel — podium territoires */}
                          <Route path="audience" element={<AudiencePage />} />

                          {/* Statut plateforme — horloges + déploiement */}
                          <Route path="statut" element={<StatutPage />} />

                          {/* Pages territoire — hub par territoire et scanner territorial */}
                          <Route path="territoire/:territory" element={<TerritoryHub />} />
                          <Route path="territoire/:territory/scanner" element={<TerritoryScanner />} />

                          {/* ── Nouvelles pages V3 ── */}
                          <Route path="guide-territoire" element={<GuideIntelligentTerritoires />} />
                          <Route path="ar-scanner" element={<ARScannerPage />} />
                          <Route path="chaine-fourniture" element={<ChaineFourniture />} />
                          <Route path="commerce-social" element={<CommerceSocial />} />
                          <Route path="petits-commerces" element={<PetitsCommerces />} />
                          <Route path="producteurs-locaux" element={<ProducteursLocaux />} />
                          <Route path="marches-locaux" element={<MarchesLocaux />} />
                          <Route path="analyse-factures" element={<AnalyseFactures />} />
                          <Route path="detection-fraude" element={<DetectionFraude />} />
                          <Route path="evaluation-magasins" element={<EvaluationMagasins />} />
                          <Route path="portail-developpeurs" element={<PortailDeveloppeurs />} />
                          <Route path="chocs-prix" element={<ChocsPrixPage />} />
                          <Route path="newsletter" element={<NewsletterHubPage />} />
                          <Route path="monitoring-ia" element={<MonitoringIAPage />} />
                          <Route path="organigrame-gbh" element={<OrganigrammeGBH />} />
                          <Route path="organigramme-gbh" element={<OrganigrammeGBH />} />

                          {/* ── SEO & Growth Pages ── */}
                          <Route path="produit/:slug" element={<SEOProductPage />} />
                          <Route path="categorie/:slug" element={<SEOCategoryPage />} />
                          {/* Long-tail SEO: local price pages /prix/<product>-<territory> */}
                          <Route path="prix/:slug" element={<SEOPrixLocalPage />} />
                          {/* Long-tail SEO: retailer comparison /comparer/<r1>-vs-<r2>-<territory> */}
                          <Route path="comparer/:slug" element={<SEOComparaisonPage />} />
                          {/* Long-tail SEO: inflation trends /inflation/<category>-<territory>-<year> */}
                          <Route path="inflation/:slug" element={<SEOInflationPage />} />
                          {/* Long-tail SEO: cheapest products /moins-cher/<territory>[/<category>] */}
                          <Route path="moins-cher/:territory" element={<SEOMoinsChersPage />} />
                          <Route path="moins-cher/:territory/:category" element={<SEOMoinsChersPage />} />
                          {/* Long-tail SEO: brand pages /marque/<brand>-<territory> */}
                          <Route path="marque/:slug" element={<SEOBrandPage />} />
                          {/* Long-tail SEO: retailer price pages /prix-enseigne/<retailer>/<territory> */}
                          <Route path="prix-enseigne/:retailer/:territory" element={<SEOEnseignePrixPage />} />
                          {/* Long-tail SEO: guide pages /guide-prix/<product>-<territory> */}
                          <Route path="guide-prix/:slug" element={<SEOGuidePrixPage />} />
                          {/* Long-tail SEO: comparateur dynamique /comparateur/<product>-<territory> (V2/V3) */}
                          <Route path="comparateur/:slug" element={<SEOComparateurSlugPage />} />
                          {/* Landing page — high-conversion entry point */}
                          <Route path="landing" element={<LandingPage />} />
                          <Route path="devenir-partenaire" element={<PartnerPage />} />
                          {/* Pillar pages */}
                          <Route path="guide-prix-alimentaire-dom" element={<GuidePrixAlimentaireDOM />} />
                          <Route path="comparateur-supermarches-dom" element={<ComparateurSuperMarchesDOM />} />
                          <Route path="inflation-alimentaire-dom" element={<InflationAlimentaireDOMAnalyse />} />
                          <Route path="ou-faire-courses-dom" element={<OuFaireCoursesDOMPage />} />
                          <Route path="stats-dashboard" element={<StatsDashboard />} />
                          {/* Internal/admin dashboards — RequireAdmin guard */}
                          <Route path="seo-monitoring" element={<RequireAdmin><SeoMonitoringPage /></RequireAdmin>} />
                          <Route path="outreach" element={<RequireAdmin><OutreachDashboardPage /></RequireAdmin>} />
                          <Route path="cro-dashboard" element={<RequireAdmin><CRODashboardPage /></RequireAdmin>} />
                          <Route path="seo-loop-dashboard" element={<RequireAdmin><SeoLoopDashboardPage /></RequireAdmin>} />
                          <Route path="revenue-dashboard" element={<RequireAdmin><RevenueDashboardPage /></RequireAdmin>} />
                          <Route path="expansion-dashboard" element={<RequireAdmin><ExpansionDashboardPage /></RequireAdmin>} />
                          <Route path="authority-dashboard" element={<RequireAdmin><AuthorityDashboardPage /></RequireAdmin>} />
                          <Route path="global-dashboard" element={<RequireAdmin><GlobalDashboardPage /></RequireAdmin>} />
                          <Route path="auto-seo-dashboard" element={<RequireAdmin><AutoSeoDashboardPage /></RequireAdmin>} />
                          <Route path="vs/:slug" element={<SEOCompetitorComparisonPage />} />
                          <Route path="top-economies" element={<TopEconomiesPage />} />
                          <Route path="tendances" element={<TendancesPage />} />
                          <Route path="populaires" element={<PopulairesPage />} />

                          {/* Pages fonctionnelles sans itinéraire précédent */}
                          <Route path="perimetre" element={<Perimetre />} />
                          <Route path="predictions" element={<Predictions />} />
                          <Route path="ia-conseiller" element={<IaConseiller />} />
                          <Route path="ai-insights" element={<AiMarketInsights />} />

                          {/* Conversion + User OS + Executive OS */}
                          <Route path="mon-espace" element={<UserDashboardPage />} />
                          <Route path="executive" element={<ExecutiveDashboardPage />} />
                          <Route path="top-deals-du-jour" element={<TopDealsDuJourPage />} />

                          {/* Catch-all route - 404 page */}
                          <Route path="*" element={<NotFound />} />
                        </Route>
                      </Routes>

                      <Suspense fallback={null}><AnalyticsTracker /></Suspense>
                      <PerformanceMonitor />
                      <Suspense fallback={null}><OnboardingAutoStart /></Suspense>
                      <OnboardingTour />
                      <Suspense fallback={null}><HelpButton /></Suspense>
                      <ToastProvider />
                      <AuthDebugPanel />
                      {/* Deployment proof badge — shows shortSHA + date in bottom-right */}
                      <Suspense fallback={null}><BuildInfo /></Suspense>
                    </Suspense>
                  </BrowserRouter>
                    </EntitlementProvider>
                  </Suspense>
                </StoreSelectionProvider>
              </OnboardingProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </Suspense>
    </ErrorBoundary>
  );
}
