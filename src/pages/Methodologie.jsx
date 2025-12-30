export default function Methodologie() {
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0f62fe] to-[#0353e9] p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Méthodologie</h1>
            <a 
              href="/" 
              className="text-white hover:text-gray-200 transition-colors"
            >
              ← Accueil
            </a>
          </div>
          <p className="text-gray-100">Comment sont calculés et collectés les prix</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="space-y-8">

          {/* Introduction */}
          <section className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">📊 Transparence totale</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                A KI PRI SA YÉ s'engage à une transparence totale sur la méthodologie de collecte,
                de calcul et d'affichage des prix. Cette page explique en détail comment nous
                travaillons.
              </p>
              <p className="font-semibold text-yellow-400">
                Tout ce qui est affiché sur notre plateforme est soit réel, soit clairement
                identifié comme étant en développement ou en phase de test.
              </p>
            </div>
          </section>

          {/* Data Collection */}
          <section className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">🔍 Collecte des données</h2>
            <div className="text-gray-300 space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Sources de données</h3>
                <p className="mb-3">Nos prix proviennent de plusieurs sources :</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>
                    <strong>Tickets de caisse citoyens :</strong> Les utilisateurs peuvent scanner
                    et partager leurs tickets de caisse (données anonymisées)
                  </li>
                  <li>
                    <strong>Collecte manuelle :</strong> Relevés de prix effectués physiquement
                    dans les magasins par des bénévoles
                  </li>
                  <li>
                    <strong>Partenariats (à venir) :</strong> Accords avec des enseignes pour
                    partage de données tarifaires en temps réel
                  </li>
                  <li>
                    <strong>Open Data :</strong> Données publiques de l'INSEE, DGCCRF et autres
                    organismes officiels
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                <p className="text-yellow-400 font-semibold mb-2">⚠️ Phase actuelle</p>
                <p className="text-sm text-gray-300">
                  Nous sommes actuellement en phase de développement. Les prix affichés proviennent
                  d'un jeu de données de démonstration basé sur des relevés manuels ponctuels.
                  La collecte automatisée et citoyenne sera activée progressivement.
                </p>
              </div>
            </div>
          </section>

          {/* Data Verification */}
          <section className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">✓ Vérification des données</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Chaque prix collecté passe par un processus de vérification avant affichage :
              </p>
              <ol className="list-decimal list-inside ml-4 space-y-2">
                <li><strong>Validation du format :</strong> Code EAN valide, prix cohérent, date récente</li>
                <li><strong>Détection d'anomalies :</strong> Comparaison avec les prix moyens du territoire</li>
                <li><strong>Vérification croisée :</strong> Si possible, confirmation par plusieurs sources</li>
                <li><strong>Horodatage :</strong> Date et heure de collecte systématiquement enregistrées</li>
              </ol>
              <p className="text-sm text-gray-400 mt-4">
                Les prix aberrants (erreurs manifestes) sont automatiquement écartés ou mis en attente
                de vérification manuelle.
              </p>
            </div>
          </section>

          {/* Calculations */}
          <section className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">🧮 Calculs et moyennes</h2>
            <div className="text-gray-300 space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Prix moyen par territoire</h3>
                <p className="text-sm text-gray-400">
                  Moyenne arithmétique simple des prix collectés pour un même produit (EAN identique)
                  dans un territoire donné au cours des 7 derniers jours.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Comparaison avec la France hexagonale</h3>
                <p className="text-sm text-gray-400">
                  Écart calculé en pourcentage : ((Prix DROM - Prix France) / Prix France) × 100
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Alertes prix anormaux</h3>
                <p className="text-sm text-gray-400">
                  Un prix est considéré comme anormalement élevé s'il dépasse de +20% la moyenne
                  territoriale du produit.
                </p>
              </div>
            </div>
          </section>

          {/* Update Frequency */}
          <section className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">🔄 Fréquence de mise à jour</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                La fraîcheur des données est essentielle pour un comparateur de prix pertinent :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Tickets citoyens :</strong> Traités dans les 24h suivant le partage</li>
                <li><strong>Collecte manuelle :</strong> Hebdomadaire pour les produits de base</li>
                <li><strong>Données partenaires (à venir) :</strong> Quotidienne, voire temps réel</li>
                <li><strong>Open Data INSEE :</strong> Mensuelle (selon publication officielle)</li>
              </ul>
              <p className="text-sm text-gray-400 mt-4">
                <strong>Important :</strong> La date de dernière mise à jour est toujours affichée
                pour chaque prix.
              </p>
            </div>
          </section>

          {/* Limitations */}
          <section className="bg-red-900/20 border border-red-700 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-4 text-red-400">⚠️ Limites du service</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                A KI PRI SA YÉ reconnaît honnêtement ses limites actuelles :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>
                  <strong>Couverture incomplète :</strong> Tous les magasins et produits ne sont
                  pas encore référencés
                </li>
                <li>
                  <strong>Données non temps réel :</strong> Les prix peuvent avoir changé depuis
                  la dernière collecte
                </li>
                <li>
                  <strong>Promotions temporaires :</strong> Difficiles à capturer et peuvent fausser
                  les moyennes
                </li>
                <li>
                  <strong>Variations de format :</strong> Un même produit peut exister en plusieurs
                  formats (500g, 1kg, etc.)
                </li>
              </ul>
              <p className="text-yellow-400 font-semibold mt-4">
                Nous travaillons activement à améliorer la couverture et la précision des données.
              </p>
            </div>
          </section>

          {/* Data Sources */}
          <section className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">📚 Sources publiques utilisées</h2>
            <div className="text-gray-300 space-y-2">
              <p className="mb-3">Pour le contexte et l'analyse :</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>
                  <strong>INSEE :</strong> Indices des prix à la consommation dans les DOM
                  <br />
                  <a 
                    href="https://www.insee.fr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    www.insee.fr
                  </a>
                </li>
                <li>
                  <strong>DGCCRF :</strong> Direction générale de la concurrence, de la consommation
                  et de la répression des fraudes
                  <br />
                  <a 
                    href="https://www.economie.gouv.fr/dgccrf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    www.economie.gouv.fr/dgccrf
                  </a>
                </li>
                <li>
                  <strong>Open Food Facts :</strong> Base de données collaborative de produits alimentaires
                  <br />
                  <a 
                    href="https://fr.openfoodfacts.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    fr.openfoodfacts.org
                  </a>
                </li>
              </ul>
            </div>
          </section>

          {/* How to contribute */}
          <section className="bg-green-900/20 border border-green-700 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-4 text-green-400">🤝 Comment contribuer</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                A KI PRI SA YÉ est un projet citoyen. Vous pouvez contribuer de plusieurs manières :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Partager vos tickets de caisse</strong> (fonction scanner à venir)</li>
                <li><strong>Signaler des prix anormaux</strong> ou des erreurs</li>
                <li><strong>Proposer de nouveaux magasins</strong> à référencer</li>
                <li><strong>Contribuer au code source</strong> (projet open-source à venir)</li>
              </ul>
              <p className="mt-4">
                <a 
                  href="/contact" 
                  className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-all"
                >
                  Contribuer au projet
                </a>
              </p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
