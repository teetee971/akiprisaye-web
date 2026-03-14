/**
 * EspaceCreateur.tsx
 *
 * Tableau de bord exclusif du créateur / développeur du logiciel.
 * Accès réservé au rôle "creator" — plan CREATOR (illimité sur tout).
 *
 * Route : /espace-createur
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import {
  Crown, Shield, Zap, Code2, Database, Users, BarChart3,
  Settings, Lock, CheckCircle, AlertCircle, Copy, ExternalLink,
  Terminal, BookOpen, Sparkles, Globe, Key, ChevronDown, ChevronUp,
  TrendingUp, Bell, Download, FileText, Wrench, RefreshCw,
  LogOut, Star, Building2, Smartphone,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PLAN_DEFINITIONS } from '../billing/plans';

/* ─── Admin shortcut ─────────────────────────────────────────────────── */

interface AdminLink {
  label: string;
  icon: React.ElementType;
  to: string;
  description: string;
  color: string;
}

const ADMIN_LINKS: AdminLink[] = [
  { label: 'Dashboard Admin',       icon: BarChart3,   to: '/admin',                description: 'Vue d\'ensemble et métriques', color: 'text-blue-400' },
  { label: 'Gestion utilisateurs',  icon: Users,       to: '/admin/users',          description: 'Rôles, plans, accès', color: 'text-purple-400' },
  { label: 'Sync / Import',         icon: RefreshCw,   to: '/admin/sync',           description: 'Synchronisation des données', color: 'text-green-400' },
  { label: 'Gestion Magasins',      icon: Building2,   to: '/admin/stores',         description: 'Référentiel enseigne', color: 'text-amber-400' },
  { label: 'Gestion Produits',      icon: Database,    to: '/admin/products',       description: 'Catalogue EAN', color: 'text-cyan-400' },
  { label: 'Import Prix',           icon: Download,    to: '/admin/import',         description: 'Import CSV / JSON', color: 'text-orange-400' },
  { label: 'Modération',            icon: Shield,      to: '/admin/moderation',     description: 'Signalements citoyens', color: 'text-red-400' },
  { label: 'Marketplace Admin',     icon: Globe,       to: '/admin/marketplace',    description: 'Gestion des annonces', color: 'text-pink-400' },
  { label: 'Devis Institutionnels', icon: FileText,    to: '/admin/devis',          description: 'Licences & contrats B2B', color: 'text-indigo-400' },
  { label: 'Calculs Bâtiment',      icon: Wrench,      to: '/admin/calculs-batiment', description: 'Module BTP admin', color: 'text-slate-400' },
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
    detail: 'Dans votre dépôt GitHub → Settings → Secrets and variables → Actions → "New repository secret". Nom : FIREBASE_SERVICE_ACCOUNT_KEY. Valeur : collez le contenu JSON copié.',
    link: { label: 'GitHub → Secrets → Nouveau secret →', href: 'https://github.com/teetee971/akiprisaye-web/settings/secrets/actions/new' },
  },
  {
    num: 3,
    title: 'Déclenchez le workflow depuis l\'onglet Actions',
    detail: 'Dans votre dépôt → onglet "Actions" → workflow "✨ Attribuer le rôle Créateur" → "Run workflow" → entrez votre email → "Run workflow".',
    link: { label: 'GitHub → Actions → ✨ Attribuer le rôle Créateur →', href: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml' },
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
  const { user, userRole, isCreator, isAdmin, signOutUser } = useAuth();
  const [guideOpen, setGuideOpen] = useState(!isCreator);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);

  // Redirect non-admins (admins = admin OR creator role)
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const creatorPlan = PLAN_DEFINITIONS['CREATOR'];

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
                onClick={signOutUser}
                className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Déconnexion
              </button>
            </div>
          )}
        </div>

        {/* ── Feature grid ─────────────────────────────────────────── */}
        <section className="mb-8">
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
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Outils d'administration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ADMIN_LINKS.map(l => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 hover:border-slate-500/60 rounded-xl p-4 transition-all group"
                >
                  <div className="p-2 bg-slate-700/50 rounded-lg flex-shrink-0">
                    <Icon className={`w-4 h-4 ${l.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">{l.label}</p>
                    <p className="text-xs text-slate-500 truncate">{l.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

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
