import { useState } from 'react';
import { Link } from 'react-router-dom';
import ScrollToTop from '../components/ScrollToTop';
import PWAInstallToast from '../components/PWAInstallToast';
import StructuredData from '../components/StructuredData';
import BackgroundMapBlur from '../components/BackgroundMapBlur';

export default function Home() {
  const [lang, setLang] = useState('fr');

  const content = {
    fr: {
      title: 'Comparer. Comprendre. Dépenser moins.',
      subtitle: 'Données réelles. Prix locaux. Décisions éclairées.',
      cta1: 'Créer une liste de courses',
      cta2: 'Comparer autour de moi',
      feature1Title: 'Comparateur de prix',
      feature1Desc: 'Données officielles et prix locaux vérifiés',
      feature2Title: 'Scanner de ticket',
      feature2Desc: 'Reconnaissance automatique pour suivre vos dépenses',
      feature3Title: 'Carte interactive',
      feature3Desc: 'Magasins proches avec distances réelles',
      feature4Title: 'Alertes citoyennes',
      feature4Desc: 'Variations de prix et disponibilité des produits',
      mission: 'Mission',
      missionText: 'Plateforme citoyenne dédiée à la transparence des prix en Outre-mer',
      missionDesc: 'Aucun prix inventé. Aucune promesse marketing. Uniquement des données réelles pour vous aider à mieux gérer votre budget.',
    },
    gp: {
      title: 'Konparé. Konprann. Dépansé mwens.',
      subtitle: 'Doné réyèl. Pri lokal. Désizyòn éklaré.',
      cta1: 'Kréyé on lis kous',
      cta2: 'Konparé otou mwen',
      feature1Title: 'Konparatè pri',
      feature1Desc: 'Doné ofisyèl é pri lokal vérifié',
      feature2Title: 'Skannè tiké',
      feature2Desc: 'Rékonesans otomatik pou swiv dépans-w',
      feature3Title: 'Kat entèraktif',
      feature3Desc: 'Magazen pwoch ek distans réyèl',
      feature4Title: 'Alèt sitwayèn',
      feature4Desc: 'Varyasyòn pri é disponibilité pwodui',
      mission: 'Misyòn',
      missionText: 'Platfòm sitwayèn pou transparans pri an Lòtremè',
      missionDesc: 'Pyès pri envanté. Pyès pwomès maketing. Sèlman doné réyèl pou éd-w jéré bidjé-w.',
    },
    es: {
      title: 'Comparar. Comprender. Gastar menos.',
      subtitle: 'Datos reales. Precios locales. Decisiones informadas.',
      cta1: 'Crear una lista de compras',
      cta2: 'Comparar cerca de mí',
      feature1Title: 'Comparador de precios',
      feature1Desc: 'Datos oficiales y precios locales verificados',
      feature2Title: 'Escáner de ticket',
      feature2Desc: 'Reconocimiento automático para rastrear sus gastos',
      feature3Title: 'Mapa interactivo',
      feature3Desc: 'Tiendas cercanas con distancias reales',
      feature4Title: 'Alertas ciudadanas',
      feature4Desc: 'Variaciones de precios y disponibilidad de productos',
      mission: 'Misión',
      missionText: 'Plataforma ciudadana dedicada a la transparencia de precios en Ultramar',
      missionDesc: 'Sin precios inventados. Sin promesas de marketing. Solo datos reales para ayudarle a gestionar mejor su presupuesto.',
    },
  };

  const t = content[lang];

  return (
    <div className="flex flex-col min-h-screen max-w-[100vw] overflow-x-hidden">
      {/* SEO Structured Data */}
      <StructuredData />
      
      {/* Chic Background - Blurred map at 20% opacity */}
      <BackgroundMapBlur />
      
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 bg-[color:var(--accent-primary)] text-white rounded-lg shadow-lg"
      >
        Aller au contenu principal
      </a>
      
      {/* Hero Section - Minimal & Institutional */}
      <section className="border-b border-[color:var(--glass-border)]">
          <div className="container-civic py-16 sm:py-24 text-center">
            <div className="flex justify-end mb-6">
              <select
                className="glass px-3 py-2 text-sm"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                aria-label="Sélectionner la langue"
              >
                <option value="fr">Français</option>
                <option value="gp">Kréyol</option>
                <option value="es">Español</option>
              </select>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[color:var(--text-main)] mb-6 leading-tight">
              {t.title}
            </h1>
            <p className="text-xl sm:text-2xl text-[color:var(--text-muted)] mb-12 max-w-3xl mx-auto">
              {t.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/liste-courses"
                className="btn-civic-primary"
              >
                {t.cta1}
              </Link>
              <Link
                to="/carte"
                className="btn-civic"
              >
                {t.cta2}
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section - Clean Cards */}
        <main id="main-content" className="flex-grow py-16 px-4 sm:px-6 lg:px-8">
          <div className="container-civic">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/comparateur"
                className="glass p-6 hover:border-[color:var(--accent-primary)]"
              >
                <h3 className="text-xl font-semibold text-[color:var(--text-main)] mb-2">{t.feature1Title}</h3>
                <p className="text-sm text-[color:var(--text-muted)]">{t.feature1Desc}</p>
              </Link>

              <Link
                to="/scan"
                className="glass p-6 hover:border-[color:var(--accent-primary)]"
              >
                <h3 className="text-xl font-semibold text-[color:var(--text-main)] mb-2">{t.feature2Title}</h3>
                <p className="text-sm text-[color:var(--text-muted)]">{t.feature2Desc}</p>
              </Link>

              <Link
                to="/carte"
                className="glass p-6 hover:border-[color:var(--accent-primary)]"
              >
                <h3 className="text-xl font-semibold text-[color:var(--text-main)] mb-2">{t.feature3Title}</h3>
                <p className="text-sm text-[color:var(--text-muted)]">{t.feature3Desc}</p>
              </Link>

              <Link
                to="/alertes"
                className="glass p-6 hover:border-[color:var(--accent-primary)]"
              >
                <h3 className="text-xl font-semibold text-[color:var(--text-main)] mb-2">{t.feature4Title}</h3>
                <p className="text-sm text-[color:var(--text-muted)]">{t.feature4Desc}</p>
              </Link>
            </div>
          </div>
        </main>

        {/* Mission Section - Institutional */}
        <section className="border-t border-[color:var(--glass-border)] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-semibold text-[color:var(--text-main)] mb-6">{t.mission}</h2>
            <p className="text-lg text-[color:var(--text-main)] mb-4">
              {t.missionText}
            </p>
            <p className="text-[color:var(--text-muted)] mb-8">
              {t.missionDesc}
            </p>
            
            {/* Data Source Panel - Trust & Transparency */}
            <div className="panel-source max-w-2xl mx-auto mb-8">
              <strong>Sources officielles :</strong> OPMR (Observatoire des Prix et des Marges), 
              INSEE, DGCCRF, relevés terrain partenaires. 
              Données indicatives uniquement.
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                to="/a-propos"
                className="btn-civic"
              >
                En savoir plus
              </Link>
              <Link
                to="/methodologie"
                className="btn-civic"
              >
                Notre méthodologie
              </Link>
            </div>
          </div>
        </section>
      
      {/* PWA Install Toast */}
      <PWAInstallToast />
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}
