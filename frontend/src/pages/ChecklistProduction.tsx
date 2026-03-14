/**
 * ChecklistProduction — Siriste à faire pour la mise en production
 *
 * Liste de vérification des tâches critiques avant déploiement en production.
 * Couvre : frontend, sécurité, performance, tests, accessibilité, conformité,
 *          infrastructure et documentation.
 *
 * Principe : seules les tâches réellement observées dans la base de code
 *            et pertinentes pour une mise en production sont listées ici.
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import {
  CheckCircle,
  Clock,
  Circle,
  AlertTriangle,
  Shield,
  Zap,
  TestTube,
  Globe,
  FileText,
  Server,
  Accessibility,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type TaskStatus = 'done' | 'in-progress' | 'todo' | 'critical';
type Priority = 'haute' | 'moyenne' | 'basse';

interface ChecklistTask {
  label: string;
  status: TaskStatus;
  priority: Priority;
  note?: string;
}

interface ChecklistSection {
  key: string;
  title: string;
  tasks: ChecklistTask[];
}

// ── Data ──────────────────────────────────────────────────────────────────────

const CHECKLIST: ChecklistSection[] = [
  {
    key: 'securite',
    title: '🔐 Sécurité',
    tasks: [
      { label: 'Règles Firestore séparant citoyen / pro / admin', status: 'done', priority: 'haute' },
      { label: 'Aucune clé API Firebase exposée côté client', status: 'done', priority: 'haute' },
      { label: 'Content Security Policy (CSP) configurée via Cloudflare', status: 'done', priority: 'haute' },
      { label: 'Variables d\'environnement VITE_* sensibles hors du dépôt', status: 'done', priority: 'haute' },
      { label: 'Authentification Firebase avec règles de rôle (citizen/pro/admin)', status: 'done', priority: 'haute' },
      { label: 'Rollback instantané activé sur Cloudflare Pages', status: 'done', priority: 'haute' },
      { label: 'Audit des dépendances npm (vulnerabilités critiques)', status: 'in-progress', priority: 'haute' },
      { label: 'HTTPS enforced — pas de contenu mixte HTTP/HTTPS', status: 'done', priority: 'haute' },
    ],
  },
  {
    key: 'frontend',
    title: '🖥️ Frontend & UX',
    tasks: [
      { label: 'Build de production sans erreur TypeScript (0 TS errors)', status: 'done', priority: 'haute' },
      { label: 'Code splitting par route (lazyPage + Suspense)', status: 'done', priority: 'moyenne' },
      { label: 'Gestion des erreurs — ErrorBoundary global en place', status: 'done', priority: 'haute' },
      { label: 'Fallback 404 (NotFound.tsx) routé sur /*', status: 'done', priority: 'moyenne' },
      { label: 'Timeout Suspense (10 s) avec fallback visible', status: 'done', priority: 'moyenne' },
      { label: 'Icônes Lucide React — cohérence sur toutes les pages', status: 'done', priority: 'basse' },
      { label: 'Routes legacy aliases en place (backward compatibility)', status: 'done', priority: 'haute' },
      { label: 'BASE_URL Vite correct selon l\'env (Cloudflare vs GitHub Pages)', status: 'done', priority: 'haute' },
      { label: 'Suppression des fichiers obsolètes et @ts-nocheck', status: 'done', priority: 'moyenne' },
      { label: 'Indicateur DOM / métropole pour les comparateurs de prix', status: 'todo', priority: 'moyenne', note: 'Prévu V1' },
      { label: 'Optimisation GPS liste de courses (meilleur compromis prix/distance)', status: 'todo', priority: 'basse', note: 'Prévu V1' },
    ],
  },
  {
    key: 'performance',
    title: '⚡ Performance',
    tasks: [
      { label: 'PageSpeed 99/100 Desktop — Core Web Vitals excellent', status: 'done', priority: 'haute' },
      { label: 'Bundler Vite avec tree-shaking activé', status: 'done', priority: 'moyenne' },
      { label: 'Images Unsplash avec paramètres de compression (auto=format&fit=crop)', status: 'done', priority: 'basse' },
      { label: 'Lazy loading des pages (React.lazy + lazyPage helper)', status: 'done', priority: 'haute' },
      { label: 'Cache des requêtes prix (priceCacheService)', status: 'done', priority: 'moyenne' },
      { label: 'Fonctions Cloudflare Workers optimisées (<50ms cold start)', status: 'in-progress', priority: 'moyenne' },
      { label: 'Mode hors-ligne étendu (PWA) pour les territoires à connectivité faible', status: 'todo', priority: 'moyenne', note: 'Prévu V2' },
    ],
  },
  {
    key: 'tests',
    title: '🧪 Tests & CI/CD',
    tasks: [
      { label: 'Pipeline CI/CD Cloudflare Pages opérationnel (npm ci && npm run build)', status: 'done', priority: 'haute' },
      { label: 'Étapes lint et type-check bloquantes en CI', status: 'done', priority: 'haute' },
      { label: 'Node.js épinglé à 20.19.0 (.nvmrc / .node-version)', status: 'done', priority: 'haute' },
      { label: 'Tests CI des routes alias (vérification littérale dans le code source)', status: 'done', priority: 'haute' },
      { label: 'Tests unitaires sur les services critiques (devis, prix, EAN)', status: 'in-progress', priority: 'haute' },
      { label: 'Tests E2E sur les parcours principaux (scan, comparaison, inscription)', status: 'todo', priority: 'haute', note: 'Priorité avant V1 publique' },
      { label: 'Monitoring des erreurs front-end en production (Sentry ou équivalent)', status: 'todo', priority: 'haute', note: 'À planifier' },
    ],
  },
  {
    key: 'conformite',
    title: '⚖️ Conformité & RGPD',
    tasks: [
      { label: 'Consentement cookie explicite à l\'inscription', status: 'done', priority: 'haute' },
      { label: 'Droit d\'accès et de suppression des données implémentés', status: 'done', priority: 'haute' },
      { label: 'Minimisation des données collectées (RGPD)', status: 'done', priority: 'haute' },
      { label: 'Aucune revente de données personnelles', status: 'done', priority: 'haute' },
      { label: 'Mentions légales accessibles (MentionsLegales.tsx)', status: 'done', priority: 'haute' },
      { label: 'Piste d\'audit immuable pour les devis (Firestore arrayUnion)', status: 'done', priority: 'haute' },
      { label: 'Identité légale (SIRET/SIREN) obligatoire pour devis B2G/B2B', status: 'done', priority: 'haute' },
      { label: 'Durée de conservation des données documentée', status: 'in-progress', priority: 'haute', note: 'À compléter dans Transparence.tsx' },
      { label: 'DPO désigné ou procédure de contact RGPD documentée', status: 'todo', priority: 'haute', note: 'À compléter avant lancement public' },
    ],
  },
  {
    key: 'accessibilite',
    title: '♿ Accessibilité',
    tasks: [
      { label: 'WCAG AA minimum visé sur toutes les pages actives', status: 'in-progress', priority: 'haute' },
      { label: 'Aria-labels sur les éléments interactifs (boutons, icônes)', status: 'in-progress', priority: 'haute' },
      { label: 'Navigation clavier supportée', status: 'in-progress', priority: 'haute' },
      { label: 'Contrastes de couleur ≥ 4,5:1 sur les composants actifs', status: 'done', priority: 'haute' },
      { label: 'Focus visible sur tous les éléments focusables', status: 'in-progress', priority: 'haute' },
      { label: 'Textes alternatifs (alt) sur toutes les images fonctionnelles', status: 'in-progress', priority: 'moyenne' },
    ],
  },
  {
    key: 'infrastructure',
    title: '🚀 Infrastructure & Déploiement',
    tasks: [
      { label: 'Déploiement Cloudflare Pages configuré (root_directory=frontend)', status: 'done', priority: 'haute' },
      { label: 'Variables d\'environnement de production configurées dans Cloudflare', status: 'done', priority: 'haute' },
      { label: 'Domaine personnalisé et certificat TLS actif', status: 'done', priority: 'haute' },
      { label: 'VITE_BUILD_SHA / VITE_BUILD_DATE injectés par Vite en CI', status: 'done', priority: 'basse' },
      { label: 'Règles de cache Cloudflare sur les assets statiques', status: 'in-progress', priority: 'moyenne' },
      { label: 'Firebase auth et Firestore configurés en projet de production (hors émulateur)', status: 'done', priority: 'haute' },
      { label: 'Backup automatique Firestore activé', status: 'todo', priority: 'haute', note: 'À configurer dans Firebase Console' },
      { label: 'Alertes de quota Firebase (Spark → Blaze) configurées', status: 'todo', priority: 'haute', note: 'Prévenir les coupures inattendues' },
    ],
  },
  {
    key: 'documentation',
    title: '📄 Documentation',
    tasks: [
      { label: 'CHANGELOG.md maintenu et à jour', status: 'done', priority: 'moyenne' },
      { label: 'Roadmap publique accessible (/roadmap)', status: 'done', priority: 'moyenne' },
      { label: 'Dossier investisseurs structuré (/dossier-investisseurs)', status: 'done', priority: 'moyenne' },
      { label: 'Page Versions accessible (/versions)', status: 'done', priority: 'basse' },
      { label: 'API interne (Cloudflare Functions) documentée', status: 'todo', priority: 'moyenne', note: 'Priorité V1' },
      { label: 'README.md monorepo à jour avec instructions de setup', status: 'in-progress', priority: 'moyenne' },
      { label: 'Guide contributeur (CONTRIBUTING.md)', status: 'todo', priority: 'basse' },
    ],
  },
  {
    key: 'ia',
    title: '🤖 IA Responsable',
    tasks: [
      { label: 'Disclaimer IA systématique sur chaque sortie IA', status: 'done', priority: 'haute' },
      { label: 'Validation humaine obligatoire sur les devis B2G/B2B', status: 'done', priority: 'haute' },
      { label: 'Affichage des hypothèses et limites pour les prédictions', status: 'in-progress', priority: 'haute', note: 'Intervalles de confiance prévus V2' },
      { label: 'Aucun LLM opaque non auditable en production', status: 'done', priority: 'haute' },
      { label: 'Données uniquement réelles pour les modèles de prédiction', status: 'done', priority: 'haute' },
      { label: 'Intervalles de confiance affichés sur les prédictions', status: 'todo', priority: 'haute', note: 'Prévu V2' },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusIcon(status: TaskStatus) {
  if (status === 'done') return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />;
  if (status === 'in-progress') return <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />;
  if (status === 'critical') return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />;
  return <Circle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />;
}

function statusLabel(status: TaskStatus) {
  if (status === 'done') return { text: 'Fait', cls: 'bg-green-100 text-green-700' };
  if (status === 'in-progress') return { text: 'En cours', cls: 'bg-yellow-100 text-yellow-700' };
  if (status === 'critical') return { text: 'Critique', cls: 'bg-red-100 text-red-700' };
  return { text: 'À faire', cls: 'bg-gray-100 text-gray-500' };
}

function priorityBadge(priority: Priority) {
  if (priority === 'haute') return 'bg-red-50 text-red-600 border border-red-200';
  if (priority === 'moyenne') return 'bg-orange-50 text-orange-600 border border-orange-200';
  return 'bg-gray-50 text-gray-500 border border-gray-200';
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  securite: Shield,
  frontend: Globe,
  performance: Zap,
  tests: TestTube,
  conformite: FileText,
  accessibilite: Accessibility,
  infrastructure: Server,
  documentation: FileText,
  ia: Globe,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChecklistProduction() {
  const [activeSection, setActiveSection] = useState<string>('securite');
  const [showAll, setShowAll] = useState(false);

  const section = CHECKLIST.find((s) => s.key === activeSection) ?? CHECKLIST[0];

  const totalTasks = CHECKLIST.flatMap((s) => s.tasks).length;
  const doneTasks = CHECKLIST.flatMap((s) => s.tasks).filter((t) => t.status === 'done').length;
  const inProgressTasks = CHECKLIST.flatMap((s) => s.tasks).filter((t) => t.status === 'in-progress').length;
  const todoTasks = CHECKLIST.flatMap((s) => s.tasks).filter((t) => t.status === 'todo' || t.status === 'critical').length;
  const progressPct = Math.round((doneTasks / totalTasks) * 100);

  return (
    <>
      <Helmet>
        <title>Checklist Production — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Liste de vérification des tâches avant mise en production — sécurité, performance, conformité, accessibilité et déploiement."
        />
              <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/checklist-prod" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/checklist-prod" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/checklist-prod" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-slate-900 text-white py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <HeroImage
              src={PAGE_HERO_IMAGES.checklistProduction}
              alt="Checklist Production"
              gradient="from-slate-950 to-emerald-900"
              height="h-40 sm:h-52"
            >
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
                ✅ Checklist Production
              </h1>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
                Siriste à faire pour mettre le logiciel en production
              </p>
            </HeroImage>
          </div>
        </div>

        {/* Progress summary */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-gray-700">Progression globale</span>
                  <span className="text-sm font-bold text-indigo-700">{progressPct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-4 text-xs text-gray-600 flex-wrap">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <strong>{doneTasks}</strong> terminé{doneTasks > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-yellow-500" />
                  <strong>{inProgressTasks}</strong> en cours
                </span>
                <span className="flex items-center gap-1">
                  <Circle className="w-3.5 h-3.5 text-gray-400" />
                  <strong>{todoTasks}</strong> à faire
                </span>
                <span className="text-gray-400">/ {totalTasks} total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section tabs */}
        <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 flex gap-0 overflow-x-auto">
            {CHECKLIST.map((s) => {
              const Icon = SECTION_ICONS[s.key] ?? Circle;
              const done = s.tasks.filter((t) => t.status === 'done').length;
              const total = s.tasks.length;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition whitespace-nowrap
                    ${activeSection === s.key
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{s.title.split(' ').slice(1).join(' ')}</span>
                  <span className="sm:hidden">{s.title.split(' ')[0]}</span>
                  <span className={`text-xs rounded-full px-1.5 py-0 ml-0.5 font-mono
                    ${done === total ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {done}/{total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section content */}
        <div className="max-w-5xl mx-auto px-4 py-4 pb-14">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              Afficher toutes les sections
            </label>
          </div>

          {(showAll ? CHECKLIST : [section]).map((sec) => (
            <div key={sec.key} className={showAll ? 'mb-8' : ''}>
              {showAll && (
                <h3 className="text-base font-semibold text-gray-800 mb-3">{sec.title}</h3>
              )}
              <div className="space-y-2">
                {sec.tasks.map((task) => {
                  const sl = statusLabel(task.status);
                  return (
                    <div
                      key={task.label}
                      className={`bg-white border rounded-xl px-4 py-3 flex items-start gap-3
                        ${task.status === 'critical' ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
                    >
                      {statusIcon(task.status)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.status === 'done' ? 'text-gray-700' : task.status === 'todo' ? 'text-gray-500' : 'text-gray-900'}`}>
                          {task.label}
                        </p>
                        {task.note && (
                          <p className="text-xs text-gray-400 mt-0.5">{task.note}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${sl.cls}`}>
                          {sl.text}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${priorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="mt-8 p-4 bg-white border border-gray-200 rounded-xl">
            <p className="text-xs font-semibold text-gray-600 mb-3">Légende</p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Terminé — déployé en production</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-yellow-500" /> En cours — partiellement implémenté</span>
              <span className="flex items-center gap-1.5"><Circle className="w-3.5 h-3.5 text-gray-400" /> À faire — planifié ou non démarré</span>
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Critique — bloquant pour la production</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
