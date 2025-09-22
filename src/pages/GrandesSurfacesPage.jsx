import GrandesSurfacesDOMTOM from '../components/GrandesSurfacesDOMTOM';

const GrandesSurfacesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Header */}
      <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🛒</div>
              <h1 className="text-xl font-bold text-white">A KI PRI SA YÉ</h1>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-slate-300 hover:text-white transition-colors">Accueil</a>
              <a href="/comparateur.html" className="text-slate-300 hover:text-white transition-colors">Comparateur</a>
              <a href="#" className="text-sky-400 font-medium">Grandes Surfaces</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Grandes Surfaces DOM-TOM
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Explorez toutes les enseignes présentes dans les territoires d'outre-mer français. 
              Filtrez par région, découvrez les suggestions d'amélioration et planifiez vos achats intelligemment.
            </p>
          </div>

          {/* Component */}
          <GrandesSurfacesDOMTOM />

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <div className="bg-slate-800/50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                🚀 Fonctionnalités à venir
              </h3>
              <p className="text-slate-400 mb-6">
                Cette interface évoluera constamment pour répondre aux besoins des consommateurs ultramarins.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-sky-900/20 rounded-lg p-4">
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-semibold text-white">Géolocalisation</h4>
                  <p className="text-sm text-slate-400">Trouvez les magasins les plus proches</p>
                </div>
                <div className="bg-sky-900/20 rounded-lg p-4">
                  <div className="text-2xl mb-2">📊</div>
                  <h4 className="font-semibold text-white">Analytics</h4>
                  <p className="text-sm text-slate-400">Statistiques et tendances locales</p>
                </div>
                <div className="bg-sky-900/20 rounded-lg p-4">
                  <div className="text-2xl mb-2">🔔</div>
                  <h4 className="font-semibold text-white">Alertes</h4>
                  <p className="text-sm text-slate-400">Notifications personnalisées</p>
                </div>
                <div className="bg-sky-900/20 rounded-lg p-4">
                  <div className="text-2xl mb-2">🤝</div>
                  <h4 className="font-semibold text-white">Communauté</h4>
                  <p className="text-sm text-slate-400">Partage et entraide locale</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-slate-400">
            <p className="mb-2">
              © 2024 A KI PRI SA YÉ - Lutte contre la vie chère dans les DOM-TOM
            </p>
            <p className="text-sm">
              Données mises à jour régulièrement • 
              <a href="/contact.html" className="text-sky-400 hover:text-sky-300 ml-1">Contact</a> • 
              <a href="/mentions.html" className="text-sky-400 hover:text-sky-300 ml-1">Mentions légales</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GrandesSurfacesPage;