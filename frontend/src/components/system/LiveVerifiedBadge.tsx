/**
 * LiveVerifiedBadge.tsx
 *
 * Badge "LIVE = VERIFIED BUILD" visible dans l'interface.
 * Lit version.json côté client, valide les champs de manière stricte
 * (sha256, buildUrl, runId, shortCommit), et affiche l'état du déploiement.
 * Affiche un état dégradé "LIVE = UNVERIFIED" en cas d'échec.
 */

import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

type VersionPayload = {
  commit?: string;
  shortCommit?: string;
  branch?: string;
  runId?: string;
  buildId?: string;
  builtAt?: string;
  buildUrl?: string | null;
  sha256?: string;
};

type FetchState =
  | { status: 'loading' }
  | { status: 'verified'; data: VersionPayload }
  | { status: 'unverified' };

export default function LiveVerifiedBadge() {
  const [state, setState] = useState<FetchState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const url = `${import.meta.env.BASE_URL}version.json?t=${Date.now()}`;
        const res = await fetch(url, {
          cache: 'no-store',
          headers: {
            'cache-control': 'no-cache, no-store, must-revalidate',
            pragma: 'no-cache',
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: VersionPayload = await res.json();

        const ok =
          !!data.commit &&
          !!data.shortCommit &&
          !!data.branch &&
          !!data.runId &&
          !!data.buildUrl &&
          !!data.sha256 &&
          data.shortCommit === data.commit.slice(0, 7) &&
          /^https:\/\/github\.com\//.test(String(data.buildUrl)) &&
          /\/actions\/runs\//.test(String(data.buildUrl)) &&
          /^\d+$/.test(String(data.runId)) &&
          /^[a-f0-9]{64}$/i.test(String(data.sha256));

        if (!cancelled) {
          setState(ok ? { status: 'verified', data } : { status: 'unverified' });
        }
      } catch {
        if (!cancelled) {
          setState({ status: 'unverified' });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') return null;

  if (state.status === 'unverified') {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-950 border border-amber-700 px-3 py-1.5 text-xs text-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
        <span className="font-semibold tracking-wide">LIVE = UNVERIFIED</span>
      </div>
    );
  }

  const { shortCommit, branch, builtAt, buildUrl } = state.data;

  const formattedDate = builtAt
    ? new Date(builtAt).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      })
    : null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950 border border-emerald-700 px-3 py-1.5 text-xs text-emerald-300">
      <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
      <span className="font-semibold tracking-wide">LIVE = VERIFIED BUILD</span>
      {shortCommit && <span className="font-mono text-emerald-400">{shortCommit}</span>}
      {branch && <span className="text-emerald-600 hidden sm:inline">· {branch}</span>}
      {formattedDate && (
        <span className="text-emerald-700 hidden md:inline">· {formattedDate} UTC</span>
      )}
      {buildUrl && (
        <a
          href={buildUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Voir le run GitHub Actions"
          className="text-emerald-600 hover:text-emerald-400 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
