export default function Hero() {
  return (
    <header className="hero">
      <div className="container">
        <div className="brand">
          <img 
            src="/logo.webp" 
            alt="Logo A KI PRI SA YÉ" 
            onError={(e) => {e.target.src = '/logo_hd_4k.png'}}
          />
          <h1>A KI PRI SA YÉ</h1>
        </div>

        <p className="hero-sub">
          Comparez les prix, suivez votre budget et trouvez l'enseigne la moins chère dans votre zone.
          Conçu pour les DROM-COM, simple et ultra-rapide.
        </p>

        <a className="cta" href="#telechargement">📥 Télécharger l'app</a>

        <div className="grid features">
          <div className="card">
            <h3>🔎 Comparateur en temps réel</h3>
            <p>Comparez les prix entre enseignes et trouvez les meilleures offres près de chez vous.</p>
          </div>
          
          <div className="card">
            <h3>📊 Suivi de budget</h3>
            <p>Gardez le contrôle de vos dépenses avec nos outils de suivi personnalisés.</p>
          </div>
          
          <div className="card">
            <h3>🌴 Spécial DROM-COM</h3>
            <p>Une solution adaptée aux spécificités des territoires d'outre-mer.</p>
          </div>
        </div>
      </div>
    </header>
  );
}