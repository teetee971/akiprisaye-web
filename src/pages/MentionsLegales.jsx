export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0f62fe] to-[#0353e9] p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Mentions Légales</h1>
            <a 
              href="/" 
              className="text-white hover:text-gray-200 transition-colors"
            >
              ← Accueil
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8 space-y-6">
          
          {/* Editor */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Éditeur du site</h2>
            <div className="text-gray-300 space-y-2">
              <p><strong>Nom du site :</strong> A KI PRI SA YÉ</p>
              <p><strong>URL :</strong> <a href="https://akiprisaye.web.app" className="text-blue-400 hover:text-blue-300">https://akiprisaye.web.app</a></p>
              <p><strong>Nature du site :</strong> Application citoyenne de comparaison de prix</p>
              <p><strong>Responsable de publication :</strong> Équipe A KI PRI SA YÉ</p>
            </div>
          </section>

          {/* Hosting */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Hébergement</h2>
            <div className="text-gray-300 space-y-2">
              <p><strong>Hébergeur :</strong> Firebase Hosting (Google LLC)</p>
              <p><strong>Adresse :</strong> 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA</p>
              <p><strong>Site web :</strong> <a href="https://firebase.google.com" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">https://firebase.google.com</a></p>
            </div>
          </section>

          {/* Personal Data */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Données personnelles</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                <strong>A KI PRI SA YÉ</strong> s'engage à protéger la vie privée de ses utilisateurs.
              </p>
              <p>
                <strong>Données collectées :</strong> Les données collectées sont limitées aux informations 
                nécessaires au fonctionnement de l'application (recherches de prix, tickets scannés avec 
                consentement explicite).
              </p>
              <p>
                <strong>Utilisation des données :</strong> Les données sont utilisées uniquement pour améliorer 
                le service et générer des statistiques anonymisées sur les prix.
              </p>
              <p>
                <strong>Droits des utilisateurs :</strong> Conformément au RGPD, vous disposez d'un droit 
                d'accès, de rectification, de suppression et de portabilité de vos données personnelles.
              </p>
              <p>
                Pour exercer ces droits, contactez-nous via le{' '}
                <a href="/contact.html" className="text-blue-400 hover:text-blue-300">
                  formulaire de contact
                </a>.
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Cookies</h2>
            <div className="text-gray-300 space-y-2">
              <p>
                Le site utilise des cookies techniques nécessaires au fonctionnement de l'application 
                (authentification Firebase, préférences utilisateur).
              </p>
              <p>
                Aucun cookie publicitaire ou de traçage n'est utilisé sans votre consentement explicite.
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Propriété intellectuelle</h2>
            <div className="text-gray-300 space-y-2">
              <p>
                Tous les contenus présents sur le site (textes, images, logos, code source) sont protégés 
                par le droit d'auteur et sont la propriété de <strong>A KI PRI SA YÉ</strong> ou de ses partenaires.
              </p>
              <p>
                Toute reproduction, distribution ou utilisation sans autorisation préalable est interdite.
              </p>
            </div>
          </section>

          {/* Liability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Responsabilité</h2>
            <div className="text-gray-300 space-y-2">
              <p>
                Les informations fournies sur le site sont données à titre indicatif. Nous nous efforçons 
                de maintenir les prix à jour, mais ne pouvons garantir l'exactitude absolue en temps réel.
              </p>
              <p>
                <strong>A KI PRI SA YÉ</strong> ne saurait être tenu responsable des erreurs, omissions ou 
                résultats qui pourraient être obtenus suite à l'usage de ces informations.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Contact</h2>
            <div className="text-gray-300">
              <p>
                Pour toute question concernant les mentions légales, contactez-nous via notre{' '}
                <a href="/contact.html" className="text-blue-400 hover:text-blue-300">
                  formulaire de contact
                </a>.
              </p>
            </div>
          </section>

          {/* Last Update */}
          <section className="pt-6 border-t border-gray-700">
            <p className="text-gray-500 text-sm">
              Dernière mise à jour : 9 novembre 2025
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1e1e1e] border-t border-gray-700 mt-12 p-6 text-center text-gray-400">
        <p>© 2025 A KI PRI SA YÉ - Tous droits réservés</p>
        <div className="flex justify-center gap-4 mt-4 text-sm">
          <a href="/" className="hover:text-white transition-colors">
            Accueil
          </a>
          <a href="/contact.html" className="hover:text-white transition-colors">
            Contact
          </a>
          <a href="/faq.html" className="hover:text-white transition-colors">
            FAQ
          </a>
        </div>
      </footer>
    </div>
  );
}
