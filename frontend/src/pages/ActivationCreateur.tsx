/**
 * ActivationCreateur.tsx
 *
 * Page de bootstrap pour le propriétaire / créateur du projet.
 * Accessible à TOUT utilisateur authentifié — même sans rôle admin.
 *
 * Objectif : expliquer les 3 méthodes pour s'attribuer le rôle "creator"
 * (GitHub Actions, terminal local, Termux Android) sans avoir besoin
 * d'accéder à /espace-createur (qui est protégé par isAdmin).
 *
 * Route : /activation-createur
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import {
  Crown,
  Terminal,
  Smartphone,
  Github,
  ExternalLink,
  Copy,
  CheckCircle,
  Lock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/* ── Copy-to-clipboard helper ─────────────────────────────────────────── */
function CopyBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="relative mt-2 rounded-lg bg-slate-950 border border-slate-700 overflow-hidden">
      <pre className="p-3 text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        aria-label="Copier"
      >
        {copied ? (
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────── */

export default function ActivationCreateur() {
  const { user, isCreator, loading } = useAuth();

  // Not logged in → redirect to login
  if (!loading && !user) {
    return <Navigate to={`/connexion?next=/activation-createur`} replace />;
  }

  // Already creator → redirect to the full creator dashboard
  if (!loading && isCreator) {
    return <Navigate to="/espace-createur" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Activation Créateur — A KI PRI SA YÉ</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-white px-4 py-10">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="text-center space-y-3">
            <div className="inline-flex p-4 rounded-2xl bg-amber-400/10 border border-amber-500/30">
              <Crown className="w-10 h-10 text-amber-300" />
            </div>
            <h1 className="text-2xl font-bold text-white">Activation du rôle Créateur</h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Cette page explique comment vous attribuer l'accès total au logiciel en tant que
              propriétaire du projet.
            </p>
            {user && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-xs text-slate-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                Connecté : <span className="font-medium text-white">{user.email}</span>
              </div>
            )}
          </div>

          {/* ── Étape préalable ────────────────────────────────────── */}
          <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-700/40 text-sm text-blue-200">
            <p className="font-semibold mb-1">✅ Étape préalable terminée</p>
            <p>
              Vous êtes connecté avec <strong className="text-white">{user?.email}</strong>. Votre
              compte Firebase existe — vous pouvez maintenant activer le rôle Créateur.
            </p>
          </div>

          {/* ── Méthode 1 — GitHub Actions (recommandée, sans PC) ──── */}
          <section className="rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-800/50 border-b border-slate-700">
              <Github className="w-5 h-5 text-white flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Méthode 1 — GitHub Actions</p>
                <p className="text-xs text-slate-400">
                  Recommandée · Sans PC · Fonctionne depuis un téléphone
                </p>
              </div>
            </div>
            <ol className="divide-y divide-slate-800 text-sm">
              <li className="px-5 py-4 space-y-1">
                <p className="font-medium text-white">1. Téléchargez la clé Admin Firebase</p>
                <p className="text-slate-400">
                  Ouvrez la Console Firebase → Paramètres ⚙️ → Comptes de service → compte{' '}
                  <code className="text-amber-300 text-xs">
                    firebase-adminsdk-fbsvc@a-ki-pri-sa-ye.iam.gserviceaccount.com
                  </code>{' '}
                  → cliquez <strong>"Générer une nouvelle clé privée"</strong> → téléchargez le
                  JSON.
                </p>
                <a
                  href="https://console.firebase.google.com/project/a-ki-pri-sa-ye/settings/serviceaccounts/adminsdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:underline mt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Firebase Console → Comptes de service →
                </a>
              </li>
              <li className="px-5 py-4 space-y-1">
                <p className="font-medium text-white">2. Ajoutez un secret GitHub</p>
                <p className="text-slate-400">
                  Dépôt GitHub →{' '}
                  <strong>
                    Settings → Secrets and variables → Actions → New repository secret
                  </strong>
                  <br />
                  Nom : <code className="text-amber-300 text-xs">FIREBASE_SERVICE_ACCOUNT_KEY</code>
                  <br />
                  Valeur : copiez-collez le contenu JSON du fichier téléchargé.
                </p>
                <a
                  href="https://github.com/teetee971/akiprisaye-web/settings/secrets/actions/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:underline mt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  GitHub → Secrets → Nouveau secret →
                </a>
              </li>
              <li className="px-5 py-4 space-y-1">
                <p className="font-medium text-white">3. Déclenchez le workflow</p>
                <p className="text-slate-400">
                  GitHub → onglet <strong>Actions</strong> → workflow
                  <strong> "✨ Attribuer le rôle Créateur"</strong> → bouton{' '}
                  <strong>"Run workflow"</strong> → entrez{' '}
                  <code className="text-amber-300 text-xs">{user?.email ?? 'votre@email.com'}</code>{' '}
                  → confirmez.
                </p>
                <a
                  href="https://github.com/teetee971/akiprisaye-web/actions/workflows/set-creator-role.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:underline mt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  GitHub → Actions → ✨ Attribuer le rôle Créateur →
                </a>
              </li>
              <li className="px-5 py-4 space-y-1">
                <p className="font-medium text-white">4. Reconnectez-vous</p>
                <p className="text-slate-400">
                  Une fois le workflow terminé (icône ✅ verte), déconnectez-vous et
                  reconnectez-vous. Votre rôle Créateur est actif immédiatement.
                </p>
                <Link
                  to="/connexion"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:underline mt-1"
                >
                  Se connecter →
                </Link>
              </li>
            </ol>
          </section>

          {/* ── Méthode 2 — Terminal local ─────────────────────────── */}
          <section className="rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-800/50 border-b border-slate-700">
              <Terminal className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Méthode 2 — Terminal PC (local)</p>
                <p className="text-xs text-slate-400">Node.js ≥ 18 requis · Dépôt cloné</p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-slate-300">
              <p>
                Placez <code className="text-amber-300 text-xs">serviceAccountKey.json</code> à la
                racine du dépôt, puis :
              </p>
              <CopyBlock
                code={`npm install\nnode scripts/set-creator-role.mjs ${user?.email ?? 'votre@email.com'}`}
              />
              <p className="text-xs text-slate-500">
                ⚠️ Ne commitez jamais <code>serviceAccountKey.json</code> — il est dans{' '}
                <code>.gitignore</code>.
              </p>
            </div>
          </section>

          {/* ── Méthode 3 — Termux Android ─────────────────────────── */}
          <section className="rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-800/50 border-b border-slate-700">
              <Smartphone className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Méthode 3 — Termux (Android)</p>
                <p className="text-xs text-slate-400">Sans PC · Terminal Android</p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-slate-300">
              <p>
                Placez <code className="text-amber-300 text-xs">serviceAccountKey.json</code> dans{' '}
                <code className="text-xs">~/downloads/</code>, puis dans Termux :
              </p>
              <CopyBlock
                code={`cd ~/downloads\ncurl -fsSL https://raw.githubusercontent.com/teetee971/akiprisaye-web/main/scripts/set-creator-role.mjs -o set-creator-role.mjs\nnpm install firebase-admin && node set-creator-role.mjs ${user?.email ?? 'votre@email.com'}`}
              />
            </div>
          </section>

          {/* ── Note Google Auth ───────────────────────────────────── */}
          <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-700/40 text-sm text-amber-200 space-y-2">
            <p className="font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 flex-shrink-0" />
              Connexion Google — action manuelle requise
            </p>
            <p>
              Pour que la connexion Google fonctionne depuis GitHub Pages, le domaine
              <code className="mx-1 text-white text-xs bg-slate-800 px-1 py-0.5 rounded">
                teetee971.github.io
              </code>
              doit être ajouté dans Firebase Console :
            </p>
            <p className="text-xs">
              Firebase Console → Authentication → Settings → <strong>Authorized domains</strong> →
              "Add domain" → <code className="text-white">teetee971.github.io</code>
            </p>
            <a
              href="https://console.firebase.google.com/project/a-ki-pri-sa-ye/authentication/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Firebase Console → Authentication → Settings →
            </a>
            <p className="text-xs text-amber-300/70 mt-1">
              La connexion par email/mot de passe fonctionne sans cette étape.
            </p>
          </div>

          {/* ── Footer links ───────────────────────────────────────── */}
          <div className="text-center space-y-2 pt-2">
            <p className="text-xs text-slate-500">
              Guide complet :{' '}
              <a
                href="/docs/OWNER_QUICKSTART.md"
                className="text-blue-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                docs/OWNER_QUICKSTART.md
              </a>
            </p>
            <Link to="/" className="text-xs text-slate-600 hover:text-slate-400 hover:underline">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
