import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer id="footer" className="border-t border-slate-800 bg-slate-950 py-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400 mb-3">
          <Link to="/mentions-legales" className="hover:text-white">Mentions légales</Link>
          <Link to="/privacy" className="hover:text-white">Confidentialité</Link>
          <Link to="/contact" className="hover:text-white">Contact</Link>
          <Link to="/methodologie" className="hover:text-white">Méthodologie</Link>
          <Link to="/faq" className="hover:text-white">FAQ</Link>
          <Link to="/solidarite" className="hover:text-orange-300">🤝 Entraide</Link>
          <Link to="/messagerie" className="hover:text-indigo-300">💬 Messagerie</Link>
          <Link to="/inscription-pro" className="hover:text-blue-300">💼 Espace Pro</Link>
          <Link to="/gouvernance" className="hover:text-slate-300">Gouvernance</Link>
          <Link to="/presse" className="hover:text-slate-300">Presse</Link>
          <Link to="/versions" className="hover:text-slate-300">Versions</Link>
        </div>
        <p className="text-center text-xs text-slate-600">
          © {new Date().getFullYear()} A KI PRI SA YÉ — Observer, pas vendre. Données citoyennes pour les territoires ultramarins.
        </p>
      </div>
    </footer>
  );
}
