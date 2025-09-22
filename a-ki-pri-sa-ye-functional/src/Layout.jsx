import { Link, useLocation } from 'react-router-dom'

const navigationItems = [
  { to: '/', label: 'Accueil', icon: '🏠' },
  { to: '/comparateur', label: 'Comparateur', icon: '🛒' },
  { to: '/ocr', label: 'Scanner', icon: '🧾' },
  { to: '/statistics', label: 'Stats', icon: '📊' },
  { to: '/history', label: 'Historique', icon: '📋' },
  { to: '/chat', label: 'Chat IA', icon: '💬' },
  { to: '/import', label: 'Import', icon: '📥' }
]

export default function Layout({ children }){
  const location = useLocation()

  return (
    <div className="min-h-screen gradient text-white">
      <header className="max-w-6xl mx-auto px-6 pt-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192.png" className="w-9 h-9 rounded-xl" alt="A KI PRI SA YÉ Logo"/>
            <span className="text-white/80 text-sm tracking-widest">A KI PRI SA YÉ</span>
          </div>
          <nav className="flex items-center gap-3 text-white/80 text-sm flex-wrap" role="navigation" aria-label="Navigation principale">
            {navigationItems.map((item) => (
              <Link 
                key={item.to}
                to={item.to} 
                className={`hover:text-white px-2 py-1 rounded transition-colors ${
                  location.pathname === item.to ? 'bg-white/10 text-white' : ''
                }`}
                aria-current={location.pathname === item.to ? 'page' : undefined}
              >
                <span className="mr-1" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
      <footer className="max-w-6xl mx-auto px-6 pb-12 text-white/50 text-sm">
        <div className="card p-4">
          <p>© {new Date().getFullYear()} A KI PRI SA YÉ - Comparateur de prix pour les DOM-TOM</p>
          <p className="mt-1 text-xs">Gérez votre budget facilement et trouvez les meilleurs prix locaux</p>
        </div>
      </footer>
    </div>
  )
}