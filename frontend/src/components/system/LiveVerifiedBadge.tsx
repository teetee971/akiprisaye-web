/**
 * LiveVerifiedBadge.tsx
 *
 * Badge "LIVE = VERIFIED BUILD" visible dans l'interface.
 * Lit version.json côté client et affiche l'état du déploiement.
 * Silencieux en cas d'échec (badge simplement masqué).
 */

import { useEffect, useState } from 'react';
import { CheckCircle, ExternalLink } from 'lucide-react';

type VersionPayload = {
  commit?: string;
  shortCommit?: string;
  branch?: string;
  runId?: string;
  builtAt?: string;
  buildUrl?: string | null;
};

export default function LiveVerifiedBadge() {
  const [data, setData] = useState<VersionPayload | null>(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL ?? '/';
    const url = base.endsWith('/') ? `${base}version.json` : `${base}/version.json`;
    fetch(url, { headers: { 'cache-control': 'no-cache' } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<VersionPayload>;
      })
      .then(setData)
      .catch(() => {
        // Silent — badge stays hidden on failure
      });
  }, []);

  if (!data) return null;

  const { shortCommit, branch, builtAt, buildUrl } = data;

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
      {shortCommit && (
        <span className="font-mono text-emerald-400">{shortCommit}</span>
      )}
      {branch && (
        <span className="text-emerald-600 hidden sm:inline">· {branch}</span>
      )}
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
