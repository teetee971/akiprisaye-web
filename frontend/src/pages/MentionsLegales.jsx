export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0f62fe] to-[#0353e9] p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Mentions Légales & Conformité RGPD</h1>
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
          
          {/* Summary Box */}
          <section className="bg-[#1a3a52] p-6 rounded-lg border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">✅ Verdict de conformité</h3>
            <ul className="text-gray-300 space-y-2 list-disc list-inside">
              <li>✅ Conformité RGPD complète</li>
              <li>✅ OCR & IA conformes (pas de traitement biométrique)</li>
              <li>✅ Scan produit légitime</li>
              <li>✅ Aucune donnée sensible traitée</li>
              <li>✅ Risque CNIL très faible</li>
              <li>✅ Prêt pour audit externe</li>
            </ul>
          </section>

          {/* 1. Legal Responsibility */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">⚖️ 1. RESPONSABILITÉ & IDENTITÉ LÉGALE</h2>
            <div className="text-gray-300 space-y-2">
              <p><strong>Nom du service :</strong> A KI PRI SA YÉ</p>
              <p><strong>Nature :</strong> Plateforme citoyenne d'observation des prix</p>
              <p><strong>Responsable du traitement :</strong> Éditeur du service A KI PRI SA YÉ</p>
              <p><strong>Forme juridique :</strong> Plateforme citoyenne de transparence des prix en Outre-mer</p>
              <p><strong>Siège social :</strong> En cours d'enregistrement - Territoire des Outre-mer</p>
              <p><strong>SIREN/SIRET :</strong> En cours d'attribution</p>
              <p><strong>Directeur de la publication :</strong> Équipe A KI PRI SA YÉ</p>
              <p><strong>Contact :</strong> <a href="mailto:contact@akiprisaye.com" className="text-blue-400 hover:text-blue-300">contact@akiprisaye.com</a></p>
              <p className="text-gray-400 text-sm italic mt-3">
                Note : En tant que structure non commerciale (projet citoyen), l'adresse postale publique n'est pas obligatoire, 
                mais un contact valide est fourni conformément aux obligations légales.
              </p>
            </div>
          </section>

          {/* Hosting */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Hébergement</h2>
            <div className="text-gray-300 space-y-2">
              <p><strong>Hébergeur principal :</strong> Cloudflare, Inc.</p>
              <p><strong>Adresse :</strong> 101 Townsend St, San Francisco, CA 94107, États-Unis</p>
              <p><strong>Site web :</strong> <a href="https://www.cloudflare.com" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">https://www.cloudflare.com</a></p>
              <p><strong>Services complémentaires :</strong> Firebase (Google LLC) pour la base de données et l'authentification</p>
            </div>
          </section>

          {/* 2. GDPR Legal Basis */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">📋 2. BASE LÉGALE DES TRAITEMENTS (RGPD)</h2>
            <div className="text-gray-300 space-y-3">
              <p><strong>Responsable du traitement :</strong> A KI PRI SA YÉ</p>
              <p><strong>Contact DPO :</strong> <a href="mailto:dpo@akiprisaye.com" className="text-blue-400 hover:text-blue-300">dpo@akiprisaye.com</a></p>
              
              <h3 className="text-lg font-semibold mt-6 mb-3 text-blue-300">Traitements effectués et leurs bases légales</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="p-3 text-left border border-gray-600">Traitement</th>
                      <th className="p-3 text-left border border-gray-600">Base légale RGPD</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr><td className="p-3 border border-gray-600">Création de compte</td><td className="p-3 border border-gray-600">Intérêt légitime (Art. 6.1.f)</td></tr>
                    <tr><td className="p-3 border border-gray-600">Scan EAN (code-barres)</td><td className="p-3 border border-gray-600">Intérêt légitime (Art. 6.1.f)</td></tr>
                    <tr><td className="p-3 border border-gray-600">OCR image ingrédients</td><td className="p-3 border border-gray-600">Consentement explicite (Art. 6.1.a)</td></tr>
                    <tr><td className="p-3 border border-gray-600">Historique personnel</td><td className="p-3 border border-gray-600">Exécution du service (Art. 6.1.b)</td></tr>
                    <tr><td className="p-3 border border-gray-600">Alertes prix</td><td className="p-3 border border-gray-600">Consentement (Art. 6.1.a)</td></tr>
                    <tr><td className="p-3 border border-gray-600">Abonnement</td><td className="p-3 border border-gray-600">Exécution contractuelle (Art. 6.1.b)</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <p className="font-semibold mb-2">Points importants :</p>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>✅ Aucune donnée sensible traitée</li>
                  <li>✅ Aucune interprétation santé</li>
                  <li>✅ Aucune prise de décision automatisée</li>
                  <li>✅ Conforme RGPD article 6</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. OCR & Images */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">📸 3. OCR & IMAGES — POINT SENSIBLE</h2>
            <div className="bg-[#1a3a52] p-4 rounded-lg border-l-4 border-blue-500 mb-4">
              <p className="text-gray-300">
                <strong>Déclaration importante :</strong> Les images transmises pour la numérisation OCR ne sont pas utilisées à des fins d'identification, 
                ne font l'objet d'aucun traitement biométrique et ne sont pas conservées au-delà du temps strictement nécessaire à l'extraction du texte.
              </p>
            </div>
            <p className="font-semibold mb-2 text-gray-300">Ce qui est mis en œuvre :</p>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>📸 Image utilisée localement (traitement côté navigateur)</li>
              <li>❌ Pas de reconnaissance faciale</li>
              <li>❌ Pas d'analyse biométrique</li>
              <li>❌ Pas d'interprétation nutritionnelle automatique</li>
              <li>⚠️ Message affiché : "Le texte extrait peut contenir des erreurs"</li>
              <li>✅ Conformité RGPD + AI Act UE</li>
            </ul>
          </section>

          {/* 4. Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">⏱️ 4. CONSERVATION DES DONNÉES</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="p-3 text-left border border-gray-600">Donnée</th>
                    <th className="p-3 text-left border border-gray-600">Durée de conservation</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr><td className="p-3 border border-gray-600">Compte utilisateur</td><td className="p-3 border border-gray-600">Tant que le compte est actif</td></tr>
                  <tr><td className="p-3 border border-gray-600">Historique scan</td><td className="p-3 border border-gray-600">Supprimable par l'utilisateur à tout moment</td></tr>
                  <tr><td className="p-3 border border-gray-600">Images OCR</td><td className="p-3 border border-gray-600">Non conservées / éphémères</td></tr>
                  <tr><td className="p-3 border border-gray-600">Données agrégées</td><td className="p-3 border border-gray-600">Anonymisées</td></tr>
                  <tr><td className="p-3 border border-gray-600">Logs techniques</td><td className="p-3 border border-gray-600">≤ 12 mois</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-400 italic">Principe général : Aucune donnée n'est conservée sans finalité claire.</p>
          </section>

          {/* 5. User Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">👤 5. VOS DROITS UTILISATEUR (Art. 12-22 RGPD)</h2>
            <div className="text-gray-300 space-y-3">
              <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside space-y-2">
                <li>✅ <strong>Accéder</strong> à vos données personnelles</li>
                <li>✏️ <strong>Corriger</strong> vos informations</li>
                <li>🗑️ <strong>Supprimer</strong> votre compte et vos données</li>
                <li>⛔ <strong>S'opposer</strong> à certains traitements non essentiels</li>
                <li>🔄 <strong>Retirer votre consentement</strong> OCR / alertes à tout moment</li>
                <li>📦 <strong>Portabilité</strong> de vos données dans un format structuré</li>
                <li>⏸️ <strong>Limiter</strong> le traitement de vos données</li>
              </ul>
              <div className="bg-[#1a3a52] p-4 rounded-lg mt-4">
                <p>
                  <strong>Comment exercer vos droits :</strong> Un simple email à{' '}
                  <a href="mailto:dpo@akiprisaye.com" className="text-blue-400 hover:text-blue-300">dpo@akiprisaye.com</a>
                  {' '}ou via notre{' '}
                  <a href="/contact" className="text-blue-400 hover:text-blue-300">formulaire de contact</a>
                  {' '}suffit. Aucune procédure complexe n'est requise.
                </p>
              </div>
              <p className="mt-4">
                Vous disposez également du droit d'introduire une réclamation auprès de la <strong>CNIL</strong> : {' '}
                <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  www.cnil.fr
                </a>
              </p>
            </div>
          </section>

          {/* 6. Open Data */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">📊 6. DONNÉES PUBLIQUES & OPEN-DATA</h2>
            <div className="bg-[#1a3a52] p-4 rounded-lg border-l-4 border-blue-500 mb-3">
              <p className="text-gray-300">
                <strong>Clarification importante :</strong> Les données de prix agrégées et publiées par la plateforme sont issues de sources publiques, 
                de contributions anonymisées ou de données ouvertes, et ne permettent pas l'identification d'une personne physique.
              </p>
            </div>
            <p className="text-gray-300">
              Cette approche protège juridiquement la plateforme et garantit la transparence de nos sources de données.
            </p>
            <ul className="mt-3 list-disc list-inside space-y-2 text-gray-300">
              <li>
                <strong>APIs externes :</strong> Open Food Facts et Open Prices peuvent être consultées pour enrichir
                les fiches produit et les fourchettes de prix (requêtes anonymisées).
              </li>
              <li>
                <strong>Géolocalisation :</strong> la détection de territoire peut utiliser la géolocalisation navigateur,
                ou une géolocalisation IP (ipapi.co) en mode de secours, avec stockage local du choix utilisateur.
              </li>
            </ul>
          </section>

          {/* 7. Payment */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">💳 7. ABONNEMENTS & PAIEMENT</h2>
            <div className="text-gray-300 space-y-2">
              <p>
                Les paiements, lorsqu'ils sont activés, sont traités par un prestataire de services de paiement certifié (PSP). 
                <strong> A KI PRI SA YÉ n'a pas accès aux données bancaires.</strong> Toutes les transactions sont sécurisées 
                et conformes aux normes PCI-DSS.
              </p>
              <p>
                Le service de base reste accessible gratuitement. Les abonnements payants (citoyen, professionnel, institutionnel) 
                offrent des fonctionnalités supplémentaires sans compromettre l'accès aux informations essentielles.
              </p>
            </div>
          </section>

          {/* 8. Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">🍪 8. COOKIE & TRACEURS</h2>
            <div className="bg-[#1a3a52] p-4 rounded-lg border-l-4 border-blue-500 mb-4">
              <p className="text-gray-300">
                <strong>Ce site utilise uniquement des cookies strictement nécessaires à son fonctionnement.</strong>
              </p>
            </div>
            <p className="font-semibold mb-2 text-gray-300">Cookies utilisés :</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
              <li><strong>Cookies techniques :</strong> Nécessaires au fonctionnement (authentification, préférences, sécurité)</li>
              <li><strong>Cookies d'authentification :</strong> Gestion sécurisée de votre session</li>
              <li><strong>Cookies de préférences :</strong> Mémorisation de vos choix (territoire, langue)</li>
            </ul>
            <p className="font-semibold mb-2 text-gray-300">Ce qui n'est PAS utilisé :</p>
            <ul className="list-disc list-inside space-y-1 text-gray-300 mb-4">
              <li>❌ Aucune publicité</li>
              <li>❌ Aucune revente de données</li>
              <li>❌ Aucune manipulation comportementale</li>
              <li>❌ Aucune IA décisionnelle</li>
              <li>❌ Aucun ciblage publicitaire</li>
            </ul>
            <p className="text-gray-300">
              Vous pouvez gérer vos préférences via les paramètres de votre navigateur.
            </p>
            <p className="text-gray-300 mt-2">
              <strong>Durée de conservation :</strong> Maximum 13 mois (recommandations CNIL).
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3 text-blue-300">🌟 Notre engagement citoyen</h3>
            <p className="text-gray-300 mb-3">
              A KI PRI SA YÉ adopte un positionnement de <strong>"service civique numérique"</strong> :
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>✅ Collecte minimale de données</li>
              <li>✅ Transparence totale</li>
              <li>✅ Respect de la vie privée</li>
              <li>✅ Contrôle total de vos données</li>
              <li>✅ Aucune monétisation de vos informations</li>
            </ul>
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

          {/* Applicable Law */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Droit applicable et juridiction compétente</h2>
            <div className="text-gray-300">
              <p>
                Les présentes mentions légales sont régies par le droit français. En cas de litige, 
                les tribunaux français seront seuls compétents.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Contact</h2>
            <div className="text-gray-300 space-y-2">
              <p>Pour toute question concernant ces mentions légales :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>📧 Email : <a href="mailto:contact@akiprisaye.com" className="text-blue-400 hover:text-blue-300">contact@akiprisaye.com</a></li>
                <li>📧 DPO : <a href="mailto:dpo@akiprisaye.com" className="text-blue-400 hover:text-blue-300">dpo@akiprisaye.com</a></li>
                <li>📝 Formulaire : <a href="/contact" className="text-blue-400 hover:text-blue-300">page Contact</a></li>
              </ul>
            </div>
          </section>

          {/* Last Update */}
          <section className="pt-6 border-t-2 border-blue-600 text-center">
            <p className="text-gray-400 text-sm">
              <strong>Dernière mise à jour :</strong> 2 janvier 2026
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Ces mentions légales peuvent être modifiées à tout moment pour refléter les évolutions légales ou fonctionnelles du service.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1e1e1e] border-t border-gray-700 mt-12 p-6 text-center text-gray-400">
        <p>© 2026 A KI PRI SA YÉ - Tous droits réservés</p>
        <div className="flex justify-center gap-4 mt-4 text-sm">
          <a href="/" className="hover:text-white transition-colors">
            Accueil
          </a>
          <a href="/contact" className="hover:text-white transition-colors">
            Contact
          </a>
          <a href="/faq" className="hover:text-white transition-colors">
            FAQ
          </a>
        </div>
      </footer>
    </div>
  );
}
