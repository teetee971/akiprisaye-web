import { Link } from 'react-router-dom'
export default function Layout({ children }){
  return (
    <div className="min-h-screen gradient text-white">
      <header className="max-w-6xl mx-auto px-6 pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192.png" className="w-9 h-9 rounded-xl" alt="Logo"/>
            <span className="text-white/80 text-sm tracking-widest">A KI PRI SA YÉ</span>
          </div>
          <nav className="flex items-center gap-4 text-white/80">
            <Link to="/" className="hover:text-white">Accueil</Link>
            <Link to="/chat" className="hover:text-white">Chat IA</Link>
            <Link to="/ocr" className="hover:text-white">OCR</Link>
            <Link to="/comparateur" className="hover:text-white">Comparateur</Link>
            <Link to="/import" className="hover:text-white">Importer</Link>
          </nav>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      <footer className="max-w-6xl mx-auto px-6 pb-12 text-white/50 text-sm">
        <div className="card p-4"><p>© {new Date().getFullYear()} A KI PRI SA YÉ</p></div>
      </footer>
    </div>
  )
}