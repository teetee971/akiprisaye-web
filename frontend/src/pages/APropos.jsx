import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { Link } from 'react-router-dom';

export default function APropos() {
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Hero banner — real Unsplash photo with gradient fallback */}
      <div className="px-4 pt-6 max-w-4xl mx-auto">
        <HeroImage
          src={PAGE_HERO_IMAGES.aPropos}
          alt="Paysage naturel — territoires d'Outre-mer"
          gradient="from-blue-950 to-indigo-950"
          height="h-44 sm:h-60"
        >
          <div className="flex items-center justify-between w-full">
            <h1 className="text-3xl font-bold text-white drop-shadow">À Propos</h1>
            <Link
              to="/"
              className="text-white/80 hover:text-white transition-colors text-sm"
            >
              ← Accueil
            </Link>
          </div>
        </HeroImage>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="space-y-5">
          
          {/* Mission */}
          <section className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">🎯 Notre Mission</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                <strong>A KI PRI SA YÉ</strong> est un outil citoyen, sérieux, factuel et vérifiable
                pour lutter contre la vie chère dans les territoires d'Outre-mer.
              </p>
              <p>
                Notre plateforme permet de comparer les prix des produits du quotidien dans les
                départements et régions d'Outre-mer (DROM-COM) :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>🇬🇵 Guadeloupe</li>
                <li>🇲🇶 Martinique</li>
                <li>🇬🇫 Guyane</li>
                <li>🇷🇪 La Réunion</li>
                <li>🇾🇹 Mayotte</li>
                <li>🇫🇷 France hexagonale (référence)</li>
              </ul>
            </div>
          </section>

          {/* Philosophy */}
          <section className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">💡 Notre Philosophie</h2>
            <div className="text-gray-300 space-y-3">
              <blockquote className="border-l-4 border-blue-500 pl-4 italic text-lg">
                "Faire peu, mais faire VRAI."
              </blockquote>
              <p>
                A KI PRI SA YÉ n'est pas un gadget. C'est un outil citoyen basé sur des principes clairs :
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span><strong>Transparence totale</strong> : Sources clairement identifiées, méthodologie publique</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span><strong>Données réelles</strong> : Aucun prix inventé, aucune simulation présentée comme réelle</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span><strong>Honnêteté</strong> : Les modules en développement sont clairement identifiés</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span><strong>Indépendance</strong> : Aucun lien avec des enseignes ou marques commerciales</span>
                </li>
              </ul>
            </div>
          </section>

          {/* What we do */}
          <section className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">🛠️ Nos Services</h2>
            <div className="text-gray-300 space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Comparateur de prix</h3>
                <p className="text-gray-400">
                  Comparez les prix des produits du quotidien entre différentes enseignes et territoires.
                  Date de mise à jour et source affichées pour chaque prix.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Carte géographique</h3>
                <p className="text-gray-400">
                  Visualisez les prix moyens par territoire et localisez les magasins participants.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Alertes consommateurs</h3>
                <p className="text-gray-400">
                  Recevez des alertes sur les prix anormalement élevés, les pénuries et les variations brutales.
                  <span className="text-yellow-500 ml-2">(En développement)</span>
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Fil d'actualité</h3>
                <p className="text-gray-400">
                  Suivez l'actualité de l'inflation et de la vie chère, basée uniquement sur des sources publiques
                  (INSEE, DGCCRF, etc.).
                </p>
              </div>
            </div>
          </section>

          {/* What we don't do */}
          <section className="bg-red-900/20 border border-red-700 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-4 text-red-400">❌ Ce que nous ne faisons PAS</h2>
            <div className="text-gray-300 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>Pas de prix inventés ou simulés</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>Pas de fausse intelligence artificielle</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>Pas de promesses impossibles</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>Pas de publicité pour des enseignes</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>Pas de collecte de données personnelles invasive</span>
              </p>
            </div>
          </section>

          {/* Team */}
          <section className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">👥 L'Équipe</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                A KI PRI SA YÉ est développé par une équipe citoyenne bénévole,
                sans but lucratif, avec pour seul objectif d'aider les consommateurs
                ultramarins à mieux gérer leur budget.
              </p>
              <p className="text-sm text-gray-400">
                Nous sommes ouverts aux contributions et aux partenariats avec des
                associations de consommateurs, collectivités locales et institutions
                publiques partageant nos valeurs de transparence et d'indépendance.
              </p>
            </div>
          </section>

          {/* Comparatif concurrence */}
          <section className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">⚖️ Comparatif avec la concurrence</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Vous souhaitez comprendre en quoi A KI PRI SA YÉ se distingue des autres
                comparateurs de prix disponibles ? Consultez notre tableau comparatif
                des fonctionnalités.
              </p>
              <Link
                to="/comparatif-concurrence"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-all"
              >
                Voir le comparatif →
              </Link>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">📧 Contact</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Pour toute question, suggestion ou partenariat :
              </p>
              <Link 
                to="/contact" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all"
              >
                Nous contacter
              </Link>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
