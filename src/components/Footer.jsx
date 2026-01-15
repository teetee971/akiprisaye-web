export default function Footer() {
  return (
    <footer
      className="bg-slate-900 border-t border-slate-800 mt-auto"
      style={{ paddingBottom: 'max(1.5rem, var(--safe-bottom))' }}
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Disclaimer */}
        <div className="mb-8">
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              Transparence civique et données officielles
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav
          className="flex flex-wrap justify-center gap-6 mb-6 text-sm"
          aria-label="Navigation du pied de page"
        >
          <a
            href="/a-propos"
            className="text-slate-300 hover:text-blue-400 transition-colors"
          >
            À propos
          </a>
          <a
            href="/methodologie"
            className="text-slate-300 hover:text-blue-400 transition-colors"
          >
            Méthodologie
          </a>
          <a
            href="/actualites"
            className="text-slate-300 hover:text-blue-400 transition-colors"
          >
            Actualités
          </a>
          <a
            href="/contact"
            className="text-slate-300 hover:text-blue-400 transition-colors"
          >
            Contact
          </a>
          <a
            href="/mentions-legales"
            className="text-slate-300 hover:text-blue-400 transition-colors"
          >
            Mentions légales
          </a>
        </nav>

        {/* Copyright */}
        <div className="text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} A KI PRI SA YÉ - Tous droits réservés</p>
          <p className="mt-2 text-xs text-slate-500">
            Plateforme citoyenne de transparence des prix en Outre-mer
          </p>
        </div>
      </div>
    </footer>
  );
}
