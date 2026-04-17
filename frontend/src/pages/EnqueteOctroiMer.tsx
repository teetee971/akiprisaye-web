/**
 * EnqueteOctroiMer.tsx
 *
 * Dossier d'enquête complet sur l'octroi de mer dans les territoires d'outre-mer.
 *
 * Sources officielles :
 *  - Loi n° 2004-639 du 2 juillet 2004 relative à l'octroi de mer
 *  - Décision du Conseil de l'UE 2021/1657 du 17 sept. 2021 (prorogation au 31 déc. 2027)
 *  - DGDDI — Douanes françaises, statistiques octroi de mer 2022-2024
 *  - IEDOM — Rapports annuels 2023 (GP, MQ, GF, RE, YT)
 *  - Autorité de la concurrence — Avis 09-A-45 (2009) ; Avis 19-A-12 (2019)
 *  - Cour des Comptes — Rapport sur les finances des collectivités d'outre-mer (2023)
 *  - INSEE — Enquête sur les niveaux de vie et prix DOM 2022-2023
 *  - CEROM — Comptes Économiques Rapides pour l'Outre-Mer 2022
 *  - EUR-Lex — Décision (UE) 2022/692 du Conseil ; Règlement (UE) 2022/2
 *  - Délibérations des Conseils Régionaux : GP (2022), MQ (2022), GF (2021), RE (2022), YT (2021)
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Landmark,
  TrendingUp,
  Globe,
  DollarSign,
  BarChart2,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  FileText,
  Scale,
  MapPin,
  BookOpen,
  ExternalLink,
  Shield,
  ArrowLeft,
  GraduationCap,
  History,
  Users,
} from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

/* ─── Tabs ──────────────────────────────────────────────────────────────── */

const TABS = [
  { key: 'histoire', label: 'Histoire & origines', icon: History },
  { key: 'mecanisme', label: 'Mécanisme juridique', icon: Scale },
  { key: 'taux', label: 'Taux par territoire', icon: BarChart2 },
  { key: 'impact', label: 'Impact consommateur', icon: TrendingUp },
  { key: 'budget', label: 'Financement collectivités', icon: Landmark },
  { key: 'acteurs', label: 'Qui décide ?', icon: Users },
  { key: 'sources', label: 'Sources & réforme', icon: BookOpen },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/* ─── Reusable components ─────────────────────────────────────────────── */

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-4 mt-8">
      <Icon className="w-5 h-5 text-purple-400 flex-shrink-0" />
      {children}
    </h2>
  );
}

function InfoBox({
  color = 'blue',
  title,
  children,
}: {
  color?: 'blue' | 'amber' | 'green' | 'red' | 'purple';
  title: string;
  children: React.ReactNode;
}) {
  const palette: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
    green: 'bg-green-500/10 border-green-500/30 text-green-200',
    red: 'bg-red-500/10 border-red-500/30 text-red-200',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-200',
  };
  return (
    <div className={`border rounded-xl p-4 mb-4 ${palette[color]}`}>
      <p className="font-semibold mb-1">{title}</p>
      <div className="text-sm opacity-90">{children}</div>
    </div>
  );
}

function DataCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight ? 'bg-purple-500/10 border-purple-500/30' : 'bg-slate-800 border-slate-700'
      }`}
    >
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-purple-300' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function Collapse({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700 rounded-xl mb-3 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && <div className="px-4 pb-4 text-sm text-gray-300 leading-relaxed">{children}</div>}
    </div>
  );
}

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 underline underline-offset-2 text-xs"
    >
      <ExternalLink className="w-3 h-3" />
      {children}
    </a>
  );
}

/* ─── Main component ───────────────────────────────────────────────────── */

const EnqueteOctroiMer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('histoire');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>
          Enquête : L'Octroi de Mer — Taxe, mécanisme et impact DOM-TOM — A KI PRI SA YÉ
        </title>
        <meta
          name="description"
          content="Dossier d'investigation complet sur l'octroi de mer : 350 ans d'histoire, mécanisme juridique européen, taux par territoire et catégorie, impact sur les prix, financement des collectivités DOM-TOM."
        />
        <link
          rel="canonical"
          href="https://teetee971.github.io/akiprisaye-web/enquete-octroi-mer"
        />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/enquete-octroi-mer"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/enquete-octroi-mer"
        />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 pb-16 pt-6">
        {/* Back navigation */}
        <div className="mb-4 flex flex-wrap gap-3">
          <Link
            to="/calculateur-octroi"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Calculateur Octroi de mer
          </Link>
          <Link
            to="/conference-octroi-mer"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-300 transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5" /> Conférence expert
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-6">
          <HeroImage
            src={PAGE_HERO_IMAGES.enqueteOctroiMer}
            alt="Port de commerce — enquête octroi de mer DOM-TOM"
            gradient="from-slate-950 to-purple-900"
            height="h-48 sm:h-64"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-6 h-6 text-purple-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-purple-300">
                Dossier d'enquête
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow leading-tight">
              🏛️ L'Octroi de Mer
              <br />
              démystifié
            </h1>
            <p className="text-purple-100 text-sm mt-2 drop-shadow max-w-2xl">
              350 ans d'histoire, un mécanisme fiscal unique au monde, des milliards de taxes
              collectées chaque année. L'enquête complète de l'Observatoire A KI PRI SA YÉ.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs text-purple-300">
                📊 DGDDI · IEDOM · EUR-Lex · Cour des Comptes
              </span>
              <span className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-xs text-gray-300">
                Mise à jour mars 2026
              </span>
            </div>
          </HeroImage>
        </div>

        {/* Key figures */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <DataCard
            label="Revenus annuels OM (5 DROM)"
            value="~1,2 Md€"
            sub="Source : DGDDI 2023"
            highlight
          />
          <DataCard label="Part budget régions DOM" value="25–35 %" sub="selon territoire" />
          <DataCard label="Nb. catégories tarifaires" value="~7 000" sub="nomenclature douanière" />
          <DataCard label="Produit créé en" value="1670" sub="Ordonnance de Colbert" />
        </div>

        {/* Disclaimer */}
        <InfoBox color="amber" title="⚠️ Note méthodologique">
          Toutes les données sont issues de sources officielles publiques (EUR-Lex, DGDDI, IEDOM,
          Cour des Comptes, délibérations régionales). Les taux cités sont des exemples
          représentatifs — les délibérations régionales créent des milliers de lignes tarifaires
          distinctes. Cette page vise à informer, pas à remplacer une consultation juridique ou
          douanière.
        </InfoBox>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === t.key
                    ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                    : 'bg-slate-800 border border-slate-700 text-gray-400 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ══ TAB 1 : Histoire & origines ══ */}
        {activeTab === 'histoire' && (
          <div>
            <SectionTitle icon={History}>
              350 ans d'histoire : de Colbert à l'Union Européenne
            </SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              L'octroi de mer est l'une des plus anciennes taxes françaises encore en vigueur. Son
              histoire court sur plus de trois siècles et reflète l'évolution du rapport entre la
              métropole et ses territoires d'outre-mer.
            </p>

            <div className="space-y-4 mb-8">
              {[
                {
                  year: '1670',
                  color: '#a78bfa',
                  title: 'Ordonnance de Colbert',
                  content: `Jean-Baptiste Colbert, ministre de Louis XIV, crée le "droit de poids et entrée" dans les
                    Antilles françaises. Objectif initial : taxer les échanges commerciaux pour financer la
                    défense des colonies et rémunérer la Compagnie des Indes Occidentales. Ce droit est perçu
                    sur toutes les marchandises entrant dans les ports.`,
                  source: 'Archives nationales — Ordonnance du 15 septembre 1670',
                },
                {
                  year: '1791',
                  color: '#60a5fa',
                  title: 'Nationalisation sous la Révolution',
                  content: `L'octroi est renationalisé et ses modalités harmonisées dans les différentes colonies.
                    Il devient un instrument fiscal central pour l'administration coloniale, générant des
                    revenus stables pour les budgets locaux.`,
                  source: "Décret de l'Assemblée nationale constituante, 1791",
                },
                {
                  year: '1946',
                  color: '#34d399',
                  title: 'Départementalisation des DOM',
                  content: `La loi de départementalisation (Loi Veil) intègre les quatre vieilles colonies
                    (Guadeloupe, Martinique, Guyane, La Réunion) dans la République française. L'octroi de
                    mer est maintenu comme taxe locale spécifique aux DOM, reconnaissant les particularités
                    économiques de ces territoires insulaires éloignés.`,
                  source: 'Loi n° 46-451 du 19 mars 1946',
                },
                {
                  year: '1989',
                  color: '#fbbf24',
                  title: 'Première mise en conformité européenne',
                  content: `La Cour de Justice des Communautés Européennes (CJCE) juge que l'octroi de mer,
                    dans sa forme alors en vigueur, est incompatible avec le droit communautaire car il
                    discrimine les importations par rapport à la production locale. La France doit réformer
                    le dispositif.`,
                  source: 'CJCE, arrêt C-163/90, Legros, 16 juillet 1992',
                },
                {
                  year: '1992',
                  color: '#f87171',
                  title: 'Réforme et décision du Conseil CE',
                  content: `Le Conseil des Communautés Européennes autorise la France à maintenir l'octroi de
                    mer sous conditions strictes : les différentiels de taux entre importations et production
                    locale doivent être justifiés par des handicaps spécifiques reconnus (éloignement,
                    insularité, marché étroit, dépendance économique). Création du régime dit "octroi de
                    mer différentiel".`,
                  source: 'Décision 89/688/CEE du Conseil du 22 décembre 1989',
                },
                {
                  year: '2004',
                  color: '#a78bfa',
                  title: 'Réforme majeure — Loi du 2 juillet 2004',
                  content: `La loi n° 2004-639 refond entièrement le régime. Elle crée un octroi de mer à
                    deux niveaux : l'octroi de mer "régional" (OM-R, perçu par les Régions) et l'octroi
                    de mer "communautaire" (OM-C, redistribué aux communes). Les taux sont fixés par
                    délibération des Conseils Régionaux dans un cadre autorisé par l'UE. Les produits
                    locaux peuvent bénéficier d'exonérations ou de taux réduits.`,
                  source: 'Loi n° 2004-639 du 2 juillet 2004 — Légifrance',
                },
                {
                  year: '2014 → 2021',
                  color: '#38bdf8',
                  title: "Prorogations successives par l'UE",
                  content: `La décision 2014/162/UE proroge le régime jusqu'en 2020, puis la décision
                    (UE) 2021/1657 du Conseil du 17 septembre 2021 le proroge jusqu'au 31 décembre 2027.
                    Chaque prorogation fait l'objet d'une évaluation de la Commission européenne sur
                    l'impact du dispositif et son adéquation avec les objectifs de cohésion régionale.`,
                  source: 'Décision (UE) 2021/1657 du Conseil — EUR-Lex',
                },
                {
                  year: '2027',
                  color: '#4ade80',
                  title: 'Horizon : renouvellement en cours de négociation',
                  content: `Le régime actuel expire le 31 décembre 2027. Les négociations avec Bruxelles
                    ont débuté en 2025. Plusieurs scénarios sont sur la table : prorogation à l'identique,
                    réforme structurelle, ou intégration dans un cadre fiscal DOM rénové. Les Régions
                    d'Outre-Mer militent pour une prorogation a minima jusqu'en 2035.`,
                  source: 'Commission européenne — Document de consultation 2024',
                },
              ].map((event) => (
                <div
                  key={event.year}
                  className="flex gap-4 border border-slate-800 rounded-xl p-4 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex-shrink-0 text-center">
                    <div
                      className="inline-block px-2 py-1 rounded-lg text-xs font-bold"
                      style={{
                        background: `${event.color}22`,
                        border: `1px solid ${event.color}55`,
                        color: event.color,
                      }}
                    >
                      {event.year}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white mb-1">{event.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{event.content}</p>
                    <p className="text-xs text-slate-600 italic">{event.source}</p>
                  </div>
                </div>
              ))}
            </div>

            <InfoBox color="purple" title="📌 Pourquoi l'UE autorise-t-elle cette taxe ?">
              Le Traité sur le Fonctionnement de l'Union Européenne (TFUE) prévoit, à son article
              349, un régime dérogatoire pour les "régions ultrapériphériques" (RUP). Les DROM
              français (GP, MQ, GF, RE, YT) sont des RUP. Ce statut permet des dérogations aux
              règles du marché intérieur, dont l'octroi de mer, à condition que ces mesures "visent
              à surmonter les difficultés particulières" liées à l'éloignement, l'insularité, la
              faible superficie et la dépendance économique.
              <br />
              <br />
              <SourceLink href="https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX%3A12012E%2FTXT#d1e4884-47-1">
                TFUE — Art. 349 (EUR-Lex)
              </SourceLink>
            </InfoBox>
          </div>
        )}

        {/* ══ TAB 2 : Mécanisme juridique ══ */}
        {activeTab === 'mecanisme' && (
          <div>
            <SectionTitle icon={Scale}>
              Le mécanisme juridique : comment ça marche concrètement ?
            </SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              L'octroi de mer n'est pas une taxe unique. C'est un{' '}
              <strong className="text-white">système à plusieurs niveaux</strong> avec des
              assiettes, des taux et des bénéficiaires distincts. Voici son architecture complète.
            </p>

            <Collapse title="📦 Qu'est-ce qui est taxé ? L'assiette de l'octroi de mer">
              <p className="mb-3">L'octroi de mer s'applique à deux flux économiques :</p>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li>
                  <strong>Importations</strong> de marchandises dans un DROM : tout bien physique
                  importé depuis la métropole, l'UE ou un pays tiers est soumis à l'octroi de mer,
                  calculé sur la valeur en douane (valeur CIF : coût + fret + assurance).
                </li>
                <li>
                  <strong>Production locale</strong> : les entreprises dont le chiffre d'affaires
                  annuel dépasse 300 000 € qui exercent une activité de production dans un DROM sont
                  également assujetties à l'octroi de mer sur leur production livrée dans le même
                  DROM.
                </li>
              </ul>
              <p className="text-gray-500 text-xs">
                Base légale : Art. 1 et 3 de la Loi n° 2004-639 du 2 juillet 2004.
              </p>
            </Collapse>

            <Collapse title="🔢 Les deux composantes : OM-R et OM-C">
              <div className="space-y-3 mb-2">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                  <p className="font-semibold text-purple-300 mb-1">
                    OM-R — Octroi de Mer Régional
                  </p>
                  <p>
                    Perçu par le <strong>Conseil Régional</strong>. Taux fixé par délibération
                    régionale dans les limites autorisées par la liste UE. Constitue la principale
                    ressource "propre" des régions d'outre-mer. Taux pouvant aller de 0 % à 60 %
                    selon la catégorie de produits.
                  </p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="font-semibold text-blue-300 mb-1">
                    OM-C — Octroi de Mer Communautaire (dit "de solidarité")
                  </p>
                  <p>
                    Taux fixe de <strong>2,5 %</strong> sur les mêmes bases. Perçu par la Région
                    mais intégralement reversé aux communes du DROM (fonds de péréquation). Alimenté
                    aussi bien par les importations que par la production locale assujettie.
                  </p>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Source : Art. 16 et 17 de la Loi 2004-639 ; Délibérations Conseils Régionaux 2022.
              </p>
            </Collapse>

            <Collapse title="⚖️ Le différentiel : avantage à la production locale">
              <p className="mb-3">
                La disposition la plus controversée du dispositif est le{' '}
                <strong>différentiel de taux</strong>. La loi permet aux Régions de fixer des taux
                d'octroi de mer inférieurs (ou nuls) pour les produits fabriqués localement par
                rapport aux produits équivalents importés.
              </p>
              <p className="mb-3">
                <strong>Exemple :</strong> Un yaourt importé de métropole peut être taxé à 8 % d'OM,
                tandis qu'un yaourt produit en Guadeloupe bénéficie d'un taux de 0 %. Cela crée une
                "protection" de facto de la production locale — justifiée par la nécessité de
                maintenir un tissu industriel et agricole local face à la concurrence des grandes
                industries métropolitaines.
              </p>
              <p className="mb-3">
                Ce différentiel est encadré : l'annexe de la décision UE fixe, pour chaque catégorie
                de produits, le différentiel maximum autorisé (généralement 10, 20 ou 30 points).
              </p>
              <p className="text-gray-500 text-xs">
                Source : Annexe de la Décision (UE) 2021/1657 — EUR-Lex.
              </p>
            </Collapse>

            <Collapse title="🏛️ Qui collecte l'octroi de mer ?">
              <p className="mb-3">
                L'octroi de mer est collecté par la{' '}
                <strong>DGDDI (Direction générale des douanes et droits indirects)</strong> —
                l'administration des douanes françaises. Les importateurs la déclarent et la règlent
                en même temps que les droits de douane.
              </p>
              <p className="mb-3">
                Pour la production locale, les assujettis déposent une déclaration mensuelle auprès
                du bureau des douanes compétent (Pointe-à-Pitre, Fort-de-France, etc.).
              </p>
              <p className="mb-3">
                Les sommes collectées sont ensuite reversées aux Régions, qui les redistribuent
                selon les clés légales vers leurs propres budgets et les budgets communaux.
              </p>
              <p className="text-gray-500 text-xs">
                Source : DGDDI — Notice pratique octroi de mer 2024.
              </p>
            </Collapse>

            <Collapse title="📋 Les exonérations et régimes spéciaux">
              <p className="mb-3">
                Plusieurs catégories de produits et d'opérateurs bénéficient d'exonérations :
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  <strong>Franchises personnelles</strong> : les voyageurs revenant de métropole ou
                  de l'étranger bénéficient de franchises (comme en métropole pour la TVA).
                </li>
                <li>
                  <strong>Importations des collectivités</strong> : les biens acquis par les
                  collectivités territoriales pour leurs besoins propres (matériels scolaires,
                  véhicules de service…) sont souvent exonérés.
                </li>
                <li>
                  <strong>Produits de première nécessité</strong> : chaque Région peut exonérer
                  totalement certains produits alimentaires de base ou médicaments.
                </li>
                <li>
                  <strong>Entreprises en dessous du seuil</strong> : les producteurs locaux avec
                  moins de 300 000 € de CA annuel sont exonérés de la partie "production locale".
                </li>
                <li>
                  <strong>Réexportation</strong> : les marchandises en transit ou réexportées hors
                  DROM sont exonérées.
                </li>
              </ul>
              <p className="text-gray-500 text-xs mt-3">
                Source : Art. 6 à 12 de la Loi 2004-639 ; délibérations régionales annuelles.
              </p>
            </Collapse>

            {/* Architecture diagram */}
            <div className="mt-6 border border-slate-700 rounded-xl overflow-hidden">
              <div className="bg-slate-800 px-4 py-2">
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Architecture du système octroi de mer
                </p>
              </div>
              <div className="p-4">
                {[
                  {
                    step: '1',
                    label: 'Importation / Production locale',
                    sub: 'Marchandise entre dans un DROM ou produite par une entreprise locale ≥300K€ CA',
                    color: '#a78bfa',
                  },
                  {
                    step: '2',
                    label: 'Déclaration & Liquidation',
                    sub: 'DGDDI (Douanes) calcule : Base HT × Taux OM-R + Base HT × 2,5% OM-C',
                    color: '#60a5fa',
                  },
                  {
                    step: '3',
                    label: 'Collecte par les Douanes',
                    sub: 'Règlement mensuel par importateurs et producteurs assujettis',
                    color: '#34d399',
                  },
                  {
                    step: '4',
                    label: 'Reversement aux Régions',
                    sub: 'OM-R → budget Conseil Régional · OM-C → fonds péréquation communes',
                    color: '#fbbf24',
                  },
                  {
                    step: '5',
                    label: 'Redistribution aux communes',
                    sub: 'Clé de répartition fixée par arrêté : population + superficie + DGF (dotation globale)',
                    color: '#f87171',
                  },
                ].map((s, i) => (
                  <div key={s.step}>
                    <div className="flex gap-3 items-start">
                      <div
                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{
                          background: `${s.color}22`,
                          border: `1px solid ${s.color}55`,
                          color: s.color,
                        }}
                      >
                        {s.step}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{s.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                      </div>
                    </div>
                    {i < 4 && <div className="ml-3.5 h-4 w-px bg-slate-700 my-0.5" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 3 : Taux par territoire ══ */}
        {activeTab === 'taux' && (
          <div>
            <SectionTitle icon={BarChart2}>Taux et catégories par territoire</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Il n'existe pas un seul taux d'octroi de mer mais des{' '}
              <strong className="text-white">milliers de lignes tarifaires</strong> combinant
              territoire, nomenclature douanière (NC8) et statut du produit (importé vs. local).
              Voici les taux représentatifs des grandes catégories.
            </p>

            <InfoBox color="amber" title="📌 Comment lire ces taux">
              Les taux ci-dessous sont les taux d'octroi de mer régional (OM-R) pour les produits
              importés. La production locale du même territoire bénéficie souvent de taux réduits ou
              nuls (différentiel). Ajouter systématiquement 2,5 % d'OM-C pour obtenir le taux total.
            </InfoBox>

            {/* Table by territory and category */}
            {[
              {
                territory: 'Guadeloupe 🇬🇵',
                source: 'Délibération CR/20-2/REXT du Conseil Régional de Guadeloupe (2022)',
                sourceUrl: 'https://www.cr-guadeloupe.fr',
                rows: [
                  {
                    cat: 'Alimentation courante (riz, pâtes, farine)',
                    imp: '5–8 %',
                    local: '0 %',
                    diff: '5–8 pts',
                  },
                  {
                    cat: 'Boissons (sodas, eaux minérales)',
                    imp: '18–25 %',
                    local: '0 %',
                    diff: '18–25 pts',
                  },
                  { cat: 'Véhicules particuliers', imp: '30 %', local: 'N/A', diff: '—' },
                  {
                    cat: 'Matériaux de construction',
                    imp: '8–12 %',
                    local: '0 %',
                    diff: '8–12 pts',
                  },
                  { cat: 'Équipements électroménagers', imp: '15–20 %', local: 'N/A', diff: '—' },
                  {
                    cat: 'Produits pharmaceutiques (non essentiels)',
                    imp: '2,5 %',
                    local: '0 %',
                    diff: '2,5 pts',
                  },
                  {
                    cat: 'Produits pétroliers (hors carburants réglementés)',
                    imp: '10–15 %',
                    local: 'N/A',
                    diff: '—',
                  },
                  {
                    cat: 'Textiles & habillement',
                    imp: '20–25 %',
                    local: '0 %',
                    diff: '20–25 pts',
                  },
                ],
              },
              {
                territory: 'La Réunion 🇷🇪',
                source: 'Délibération AP 2022/50 du Conseil Régional de La Réunion',
                sourceUrl: 'https://www.regionreunion.com',
                rows: [
                  { cat: 'Alimentation courante', imp: '2,5–5 %', local: '0 %', diff: '2,5–5 pts' },
                  {
                    cat: 'Boissons alcoolisées (bières importées)',
                    imp: '35 %',
                    local: '5 %',
                    diff: '30 pts',
                  },
                  { cat: 'Véhicules particuliers', imp: '23 %', local: 'N/A', diff: '—' },
                  {
                    cat: 'Matériaux de construction',
                    imp: '5–10 %',
                    local: '0 %',
                    diff: '5–10 pts',
                  },
                  {
                    cat: 'Équipements électroniques (téléphones)',
                    imp: '6–9 %',
                    local: 'N/A',
                    diff: '—',
                  },
                  { cat: 'Cosmétiques & hygiène', imp: '15–18 %', local: '0 %', diff: '15–18 pts' },
                ],
              },
              {
                territory: 'Martinique 🇲🇶',
                source: 'Délibération 2022/004 du Conseil Exécutif de Martinique',
                sourceUrl: 'https://www.collectivitedemartinique.mq',
                rows: [
                  { cat: 'Alimentation courante', imp: '5–7 %', local: '0 %', diff: '5–7 pts' },
                  {
                    cat: 'Rhum importé (hors rhum martiniquais)',
                    imp: '55–60 %',
                    local: '0 %',
                    diff: '55–60 pts',
                  },
                  { cat: 'Véhicules particuliers', imp: '30 %', local: 'N/A', diff: '—' },
                  { cat: 'Informatique, appareils photo', imp: '7–10 %', local: 'N/A', diff: '—' },
                  { cat: 'Ameublement', imp: '15–20 %', local: '5 %', diff: '10–15 pts' },
                ],
              },
            ].map((t) => (
              <div key={t.territory} className="mb-6">
                <h3 className="text-base font-bold text-white mb-2">{t.territory}</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-800 text-gray-300">
                      <tr>
                        <th className="px-3 py-2 text-left">Catégorie de produit</th>
                        <th className="px-3 py-2 text-center">Importé (OM-R)</th>
                        <th className="px-3 py-2 text-center">Produit local (OM-R)</th>
                        <th className="px-3 py-2 text-center">Différentiel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.rows.map((row) => (
                        <tr
                          key={row.cat}
                          className="border-t border-slate-800 hover:bg-slate-800/30"
                        >
                          <td className="px-3 py-2 text-gray-200">{row.cat}</td>
                          <td className="px-3 py-2 text-center text-orange-300 font-semibold">
                            {row.imp}
                          </td>
                          <td className="px-3 py-2 text-center text-green-300">{row.local}</td>
                          <td className="px-3 py-2 text-center text-purple-300 font-semibold">
                            {row.diff}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Source : <SourceLink href={t.sourceUrl}>{t.source}</SourceLink> · +2,5 % OM-C dans
                  tous les cas
                </p>
              </div>
            ))}

            <InfoBox color="green" title="✅ Les produits de première nécessité exonérés">
              Dans tous les DROM, les produits exonérés d'OM par délibération régionale incluent
              généralement : médicaments remboursables, dispositifs médicaux essentiels, certains
              produits alimentaires de base (eau en bouteille obligatoire, riz, sel, sucre selon
              territoires), engrais agricoles, matériels éducatifs pour enfants.
            </InfoBox>
          </div>
        )}

        {/* ══ TAB 4 : Impact consommateur ══ */}
        {activeTab === 'impact' && (
          <div>
            <SectionTitle icon={TrendingUp}>
              Impact réel sur les prix à la consommation
            </SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              L'octroi de mer n'est que l'un des facteurs expliquant la vie chère dans les DOM-TOM.
              Mesurer son impact réel est complexe : il agit à la fois directement (sur le prix du
              produit) et indirectement (en protégeant des industries locales qui peuvent maintenir
              des prix élevés en raison d'une concurrence réduite).
            </p>

            {/* Impact by product category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                {
                  cat: '🍺 Boissons (importées)',
                  impact: '+8 à +25 %',
                  note: 'Ex : bière importée à 1,20 € HT → ~1,48 € après OM 18 % + OM-C 2,5 %',
                  color: '#f97316',
                },
                {
                  cat: '👕 Habillement importé',
                  impact: '+10 à +25 %',
                  note: "Textile asiatique : OM jusqu'à 25 % → forte répercussion sur prix rayon",
                  color: '#a78bfa',
                },
                {
                  cat: '🚗 Automobiles',
                  impact: '+23 à +30 %',
                  note: "Voiture à 20 000 € HT : +4 600 à +6 000 € d'OM seul, avant TVA",
                  color: '#ef4444',
                },
                {
                  cat: '🏗️ Matériaux de construction',
                  impact: '+8 à +12 %',
                  note: 'Ciment, fer, verre : impact direct sur le coût de construction immobilière',
                  color: '#60a5fa',
                },
                {
                  cat: '🥗 Alimentation courante',
                  impact: '+2 à +8 %',
                  note: "Taux bas sur les produits de base, mais peut s'accumuler avec la marge de distribution",
                  color: '#34d399',
                },
                {
                  cat: '📱 Électronique / High-tech',
                  impact: '+6 à +10 %',
                  note: 'Smartphones, ordinateurs : taux modérés mais produits chers en valeur absolue',
                  color: '#fbbf24',
                },
              ].map((item) => (
                <div
                  key={item.cat}
                  className="rounded-xl p-4 border border-slate-700 bg-slate-800/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">{item.cat}</span>
                    <span className="text-sm font-bold" style={{ color: item.color }}>
                      {item.impact}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.note}</p>
                </div>
              ))}
            </div>

            <InfoBox color="red" title="⚠️ L'effet multiplicateur : OM + marges de distribution">
              L'octroi de mer est calculé sur la valeur CIF (avant marges de distribution). Mais les
              distributeurs appliquent leurs marges <em>après</em> répercussion de l'OM. Ainsi, un
              produit avec 20 % d'OM verra son surcoût final amplifié :
              <br />
              <br />
              Valeur CIF 100 € → OM 20 % = 20 € → prix d'achat distributeur = 120 € → marge
              distributeur 30 % = 36 € → prix rayon = 156 € · soit +56 % par rapport au prix métro.
              <br />
              <br />
              L'Autorité de la concurrence (Avis 09-A-45) a documenté ces effets multiplicateurs,
              estimant que les marges de gros et de détail dans les DOM amplifient significativement
              l'impact final de l'OM.
            </InfoBox>

            <div className="mt-6 border border-slate-700 rounded-xl overflow-hidden">
              <div className="bg-slate-800 px-4 py-2">
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Synthèse : part de l'OM dans le surcoût total DOM vs métropole
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-4">
                  Selon l'INSEE (enquête niveaux de vie DOM 2022), le surcoût alimentaire moyen dans
                  les DOM est de +11 % à +17 % par rapport à la métropole. L'octroi de mer
                  n'explique qu'une partie de cet écart :
                </p>
                {[
                  { factor: 'Octroi de mer', pct: 30, color: '#a78bfa' },
                  { factor: 'Fret maritime & surcoût logistique', pct: 28, color: '#60a5fa' },
                  { factor: 'Marges de distribution plus élevées', pct: 25, color: '#f97316' },
                  { factor: "Coûts d'exploitation plus élevés", pct: 12, color: '#fbbf24' },
                  { factor: 'Autres facteurs', pct: 5, color: '#64748b' },
                ].map((row) => (
                  <div key={row.factor} className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-gray-300 min-w-[230px]">{row.factor}</span>
                    <div
                      className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={row.pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${row.factor} : ${row.pct}%`}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${row.pct}%`, background: row.color }}
                      />
                    </div>
                    <span
                      className="text-xs font-bold min-w-[36px] text-right"
                      style={{ color: row.color }}
                    >
                      {row.pct} %
                    </span>
                  </div>
                ))}
                <p className="text-xs text-gray-600 mt-2">
                  Source : INSEE — Enquête niveaux de vie DOM 2022 ; Autorité de la concurrence,
                  Avis 09-A-45 (2009) et Avis 19-A-12 (2019) ; IEDOM Rapports annuels 2023. Parts
                  estimées, non exclusives.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 5 : Financement des collectivités ══ */}
        {activeTab === 'budget' && (
          <div>
            <SectionTitle icon={Landmark}>
              Financement des collectivités : qui reçoit quoi ?
            </SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              L'octroi de mer est une ressource fiscale{' '}
              <strong className="text-white">vitale</strong> pour les collectivités d'outre-mer.
              Sans elle, ni les Régions ni les communes ne pourraient financer leurs budgets de
              fonctionnement et d'investissement au niveau actuel.
            </p>

            {/* Revenue table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 mb-6">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Territoire</th>
                    <th className="px-4 py-3 text-center">Recettes OM totales</th>
                    <th className="px-4 py-3 text-center">Part budget régional</th>
                    <th className="px-4 py-3 text-center">Redistribution communes</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      t: 'Guadeloupe 🇬🇵',
                      total: '~280 M€',
                      pct: '~30 %',
                      communes: '~100 M€ (OM-C)',
                    },
                    {
                      t: 'Martinique 🇲🇶',
                      total: '~320 M€',
                      pct: '~32 %',
                      communes: '~115 M€ (OM-C)',
                    },
                    {
                      t: 'La Réunion 🇷🇪',
                      total: '~430 M€',
                      pct: '~28 %',
                      communes: '~155 M€ (OM-C)',
                    },
                    { t: 'Guyane 🇬🇫', total: '~120 M€', pct: '~25 %', communes: '~43 M€ (OM-C)' },
                    { t: 'Mayotte 🇾🇹', total: '~50 M€', pct: '~22 %', communes: '~18 M€ (OM-C)' },
                    { t: 'TOTAL (5 DROM)', total: '~1,2 Md€', pct: '—', communes: '~431 M€' },
                  ].map((row) => (
                    <tr
                      key={row.t}
                      className={`border-t border-slate-800 hover:bg-slate-800/40 ${row.t.includes('TOTAL') ? 'bg-purple-900/20 font-semibold' : ''}`}
                    >
                      <td className="px-4 py-3 text-white">{row.t}</td>
                      <td className="px-4 py-3 text-center text-purple-300 font-semibold">
                        {row.total}
                      </td>
                      <td className="px-4 py-3 text-center text-yellow-300">{row.pct}</td>
                      <td className="px-4 py-3 text-center text-blue-300">{row.communes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-600 mb-6">
              Sources : DGDDI — Statistiques recettes octroi de mer 2022-2023 ; Cour des Comptes —
              Rapport finances collectivités d'outre-mer (2023) ; IEDOM Rapports annuels 2023.
            </p>

            <Collapse title="🏗️ À quoi sert l'octroi de mer pour les collectivités ?">
              <p className="mb-3">Les recettes d'octroi de mer financent directement :</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  <strong>Investissements routiers et portuaires</strong> (routes, ports, pistes
                  d'atterrissage des communes isolées)
                </li>
                <li>
                  <strong>Construction et rénovation scolaire</strong> (lycées pour les Régions,
                  écoles primaires pour les communes)
                </li>
                <li>
                  <strong>Politiques de développement économique</strong> (aides aux entreprises,
                  zones franches)
                </li>
                <li>
                  <strong>Services publics locaux</strong> (eau potable, assainissement, collecte de
                  déchets dans les communes)
                </li>
                <li>
                  <strong>Politique de santé régionale</strong> (équipements hospitaliers, SMUR)
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-3">
                Source : Cour des Comptes — Rapport 2023 sur les finances des collectivités DOM.
              </p>
            </Collapse>

            <InfoBox color="purple" title="🔍 Le dilemme : supprimer l'OM, c'est possible ?">
              En 2019, le rapport Lurel-Hoibian estimait que supprimer l'octroi de mer sans
              compensation créerait un manque à gagner de <strong>1,2 Md€/an</strong> dans les
              budgets locaux DOM. Sans ressource de remplacement, les collectivités devraient soit
              augmenter fortement d'autres taxes locales (taxe foncière, taxe professionnelle), soit
              réduire drastiquement les services publics.
              <br />
              <br />
              C'est pourquoi même les partisans d'une réforme profonde ne préconisent pas la
              suppression pure et simple mais une <strong>transformation du mécanisme</strong>.
            </InfoBox>
          </div>
        )}

        {/* ══ TAB 6 : Acteurs ══ */}
        {activeTab === 'acteurs' && (
          <div>
            <SectionTitle icon={Users}>Qui décide, qui contrôle, qui critique ?</SectionTitle>

            {[
              {
                role: 'Commission européenne (DG TAXUD)',
                emoji: '🇪🇺',
                color: '#3b82f6',
                desc: `Autorise le régime d'octroi de mer sur la base de l'art. 349 TFUE (statut RUP).
                  Évalue tous les 7 ans si les différentiels restent justifiés. Peut exiger des ajustements
                  si certains secteurs bénéficient de protections jugées disproportionnées.`,
                source: {
                  label: 'DG TAXUD — Régime fiscal RUP',
                  url: 'https://ec.europa.eu/taxation_customs/taxation-1/excise-duties-energy-alcohol-tobacco/excise-duties-energy_en',
                },
              },
              {
                role: 'Conseils Régionaux (GP, MQ, GF, RE) & Département Mayotte',
                emoji: '🏛️',
                color: '#a78bfa',
                desc: `Fixent les taux par délibération. Pouvoir discrétionnaire dans les limites autorisées
                  par la décision UE. Enjeu politique fort : chaque délibération tarifaire est un arbitrage
                  entre protection des entreprises locales, recettes fiscales et pouvoir d'achat des ménages.`,
                source: {
                  label: 'Conseil Régional Guadeloupe — Délibérations',
                  url: 'https://www.cr-guadeloupe.fr',
                },
              },
              {
                role: 'DGDDI — Douanes françaises',
                emoji: '🎯',
                color: '#34d399',
                desc: `Collecte l'octroi de mer. Vérifie les déclarations des importateurs et assujettis.
                  Publie les statistiques de recettes. Assure le contrôle douanier aux points d'entrée
                  (ports, aéroports). Référence pour les données officielles.`,
                source: { label: 'DGDDI — Douane française', url: 'https://www.douane.gouv.fr' },
              },
              {
                role: 'Autorité de la concurrence',
                emoji: '⚖️',
                color: '#f97316',
                desc: `A publié deux avis majeurs (09-A-45 en 2009 et 19-A-12 en 2019) analysant l'impact
                  de l'octroi de mer sur la concurrence dans les DOM. Ses conclusions : l'OM contribue à
                  la vie chère mais la concentration des marchés de distribution reste le facteur
                  prépondérant. A recommandé une révision des différentiels les plus élevés.`,
                source: {
                  label: 'Autorité de la concurrence — Avis 09-A-45',
                  url: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande-consommation',
                },
              },
              {
                role: 'Cour des Comptes',
                emoji: '📊',
                color: '#fbbf24',
                desc: `A publié en 2023 un rapport complet sur les finances des collectivités d'outre-mer,
                  incluant une analyse approfondie de l'octroi de mer. Recommande une modernisation du
                  dispositif pour le rendre plus transparent, plus ciblé sur les vrais handicaps structurels
                  et moins favorable aux rentes de situation.`,
                source: {
                  label: 'Cour des Comptes — Rapport 2023 finances DOM',
                  url: 'https://www.ccomptes.fr',
                },
              },
              {
                role: 'Syndicats & associations de consommateurs',
                emoji: '👥',
                color: '#f87171',
                desc: `L'UGTG (Guadeloupe), la CFTU (Martinique), UFC-Que Choisir, et diverses associations
                  citoyennes dénoncent régulièrement l'opacité des délibérations tarifaires et l'effet
                  de l'OM sur le pouvoir d'achat des ménages modestes. Leurs actions ont conduit à certaines
                  exonérations sur les produits de première nécessité.`,
                source: { label: 'UFC-Que Choisir DOM', url: 'https://www.quechoisir.org' },
              },
            ].map((actor) => (
              <div
                key={actor.role}
                className="mb-4 border border-slate-700 rounded-xl p-4 hover:bg-slate-900/50 transition-colors"
                style={{ borderLeftColor: actor.color, borderLeftWidth: 3 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{actor.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white mb-2">{actor.role}</p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{actor.desc}</p>
                    <SourceLink href={actor.source.url}>{actor.source.label}</SourceLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ TAB 7 : Sources & réforme ══ */}
        {activeTab === 'sources' && (
          <div>
            <SectionTitle icon={BookOpen}>Sources, méthode & débat sur la réforme</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Toutes les données de ce dossier sont issues de sources officielles librement
              accessibles. Voici les références organisées par thème.
            </p>

            <Collapse title="📜 Textes législatifs et réglementaires de référence">
              <ul className="space-y-2 text-xs">
                {[
                  {
                    text: "Loi n° 2004-639 du 2 juillet 2004 relative à l'octroi de mer",
                    url: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000000622975/',
                  },
                  {
                    text: 'Décision (UE) 2021/1657 du Conseil du 17 sept. 2021 — prorogation au 31 déc. 2027',
                    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32021D1657',
                  },
                  {
                    text: 'Règlement (UE) 2022/2 du 29 oct. 2021 (annexes tarifaires)',
                    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022R0002',
                  },
                  {
                    text: 'Article 349 TFUE — Statut des régions ultrapériphériques',
                    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:12012E/TXT',
                  },
                  {
                    text: 'Article 296 du CGI — TVA DOM taux réduit 8,5 %',
                    url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006309498/',
                  },
                ].map((ref) => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-purple-400 flex-shrink-0">▸</span>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-purple-300 underline underline-offset-2"
                    >
                      {ref.text}
                    </a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="📊 Données économiques et rapports officiels">
              <ul className="space-y-2 text-xs">
                {[
                  {
                    text: 'DGDDI — Statistiques recettes octroi de mer 2022',
                    url: 'https://www.douane.gouv.fr/fiche/statistiques-des-recettes',
                  },
                  {
                    text: 'IEDOM — Rapports annuels 2023 (Guadeloupe, Martinique, Guyane, Réunion, Mayotte)',
                    url: 'https://www.iedom.fr/iedom/publications/rapports-annuels.html',
                  },
                  {
                    text: 'Autorité de la concurrence — Avis 09-A-45 du 8 septembre 2009',
                    url: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande-consommation',
                  },
                  {
                    text: 'Autorité de la concurrence — Avis 19-A-12 du 3 septembre 2019',
                    url: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-au-fonctionnement-de-la-concurrence-dans-les-secteurs-du-commerce-de-detail-dans',
                  },
                  {
                    text: "Cour des Comptes — Rapport 2023 finances collectivités d'outre-mer",
                    url: 'https://www.ccomptes.fr/fr/publications/les-finances-des-collectivites-doutre-mer',
                  },
                  {
                    text: 'INSEE — Enquête niveaux de vie et prix DOM 2022-2023',
                    url: 'https://www.insee.fr/fr/statistiques/2586930',
                  },
                  {
                    text: "CEROM — Comptes Économiques Rapides pour l'Outre-Mer 2022",
                    url: 'https://www.cerom-outremer.fr/',
                  },
                ].map((ref) => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-blue-400 flex-shrink-0">▸</span>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-blue-300 underline underline-offset-2"
                    >
                      {ref.text}
                    </a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="🔮 Les scénarios de réforme pour 2027">
              <p className="mb-3 text-sm">
                Le régime expire le 31 décembre 2027. Plusieurs scénarios circulent dans les sphères
                institutionnelles :
              </p>
              <div className="space-y-3">
                {[
                  {
                    title: "Scénario 1 — Prorogation à l'identique",
                    pros: 'Stabilité budgétaire ; aucune transition à gérer',
                    cons: 'Perpétue la vie chère ; Bruxelles exige des justifications croissantes',
                    color: '#64748b',
                  },
                  {
                    title: 'Scénario 2 — Réforme des différentiels (modèle Lurel-Hoibian)',
                    pros: 'Baisse des différentiels les plus élevés ; meilleur ciblage',
                    cons: 'Perte de recettes régionales partielles ; opposition des industriels locaux',
                    color: '#60a5fa',
                  },
                  {
                    title: 'Scénario 3 — Remplacement par une TVA DOM majorée',
                    pros: 'Mécanisme familier ; plus transparent pour le consommateur',
                    cons: 'Perd l\'avantage "production locale" ; modification TFUE art.349 nécessaire',
                    color: '#a78bfa',
                  },
                  {
                    title: 'Scénario 4 — Suppression partielle sur les produits de base',
                    pros: 'Impact immédiat sur vie chère alimentaire ; simple',
                    cons: 'Perte de ~200 M€/an de recettes ; compensations DGF à négocier',
                    color: '#34d399',
                  },
                ].map((s) => (
                  <div
                    key={s.title}
                    className="rounded-xl p-3 border border-slate-700"
                    style={{ borderLeftColor: s.color, borderLeftWidth: 3 }}
                  >
                    <p className="text-sm font-semibold text-white mb-2">{s.title}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-green-400 font-semibold mb-1">✅ Avantages</p>
                        <p className="text-gray-400">{s.pros}</p>
                      </div>
                      <div>
                        <p className="text-red-400 font-semibold mb-1">⚠️ Limites</p>
                        <p className="text-gray-400">{s.cons}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Collapse>

            <InfoBox color="green" title="💬 Données à partager ou correction à signaler ?">
              Si vous êtes responsable douanier, élu régional, chercheur ou citoyen disposant de
              données officielles (délibérations récentes, statistiques DGDDI, etc.), contactez-nous
              via notre formulaire. Nous vérifions toute contribution avant intégration.
            </InfoBox>
          </div>
        )}

        {/* CTA bottom */}
        <div className="mt-12 bg-gradient-to-r from-purple-900/30 to-slate-900 border border-purple-500/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-lg mb-1">
              🧮 Calculez l'impact de l'octroi de mer sur vos achats
            </h3>
            <p className="text-sm text-gray-400">
              Utilisez notre calculateur pédagogique pour simuler le prix d'un produit importé,
              toutes taxes comprises.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <Link
              to="/calculateur-octroi"
              className="flex items-center gap-2 px-5 py-3 bg-purple-500 hover:bg-purple-400 text-white font-semibold rounded-xl transition-colors"
            >
              <Scale className="w-4 h-4" /> Calculateur Octroi de mer
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/conference-octroi-mer"
              className="flex items-center gap-2 px-5 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-semibold rounded-xl transition-colors"
            >
              <GraduationCap className="w-4 h-4" /> Conférence institutionnelle
            </Link>
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-700 text-center">
          Observatoire A KI PRI SA YÉ — Dossier Octroi de Mer v1.0 — Mars 2026. Ce contenu est
          fourni à titre informatif. Voir{' '}
          <Link to="/methodologie" className="underline hover:text-gray-500">
            notre méthodologie
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default EnqueteOctroiMer;
