/**
 * EspaceCreateur.tsx
 *
 * Tableau de bord exclusif du créateur / développeur du logiciel.
 * Accès réservé au rôle "creator" — plan CREATOR (illimité sur tout).
 *
 * Route : /espace-createur
 */

import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import {
  Crown, Shield, Zap, Code2, Database, Users, BarChart3,
  Settings, Lock, CheckCircle, AlertCircle, Copy, ExternalLink,
  Terminal, BookOpen, Sparkles, Globe, Key, ChevronDown, ChevronUp,
  TrendingUp, Bell, Download, FileText, Wrench, RefreshCw,
  LogOut, Star, Building2, Smartphone, BrainCircuit, Activity, Clock3, Eye, MapPinned,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PLAN_DEFINITIONS } from '../billing/plans';
import { useUserStats } from '../hooks/useUserStats';
import { getConversionStats, getDailyStats } from '../utils/priceClickTracker';
import {
  useVisitorStats,
  type InterestStats,
  type TerritoryInterestStat,
  type TerritoryStats,
} from '../hooks/useVisitorStats';

/* ─── Admin shortcut ─────────────────────────────────────────────────── */

interface AdminLink {
  label: string;
  icon: React.ElementType;
  to: string;
  description: string;
  color: string;
  requiresAdmin: boolean;
  helpHref?: string;
}

