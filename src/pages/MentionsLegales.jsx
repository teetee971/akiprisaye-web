import { Link } from 'react-router-dom';

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0f62fe] to-[#0353e9] p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">⚖️ Mentions Légales</h1>
            <Link 
              to="/" 
              className="text-white hover:text-gray-200 transition-colors"
            >
              ← Accueil
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8 space-y-6">
          
          {/* Service title */}
          <section>
            <h2 className="text-3xl font-bold mb-4 text-blue-400">A KI PRI SA YÉ</h2>
          </section>

          {/* Editor */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Éditeur du service</h2>
            <div className="text-gray-300 space-y-2">
              <p>
                A KI PRI SA YÉ est une plateforme numérique citoyenne d'observation, de comparaison et d'analyse des prix.
              </p>
              <p>
                Le service est exploité dans un cadre non publicitaire, non commercial, à vocation d'intérêt général.
              </p>
              <p className="mt-4">
                <strong>Responsable du traitement des données :</strong><br />
                Éditeur du service A KI PRI SA YÉ
              </p>
              <p className="mt-4">
                <strong>Contact :</strong><br />
                📧 <a href="mailto:contact@akiprisaye.fr" className="text-blue-400 hover:text-blue-300">contact@akiprisaye.fr</a>
              </p>
            </div>
          </section>

          {/* Hosting */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Hébergement</h2>
            <div className="text-gray-300 space-y-2">
              <p>
                Le service est hébergé sur des infrastructures sécurisées situées dans l'Union européenne, 
                via des prestataires conformes au RGPD (ex. Cloudflare, Firebase / Google Cloud).
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Propriété intellectuelle</h2>
            <div className="text-gray-300 space-y-2">
              <p>
                L'ensemble des contenus (textes, interfaces, données agrégées, visuels) est protégé par 
                le droit de la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction ou réutilisation non autorisée est interdite, sauf dans le cadre des 
                usages explicitement ouverts (open-data).
              </p>
            </div>
          </section>

          {/* Link to privacy policy */}
          <section className="bg-[#252525] rounded-lg p-6 border border-blue-500/30">
            <h2 className="text-xl font-semibold mb-3 text-blue-400">Protection des données personnelles</h2>
            <p className="text-gray-300">
              Pour plus d'informations sur la protection de vos données personnelles et votre vie privée, 
              consultez notre{' '}
              <Link to="/politique-confidentialite" className="text-blue-400 hover:text-blue-300 font-semibold underline">
                Politique de Confidentialité
              </Link>.
            </p>
          </section>

          {/* Last Update */}
          <section className="pt-6 border-t border-gray-700">
            <p className="text-gray-500 text-sm">
              Dernière mise à jour : 2 janvier 2026
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1e1e1e] border-t border-gray-700 mt-12 p-6 text-center text-gray-400">
        <p>© {new Date().getFullYear()} A KI PRI SA YÉ - Tous droits réservés</p>
        <div className="flex justify-center gap-4 mt-4 text-sm flex-wrap">
          <Link to="/" className="hover:text-white transition-colors">
            Accueil
          </Link>
          <Link to="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
          <Link to="/faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
          <Link to="/politique-confidentialite" className="hover:text-white transition-colors">
            Politique de Confidentialité
          </Link>
        </div>
      </footer>
    </div>
  );
}
