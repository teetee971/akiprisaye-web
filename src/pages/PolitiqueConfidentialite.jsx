import { Link } from 'react-router-dom';

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0f62fe] to-[#0353e9] p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">🔐 Politique de Confidentialité & Protection des Données</h1>
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
        <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8 space-y-8">
          
          {/* General Principle */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">1. Principe général</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                A KI PRI SA YÉ respecte strictement la vie privée de ses utilisateurs.
              </p>
              <p className="bg-[#252525] p-4 rounded-lg border-l-4 border-blue-500">
                ➡️ <strong>Aucune donnée personnelle n'est vendue, louée ou exploitée à des fins publicitaires.</strong>
              </p>
            </div>
          </section>

          {/* Account Creation */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">2. Création de compte (obligatoire)</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                La création d'un compte est requise pour accéder au service afin de garantir :
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>la fiabilité des contributions,</li>
                <li>la traçabilité des données,</li>
                <li>la protection contre les abus.</li>
              </ul>
              <div className="mt-4 bg-[#252525] p-4 rounded-lg">
                <p className="font-semibold mb-2">Données collectées :</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Identifiant de compte</li>
                  <li>Informations techniques de connexion</li>
                </ul>
                <p className="mt-3 text-sm text-blue-400">
                  <strong>Base légale :</strong> intérêt légitime (article 6 RGPD)
                </p>
              </div>
            </div>
          </section>

          {/* Product Scanning */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">3. Scan de produits (EAN)</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Lors du scan d'un code-barres :
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>le code EAN est analysé,</li>
                <li>les informations produits sont issues de bases publiques ou contributives,</li>
                <li>aucune donnée personnelle n'est liée au produit scanné.</li>
              </ul>
              <p className="bg-[#252525] p-4 rounded-lg border-l-4 border-green-500 mt-4">
                ➡️ Le scan EAN ne permet <strong>aucune identification de l'utilisateur</strong>.
              </p>
            </div>
          </section>

          {/* OCR Ingredients */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">4. OCR ingrédients & images</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Lorsque l'utilisateur utilise la fonction de numérisation (OCR) :
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>les images sont utilisées uniquement pour extraire du texte,</li>
                <li>aucune reconnaissance faciale ou biométrique n'est effectuée,</li>
                <li>les images ne sont pas conservées après traitement,</li>
                <li>le texte extrait peut contenir des erreurs.</li>
              </ul>
              <p className="mt-3 text-sm text-blue-400">
                <strong>Base légale :</strong> consentement explicite de l'utilisateur.
              </p>
            </div>
          </section>

          {/* User History */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">5. Historique & données utilisateur</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                L'utilisateur peut consulter son historique personnel de scans et d'alertes.
              </p>
              <div className="bg-[#252525] p-4 rounded-lg border-l-4 border-blue-500 mt-4">
                <p className="font-semibold mb-2">➡️ Cet historique est :</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>personnel,</li>
                  <li>modifiable,</li>
                  <li>supprimable à tout moment par l'utilisateur.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Aggregated Data */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">6. Données agrégées & open-data</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Les données publiées sous forme de statistiques ou d'analyses :
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>sont anonymisées,</li>
                <li>ne permettent pas l'identification d'une personne,</li>
                <li>peuvent être utilisées à des fins d'observation publique.</li>
              </ul>
            </div>
          </section>

          {/* Subscriptions */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">7. Abonnements</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Le service propose plusieurs niveaux d'accès :
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Citoyen</li>
                <li>Professionnel</li>
                <li>Institution</li>
              </ul>
              <p className="mt-4">
                Lorsque les paiements sont activés :
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>ils sont traités par un prestataire de paiement certifié,</li>
                <li>A KI PRI SA YÉ n'a aucun accès aux données bancaires.</li>
              </ul>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">8. Durée de conservation</h2>
            <div className="text-gray-300">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-4 font-semibold text-blue-400">Données</th>
                    <th className="text-left py-3 px-4 font-semibold text-blue-400">Durée</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="py-3 px-4">Compte utilisateur</td>
                    <td className="py-3 px-4">Tant que le compte est actif</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-3 px-4">Historique personnel</td>
                    <td className="py-3 px-4">Supprimable par l'utilisateur</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-3 px-4">Images OCR</td>
                    <td className="py-3 px-4">Non conservées</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-3 px-4">Données agrégées</td>
                    <td className="py-3 px-4">Anonymisées</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Logs techniques</td>
                    <td className="py-3 px-4">Maximum 12 mois</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">9. Droits des utilisateurs</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Conformément au RGPD, chaque utilisateur dispose des droits suivants :
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>droit d'accès,</li>
                <li>droit de rectification,</li>
                <li>droit à l'effacement,</li>
                <li>droit d'opposition,</li>
                <li>droit au retrait du consentement.</li>
              </ul>
              <p className="mt-4 bg-[#252525] p-4 rounded-lg">
                Toute demande peut être effectuée via l'adresse de contact :{' '}
                <a href="mailto:contact@akiprisaye.fr" className="text-blue-400 hover:text-blue-300">
                  contact@akiprisaye.fr
                </a>
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">10. Cookies & traceurs</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Le service utilise uniquement des cookies strictement nécessaires à son fonctionnement et à la sécurité.
              </p>
              <p className="bg-[#252525] p-4 rounded-lg border-l-4 border-green-500">
                ➡️ <strong>Aucun cookie publicitaire ou de suivi comportemental n'est utilisé.</strong>
              </p>
            </div>
          </section>

          {/* Policy Updates */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">11. Évolution de la politique</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Cette politique peut être mise à jour afin de rester conforme aux évolutions légales et techniques.
              </p>
              <p>
                Les utilisateurs seront informés en cas de modification substantielle.
              </p>
            </div>
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
          <Link to="/mentions-legales" className="hover:text-white transition-colors">
            Mentions Légales
          </Link>
        </div>
      </footer>
    </div>
  );
}
