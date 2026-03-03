import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer id="footer" className="border-t border-slate-800 bg-slate-950 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4 text-sm text-slate-400">
        <Link to="/mentions-legales" className="hover:text-white">Mentions légales</Link>
        <Link to="/privacy" className="hover:text-white">Privacy</Link>
        <Link to="/contact" className="hover:text-white">Contact</Link>
        <span>© {new Date().getFullYear()} A KI PRI SA YÉ</span>
      </div>
    </footer>
  );
}
