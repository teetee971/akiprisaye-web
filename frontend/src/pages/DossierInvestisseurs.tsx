/**
 * DossierInvestisseurs — Dossier investisseurs complet A KI PRI SA YÉ
 *
 * Structure conforme à l'Issue #503 :
 *   1. Executive Summary
 *   2. Problématique réelle & contexte
 *   3. Solution A KI PRI SA YÉ
 *   4. Marché & opportunité
 *   5. Modèle économique
 *   6. Traction & indicateurs
 *   7. Avantage concurrentiel
 *   8. Technologie & architecture
 *   9. Stratégie de déploiement
 *  10. Équipe & gouvernance
 *  11. Besoins de financement
 *  12. Risques & maîtrise
 *  13. Vision à 3–5 ans
 *
 * ⚠️  Règles absolues respectées :
 *   - Aucun chiffre inventé
 *   - Hypothèses clairement identifiées
 *   - Phase pilote indiquée là où les métriques sont absentes
 *   - Pas de promesses irréalistes
 */

import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  FileText,
  TrendingUp,
  Globe,
  BarChart3,
  Shield,
  Cpu,
  Map,
  Users,
  Wallet,
  AlertTriangle,
  Eye,
  ChevronRight,
  Printer,
  ExternalLink,
  ArrowUp,
} from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ── Section config ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'executive-summary', label: 'Executive Summary', icon: FileText },
  { id: 'problematique', label: 'Problématique & contexte', icon: AlertTriangle },
  { id: 'solution', label: 'Solution', icon: Eye },
  { id: 'marche', label: 'Marché & opportunité', icon: Globe },
  { id: 'modele-economique', label: 'Modèle économique', icon: Wallet },
  { id: 'traction', label: 'Traction & indicateurs', icon: TrendingUp },
  { id: 'avantage', label: 'Avantage concurrentiel', icon: Shield },
  { id: 'technologie', label: 'Technologie & architecture', icon: Cpu },
  { id: 'deploiement', label: 'Stratégie de déploiement', icon: Map },
  { id: 'equipe', label: 'Équipe & gouvernance', icon: Users },
  { id: 'financement', label: 'Besoins de financement', icon: BarChart3 },
  { id: 'risques', label: 'Risques & maîtrise', icon: AlertTriangle },
  { id: 'vision', label: 'Vision à 3–5 ans', icon: TrendingUp },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function DossierInvestisseurs() {
  const [activeSection, setActiveSection] = useState('executive-summary');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  // Track active section with IntersectionObserver (works on mobile touch)
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Show/hide the back-to-top button
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll mobile nav tab into view when active section changes
  useEffect(() => {
    const nav = mobileNavRef.current;
    if (!nav) return;
    const btn = nav.querySelector<HTMLElement>(`[data-id="${activeSection}"]`);
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeSection]);

  function scrollTo(id: string) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <Helmet>
        <title>Dossier Investisseurs — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Dossier investisseurs complet A KI PRI SA YÉ : observatoire des prix ultramarins, modèle économique, technologie, stratégie de déploiement."
        />
        <link
          rel="canonical"
          href="https://teetee971.github.io/akiprisaye-web/dossier-investisseurs"
        />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/dossier-investisseurs"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/dossier-investisseurs"
        />
      </Helmet>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <HeroImage
          src={PAGE_HERO_IMAGES.dossierInvestisseurs}
          alt="Dossier Investisseurs"
          gradient="from-slate-950 to-indigo-900"
          height="h-40 sm:h-52"
        >
          <div className="flex items-start justify-between w-full flex-wrap gap-3">
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
                📊 Dossier Investisseurs
              </h1>
              <p
                style={{
                  margin: '0.25rem 0 0',
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.75)',
                }}
              >
                Présentation complète pour les investisseurs et partenaires institutionnels
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition print:hidden whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Imprimer /</span> PDF
            </button>
          </div>
        </HeroImage>
      </div>

      {/* Disclaimer */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <div className="bg-amber-900/40 border border-amber-700/50 rounded-xl px-5 py-4 text-sm text-amber-200 print:border-amber-400 print:text-amber-900 print:bg-amber-50">
          <strong>Avertissement :</strong> Ce document présente le projet A KI PRI SA YÉ à
          destination d'investisseurs potentiels. Il ne contient aucun chiffre inventé. Les éléments
          prévisionnels sont présentés comme des hypothèses de travail et clairement identifiés
          comme tels. Ce document ne constitue pas une sollicitation d'investissement au sens
          réglementaire.
        </div>
      </div>

      {/* Mobile section navigation — horizontal scroll tabs (hidden on lg+) */}
      <div
        ref={mobileNavRef}
        className="lg:hidden sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 print:hidden"
      >
        <div className="flex overflow-x-auto gap-1 px-3 py-2 scrollbar-hide">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              data-id={s.id}
              onClick={() => scrollTo(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0
                ${
                  activeSection === s.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <s.icon className="w-3 h-3" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar navigation — hidden on print */}
        <nav className="hidden lg:block w-56 flex-shrink-0 print:hidden">
          <div className="sticky top-4 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
              Sommaire
            </p>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition
                  ${
                    activeSection === s.id
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <s.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-8 pb-12">
          {/* ── 1. EXECUTIVE SUMMARY ──────────────────────────────────────── */}
          <Section id="executive-summary" number="01" title="Executive Summary" icon={FileText}>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>A KI PRI SA YÉ</strong> est une plateforme numérique d'observation et de
              comparaison des prix dans les territoires français d'Outre-mer. Son nom, en créole
              guadeloupéen, signifie <em>« A quel prix est-ce ? »</em> — une question quotidienne
              qui résume la réalité économique vécue par des millions de citoyens ultramarins.
            </p>

            <KeyValueGrid
              items={[
                {
                  label: 'Problème',
                  value:
                    "Vie chère structurelle dans les DOM-COM, opacité des prix, absence d'outil citoyen indépendant",
                },
                {
                  label: 'Solution',
                  value:
                    'Plateforme modulaire : comparateur, scanner, observatoire, alertes, prédictions, devis institutionnels',
                },
                {
                  label: 'Cible',
                  value:
                    'Citoyens ultramarins, enseignes locales, collectivités territoriales, institutions publiques',
                },
                {
                  label: 'Modèle',
                  value: 'Abonnements (B2C) + Licences (B2B) + Prestations sur devis (B2G)',
                },
                {
                  label: 'Tech',
                  value:
                    'React 18 / TypeScript / Firebase / Cloudflare Pages — stack moderne, ouverte, auditée',
                },
                {
                  label: 'Statut',
                  value: 'Plateforme opérationnelle — phase pilote en cours dans les DOM',
                },
                {
                  label: 'Ambition',
                  value:
                    "Référence ultramarine indépendante, extensible à l'ensemble du territoire national",
                },
              ]}
            />

            <Callout type="info">
              Le projet se distingue par son engagement de transparence totale : chaque donnée est
              sourcée, chaque estimation est expliquée, chaque IA est non-opaque. Il n'y a pas de
              modèle publicitaire.
            </Callout>
          </Section>

          {/* ── 2. PROBLÉMATIQUE ──────────────────────────────────────────── */}
          <Section
            id="problematique"
            number="02"
            title="Problématique réelle & contexte"
            icon={AlertTriangle}
          >
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Spécificités des territoires d'Outre-mer
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Les cinq Départements et Régions d'Outre-mer (Guadeloupe, Martinique, Guyane, La
              Réunion, Mayotte) et les Collectivités d'Outre-mer (Saint-Martin, Saint-Barthélemy,
              Polynésie française, Nouvelle-Calédonie, Saint-Pierre-et-Miquelon…) partagent des
              contraintes économiques structurelles documentées par l'INSEE et l'IEDOM :
            </p>
            <ul className="space-y-2 text-gray-700 mb-5">
              <Li>
                <strong>Éloignement logistique :</strong> l'insularité engendre des surcoûts de fret
                qui se répercutent mécaniquement sur les prix au détail.
              </Li>
              <Li>
                <strong>Dépendance aux importations :</strong> la majorité des produits de
                consommation courante est importée, principalement depuis la métropole ou l'Europe.
              </Li>
              <Li>
                <strong>Concentration du marché :</strong> un nombre limité d'opérateurs distribue
                les produits dans chaque territoire, ce qui réduit la pression concurrentielle.
              </Li>
              <Li>
                <strong>Asymétrie d'information :</strong> les consommateurs ne disposent d'aucun
                outil numérique indépendant pour comparer les prix entre enseignes ou entre
                territoires.
              </Li>
            </ul>

            <Callout type="source">
              Des études régulières de la DGCCRF, de l'INSEE et des observatoires régionaux des prix
              documentent des écarts de prix significatifs et persistants entre les DOM et la
              métropole pour de nombreuses catégories de produits. Ces données sont publiques et
              constituent le socle d'analyse de la plateforme.
            </Callout>

            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">
              Limites des solutions existantes
            </h3>
            <ul className="space-y-2 text-gray-700">
              <Li>
                Données partielles ou non actualisées dans les outils de comparaison généralistes
              </Li>
              <Li>Absence de traçabilité des prix observés (qui a mesuré quoi, quand, où ?)</Li>
              <Li>
                Pas d'outil citoyen intégrant scan produit, historique et alertes dans les DOM
              </Li>
              <Li>Outils institutionnels existants non accessibles au grand public</Li>
            </ul>
          </Section>

          {/* ── 3. SOLUTION ──────────────────────────────────────────────── */}
          <Section id="solution" number="03" title="Solution A KI PRI SA YÉ" icon={Eye}>
            <p className="text-gray-700 leading-relaxed mb-5">
              La plateforme est conçue comme un observatoire modulaire. Chaque module répond à un
              besoin précis, documenté, et s'intègre dans une architecture cohérente :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {[
                {
                  title: 'Comparateur de prix',
                  desc: 'Comparaison multi-enseignes, multi-territoires, données observées et datées.',
                },
                {
                  title: 'Scanner produits & tickets',
                  desc: 'Scan EAN, OCR tickets de caisse, identification produit par photo.',
                },
                {
                  title: 'Carte interactive DOM/COM',
                  desc: 'Visualisation géographique des prix et des enseignes par territoire.',
                },
                {
                  title: 'Alertes consommateurs',
                  desc: "Notifications en temps réel sur les variations de prix d'intérêt.",
                },
                {
                  title: 'Prédiction de prix explicable',
                  desc: 'Estimation tendancielle basée sur données historiques, avec justification visible.',
                },
                {
                  title: 'Observatoire public',
                  desc: 'Données agrégées ouvertes aux institutions, chercheurs et journalistes.',
                },
                {
                  title: 'Marketplace enseignes',
                  desc: 'Référencement des enseignes locales avec leurs catalogues vérifiés.',
                },
                {
                  title: 'Devis IA institutionnels',
                  desc: 'Module B2G : demande de devis structuré, estimation expliquée, validation humaine obligatoire.',
                },
              ].map((m) => (
                <div key={m.title} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-sm text-indigo-700 mb-1">{m.title}</p>
                  <p className="text-sm text-gray-600">{m.desc}</p>
                </div>
              ))}
            </div>

            <Callout type="info">
              <strong>Principe fondamental :</strong> tout est sourcé, traçable et auditable. Aucune
              donnée n'est présentée sans horodatage, origine et méthode de collecte. L'IA reste
              explicable — aucune "boîte noire" dans les estimations.
            </Callout>
          </Section>

          {/* ── 4. MARCHÉ ─────────────────────────────────────────────────── */}
          <Section id="marche" number="04" title="Marché & opportunité" icon={Globe}>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Segments cibles</h3>

            <div className="space-y-3 mb-6">
              {[
                {
                  segment: 'Citoyens ultramarins',
                  desc: "Population des DOM-COM cherchant à mieux maîtriser son budget alimentaire et de consommation courante. Le pouvoir d'achat est une préoccupation structurelle et documentée.",
                  note: "Population totale des 5 DOM : environ 2,2 millions d'habitants (source INSEE, estimations 2022–2024).",
                },
                {
                  segment: 'Enseignes locales et nationales',
                  desc: 'Distribution locale, franchise, grandes et moyennes surfaces souhaitant valoriser leur offre prix de manière transparente et vérifiable.',
                  note: '',
                },
                {
                  segment: 'Collectivités territoriales',
                  desc: "Régions, départements, mairies cherchant un outil d'analyse pour accompagner leurs politiques de lutte contre la vie chère.",
                  note: '',
                },
                {
                  segment: 'Institutions publiques & État',
                  desc: "Préfectures, DGCCRF, observatoires officiels des prix, ministères souhaitant disposer d'un outil citoyen indépendant en complément de leurs propres données.",
                  note: '',
                },
                {
                  segment: 'Chercheurs & ONG',
                  desc: "Accès à des données structurées pour l'analyse des dynamiques de prix dans les territoires ultramarins.",
                  note: '',
                },
              ].map((s) => (
                <div key={s.segment} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-sm text-gray-900 mb-1">{s.segment}</p>
                  <p className="text-sm text-gray-600">{s.desc}</p>
                  {s.note && <p className="text-xs text-indigo-600 mt-1 italic">{s.note}</p>}
                </div>
              ))}
            </div>

            <h3 className="text-base font-semibold text-gray-900 mb-3">Approche de marché</h3>
            <div className="flex flex-col gap-2">
              <Step
                n={1}
                label="Concentration ultramarine"
                desc="Ancrage fort dans les DOM-COM : niche documentée, besoin réel, concurrence faible."
              />
              <Step
                n={2}
                label="Extension multi-territoires"
                desc="Montée en charge progressive vers l'ensemble des territoires ultramarins et COM éloignées."
              />
              <Step
                n={3}
                label="Ouverture nationale comparative"
                desc="Extension vers la France métropolitaine comme référentiel comparatif, une fois la base ultramarine consolidée."
              />
            </div>

            <Callout type="warn" className="mt-5">
              <strong>Hypothèse de travail :</strong> L'extension nationale est conditionnée à la
              consolidation du modèle sur les territoires d'Outre-mer. Aucun calendrier d'extension
              métropolitaine n'est présenté comme acquis.
            </Callout>
          </Section>

          {/* ── 5. MODÈLE ÉCONOMIQUE ──────────────────────────────────────── */}
          <Section id="modele-economique" number="05" title="Modèle économique" icon={Wallet}>
            <p className="text-gray-700 mb-4">
              Le modèle est sans freemium au sens classique : l'accès aux données publiques et aux
              fonctions citoyennes essentielles reste libre. La monétisation repose sur des services
              à valeur ajoutée différenciée.
            </p>

            <h3 className="text-base font-semibold text-gray-900 mb-3">Sources de revenus</h3>

            <div className="overflow-x-auto mb-5">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2 border border-gray-200 font-semibold text-gray-700">
                      Offre
                    </th>
                    <th className="text-left px-4 py-2 border border-gray-200 font-semibold text-gray-700">
                      Cible
                    </th>
                    <th className="text-left px-4 py-2 border border-gray-200 font-semibold text-gray-700">
                      Tarif
                    </th>
                    <th className="text-left px-4 py-2 border border-gray-200 font-semibold text-gray-700">
                      Caractéristique
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      offre: 'Gratuit',
                      cible: 'Tous citoyens',
                      tarif: '0 €/mois',
                      cara: 'Fonctions de base, contribution citoyenne',
                    },
                    {
                      offre: 'Citoyen Premium',
                      cible: 'Citoyens actifs',
                      tarif: '3,99 €/mois · 39 €/an',
                      cara: 'Scan illimité, OCR, alertes, historique 12 mois',
                    },
                    {
                      offre: 'Pro',
                      cible: 'Associations, analystes, pros',
                      tarif: '19 €/mois · 190 €/an',
                      cara: 'Exports, agrégations, historique long, multi-territoires',
                    },
                    {
                      offre: 'Business',
                      cible: 'Équipes, exploitation intensive',
                      tarif: '99 €/mois · 990 €/an',
                      cara: 'Listes partagées, tableaux de bord équipe, accès étendu',
                    },
                    {
                      offre: 'Institution',
                      cible: 'Collectivités, État, chercheurs',
                      tarif: 'Sur devis annuel',
                      cara: 'Licence dédiée, open-data structuré, observatoire officiel',
                    },
                    {
                      offre: 'Prestations IA',
                      cible: 'Institutions, cabinets',
                      tarif: 'Devis au projet',
                      cara: 'Rapports, audits, études territoriales personnalisées',
                    },
                  ].map((r) => (
                    <tr key={r.offre} className="border-b border-gray-200">
                      <td className="px-4 py-2 border border-gray-200 font-medium">{r.offre}</td>
                      <td className="px-4 py-2 border border-gray-200 text-gray-600">{r.cible}</td>
                      <td className="px-4 py-2 border border-gray-200 text-indigo-700 font-medium">
                        {r.tarif}
                      </td>
                      <td className="px-4 py-2 border border-gray-200 text-gray-600">{r.cara}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Caractéristiques du modèle
            </h3>
            <ul className="space-y-2 text-gray-700">
              <Li>
                <strong>Revenus récurrents :</strong> abonnements mensuels et annuels prévisibles.
              </Li>
              <Li>
                <strong>Faible coût marginal :</strong> infrastructure cloud à coût fixe, pas de
                coût variable lié au nombre d'utilisateurs.
              </Li>
              <Li>
                <strong>Fort potentiel B2G :</strong> les institutions publiques constituent un
                marché stable et à haute valeur unitaire.
              </Li>
              <Li>
                <strong>Pas de revenus publicitaires :</strong> modèle d'indépendance éditoriale
                préservée.
              </Li>
            </ul>
          </Section>

          {/* ── 6. TRACTION ──────────────────────────────────────────────── */}
          <Section id="traction" number="06" title="Traction & indicateurs" icon={TrendingUp}>
            <Callout type="warn" className="mb-5">
              <strong>Transparence :</strong> le projet est en phase pilote. Les indicateurs
              ci-dessous reflètent l'état de développement de la plateforme, pas des métriques
              d'usage consolidées. Aucun chiffre d'utilisateurs actifs ne sera mentionné sans source
              vérifiable.
            </Callout>

            <h3 className="text-base font-semibold text-gray-900 mb-3">État de la plateforme</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {[
                {
                  label: 'Territoires couverts',
                  value: '12 territoires',
                  note: 'DOM + COM français intégrés dans le comparateur',
                },
                {
                  label: 'Modules opérationnels',
                  value: '8 modules',
                  note: 'Comparateur, Scanner, OCR, Carte, Observatoire, Alertes, Messagerie, Groupes citoyens',
                },
                {
                  label: 'Routes applicatives',
                  value: '130+ pages',
                  note: 'Application complète, fonctionnelle et déployée',
                },
                {
                  label: 'Infrastructure',
                  value: 'Cloudflare Pages',
                  note: 'CI/CD industriel, déploiement continu opérationnel',
                },
                {
                  label: 'Utilisateurs actifs',
                  value: 'Phase pilote',
                  note: 'Métriques en cours de consolidation — non communiquées à ce stade',
                },
                {
                  label: 'Demandes institutionnelles',
                  value: 'En cours',
                  note: 'Module devis IA opérationnel — pipeline en construction',
                },
              ].map((m) => (
                <div key={m.label} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-0.5">{m.label}</p>
                  <p className="text-lg font-bold text-indigo-700">{m.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.note}</p>
                </div>
              ))}
            </div>

            <h3 className="text-base font-semibold text-gray-900 mb-2">Jalons réalisés</h3>
            <ul className="space-y-2 text-gray-700">
              <Li>Architecture technique complète et déployée en production</Li>
              <Li>Système d'authentification et de gestion des rôles opérationnel</Li>
              <Li>Observatoire des prix avec données historiques accessibles publiquement</Li>
              <Li>Scanner EAN et OCR tickets de caisse fonctionnels sur mobile</Li>
              <Li>Messagerie interne citoyenne et groupes de parole opérationnels</Li>
              <Li>Module Devis IA (B2G) intégré avec validation humaine obligatoire</Li>
              <Li>Interface d'administration complète (modération, gestion des données)</Li>
            </ul>
          </Section>

          {/* ── 7. AVANTAGE CONCURRENTIEL ──────────────────────────────────── */}
          <Section id="avantage" number="07" title="Avantage concurrentiel" icon={Shield}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Données territoriales fines',
                  desc: "La plateforme est la seule à couvrir l'ensemble des DOM-COM avec une granularité par enseigne, produit et date d'observation.",
                },
                {
                  title: 'Transparence totale',
                  desc: "Chaque donnée est datée, sourcée et auditable. L'IA est explicable — les facteurs de calcul sont visibles pour l'utilisateur.",
                },
                {
                  title: 'Double approche B2C + B2G',
                  desc: "Rare combinaison d'un outil grand public et d'une offre institutionnelle structurée avec traçabilité légale complète.",
                },
                {
                  title: 'Conformité RGPD native',
                  desc: "Architecture conçue dès l'origine avec minimisation des données, accès restreint et consentement explicite.",
                },
                {
                  title: 'Modularité technique',
                  desc: 'Chaque module est indépendant et peut être déployé séparément pour des partenaires institutionnels.',
                },
                {
                  title: 'Crédibilité publique',
                  desc: "Positionnement d'observatoire citoyen indépendant — sans conflits d'intérêts avec les enseignes ou les producteurs.",
                },
                {
                  title: 'Absence de modèle publicitaire',
                  desc: "L'indépendance éditoriale est préservée structurellement, ce qui renforce la confiance des institutions.",
                },
                {
                  title: 'Ancrage culturel fort',
                  desc: "Nom créole, approche communautaire, connexion avec les réalités quotidiennes des territoires d'Outre-mer.",
                },
              ].map((a) => (
                <div key={a.title} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-sm text-indigo-700 mb-1 flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5" />
                    {a.title}
                  </p>
                  <p className="text-sm text-gray-600">{a.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 8. TECHNOLOGIE ───────────────────────────────────────────── */}
          <Section id="technologie" number="08" title="Technologie & architecture" icon={Cpu}>
            <p className="text-gray-700 mb-5">
              La stack technique est moderne, éprouvée et entièrement auditée. Aucune dépendance
              propriétaire critique n'est présente. Le code est accessible sur GitHub.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                {
                  layer: 'Frontend',
                  tech: 'React 18 + TypeScript + Vite',
                  detail: 'SPA modulaire, code-splitting, accessibilité WCAG',
                },
                {
                  layer: 'Style',
                  tech: 'Tailwind CSS 4 + Framer Motion',
                  detail: 'Design system cohérent, animations accessibles',
                },
                {
                  layer: 'Base de données',
                  tech: 'Firebase Firestore',
                  detail: 'NoSQL temps réel, subscriptions, règles de sécurité',
                },
                {
                  layer: 'Authentification',
                  tech: 'Firebase Auth',
                  detail: 'Multi-provider, gestion des rôles (citoyen / pro / admin)',
                },
                {
                  layer: 'Déploiement',
                  tech: 'Cloudflare Pages',
                  detail: 'CDN mondial, déploiement atomique, rollback instantané',
                },
                {
                  layer: 'CI/CD',
                  tech: 'GitHub Actions',
                  detail: 'Tests automatiques, lint, build, déploiement continu',
                },
                {
                  layer: 'Tests',
                  tech: 'Vitest + Testing Library',
                  detail: '76+ fichiers de test, couverture fonctionnelle et service',
                },
                {
                  layer: 'IA',
                  tech: 'Modèles explicables maison',
                  detail: 'Pas de LLM opaque — règles métier documentées et auditables',
                },
              ].map((t) => (
                <div key={t.layer} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {t.layer}
                  </p>
                  <p className="font-semibold text-sm text-slate-900 mb-0.5">{t.tech}</p>
                  <p className="text-xs text-slate-500">{t.detail}</p>
                </div>
              ))}
            </div>

            <h3 className="text-base font-semibold text-gray-900 mb-3">Principes d'architecture</h3>
            <ul className="space-y-2 text-gray-700">
              <Li>
                <strong>IA explicable :</strong> les estimations présentent leur raisonnement ligne
                par ligne. Aucune prédiction sans justification affichée.
              </Li>
              <Li>
                <strong>Données vérifiables :</strong> chaque observation de prix est horodatée,
                localisée et rattachée à une source.
              </Li>
              <Li>
                <strong>Validation humaine obligatoire :</strong> aucun engagement contractuel ou
                devis n'est émis automatiquement par un système IA.
              </Li>
              <Li>
                <strong>Open source :</strong> le code source est public sur GitHub, ce qui permet
                un audit indépendant.
              </Li>
            </ul>

            <div className="mt-4">
              <a
                href="https://github.com/teetee971/akiprisaye-web"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Dépôt public GitHub — teetee971/akiprisaye-web
              </a>
            </div>
          </Section>

          {/* ── 9. DÉPLOIEMENT ───────────────────────────────────────────── */}
          <Section id="deploiement" number="09" title="Stratégie de déploiement" icon={Map}>
            <p className="text-gray-700 mb-5">
              La stratégie de déploiement est progressive et conditionnée à la validation de chaque
              phase avant passage à la suivante. Aucun calendrier n'est présenté comme une
              certitude.
            </p>

            <div className="space-y-4">
              {[
                {
                  phase: 'Phase 1 — Pilote DOM',
                  statut: 'En cours',
                  color: 'indigo',
                  items: [
                    'Déploiement opérationnel en Guadeloupe, Martinique, La Réunion, Guyane, Mayotte',
                    'Collecte des premières contributions citoyennes',
                    'Validation du modèle de données et des interfaces',
                    'Premiers retours institutionnels',
                  ],
                },
                {
                  phase: 'Phase 2 — Extension multi-territoires',
                  statut: 'Planifiée',
                  color: 'blue',
                  items: [
                    'Intégration des COM (Saint-Martin, Polynésie, Nouvelle-Calédonie…)',
                    'Consolidation du modèle économique B2C',
                    'Premiers partenariats avec des collectivités locales',
                    'Lancement des licences institutionnelles',
                  ],
                },
                {
                  phase: 'Phase 3 — Intégration institutionnelle',
                  statut: 'Conditionnelle',
                  color: 'slate',
                  items: [
                    'Partenariats formels avec les observatoires des prix territoriaux',
                    'Intégration avec des sources de données officielles (INSEE, DIECCTE)',
                    'Consolidation des revenus B2G',
                    "Publication de rapports d'observatoire co-labellisés",
                  ],
                },
                {
                  phase: 'Phase 4 — Ouverture aux investisseurs & montée en charge',
                  statut: 'Conditionnelle',
                  color: 'gray',
                  items: [
                    'Levée de fonds sur la base de métriques consolidées',
                    "Expansion de l'équipe technique et data",
                    "Développement de l'extension nationale comparative",
                    'Internationalisation vers les territoires francophones comparables',
                  ],
                },
              ].map((p) => (
                <div key={p.phase} className={`border border-${p.color}-200 rounded-xl p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{p.phase}</h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full bg-${p.color}-100 text-${p.color}-700 font-medium`}
                    >
                      {p.statut}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {p.items.map((item) => (
                      <li key={item} className="text-sm text-gray-600 flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 10. ÉQUIPE ───────────────────────────────────────────────── */}
          <Section id="equipe" number="10" title="Équipe & gouvernance" icon={Users}>
            <Callout type="info" className="mb-5">
              L'équipe est présentée par rôle et compétences. Les détails personnels sont
              communiqués aux investisseurs qualifiés lors d'une due diligence formelle.
            </Callout>

            <div className="space-y-4 mb-6">
              {[
                {
                  role: 'Fondateur / Porteur du projet',
                  profil:
                    'Initiateur et développeur principal de la plateforme. Connaissance approfondie des réalités économiques des DOM-COM et expertise technique sur la stack déployée.',
                },
                {
                  role: 'Rôle : Technologie & Data',
                  profil:
                    "Architecture logicielle, pipeline de données, système d'IA explicable, sécurité et conformité RGPD.",
                },
                {
                  role: 'Rôle : Relations institutionnelles',
                  profil:
                    "Engagement avec les collectivités, les services de l'État et les observatoires des prix. Construction des partenariats B2G.",
                },
                {
                  role: 'Partenaires locaux',
                  profil:
                    'En cours de structuration — associations citoyennes, acteurs économiques locaux et relais territoriaux dans les DOM.',
                },
              ].map((m) => (
                <div key={m.role} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-sm text-gray-900 mb-1">{m.role}</p>
                  <p className="text-sm text-gray-600">{m.profil}</p>
                </div>
              ))}
            </div>

            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Gouvernance éthique & data
            </h3>
            <ul className="space-y-2 text-gray-700">
              <Li>Charte de données publiquement accessible dans le dépôt GitHub</Li>
              <Li>
                Toute modification des règles de modération ou de collecte est documentée et
                versionnée
              </Li>
              <Li>Aucune donnée personnelle n'est revendue ou partagée à des tiers commerciaux</Li>
              <Li>
                Transparence sur les sources de financement futures (mention obligatoire dans les
                conditions d'utilisation)
              </Li>
            </ul>
          </Section>

          {/* ── 11. FINANCEMENT ──────────────────────────────────────────── */}
          <Section id="financement" number="11" title="Besoins de financement" icon={BarChart3}>
            <Callout type="warn" className="mb-5">
              <strong>Avertissement :</strong> Cette section décrit les catégories de besoins et
              leur justification. Les montants spécifiques de levée seront définis sur la base de
              métriques consolidées lors de la phase de due diligence. Aucune valorisation n'est
              présentée ici — cela constituerait une donnée non étayée.
            </Callout>

            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Objectifs de la levée (à structurer)
            </h3>
            <div className="space-y-3 mb-6">
              {[
                {
                  poste: 'Développement produit',
                  desc: "Renforcement de l'équipe technique, amélioration des modules existants, développement des fonctionnalités B2G prioritaires.",
                  priorite: 'Haute',
                },
                {
                  poste: 'Collecte & qualité des données',
                  desc: "Structuration des partenariats de collecte, validation des sources, amélioration de la chaîne d'observation des prix.",
                  priorite: 'Haute',
                },
                {
                  poste: 'Partenariats institutionnels',
                  desc: "Démarches commerciales et de conventionnement avec les collectivités et services de l'État.",
                  priorite: 'Moyenne',
                },
                {
                  poste: 'Déploiement territorial',
                  desc: 'Présence locale dans les DOM-COM, animation citoyenne, formation des relais territoriaux.',
                  priorite: 'Moyenne',
                },
                {
                  poste: 'Conformité & sécurité',
                  desc: 'Audit de sécurité indépendant, certification RGPD, conformité avec les obligations légales des services numériques publics.',
                  priorite: 'Haute',
                },
              ].map((p) => (
                <div
                  key={p.poste}
                  className="flex items-start gap-4 border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900 mb-0.5">{p.poste}</p>
                    <p className="text-sm text-gray-600">{p.desc}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium
                    ${p.priorite === 'Haute' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}
                  >
                    {p.priorite}
                  </span>
                </div>
              ))}
            </div>

            <h3 className="text-base font-semibold text-gray-900 mb-2">Horizon de rentabilité</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              L'horizon de rentabilité dépend directement du rythme d'adoption institutionnelle
              (B2G) et du nombre d'abonnés actifs consolidés. Une projection financière détaillée
              sera partagée dans le cadre d'une due diligence formelle, sur la base des métriques
              réelles de la phase pilote.
            </p>
          </Section>

          {/* ── 12. RISQUES ──────────────────────────────────────────────── */}
          <Section id="risques" number="12" title="Risques & maîtrise" icon={AlertTriangle}>
            <div className="space-y-3">
              {[
                {
                  risque: 'Qualité des données',
                  description:
                    'Les contributions citoyennes peuvent être incomplètes ou inexactes.',
                  mesure:
                    'Système de validation croisée, modération humaine, horodatage obligatoire, indicateur de confiance affiché.',
                  niveau: 'Maîtrisé',
                },
                {
                  risque: 'Adoption utilisateurs',
                  description:
                    "La plateforme nécessite une masse critique d'utilisateurs pour être utile.",
                  mesure:
                    'Phasage progressif, ancrage communautaire, fonctions utiles même en faible trafic (observatoire en lecture).',
                  niveau: 'Suivi',
                },
                {
                  risque: 'Contraintes réglementaires',
                  description:
                    'Évolution du cadre RGPD, des obligations des plateformes numériques (DSA, NIS2).',
                  mesure:
                    'Architecture RGPD-native, veille juridique, conformité intégrée dès la conception.',
                  niveau: 'Maîtrisé',
                },
                {
                  risque: 'Dépendance aux partenaires',
                  description: "Dépendance à Firebase et Cloudflare pour l'infrastructure.",
                  mesure:
                    'Architecture exportable (données Firestore exportables), pas de vendor lock-in sur la logique métier.',
                  niveau: 'Suivi',
                },
                {
                  risque: 'Concurrence institutionnelle',
                  description: "Un service public similaire pourrait être développé par l'État.",
                  mesure:
                    'Positionnement complémentaire (outil citoyen indépendant vs. données officielles), partenariats plutôt que compétition.',
                  niveau: 'Faible',
                },
                {
                  risque: 'Soutenabilité financière',
                  description: 'Délai entre investissement et revenus récurrents.',
                  mesure:
                    "Coûts d'infrastructure actuellement maîtrisés. Le modèle B2G vise des contrats à haute valeur unitaire pour limiter la dépendance au volume B2C.",
                  niveau: 'Suivi',
                },
              ].map((r) => (
                <div key={r.risque} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm text-gray-900">{r.risque}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${
                        r.niveau === 'Maîtrisé'
                          ? 'bg-green-100 text-green-700'
                          : r.niveau === 'Suivi'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {r.niveau}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{r.description}</p>
                  <p className="text-sm text-indigo-700">
                    <strong>Mesure :</strong> {r.mesure}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 13. VISION ───────────────────────────────────────────────── */}
          <Section id="vision" number="13" title="Vision à 3–5 ans" icon={TrendingUp}>
            <Callout type="info" className="mb-5">
              Cette vision est présentée comme une ambition structurée, non comme un engagement
              contractuel. Chaque horizon est conditionnel à l'atteinte des jalons précédents.
            </Callout>

            <div className="space-y-5">
              {[
                {
                  horizon: 'Horizon 1 an',
                  objectif: 'Consolidation ultramarine',
                  items: [
                    'Plateforme de référence pour les DOM-COM en matière de transparence des prix',
                    "Métriques d'usage consolidées et communicables",
                    "Au moins une convention formelle avec une collectivité territoriale ou un service de l'État",
                    'Module B2G (devis institutionnels) avec les premiers clients actifs',
                  ],
                },
                {
                  horizon: 'Horizon 3 ans',
                  objectif: "Outil d'aide à la décision publique",
                  items: [
                    'Partenariats formels avec les observatoires des prix DOM-COM',
                    'Données de la plateforme citées dans des rapports officiels',
                    'Modèle économique équilibré entre B2C, B2B et B2G',
                    'Équipe pluridisciplinaire stable (tech, data, relations institutionnelles)',
                  ],
                },
                {
                  horizon: 'Horizon 5 ans',
                  objectif: 'Plateforme data territoriale de référence',
                  items: [
                    'Extension possible vers la France métropolitaine comme comparatif national',
                    "Plateforme ouverte aux collectivités pour co-construction d'observatoires locaux",
                    "Potentiel d'extension vers les territoires francophones comparables (DROM, Outre-mer belges et canadiens)",
                    "Modèle reproductible pour d'autres pays en situation de vie chère documentée",
                  ],
                },
              ].map((v) => (
                <div
                  key={v.horizon}
                  className="border border-indigo-200 rounded-xl p-5 bg-indigo-50/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                      {v.horizon}
                    </span>
                    <span className="font-semibold text-gray-900">{v.objectif}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {v.items.map((item) => (
                      <li key={item} className="text-sm text-gray-700 flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-slate-900 text-white rounded-2xl p-6 text-center">
              <p className="text-lg font-semibold mb-2">
                A KI PRI SA YÉ — Une question. Une réponse documentée.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
                Transformer la transparence des prix ultramarins en bien commun numérique, au
                service des citoyens, des institutions et d'un développement territorial plus
                équitable.
              </p>
            </div>

            {/* Contact */}
            <div className="mt-6 border border-gray-200 rounded-xl p-5 text-sm text-gray-600">
              <p className="font-semibold text-gray-900 mb-2">Contact investisseurs</p>
              <p>
                Pour toute demande de due diligence, accès aux métriques détaillées ou rendez-vous :
              </p>
              <a
                href="https://github.com/teetee971/akiprisaye-web"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 mt-1 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                github.com/teetee971/akiprisaye-web
              </a>
            </div>
          </Section>
        </main>
      </div>

      {/* Back-to-top floating button — mobile only (fixed, outside flex container) */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Retour en haut"
          className="lg:hidden fixed bottom-20 right-4 z-30 bg-indigo-600 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition hover:bg-indigo-700 print:hidden"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
}

// ── Helper sub-components ──────────────────────────────────────────────────────

function Section({
  id,
  number,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  number: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-indigo-700" />
        </div>
        <div>
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
            Section {number}
          </p>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
      </div>
      <div>{children}</div>
      <div className="mt-6 border-t border-gray-100" />
    </section>
  );
}

function KeyValueGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
      {items.map((item) => (
        <div key={item.label} className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5 font-medium uppercase tracking-wide">
            {item.label}
          </p>
          <p className="text-sm text-gray-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function Callout({
  type,
  children,
  className = '',
}: {
  type: 'info' | 'warn' | 'source';
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warn: 'bg-amber-50 border-amber-300 text-amber-800',
    source: 'bg-slate-50 border-slate-200 text-slate-700',
  };
  return (
    <div
      className={`border rounded-xl px-4 py-3 text-sm leading-relaxed ${styles[type]} ${className}`}
    >
      {children}
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

function Step({ n, label, desc }: { n: number; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
        {n}
      </div>
      <div>
        <p className="font-semibold text-sm text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}
