/**
 * VersionPage.tsx — /version
 *
 * Page de preuve de déploiement publique.
 * Permet de vérifier en 5 secondes que le site correspond exactement au dernier commit.
 *
 * Procédure de vérification :
 *   1. Copier le SHA affiché ici
 *   2. Aller sur GitHub → repo → main → derniers commits
 *   3. SHA ici == SHA GitHub → ✅ déploiement validé
 */

import { useEffect, useState } from 'react';
import { CheckCircle, GitBranch, Clock, ExternalLink, RefreshCw, Copy, Check } from 'lucide-react';
import LiveVerifiedBadge from '../components/system/LiveVerifiedBadge';

interface VersionInfo {
  commit:      string;
  shortCommit: string;
  branch:      string;
  runId:       string;
  builtAt:     string;
  buildUrl:    string | null;
}

// Build-time constants (injected by Vite define)
const BUNDLE_SHA: string  = import.meta.env.VITE_BUILD_SHA    ?? 'dev';
const BUNDLE_REF: string  = import.meta.env.VITE_BUILD_REF    ?? 'dev';
const BUNDLE_RUN: string  = import.meta.env.VITE_BUILD_RUN_ID ?? 'local';
const BUNDLE_DATE: string = import.meta.env.VITE_BUILD_DATE   ?? '';

export default function VersionPage() {
  const [data,    setData]    = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    const base = import.meta.env.BASE_URL ?? '/';
    const url = base.endsWith('/') ? `${base}version.json` : `${base}/version.json`;
    fetch(url)
      .then((r) => r.ok ? r.json() as Promise<VersionInfo> : Promise.reject(r.status))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  const sha         = data?.commit      ?? BUNDLE_SHA;
  const shortSha    = data?.shortCommit ?? sha.slice(0, 7);
  const branch      = data?.branch      ?? BUNDLE_REF;
  const runId       = data?.runId       ?? BUNDLE_RUN;
  const builtAt     = data?.builtAt;
  const buildUrl    = data?.buildUrl ?? (runId !== 'local'
    ? `https://github.com/teetee971/akiprisaye-web/actions/runs/${runId}`
    : null);

  const githubMainUrl = 'https://github.com/teetee971/akiprisaye-web/commits/main';
  const commitUrl     = sha !== 'unknown' && sha !== 'dev'
    ? `https://github.com/teetee971/akiprisaye-web/commit/${sha}`
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-12">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            Preuve de déploiement
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Comparez le SHA ci-dessous avec le dernier commit sur GitHub pour confirmer que le site sert bien la dernière version.
          </p>
        </div>

        {/* Live verification badge */}
        <div>
          <LiveVerifiedBadge />
        </div>

        {/* Main proof card */}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Chargement…
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 divide-y divide-slate-800">

            {/* Commit SHA */}
            <div className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-slate-500 mb-1">Commit (SHA complet)</div>
                {commitUrl ? (
                  <a
                    href={commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-amber-300 hover:text-amber-200 break-all flex items-center gap-1"
                  >
                    {sha}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="font-mono text-sm text-amber-300 break-all">{sha}</span>
                )}
                <div className="text-xs text-slate-500 mt-1">
                  Court : <span className="font-mono text-slate-300">{shortSha}</span>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(sha)}
                title="Copier le SHA"
                className="shrink-0 p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Branch */}
            <div className="p-4 flex items-center gap-3">
              <GitBranch className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <div className="text-xs text-slate-500">Branche</div>
                <div className="text-sm font-mono text-slate-200">{branch}</div>
              </div>
            </div>

            {/* Build date */}
            {builtAt && (
              <div className="p-4 flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Date de build</div>
                  <div className="text-sm text-slate-200">
                    {new Date(builtAt).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
                    })}{' '}
                    <span className="text-slate-500 text-xs">UTC</span>
                  </div>
                </div>
              </div>
            )}

            {/* GitHub Actions run */}
            {buildUrl && (
              <div className="p-4">
                <div className="text-xs text-slate-500 mb-1">Run GitHub Actions</div>
                <a
                  href={buildUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sky-400 hover:text-sky-300 flex items-center gap-1 break-all"
                >
                  Run #{runId}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}

          </div>
        )}

        {/* Bundle vars (always available, even if version.json fails) */}
        {(BUNDLE_SHA !== 'dev' || BUNDLE_RUN !== 'local') && (
          <details className="text-xs text-slate-600">
            <summary className="cursor-pointer hover:text-slate-500">Constantes du bundle Vite</summary>
            <div className="mt-2 font-mono space-y-1 pl-2 border-l border-slate-800">
              <div>VITE_BUILD_SHA    : {BUNDLE_SHA}</div>
              <div>VITE_BUILD_REF    : {BUNDLE_REF}</div>
              <div>VITE_BUILD_RUN_ID : {BUNDLE_RUN}</div>
              <div>VITE_BUILD_DATE   : {BUNDLE_DATE}</div>
            </div>
          </details>
        )}

        {/* Verification instructions */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm space-y-2">
          <div className="text-slate-400 font-medium">Procédure de vérification</div>
          <ol className="text-slate-500 space-y-1 list-decimal list-inside">
            <li>
              Copier le SHA ci-dessus
            </li>
            <li>
              Ouvrir{' '}
              <a href={githubMainUrl} target="_blank" rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 underline">
                github.com → repo → main → commits
              </a>
            </li>
            <li>
              SHA ici <span className="text-emerald-400">==</span> SHA GitHub → ✅ déploiement validé
            </li>
          </ol>
        </div>

        {/* Raw version.json link */}
        <div className="text-center">
          <a
            href={`${import.meta.env.BASE_URL ?? '/'}version.json`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-600 hover:text-slate-500 underline"
          >
            Voir version.json brut ↗
          </a>
        </div>

      </div>
    </div>
  );
}
