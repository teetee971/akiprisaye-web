import { Link } from 'react-router-dom';

const VERSION = '3.2.0';

// Build-time metadata injected by Vite (Issue #0.2)
const BUILD_SHA: string = import.meta.env.VITE_BUILD_SHA ?? 'dev';
const BUILD_DATE: string = import.meta.env.VITE_BUILD_DATE ?? '';
const BUILD_ENV: string = import.meta.env.VITE_BUILD_ENV ?? 'development';

const isProduction = BUILD_ENV === 'production';

export default function Footer() {
  const buildInfo = BUILD_DATE
    ? `${BUILD_ENV} · ${BUILD_DATE} · ${BUILD_SHA}`
    : `${BUILD_ENV} · ${BUILD_SHA}`;

  return (
    <footer id="footer" className="border-t border-slate-800 bg-slate-950">
      {/* ── Multi-column navigation ── */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">

          {/* Col 1 – Comparateurs */}
          <div>
            <p className="font-semibold text-slate-300 mb-3 uppercase tracking-wider text-xs">⚖️ Comparateurs</p>
            <ul className="space-y-2">
              <li><Link to="/comparateurs" className="text-slate-400 hover:text-white transition-colors">Tous les comparateurs</Link></li>
              <li><Link to="/comparateur" className="text-slate-400 hover:text-white transition-colors">Comparateur prix</Link></li>
              <li><Link to="/comparateur-vols" className="text-slate-400 hover:text-white transition-colors">Billets avion</Link></li>
              <li><Link to="/comparateur-carburants" className="text-slate-400 hover:text-white transition-colors">Carburants</Link></li>
              <li><Link to="/comparateur-services" className="text-slate-400 hover:text-white transition-colors">Télécoms</Link></li>
              <li><Link to="/tableau-inflation" className="text-slate-400 hover:text-white transition-colors">Inflation</Link></li>
            </ul>
          </div>

          {/* Col 2 – Données */}
          <div>
            <p className="font-semibold text-slate-300 mb-3 uppercase tracking-wider text-xs">📊 Données</p>
            <ul className="space-y-2">
              <li><Link to="/observatoire" className="text-slate-400 hover:text-white transition-colors">Observatoire</Link></li>
              <li><Link to="/donnees-publiques" className="text-slate-400 hover:text-white transition-colors">Données publiques</Link></li>
              <li><Link to="/methodologie" className="text-slate-400 hover:text-white transition-colors">Méthodologie</Link></li>
              <li><Link to="/comprendre-prix" className="text-slate-400 hover:text-white transition-colors">Comprendre les prix</Link></li>
              <li><Link to="/ievr" className="text-slate-400 hover:text-white transition-colors">Indice IEVR</Link></li>
              <li><Link to="/ti-panie" className="text-slate-400 hover:text-white transition-colors">Ti Panié vital</Link></li>
            </ul>
          </div>

          {/* Col 3 – Outils */}
          <div>
            <p className="font-semibold text-slate-300 mb-3 uppercase tracking-wider text-xs">🔧 Outils</p>
            <ul className="space-y-2">
              <li><Link to="/scanner" className="text-slate-400 hover:text-white transition-colors">Scanner</Link></li>
              <li><Link to="/assistant-ia" className="text-slate-400 hover:text-white transition-colors">Assistant IA</Link></li>
              <li><Link to="/liste" className="text-slate-400 hover:text-white transition-colors">Liste de courses</Link></li>
              <li><Link to="/alertes-prix" className="text-slate-400 hover:text-white transition-colors">Alertes prix</Link></li>
              <li><Link to="/contribuer-prix" className="text-slate-400 hover:text-white transition-colors">Contribuer</Link></li>
              <li><Link to="/messagerie" className="text-slate-400 hover:text-indigo-300 transition-colors">💬 Messagerie</Link></li>
              <li><Link to="/groupes-parole" className="text-slate-400 hover:text-purple-300 transition-colors">🗣️ Groupes de Parole</Link></li>
            </ul>
          </div>

          {/* Col 4 – À propos */}
          <div>
            <p className="font-semibold text-slate-300 mb-3 uppercase tracking-wider text-xs">ℹ️ À propos</p>
            <ul className="space-y-2">
              <li><Link to="/faq" className="text-slate-400 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/solidarite" className="text-slate-400 hover:text-orange-300 transition-colors">🤝 Entraide</Link></li>
              <li><Link to="/gouvernance" className="text-slate-400 hover:text-slate-200 transition-colors">Gouvernance</Link></li>
              <li><Link to="/presse" className="text-slate-400 hover:text-slate-200 transition-colors">Presse</Link></li>
              <li><Link to="/inscription-pro" className="text-slate-400 hover:text-blue-300 transition-colors">💼 Espace Pro</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-slate-800/60 py-4">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} A KI PRI SA YÉ — Observer, pas vendre. Données citoyennes pour les territoires ultramarins.</p>
          <div className="flex gap-3 items-center">
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
