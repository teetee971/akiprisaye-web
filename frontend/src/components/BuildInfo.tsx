/**
 * BuildInfo.tsx
 *
 * Pastille de déploiement discrète, fixée en bas à droite de l'écran.
 * Visible uniquement après chargement de version.json — silencieux en cas d'échec.
 *
 * Permet de vérifier en un coup d'œil que le site sert bien la dernière build.
 * Pour la preuve complète : /version
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface VersionInfo {
  commit: string;
  shortCommit: string;
  branch: string;
  runId: string;
  builtAt: string;
  buildUrl: string | null;
}

export function BuildInfo() {
  const [data, setData] = useState<VersionInfo | null>(null);

  useEffect(() => {
    // Use BASE_URL so the path is correct on GitHub Pages and locally.
    const base = import.meta.env.BASE_URL ?? '/';
    const url = base.endsWith('/') ? `${base}version.json` : `${base}/version.json`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<VersionInfo>;
      })
      .then(setData)
      .catch(() => {
        // Silent — badge simply stays hidden
      });
  }, []);

  if (!data) return null;

  const date = data.builtAt
    ? new Date(data.builtAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    : '?';

  return (
    <div
      style={{ position: 'fixed', bottom: 8, right: 10, zIndex: 9999 }}
      className="text-[10px] text-slate-600 leading-tight text-right pointer-events-auto"
    >
      <Link
        to="/version"
        className="hover:text-slate-400 transition-colors inline-flex items-center justify-end min-h-[44px] min-w-[44px] px-1"
        title={`Commit : ${data.commit}\nBranche : ${data.branch}\nBuild : ${data.builtAt}`}
      >
        {data.shortCommit} · {date}
      </Link>
    </div>
  );
}