const ADMIN_LINKS: AdminLink[] = [
  { label: 'Dashboard Admin',       icon: BarChart3,   to: '/admin',                  description: 'Vue d\'ensemble et métriques', color: 'text-blue-400',   requiresAdmin: true, helpHref: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml' },
  { label: 'Gestion utilisateurs',  icon: Users,       to: '/admin/users',            description: 'Rôles, plans, accès', color: 'text-purple-400', requiresAdmin: true, helpHref: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml' },
  { label: 'Sync / Import',         icon: RefreshCw,   to: '/admin/sync',             description: 'Synchronisation des données', color: 'text-green-400', requiresAdmin: true, helpHref: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml' },
  { label: 'Gestion Magasins',      icon: Building2,   to: '/admin/stores',           description: 'Référentiel enseigne', color: 'text-amber-400', requiresAdmin: true, helpHref: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml' },
  { label: 'Gestion Produits',      icon: Database,    to: '/admin/products',         description: 'Catalogue EAN', color: 'text-cyan-400',  requiresAdmin: true, helpHref: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml' },
  { label: 'Import Prix',           icon: Download,    to: '/admin/import',           description: 'Import CSV / JSON', color: 'text-orange-400', requiresAdmin: true, helpHref: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml' },
  { label: 'Modération',            icon: Shield,      to: '/admin/moderation',       description: 'Signalements citoyens', color: 'text-red-400',   requiresAdmin: true, helpHref: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml' },
  { label: 'Marketplace Admin',     icon: Globe,       to: '/admin/marketplace',      description: 'Gestion des annonces', color: 'text-pink-400',  requiresAdmin: true, helpHref: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml' },
  { label: 'Devis Institutionnels', icon: FileText,    to: '/admin/devis',            description: 'Licences & contrats B2B', color: 'text-indigo-400', requiresAdmin: true, helpHref: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml' },
  { label: 'Calculs Bâtiment',      icon: Wrench,      to: '/admin/calculs-batiment', description: 'Module BTP admin', color: 'text-slate-400', requiresAdmin: true, helpHref: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml' },
];

/* ─── Feature grid ───────────────────────────────────────────────────── */

const CREATOR_FEATURES = [
  { icon: Zap,        label: 'Articles suivis',          value: '∞ illimités',   color: 'text-yellow-400' },
  { icon: RefreshCw,  label: 'Actualisations/jour',      value: '∞ illimitées',  color: 'text-green-400' },
  { icon: Globe,      label: 'Territoires',              value: '∞ tous les DOM', color: 'text-blue-400' },
  { icon: TrendingUp, label: 'Historique des prix',      value: 'Complet',       color: 'text-cyan-400' },
  { icon: Bell,       label: 'Alertes prix',             value: '∞ illimitées',  color: 'text-purple-400' },
  { icon: Download,   label: 'Export CSV / JSON / PDF',  value: '✅ Actif',      color: 'text-emerald-400' },
  { icon: Users,      label: 'Listes partagées',         value: '✅ Actif',      color: 'text-pink-400' },
  { icon: BarChart3,  label: 'Dashboard budget',         value: '✅ Actif',      color: 'text-amber-400' },
  { icon: FileText,   label: 'Rapports automatiques',    value: '✅ Actif',      color: 'text-orange-400' },
  { icon: Code2,      label: 'Accès API complet',        value: '✅ Actif',      color: 'text-red-400' },
  { icon: Shield,     label: 'Interface Admin',          value: '✅ Actif',      color: 'text-slate-300' },
  { icon: Crown,      label: 'Plan',                     value: 'CREATOR',       color: 'text-yellow-300' },
];

/* ─── Setup guide steps ──────────────────────────────────────────────── */

interface Step {
  num: number;
  title: string;
  detail: string;
  code?: string;
  link?: { label: string; href: string };
}

const SETUP_STEPS: Step[] = [
  {
    num: 1,
    title: 'Créez votre compte Firebase',
    detail: 'Si ce n\'est pas déjà fait, inscrivez-vous avec votre email depuis la page d\'inscription.',
    link: { label: 'Aller à l\'inscription →', href: '/inscription' },
  },
  {
    num: 2,
    title: 'Installez firebase-admin (une seule fois)',
    detail: 'Dans un terminal, à la racine du projet, lancez l\'installation des dépendances (firebase-admin est déjà déclaré en devDependency) :',
    code: 'npm install',
  },
  {
    num: 3,
    title: 'Téléchargez la clé Admin Firebase',
    detail: 'Compte de service : firebase-adminsdk-fbsvc@a-ki-pri-sa-ye.iam.gserviceaccount.com → Cliquez "Générer une nouvelle clé privée" → renommez le fichier JSON en serviceAccountKey.json → placez-le à la RACINE du dépôt (même dossier que firebase.json et package.json) ⚠️ Ne commitez jamais ce fichier.',
    code: 'akiprisaye-web/\n├── firebase.json\n├── package.json\n├── serviceAccountKey.json   ← 👈 ICI\n├── frontend/\n└── scripts/',
    link: { label: 'Firebase Console → Comptes de service →', href: 'https://console.firebase.google.com/project/a-ki-pri-sa-ye/settings/serviceaccounts/adminsdk' },
  },
  {
    num: 4,
    title: 'Exécutez le script d\'activation',
    detail: 'Dans le terminal, depuis la racine du projet, lancez le script avec votre email :',
    code: 'node scripts/set-creator-role.mjs votre-email@domaine.com',
  },
  {
    num: 5,
    title: 'Connectez-vous à l\'application',
    detail: 'Fermez la session si elle est ouverte, puis reconnectez-vous. Votre rôle Créateur est activé immédiatement.',
    link: { label: 'Se connecter →', href: '/mon-compte' },
  },
  {
    num: 6,
    title: 'Accédez à votre espace',
    detail: 'Ce tableau de bord confirme votre statut. Toutes les fonctionnalités admin et les plans sont débloqués.',
  },
];

/* ─── Termux / GitHub Actions guide ─────────────────────────────────── */

interface MobileStep {
  num: number;
  title: string;
  detail: string;
  code?: string;
  link?: { label: string; href: string };
}

const TERMUX_STEPS: MobileStep[] = [
  {
    num: 1,
    title: 'Autoriser l\'accès au stockage (si pas encore fait)',
    detail: 'Cette commande donne à Termux l\'accès à vos fichiers. Si vous voyez une demande de permission, acceptez. Si vous avez déjà accès à ~/downloads, passez à l\'étape suivante.',
    code: 'termux-setup-storage',
  },
  {
    num: 2,
    title: 'Installer / vérifier Node.js',
    detail: 'Vérifiez d\'abord si Node.js est déjà installé. Si la commande retourne un numéro de version (ex: v22.x.x), passez à l\'étape 3. Sinon, lancez l\'installation. Si vous voyez "Abort.", relancez pkg install nodejs une seconde fois — c\'est un bug connu de Termux lors des upgrades.',
    code: 'node --version 2>/dev/null || pkg install nodejs',
  },
  {
    num: 3,
    title: 'Aller dans les téléchargements et télécharger le script',
    detail: 'Allez dans ~/downloads (où se trouve déjà serviceAccountKey.json) puis téléchargez UNIQUEMENT le script — pas besoin de cloner tout le dépôt (22 Mo) :',
    code: 'cd ~/downloads && curl -fsSL https://raw.githubusercontent.com/teetee971/akiprisaye-web/copilot/add-expert-conference-on-water/scripts/set-creator-role.mjs -o set-creator-role.mjs',
  },
  {
    num: 4,
    title: 'Installer firebase-admin et lancer le script',
    detail: 'Installez uniquement la dépendance nécessaire, puis exécutez le script. Le fichier serviceAccountKey.json est déjà dans le même dossier :',
    code: 'npm install firebase-admin && node set-creator-role.mjs teetee971@gmail.com',
  },
];

const ACTIONS_STEPS: MobileStep[] = [
  {
    num: 1,
    title: 'Copiez le contenu de serviceAccountKey.json',
    detail: 'Ouvrez le fichier JSON sur votre téléphone avec un éditeur de texte, puis sélectionnez et copiez tout le contenu (le JSON brut entre { et }).',
  },
  {
    num: 2,
    title: 'Ajoutez le secret GitHub',
    detail: 'Dans votre dépôt GitHub → Settings → Secrets and variables → Actions → "New repository secret". Nom : FIREBASE_SERVICE_ACCOUNT. Valeur : collez le contenu JSON copié.',
    link: { label: 'GitHub → Secrets → Nouveau secret →', href: 'https://github.com/teetee971/akiprisaye-web/settings/secrets/actions/new' },
  },
  {
    num: 3,
    title: 'Déclenchez le workflow depuis l\'onglet Actions',
    detail: 'Dans votre dépôt → onglet "Actions" → workflow "✨ Attribuer un rôle utilisateur" → "Run workflow" → entrez votre email et choisissez le rôle → "Run workflow".',
    link: { label: 'GitHub → Actions → ✨ Attribuer un rôle utilisateur →', href: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml' },
  },
  {
    num: 4,
    title: 'Reconnectez-vous à l\'application',
    detail: 'Une fois le workflow terminé (icône ✅ verte), fermez votre session et reconnectez-vous. Votre rôle Créateur est immédiatement actif.',
    link: { label: 'Se connecter →', href: '/mon-compte' },
  },
];



const ENV_OVERRIDE_TIP = `# frontend/.env.local
# Simule n'importe quel plan sans Firestore (pour les tests)
VITE_PLAN_OVERRIDE=CREATOR

# Autres valeurs valides :
# VITE_PLAN_OVERRIDE=CITIZEN_PREMIUM
# VITE_PLAN_OVERRIDE=PRO
# VITE_PLAN_OVERRIDE=INSTITUTION`;

type InsightTone = 'emerald' | 'cyan' | 'amber' | 'violet';

interface DashboardInsight {
  title: string;
  value: string;
  detail: string;
  tone: InsightTone;
}

const INSIGHT_TONE_STYLES: Record<InsightTone, string> = {
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  violet: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
};

const BRIEFING_INTEREST_KEY_ALIASES: Record<string, string> = {
  scan: 'scanner',
};

function normalizeBriefingInterestKey(key: string | undefined): string {
  if (!key) return '';
  const normalized = key.trim().toLowerCase();
  return BRIEFING_INTEREST_KEY_ALIASES[normalized] ?? normalized;
}

function formatDateTime(date: Date | null): string {
  if (!date) return 'En attente de données';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatFreshness(date: Date | null): string {
  if (!date) return 'Aucune remontée récente';
  const deltaMs = Date.now() - date.getTime();
  if (deltaMs < 60_000) return 'À l’instant';
  const deltaMinutes = Math.round(deltaMs / 60_000);
  if (deltaMinutes < 60) return `Il y a ${deltaMinutes} min`;
  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) return `Il y a ${deltaHours} h`;
  const deltaDays = Math.round(deltaHours / 24);
  return `Il y a ${deltaDays} j`;
}

function classifyAudienceFocus(topInterest: InterestStats | undefined): DashboardInsight {
  if (!topInterest) {
    return {
      title: 'Lecture IA',
      value: 'Signal faible',
      detail: 'Aucune tendance nette pour le moment. Les insights s’enrichissent dès les premières visites.',
      tone: 'violet',
    };
  }

  if (['comparateur', 'scanner', 'scan', 'alertes', 'liste'].includes(topInterest.key)) {
    return {
      title: 'Profil dominant',
      value: 'Acheteurs tactiques',
      detail: `Le trafic se concentre sur ${topInterest.name.toLowerCase()} : vos utilisateurs cherchent un gain prix immédiat.`,
      tone: 'emerald',
    };
  }

  if (['observatoire', 'actualites', 'methodologie', 'vie-chere'].includes(topInterest.key)) {
    return {
      title: 'Profil dominant',
      value: 'Veille citoyenne',
      detail: `Le sujet ${topInterest.name.toLowerCase()} domine : ils veulent comprendre les écarts, pas seulement acheter.`,
      tone: 'cyan',
    };
  }

  if (['assistant', 'devis', 'espace-pro', 'marketplace'].includes(topInterest.key)) {
    return {
      title: 'Profil dominant',
      value: 'Usage IA / pro',
      detail: `Les visiteurs se dirigent vers ${topInterest.name.toLowerCase()} : forte attente d’accompagnement expert et de productivité.`,
      tone: 'amber',
    };
  }

  return {
    title: 'Profil dominant',
    value: 'Communauté active',
    detail: `Le pôle ${topInterest.name.toLowerCase()} prend l’avantage : privilégier les usages d’échange, d’entraide et d’engagement.`,
    tone: 'violet',
  };
}

export function buildCreatorBriefing({
  topTerritory,
  topInterest,
  topTerritoryHistoricalInterest,
}: {
  topTerritory: TerritoryStats | undefined;
  topInterest: InterestStats | undefined;
  topTerritoryHistoricalInterest: TerritoryInterestStat | undefined;
}): string {
  if (!topTerritory && !topInterest) {
    return 'Le tableau de bord IA attend les premières remontées de présence et de navigation pour construire un briefing comportemental fiable.';
  }

  const leadTerritory = topTerritory
    ? `${topTerritory.flag} ${topTerritory.name}`
    : 'un territoire encore non identifié';
  const leadInterest = topInterest
    ? `${topInterest.emoji} ${topInterest.name.toLowerCase()}`
    : 'un usage encore diffus';
  const leadHistoricalAngle = topTerritoryHistoricalInterest
    ? `${topTerritoryHistoricalInterest.emoji} ${topTerritoryHistoricalInterest.name.toLowerCase()}`
    : 'aucun historique dominant';
  const sameFocusAsHistorical = Boolean(
    topInterest
    && topTerritoryHistoricalInterest
    && normalizeBriefingInterestKey(topInterest.key) === normalizeBriefingInterestKey(topTerritoryHistoricalInterest.interest),
  );

  if (sameFocusAsHistorical) {
    return `IA briefing : ${leadTerritory} mène actuellement l’activité. Le foyer d’attention principal est ${leadInterest}, et ce besoin confirme aussi le meilleur signal historique sur ce territoire. Priorité recommandée : renforcer la proposition de valeur et les CTA autour de ce besoin dominant, puis réactiver les territoires à fort historique mais à faible présence live.`;
  }

  return `IA briefing : ${leadTerritory} mène actuellement l’activité. Le foyer d’attention principal est ${leadInterest}, tandis que le meilleur signal historique sur ce territoire reste ${leadHistoricalAngle}. Priorité recommandée : renforcer la proposition de valeur et les CTA autour de ce besoin dominant, puis réactiver les territoires à fort historique mais à faible présence live.`;
}

/* ─── Copy to clipboard helper ──────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
    >
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copié !' : 'Copier'}
    </button>
  );
}

/* ─── Main component ──────────────────────────────────────────────────── */

const EspaceCreateur: React.FC = () => {
  const { user, userRole, isCreator, loading, signOutUser, refreshClaims } = useAuth();
  const {
    totalUsers,
    onlineUsers,
    lastAuthenticatedSeenAt,
    loading: userStatsLoading,
  } = useUserStats();
  const {
    totalOnline,
    byTerritory,
    byInterest,
    interestByTerritory,
    loading: visitorStatsLoading,
    myTerritory,
    myInterest,
    lastPresenceAt,
    lastVisitAt,
    lastInterestViewAt,
  } = useVisitorStats();
  const [guideOpen, setGuideOpen] = useState(!isCreator);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAdminLink, setSelectedAdminLink] = useState<AdminLink | null>(ADMIN_LINKS[0]);

  // Wait for auth to resolve before checking role — avoids redirect during bootstrap
  if (loading) {
    return (
      <div data-testid="auth-loading-spinner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#020617' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(251,191,36,0.2)', borderTopColor: '#fbbf24', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // isCreator is true for both "creator" and "admin" roles (matches RequireCreator guard)
  if (!isCreator) {
    return <Navigate to="/" replace />;
  }

  const handleRefreshClaims = async () => {
    setRefreshing(true);
    try { await refreshClaims(); } finally { setRefreshing(false); }
  };

  const creatorPlan = PLAN_DEFINITIONS['CREATOR'];
  const audienceLoading = userStatsLoading || visitorStatsLoading;

  const topTerritory = byTerritory[0];
  const topInterest = byInterest[0];
  const activeTerritoriesCount = byTerritory.length;
  const activeInterestCount = byInterest.length;
  const accountPresenceRate = totalUsers > 0 ? Math.round((onlineUsers / totalUsers) * 100) : 0;
  const mostDormantTerritory = [...byTerritory]
    .sort((a, b) => (b.totalVisits - b.online * 8) - (a.totalVisits - a.online * 8))[0];
  const detectedTerritory = byTerritory.find((territory) => territory.code.toLowerCase() === myTerritory.toLowerCase());
  const topTerritoryHistoricalInterest = topTerritory ? interestByTerritory[topTerritory.code]?.[0] : undefined;

  const dashboardInsights = useMemo<DashboardInsight[]>(() => {
    const focusInsight = classifyAudienceFocus(topInterest);
    return [
      {
        title: 'Territoire moteur',
        value: topTerritory ? `${topTerritory.flag} ${topTerritory.name}` : 'En attente',
        detail: topTerritory
          ? `${topTerritory.online} visiteur(s) en ligne · ${topTerritory.totalVisits.toLocaleString('fr-FR')} visites cumulées.`
          : 'Les remontées temps réel apparaîtront dès qu’un territoire deviendra actif.',
        tone: 'emerald',
      },
      {
        title: 'Sujet chaud',
        value: topInterest ? `${topInterest.emoji} ${topInterest.name}` : 'En attente',
        detail: topInterest
          ? `${topInterest.online} actif(s) maintenant · ${topInterest.totalViews.toLocaleString('fr-FR')} vues totales.`
          : 'Aucun centre d’intérêt ne ressort encore clairement.',
        tone: 'cyan',
      },
      focusInsight,
      {
        title: 'Territoire à relancer',
        value: mostDormantTerritory ? `${mostDormantTerritory.flag} ${mostDormantTerritory.name}` : 'À qualifier',
        detail: mostDormantTerritory
          ? `${mostDormantTerritory.totalVisits.toLocaleString('fr-FR')} visites historiques pour seulement ${mostDormantTerritory.online} personne(s) en direct.`
          : 'Il faut davantage d’historique pour isoler un territoire à réactiver.',
        tone: 'amber',
      },
    ];
  }, [mostDormantTerritory, topInterest, topTerritory]);

  const creatorBriefing = useMemo(() => {
    return buildCreatorBriefing({
      topTerritory,
      topInterest,
      topTerritoryHistoricalInterest,
    });
  }, [topInterest, topTerritory, topTerritoryHistoricalInterest]);

  const topInterestMax = Math.max(...byInterest.map((interest) => interest.totalViews), 1);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>Espace Créateur — A KI PRI SA YÉ</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 pt-4 pb-12">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="mb-8 bg-gradient-to-br from-amber-900/40 to-yellow-900/20 border border-amber-600/40 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-4 bg-amber-400/20 border border-amber-500/40 rounded-2xl flex-shrink-0">
              <Crown className="w-10 h-10 text-amber-300" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Plan CREATOR — Accès illimité
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                ✨ Espace Créateur
              </h1>
              <p className="text-amber-200/70 text-sm mt-1">
                Développeur & fondateur — Toutes les fonctionnalités débloquées, quotas infinis, accès admin complet.
              </p>
            </div>

            {/* Status badge */}
            <div className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${
              isCreator
                ? 'bg-green-500/15 border-green-500/40 text-green-300'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            }`}>
              {isCreator
                ? <><CheckCircle className="w-4 h-4" /> Créateur connecté</>
                : <><AlertCircle className="w-4 h-4" /> Admin (pas encore creator)</>
              }
            </div>
          </div>

          {/* User info */}
          {user && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-amber-200/60 border-t border-amber-700/30 pt-4">
              <span>📧 <strong className="text-white">{user.email}</strong></span>
              <span>🔑 UID : <code className="text-xs bg-slate-800/60 px-1.5 py-0.5 rounded text-amber-300">{user.uid}</code></span>
              <span>🏷️ Rôle : <strong className="text-amber-300">{userRole}</strong></span>
              <button
                type="button"
                onClick={handleRefreshClaims}
                disabled={refreshing}
                title="Forcer le rechargement du rôle depuis Firebase"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualisation…' : 'Actualiser le rôle'}
              </button>
              <button
                onClick={signOutUser}
                className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Déconnexion
              </button>
            </div>
          )}
        </div>

        {/* ── IA audience dashboard ─────────────────────────────────── */}
        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-fuchsia-400" />
                Tableau de bord IA — audience & comportement
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Dates des dernières mises à jour, comptes connectés, audience live, territoires, centres d’intérêt et lecture IA du trafic.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-200">
              <Activity className="h-3.5 w-3.5" />
              {audienceLoading ? 'Synchronisation des signaux…' : `${totalOnline} visiteur(s) live · ${onlineUsers} compte(s) authentifié(s)`}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                icon: Users,
                label: 'Comptes enregistrés',
                value: totalUsers.toLocaleString('fr-FR'),
                detail: 'Base utilisateurs Firebase',
                tone: 'text-cyan-300',
              },
              {
                icon: Activity,
                label: 'Comptes connectés',
                value: onlineUsers.toLocaleString('fr-FR'),
                detail: `${accountPresenceRate}% de la base actuellement active`,
                tone: 'text-emerald-300',
              },
              {
                icon: Eye,
                label: 'Visiteurs live site',
                value: totalOnline.toLocaleString('fr-FR'),
                detail: 'Présence web observée sur 5 min',
                tone: 'text-fuchsia-300',
              },
              {
                icon: Globe,
                label: 'Territoires actifs',
                value: activeTerritoriesCount.toLocaleString('fr-FR'),
                detail: `${activeInterestCount} centres d’intérêt actuellement détectés`,
                tone: 'text-amber-300',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4">
                  <Icon className={`mb-3 h-5 w-5 ${item.tone}`} />
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                  <p className={`mt-1 text-2xl font-black ${item.tone}`}>{item.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: Clock3,
                label: 'Dernier heartbeat visiteur',
                timestamp: lastPresenceAt,
                helper: 'Collection presence',
                iconClassName: 'text-cyan-300',
              },
              {
                icon: RefreshCw,
                label: 'Dernière visite comptée',
                timestamp: lastVisitAt,
                helper: 'Compteur visit_stats',
                iconClassName: 'text-emerald-300',
              },
              {
                icon: TrendingUp,
                label: 'Dernière vue de section',
                timestamp: lastInterestViewAt,
                helper: 'Compteur page_stats',
                iconClassName: 'text-amber-300',
              },
              {
                icon: Shield,
                label: 'Dernière présence authentifiée',
                timestamp: lastAuthenticatedSeenAt,
                helper: 'Collection user_presence',
                iconClassName: 'text-violet-300',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.helper}</p>
                    </div>
                    <Icon className={`h-5 w-5 ${item.iconClassName}`} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-200">{formatDateTime(item.timestamp)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatFreshness(item.timestamp)}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-950/20 via-slate-900/80 to-slate-950 p-5">
            <div className="flex items-start gap-3">
              <BrainCircuit className="mt-0.5 h-5 w-5 text-fuchsia-300" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300">Briefing IA créateur</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">{creatorBriefing}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2.5 py-1">
                    Mon territoire détecté : <strong className="text-white">{detectedTerritory ? `${detectedTerritory.flag} ${detectedTerritory.name}` : myTerritory.toUpperCase()}</strong>
                  </span>
                  <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2.5 py-1">
                    Intérêt local détecté : <strong className="text-white">{myInterest ? `${myInterest.emoji} ${myInterest.name}` : 'Accueil / non classé'}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-4">
            {dashboardInsights.map((insight) => (
              <div
                key={insight.title}
                className={`rounded-2xl border p-4 ${INSIGHT_TONE_STYLES[insight.tone]}`}
              >
                <p className="text-xs uppercase tracking-[0.18em] opacity-75">{insight.title}</p>
                <p className="mt-2 text-lg font-bold">{insight.value}</p>
                <p className="mt-2 text-sm opacity-85">{insight.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-blue-300" />
                Territoires et départements les plus actifs
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Vue combinée temps réel + historique. Idéal pour voir où se concentre l’attention et quel territoire décroche.
              </p>
              <div className="mt-4 space-y-3">
                {byTerritory.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-950/40 p-4 text-sm text-slate-500">
                    Aucun territoire actif pour le moment.
                  </div>
                ) : byTerritory.slice(0, 6).map((territory) => {
                  const historicLeader = interestByTerritory[territory.code]?.[0];
                  return (
                    <div key={territory.code} className="rounded-xl border border-slate-700/40 bg-slate-950/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {territory.flag} {territory.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {territory.code} · {territory.online} en direct · {territory.totalVisits.toLocaleString('fr-FR')} visites
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
                            Live {territory.online}
                          </span>
                          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-blue-200">
                            Historique {territory.totalVisits.toLocaleString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Top intérêts live</p>
                          <p className="mt-2 text-sm text-slate-200">
                            {territory.topInterests.length > 0
                              ? territory.topInterests.slice(0, 3).map((interest) => `${interest.emoji} ${interest.name} (${interest.online})`).join(' · ')
                              : 'Aucun focus live dominant'}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Lecture IA locale</p>
                          <p className="mt-2 text-sm text-slate-200">
                            {historicLeader
                              ? `${historicLeader.emoji} ${historicLeader.name} reste le meilleur aimant historique sur ce territoire.`
                              : 'Pas encore assez d’historique pour une recommandation locale.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className="h-4 w-4 text-fuchsia-300" />
                Radar centres d’intérêt
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Où vont les utilisateurs maintenant, et quels thèmes gardent un poids historique.
              </p>
              <div className="mt-4 space-y-3">
                {byInterest.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-950/40 p-4 text-sm text-slate-500">
                    Aucun centre d’intérêt détecté pour le moment.
                  </div>
                ) : byInterest.slice(0, 8).map((interest) => {
                  const width = Math.max(10, Math.round((interest.totalViews / topInterestMax) * 100));
                  return (
                    <div key={interest.key} className="rounded-xl border border-slate-700/40 bg-slate-950/40 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{interest.emoji} {interest.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{interest.description || 'Axe comportemental détecté par navigation.'}</p>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          <p className="font-semibold text-emerald-300">{interest.online} live</p>
                          <p>{interest.totalViews.toLocaleString('fr-FR')} vues</p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-emerald-400"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col">
        {/* ── Revenue CPC dashboard ─────────────────────────────────── */}
        <section className="mb-8 order-2 md:order-1">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-white sm:mb-4 sm:text-lg">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Revenus CPC — suivi créateur
          </h2>
          {(() => {
            const conversionStats = getConversionStats(30);
            const dailyStats = getDailyStats(7);
            const weeklyRevenue = dailyStats.reduce((sum, day) => sum + day.estimatedRevenue, 0);
            const weeklyClicks = dailyStats.reduce((sum, day) => sum + day.clicks, 0);
            const revenueTrend = dailyStats.length >= 2
              ? dailyStats[dailyStats.length - 1].estimatedRevenue - dailyStats[0].estimatedRevenue
              : 0;

            return (
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-3 sm:p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Revenu 30 jours</p>
                    <p className="mt-1 text-xl font-black text-emerald-300 sm:text-2xl">
                      {conversionStats.estimatedRevenue.toFixed(2)} €
                    </p>
                    <p className="mt-1 text-xs text-slate-400">estimation locale (clic × prix moyen × taux)</p>
                  </div>
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-3 sm:p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">CTR global</p>
                    <p className="mt-1 text-xl font-black text-cyan-300 sm:text-2xl">
                      {(conversionStats.clickThroughRate * 100).toFixed(2)}%
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {conversionStats.totalClicks.toLocaleString('fr-FR')} clic(s) / {conversionStats.totalViews.toLocaleString('fr-FR')} vue(s)
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-3 sm:p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Revenu 7 jours</p>
                    <p className="mt-1 text-xl font-black text-amber-300 sm:text-2xl">
                      {weeklyRevenue.toFixed(2)} €
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{weeklyClicks.toLocaleString('fr-FR')} clic(s) sur la semaine</p>
                  </div>
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-3 sm:p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tendance 7 jours</p>
                    <p className={`mt-1 text-xl font-black sm:text-2xl ${revenueTrend >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {revenueTrend >= 0 ? '+' : ''}
                      {revenueTrend.toFixed(2)} €
                    </p>
                    <p className="mt-1 text-xs text-slate-400">dernier jour vs premier jour (fenêtre 7j)</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 sm:p-5">
                    <h3 className="text-base font-bold text-white">Top produits convertisseurs</h3>
                    <p className="mt-1 text-xs text-slate-400">Produits avec le plus de clics et revenu estimé (30 jours)</p>
                    <div className="mt-4 space-y-3">
                      {conversionStats.topProducts.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-950/40 p-4 text-sm text-slate-500">
                          Pas encore de données de clic CPC sur la période.
                        </div>
                      ) : conversionStats.topProducts.slice(0, 5).map((product) => (
                        <div key={`${product.barcode}-${product.name}`} className="rounded-xl border border-slate-700/40 bg-slate-950/40 p-2.5 sm:p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{product.name}</p>
                              <p className="mt-1 text-xs text-slate-400">
                                {product.clicks} clic(s) · CTR {(product.ctr * 100).toFixed(2)}%
                              </p>
                            </div>
                            <p className="text-sm font-bold text-emerald-300">{product.estimatedRevenue.toFixed(2)} €</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 sm:p-5">
                    <h3 className="text-base font-bold text-white">Top enseignes CPC</h3>
                    <p className="mt-1 text-xs text-slate-400">Enseignes les plus cliquées avec panier moyen observé (30 jours)</p>
                    <div className="mt-4 space-y-3">
                      {conversionStats.topRetailers.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-950/40 p-4 text-sm text-slate-500">
                          Aucun clic enseigne enregistré sur la période.
                        </div>
                      ) : conversionStats.topRetailers.slice(0, 5).map((retailer) => (
                        <div key={retailer.retailer} className="rounded-xl border border-slate-700/40 bg-slate-950/40 p-2.5 sm:p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{retailer.retailer}</p>
                              <p className="mt-1 text-xs text-slate-400">
                                {retailer.clicks} clic(s) · panier moyen {retailer.avgPrice.toFixed(2)} €
                              </p>
                            </div>
                            <p className="text-sm font-bold text-emerald-300">{retailer.estimatedRevenue.toFixed(2)} €</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* ── Feature grid ─────────────────────────────────────────── */}
        <section className="mb-8 order-3">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Accès & fonctionnalités — Plan CREATOR
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CREATOR_FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <Icon className={`w-4 h-4 mb-2 ${f.color}`} />
                  <p className="text-xs text-slate-400 leading-tight">{f.label}</p>
                  <p className={`text-sm font-bold mt-0.5 ${f.color}`}>{f.value}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Admin shortcuts ───────────────────────────────────────── */}
        <section className="mb-8 order-1 md:order-2">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-white sm:mb-4 sm:text-lg">
            <Shield className="w-5 h-5 text-blue-400" />
            Outils d'administration
          </h2>
          <div className="mb-3 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-3.5 sm:mb-4 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  {(userRole === 'admin' || userRole === 'creator')
                    ? 'Votre rôle créateur/admin ouvre tous les modules ci-dessous.'
                    : 'Ces modules système nécessitent un compte créateur ou admin.'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {(userRole === 'admin' || userRole === 'creator')
                    ? 'Chaque pavé ouvre directement le bon écran d’administration.'
                    : 'Une fois le rôle créateur/admin actif, utilisez “Actualiser le rôle” puis ouvrez les modules ci-dessous.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  (userRole === 'admin' || userRole === 'creator')
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                }`}>
                  {(userRole === 'admin' || userRole === 'creator') ? 'Accès actif' : 'Créateur/Admin requis'}
                </span>
                <button
                  type="button"
                  onClick={handleRefreshClaims}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Actualisation…' : 'Actualiser le rôle'}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {ADMIN_LINKS.map(l => {
              const Icon = l.icon;
              // NOTE: `requiresAdmin` in ADMIN_LINKS really means "internal-only"
              // (accessible to both `admin` and `creator` roles), not strictly admin-only.
              const requiresInternalAccess = l.requiresAdmin;
              const isLocked = requiresInternalAccess && userRole !== 'admin' && userRole !== 'creator';
              const cardClassName = `flex w-full items-center gap-2.5 rounded-xl border p-3 text-left transition-all group sm:gap-3 sm:p-4 ${
                isLocked
                  ? 'bg-slate-800/40 border-slate-700/40 hover:border-amber-500/40 hover:bg-amber-950/20'
                  : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-500/60'
              }`;

              const content = (
                <>
                  <div className="p-2 bg-slate-700/50 rounded-lg flex-shrink-0">
                    <Icon className={`w-4 h-4 ${l.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">{l.label}</p>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        isLocked
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      }`}>
                        {isLocked ? 'Admin requis' : 'Ouvrir'}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">{l.description}</p>
                  </div>
                  <ExternalLink className={`h-4 w-4 flex-shrink-0 transition-colors ${
                    isLocked ? 'text-amber-300/80' : 'text-slate-500 group-hover:text-white'
                  }`} />
                </>
              );

              if (isLocked) {
                return (
                  <button
                    key={l.to}
                    type="button"
                    onClick={() => setSelectedAdminLink(l)}
                    className={cardClassName}
                    aria-pressed={selectedAdminLink?.to === l.to}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cardClassName}
                >
                  {content}
                </Link>
              );
            })}
          </div>
          {userRole !== 'admin' && userRole !== 'creator' && selectedAdminLink && (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-900/80 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                    Accès protégé
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-white">
                    {selectedAdminLink.label}
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">
                    {selectedAdminLink.description}. Ce module pointe bien vers <code className="rounded bg-slate-950/70 px-1.5 py-0.5 text-xs text-amber-200">{selectedAdminLink.to}</code>, mais la route est volontairement réservée au rôle <strong>admin</strong>.
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-slate-400">
                    <li>• Rôle actuel : <span className="font-semibold text-amber-200">{userRole}</span></li>
                    <li>• Action recommandée : promouvoir le compte en <span className="font-semibold text-emerald-300">admin</span> via GitHub Actions ou script local.</li>
                    <li>• Ensuite : revenir ici puis cliquer sur <span className="font-semibold text-cyan-300">Actualiser le rôle</span>.</li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={selectedAdminLink.helpHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20"
                  >
                    GitHub Actions
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Link
                    to="/activation-createur"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-600/60 bg-slate-800/70 px-3 py-2 text-sm font-semibold text-white transition hover:border-slate-500"
                  >
                    Guide d’activation
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>
        </div>

        {/* ── Quick navigation ─────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-400" />
            Navigation rapide — Pages clés
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {[
              { label: '💧 Enquête Eau',           to: '/enquete-eau' },
              { label: '🎓 Conférence Eau',        to: '/conference-eau' },
              { label: '💰 Tarifs & Abonnements',  to: '/pricing' },
              { label: '🏪 Petits commerces',      to: '/petits-commerces' },
              { label: '🌾 Producteurs locaux',    to: '/producteurs-locaux' },
              { label: '📍 Marchés locaux',        to: '/marches-locaux' },
              { label: '🗺️ Feuille de route',      to: '/roadmap' },
              { label: '📊 Observatoire',          to: '/observatoire' },
              { label: '🔬 Comparateur citoyen',   to: '/comparateur' },
              { label: '📱 Éval. Magasins',        to: '/evaluation-magasins' },
              { label: '📣 Commerce social',       to: '/commerce-social' },
              { label: '⚙️ Portail Développeurs',  to: '/portail-developpeurs' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="text-xs bg-slate-800/40 border border-slate-700/40 hover:border-green-500/40 hover:bg-green-900/20 rounded-lg px-3 py-2.5 text-slate-300 hover:text-green-300 transition-all"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Setup guide (collapsible) ─────────────────────────────── */}
        <section className="mb-6">
          <button
            onClick={() => setGuideOpen(o => !o)}
            className="w-full flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-2xl px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-white">
                {isCreator ? '✅ Guide d\'activation (déjà effectué)' : '🔧 Guide d\'activation du rôle Créateur'}
              </span>
              {!isCreator && (
                <span className="text-xs bg-red-500/20 border border-red-500/40 text-red-300 px-2 py-0.5 rounded-full font-semibold">
                  Action requise
                </span>
              )}
            </div>
            {guideOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {guideOpen && (
            <div className="mt-2 bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5 space-y-5">
              {SETUP_STEPS.map(step => (
                <div key={step.num} className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
                    {step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm mb-1">{step.title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">{step.detail}</p>
                    {step.code && (
                      <div className="flex items-center justify-between bg-slate-950/80 border border-slate-700/50 rounded-lg px-3 py-2">
                        <code className="text-xs text-green-300 font-mono break-all">{step.code}</code>
                        <CopyButton text={step.code} />
                      </div>
                    )}
                    {step.link && (
                      step.link.href.startsWith('http')
                        ? <a href={step.link.href} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                            {step.link.label} <ExternalLink className="inline w-3 h-3" />
                          </a>
                        : <Link to={step.link.href} className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                            {step.link.label}
                          </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Mobile guide: Termux + GitHub Actions (collapsible) ──── */}
        <section className="mb-6">
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="w-full flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-2xl px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-green-400" />
              <span className="font-bold text-white">📱 Depuis Android — Termux ou GitHub Actions</span>
              <span className="text-xs bg-green-500/20 border border-green-500/40 text-green-300 px-2 py-0.5 rounded-full font-semibold hidden sm:inline">
                Sans PC
              </span>
            </div>
            {mobileOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {mobileOpen && (
            <div className="mt-2 bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5 space-y-6">

              {/* Termux */}
              <div>
                <h3 className="text-sm font-bold text-green-300 mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Option A — Termux (terminal Android)
                </h3>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  Vous avez Termux ? C'est la méthode la plus directe. Le fichier{' '}
                  <code className="bg-slate-700/60 px-1 py-0.5 rounded text-green-300">serviceAccountKey.json</code>{' '}
                  téléchargé depuis Firebase Console est déjà dans <code className="bg-slate-700/60 px-1 py-0.5 rounded text-green-300">~/downloads</code>.
                </p>

                {/* Fast-path box for users already in ~/downloads */}
                <div className="mb-4 bg-green-950/40 border border-green-600/40 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-300 mb-2">
                    ⚡ Déjà dans ~/downloads ? Seulement 3 commandes :
                  </p>
                  {[
                    { cmd: 'node --version 2>/dev/null || pkg install nodejs', note: '— vérifie ou installe Node' },
                    { cmd: 'curl -fsSL https://raw.githubusercontent.com/teetee971/akiprisaye-web/copilot/add-expert-conference-on-water/scripts/set-creator-role.mjs -o set-creator-role.mjs', note: '— télécharge le script' },
                    { cmd: 'npm install firebase-admin && node set-creator-role.mjs teetee971@gmail.com', note: '— installe et active' },
                  ].map(({ cmd, note }) => (
                    <div key={cmd} className="flex items-center justify-between bg-slate-950/60 border border-slate-700/40 rounded-lg px-2.5 py-1.5 mb-1.5 last:mb-0">
                      <div className="min-w-0 flex-1">
                        <code className="text-xs text-green-300 font-mono break-all">{cmd}</code>
                        <span className="text-xs text-slate-500 ml-1">{note}</span>
                      </div>
                      <CopyButton text={cmd} />
                    </div>
                  ))}
                  <p className="text-xs text-amber-400/80 mt-2">
                    ⚠️ Si vous voyez <code className="bg-slate-700/60 px-1 rounded">Abort.</code> lors de l'installation de nodejs, relancez simplement <code className="bg-slate-700/60 px-1 rounded">pkg install nodejs</code> une seconde fois.
                  </p>
                </div>
                <div className="space-y-4">
                  {TERMUX_STEPS.map(step => (
                    <div key={step.num} className="flex gap-4">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 font-bold text-sm">
                        {step.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm mb-1">{step.title}</p>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">{step.detail}</p>
                        {step.code && (
                          <div className="flex items-center justify-between bg-slate-950/80 border border-slate-700/50 rounded-lg px-3 py-2">
                            <code className="text-xs text-green-300 font-mono break-all">{step.code}</code>
                            <CopyButton text={step.code} />
                          </div>
                        )}
                        {step.link && (
                          step.link.href.startsWith('http')
                            ? <a href={step.link.href} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                                {step.link.label} <ExternalLink className="inline w-3 h-3" />
                              </a>
                            : <Link to={step.link.href} className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                                {step.link.label}
                              </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-slate-700/40" />

              {/* GitHub Actions */}
              <div>
                <h3 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Option B — GitHub Actions (sans aucun terminal)
                </h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Pas de Termux ? Stockez le contenu de la clé comme{' '}
                  <strong className="text-white">secret GitHub</strong>, puis déclenchez le
                  workflow depuis l'onglet Actions — 100 % depuis votre navigateur mobile.
                </p>
                <div className="space-y-4">
                  {ACTIONS_STEPS.map(step => (
                    <div key={step.num} className="flex gap-4">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-sm">
                        {step.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm mb-1">{step.title}</p>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">{step.detail}</p>
                        {step.code && (
                          <div className="flex items-center justify-between bg-slate-950/80 border border-slate-700/50 rounded-lg px-3 py-2">
                            <code className="text-xs text-green-300 font-mono break-all">{step.code}</code>
                            <CopyButton text={step.code} />
                          </div>
                        )}
                        {step.link && (
                          step.link.href.startsWith('http')
                            ? <a href={step.link.href} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                                {step.link.label} <ExternalLink className="inline w-3 h-3" />
                              </a>
                            : <Link to={step.link.href} className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                                {step.link.label}
                              </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </section>

        {/* ── Dev override tip (collapsible) ───────────────────────── */}
        <section className="mb-6">
          <button
            onClick={() => setEnvOpen(o => !o)}
            className="w-full flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-2xl px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-violet-400" />
              <span className="font-bold text-white">🛠️ Développement — Simuler n'importe quel plan</span>
            </div>
            {envOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {envOpen && (
            <div className="mt-2 bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5">
              <p className="text-sm text-slate-400 mb-3">
                En développement local, vous pouvez simuler n'importe quel plan sans Firestore via une variable d'environnement dans <code className="text-xs bg-slate-700/60 px-1 py-0.5 rounded text-violet-300">frontend/.env.local</code> :
              </p>
              <div className="flex items-start justify-between bg-slate-950/80 border border-slate-700/50 rounded-xl p-4">
                <pre className="text-xs text-green-300 font-mono leading-relaxed whitespace-pre overflow-x-auto flex-1">
                  {ENV_OVERRIDE_TIP}
                </pre>
                <CopyButton text={ENV_OVERRIDE_TIP} />
              </div>
              <p className="text-xs text-slate-500 mt-3">
                ⚠️ Ne commitez jamais le fichier <code>.env.local</code> — il est déjà dans <code>.gitignore</code>.
              </p>
            </div>
          )}
        </section>

        {/* ── Plan details ─────────────────────────────────────────── */}
        <section className="mb-6 bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            Quotas techniques — Plan CREATOR
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {Object.entries(creatorPlan.quotas).map(([key, value]) => (
              <div key={key} className="bg-slate-900/60 rounded-xl p-3">
                <p className="text-lg font-black text-amber-400">{value >= 999999999 ? '∞' : value.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom links ─────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          <Link to="/mon-compte" className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 rounded-xl text-sm font-medium transition-all">
            <Settings className="w-4 h-4" /> Mon compte
          </Link>
          <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 bg-blue-700/30 border border-blue-700/40 hover:bg-blue-700/50 text-blue-300 rounded-xl text-sm font-medium transition-all">
            <Shield className="w-4 h-4" /> Accès Admin
          </Link>
          <Link to="/roadmap" className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 hover:border-green-500/40 text-slate-300 hover:text-green-300 rounded-xl text-sm font-medium transition-all">
            <Star className="w-4 h-4" /> Feuille de route
          </Link>
          <Link to="/portail-developpeurs" className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 rounded-xl text-sm font-medium transition-all">
            <Code2 className="w-4 h-4" /> API & Dev
          </Link>
        </div>

      </div>
    </div>
  );
};

export default EspaceCreateur;
