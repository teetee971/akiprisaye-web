/**
 * LiveOnlineBadge — Pastille "N en ligne" dans le footer
 *
 * Affiche le nombre de visiteurs actifs (5 min) en temps réel.
 * Cliquable → renvoie vers /audience (rapport complet).
 */

import { Link } from 'react-router-dom';
import { useVisitorStats } from '../../hooks/useVisitorStats';

export default function LiveOnlineBadge() {
  const { totalOnline, loading } = useVisitorStats();

  if (loading) return null;

  return (
    <Link
      to="/audience"
      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors"
      title="Voir le rapport d'audience en temps réel"
    >
      <span className="relative flex shrink-0" aria-hidden="true">
        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="tabular-nums">{totalOnline} en ligne</span>
    </Link>
  );
}
