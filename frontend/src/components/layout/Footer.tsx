import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, BarChart2, Wrench, Info, Briefcase } from 'lucide-react';
import { SkeletonBadge } from '../SkeletonWidgets';

// LiveOnlineBadge uses Firestore (lib/firebase) — lazy so Firebase SDK doesn't
// appear in the initial critical-path bundle via the Layout → Footer chain.
const LiveOnlineBadge = lazy(() => import('../analytics/LiveOnlineBadge'));

const VERSION = '3.3.0';

// Build-time metadata injected by Vite (Issue #0.2)
const BUILD_SHA: string = import.meta.env.VITE_BUILD_SHA ?? 'dev';
const BUILD_DATE: string = import.meta.env.VITE_BUILD_DATE ?? '';
const BUILD_ENV: string = import.meta.env.VITE_BUILD_ENV ?? 'development';

const isProduction = BUILD_ENV === 'production';

export default function Footer() {
  const buildInfo = BUILD_DATE
    ? `${BUILD_ENV} · ${BUILD_DATE} · ${BUILD_SHA}`
    : `${BUILD_ENV} · ${BUILD_SHA}`;

  const [debugActive, setDebugActive] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      setDebugActive(sessionStorage.getItem('auth:debug') === '1');
    } catch {
      // sessionStorage may be unavailable
    }
    return () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
    };
  }, []);

  /**
   * Secret triple-tap activator — tap the copyright line 3 times within 1.5 s
   * to toggle the auth debug panel without opening DevTools.
   * Useful on mobile Chrome / Samsung Internet.
   */
  const handleDebugTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);

    if (tapCount.current >= 3) {
      tapCount.current = 0;
      try {
        const next = sessionStorage.getItem('auth:debug') !== '1';
        if (next) {
          sessionStorage.setItem('auth:debug', '1');
        } else {
          sessionStorage.removeItem('auth:debug');
        }
        setDebugActive(next);
        window.location.reload();
      } catch {
        // sessionStorage unavailable — ignore
      }
      return;
    }

    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 1500);
  };


  return (
    <footer id="footer" className="border-t border-slate-800 bg-slate-950">
      {/* ── Multi-column navigation ── */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">

          {/* Col 1 – Commencer */}
          <div>
            <p className="font-semibold text-slate-300 mb-3 uppercase tracking-wider text-xs"><Scale className="inline-block w-3.5 h-3.5 mr-1.5 opacity-60" /> Commencer</p>
            <ul className="space-y-2">
              <li><Link to="/comparateur" className="text-slate-400 hover:text-white transition-colors">Comparateur prix</Link></li>
              <li><Link to="/search" className="text-slate-400 hover:text-white transition-colors">Recherche</Link></li>
              <li><Link to="/scanner" className="text-slate-400 hover:text-white transition-colors">Scanner</Link></li>
              <li><Link to="/liste" className="text-slate-400 hover:text-white transition-colors">Liste de courses</Link></li>
              <li><Link to="/pricing" className="text-slate-400 hover:text-white transition-colors">Offres</Link></li>
            </ul>
          </div>

          {/* Col 2 – Confiance */}
          <div>
            <p className="font-semibold text-slate-300 mb-3 uppercase tracking-wider text-xs"><BarChart2 className="inline-block w-3.5 h-3.5 mr-1.5 opacity-60" /> Confiance</p>
            <ul className="space-y-2">
              <li><Link to="/observatoire" className="text-slate-400 hover:text-white transition-colors">Observatoire</Link></li>
              <li><Link to="/transparence" className="text-slate-400 hover:text-white transition-colors">Transparence</Link></li>
              <li><Link to="/methodologie" className="text-slate-400 hover:text-white transition-colors">Méthodologie</Link></li>
              <li><Link to="/donnees-publiques" className="text-slate-400 hover:text-white transition-colors">Données publiques</Link></li>
              <li><Link to="/faq" className="text-slate-400 hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Col 3 – Ressources */}
          <div>
            <p className="font-semibold text-slate-300 mb-3 uppercase tracking-wider text-xs"><Wrench className="inline-block w-3.5 h-3.5 mr-1.5 opacity-60" /> Ressources</p>
            <ul className="space-y-2">
              <li><Link to="/actualites" className="text-slate-400 hover:text-white transition-colors">Actualités</Link></li>
              <li><Link to="/comparateurs" className="text-slate-400 hover:text-white transition-colors">Tous les comparateurs</Link></li>
              <li><Link to="/comprendre-prix" className="text-slate-400 hover:text-white transition-colors">Comprendre les prix</Link></li>
              <li><Link to="/contribuer-prix" className="text-slate-400 hover:text-white transition-colors">Contribuer</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Col 4 – Pro & institutionnels */}
          <div>
            <p className="font-semibold text-slate-300 mb-3 uppercase tracking-wider text-xs"><Info className="inline-block w-3.5 h-3.5 mr-1.5 opacity-60" /> Pro &amp; institutions</p>
            <ul className="space-y-2">
              <li><Link to="/inscription-pro" className="text-slate-400 hover:text-blue-300 transition-colors"><Briefcase className="inline-block w-3.5 h-3.5 mr-1" /> Espace Pro</Link></li>
              <li><Link to="/licence-institution" className="text-slate-400 hover:text-white transition-colors">Licence institution</Link></li>
              <li><Link to="/pricing#partners" className="text-slate-400 hover:text-white transition-colors">Partenariats</Link></li>
              <li><Link to="/contact#pro" className="text-slate-400 hover:text-white transition-colors">Parler à l’équipe</Link></li>
              <li><Link to="/gouvernance" className="text-slate-400 hover:text-white transition-colors">Gouvernance</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-slate-800/60 py-4">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <button
            type="button"
            onClick={handleDebugTap}
            title={debugActive ? 'Auth debug actif — triple-tap pour désactiver' : undefined}
            style={{
              cursor: 'default',
              WebkitTapHighlightColor: 'transparent',
              background: 'none',
              border: 'none',
              color: 'inherit',
              font: 'inherit',
              padding: 0,
              textAlign: 'left',
            }}
          >
            © {new Date().getFullYear()} A KI PRI SA YÉ — Observer, pas vendre. Données citoyennes pour les territoires ultramarins.
            {debugActive && (
              <span className="ml-1 text-xs text-orange-400" aria-label="Auth debug activé">🔒</span>
            )}
          </button>
          <div className="flex gap-3 items-center">
            <Suspense fallback={<SkeletonBadge />}><LiveOnlineBadge /></Suspense>
            <Link to="/mentions-legales" className="hover:text-slate-400 transition-colors">Mentions légales</Link>
            <Link to="/transparence" className="hover:text-slate-400 transition-colors">Confidentialité</Link>
            <Link
              to="/versions"
              className="hover:text-slate-400 transition-colors"
              title={buildInfo}
              aria-label={`Version v${VERSION} — ${buildInfo}`}
            >
              v{VERSION}
              {!isProduction && (
                <span className="ml-1 text-amber-600">({BUILD_ENV})</span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
