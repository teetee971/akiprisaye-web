/**
 * EnqueteEau.tsx
 *
 * Dossier d'enquête complet sur l'eau dans les territoires d'outre-mer.
 *
 * Sources officielles :
 *  - Code de l'environnement — art. L210-1 et suivants (Légifrance)
 *  - Loi sur l'Eau et les Milieux Aquatiques (LEMA) n° 2006-1772 du 30 déc. 2006
 *  - Directive UE 2020/2184 du 16 décembre 2020 (eau potable)
 *  - Plan Eau 2023 — 53 mesures du gouvernement (premier ministre, mars 2023)
 *  - ARS Guadeloupe — Rapports qualité des eaux 2022-2024
 *  - ARS Martinique — Rapports qualité des eaux 2022-2024
 *  - ARS La Réunion — Rapports qualité des eaux 2022-2024
 *  - ARS Guyane — Rapports qualité des eaux 2022-2024
 *  - ARS Mayotte — Rapports qualité des eaux 2022-2024
 *  - BRGM — Ressources en eaux souterraines des DOM (2023)
 *  - Offices de l'eau DOM — Rapports annuels (2022-2023)
 *  - UFC-Que Choisir — Rapport tarifs eau DOM (2023)
 *  - Cour des Comptes — Rapport sur les services d'eau et d'assainissement DOM (2020)
 *  - DGALN — Données SISPEA (Système d'Information sur les Services Publics d'Eau et d'Assainissement)
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Droplet,
  TrendingUp,
  Globe,
  DollarSign,
  BarChart2,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  FileText,
  MapPin,
  BookOpen,
  ExternalLink,
  Shield,
  ArrowLeft,
  GraduationCap,
  History,
  Users,
  Wrench,
  Heart,
} from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

/* ─── Tabs ──────────────────────────────────────────────────────────────── */

const TABS = [
  { key: 'contexte', label: 'Enjeux & contexte', icon: Globe },
  { key: 'qualite', label: 'Qualité & santé', icon: Shield },
  { key: 'tarifs', label: 'Tarifs & inégalités', icon: DollarSign },
  { key: 'infrastructure', label: 'Infrastructures', icon: Wrench },
  { key: 'acteurs', label: 'Gouvernance & acteurs', icon: Users },
  { key: 'focus', label: 'Focus Mayotte & Guyane', icon: MapPin },
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
      <Icon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
      {children}
    </h2>
  );
}

function InfoBox({
  color = 'blue',
  title,
  children,
}: {
  color?: 'blue' | 'amber' | 'green' | 'red' | 'cyan';
  title: string;
  children: React.ReactNode;
}) {
  const palette: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
    green: 'bg-green-500/10 border-green-500/30 text-green-200',
    red: 'bg-red-500/10 border-red-500/30 text-red-200',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200',
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
        highlight ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-800 border-slate-700'
      }`}
    >
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-cyan-300' : 'text-white'}`}>{value}</p>
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
      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline underline-offset-2 text-xs"
    >
      <ExternalLink className="w-3 h-3" />
      {children}
    </a>
  );
}

/* ─── Tab content components ───────────────────────────────────────────── */

function TabContexte() {
  return (
    <div>
      <SectionTitle icon={Globe}>L'eau dans les DOM : un enjeu vital et sous-estimé</SectionTitle>
      <p className="text-gray-300 text-sm mb-6 leading-relaxed">
        L'accès à une eau potable de qualité est un droit fondamental reconnu par l'ONU en 2010.
        Dans les territoires d'outre-mer français, ce droit reste fragile : infrastructures
        vieillissantes, contaminations historiques, tarifs élevés et inégalités d'accès persistent
        malgré des décennies d'investissements. Cette enquête documente la réalité du service d'eau
        dans les cinq DROM avec des données officielles.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <DataCard
          label="Écart tarifaire moyen DOM/Métropole"
          value="+40 à +120%"
          sub="selon territoire et service"
          highlight
        />
        <DataCard label="Taux de fuite réseau Guadeloupe" value="~60%" sub="vs 20% en métropole" />
        <DataCard
          label="Pop. sans eau potable (Mayotte)"
          value="~15–20%"
          sub="Source : ARS Mayotte 2023"
        />
        <DataCard label="Investissement FEDER eau DOM" value="~800 M€" sub="Prog. 2021-2027" />
      </div>

      <InfoBox color="amber" title="⚠️ Note méthodologique">
        Les données présentées proviennent de sources officielles publiques : ARS, Offices de l'eau
        DOM, Cour des Comptes, DGALN/SISPEA, UFC-Que Choisir. Les tarifs cités sont indicatifs et
        peuvent varier selon la commune, l'intercommunalité et le contrat en cours. Cette page vise
        à informer, pas à remplacer une consultation juridique ou technique.
      </InfoBox>

      <SectionTitle icon={BarChart2}>Taux de raccordement au réseau d'eau potable</SectionTitle>
      <div className="space-y-3 mb-6">
        {[
          { t: 'La Réunion 🇷🇪', v: 98, note: 'Réseau bien développé, gestion SPL', c: '#22d3ee' },
          { t: 'Martinique 🇲🇶', v: 97, note: 'ODYSSI + quelques régies communales', c: '#22d3ee' },
          {
            t: 'Guadeloupe 🇬🇵',
            v: 95,
            note: 'Réseau raccordé mais interruptions fréq.',
            c: '#60a5fa',
          },
          { t: 'Guyane 🇬🇫', v: 82, note: 'Zones rurales isolées non raccordées', c: '#f59e0b' },
          { t: 'Mayotte 🇾🇹', v: 82, note: "Crise d'accès structurelle", c: '#ef4444' },
          { t: 'Métropole 🇫🇷', v: 99.5, note: 'Référence nationale', c: '#4ade80' },
        ].map((row) => (
          <div key={row.t} className="bg-slate-800/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-200">{row.t}</span>
              <span className="text-sm font-bold" style={{ color: row.c }}>
                {row.v}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full"
                style={{ width: `${row.v}%`, background: row.c }}
              />
            </div>
            <p className="text-xs text-gray-500">{row.note}</p>
          </div>
        ))}
      </div>

      <SectionTitle icon={History}>Chronologie des crises et réformes</SectionTitle>
      <div className="space-y-3 mb-6">
        {[
          {
            year: '2006',
            title: "Loi sur l'Eau et les Milieux Aquatiques (LEMA)",
            note: "Renforcement du droit d'accès à l'eau, organisation des services.",
            c: '#22d3ee',
          },
          {
            year: '2010',
            title: "Résolution ONU — Droit à l'eau potable",
            note: "L'accès à l'eau est reconnu droit humain fondamental (résolution 64/292).",
            c: '#60a5fa',
          },
          {
            year: '2013',
            title: 'Début de la crise Guadeloupe',
            note: "Le Syndicat Mixte Ouvert (SMO) dénonce l'état catastrophique du réseau. Signalement à l'État.",
            c: '#f59e0b',
          },
          {
            year: '2020',
            title: 'Rapport Cour des Comptes',
            note: "Constat sévère sur la gestion des services d'eau dans les DOM : sous-investissement chronique.",
            c: '#ef4444',
          },
          {
            year: '2021',
            title: 'Directive UE 2020/2184',
            note: "Nouvelle directive sur l'eau potable : normes renforcées, obligation de transparence tarifaire.",
            c: '#a78bfa',
          },
          {
            year: '2022',
            title: 'Plan Urgence Eau Guadeloupe',
            note: "L'État débloque 40 M€ d'urgence pour les réseaux guadeloupéens les plus dégradés.",
            c: '#22d3ee',
          },
          {
            year: '2023',
            title: 'Plan Eau national (53 mesures)',
            note: 'Premier ministre : sobriété, réutilisation des eaux usées, soutien spécifique aux outre-mer.',
            c: '#4ade80',
          },
          {
            year: '2024',
            title: 'Crise hydrique Mayotte',
            note: "Restrictions d'eau : alimentation 1 jour sur 2. ARS et État déclenchent le plan de crise.",
            c: '#ef4444',
          },
        ].map((ev, i) => (
          <div key={ev.year} className="flex gap-3">
            <div className="flex flex-col items-center w-10 flex-shrink-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: `${ev.c}22`, border: `1.5px solid ${ev.c}`, color: ev.c }}
              >
                {ev.year.slice(2)}
              </div>
              {i < 7 && <div className="w-px flex-1 mt-1 bg-slate-700" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold text-white">{ev.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{ev.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabQualite() {
  return (
    <div>
      <SectionTitle icon={Shield}>Qualité de l'eau potable : bilan par territoire</SectionTitle>
      <p className="text-gray-300 text-sm mb-6 leading-relaxed">
        La qualité de l'eau dans les DOM est surveillée par les Agences Régionales de Santé (ARS).
        Si le taux de conformité global s'est amélioré, plusieurs problématiques persistent :
        contamination au chlordécone aux Antilles, turbidité en période de pluie, vétusté des
        installations de traitement.
      </p>

      <InfoBox color="red" title="🚨 Chlordécone : contamination persistante aux Antilles">
        Le chlordécone est un pesticide organochloré utilisé dans les bananeraies guadeloupéennes et
        martiniquaises de 1972 à 1993. Classé cancérigène possible (CIRC groupe 2B), il contamine
        durablement les sols et certaines sources d'eau. Des restrictions de consommation de
        végétaux et d'eau de source restent en vigueur dans certaines zones.
        <br />
        <br />
        <SourceLink href="https://www.santepubliquefrance.fr/determinants-de-sante/exposition-a-des-substances-chimiques/pesticides/chlordecone">
          Santé Publique France — Chlordécone
        </SourceLink>
      </InfoBox>

      <SectionTitle icon={BarChart2}>Conformité des eaux distribuées (ARS, 2023)</SectionTitle>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-800">
            <tr>
              <th className="text-left px-3 py-2 text-gray-300">Territoire</th>
              <th className="text-left px-3 py-2 text-gray-300">Conformité bactério.</th>
              <th className="text-left px-3 py-2 text-gray-300">Conformité physico-chimique</th>
              <th className="text-left px-3 py-2 text-gray-300">Risques spécifiques</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {[
              {
                t: 'Guadeloupe',
                b: '92%',
                pc: '88%',
                r: 'Chlordécone, turbidité',
                bc: '#f59e0b',
                pcc: '#ef4444',
              },
              {
                t: 'Martinique',
                b: '96%',
                pc: '91%',
                r: 'Chlordécone traces',
                bc: '#22d3ee',
                pcc: '#f59e0b',
              },
              {
                t: 'La Réunion',
                b: '98%',
                pc: '97%',
                r: 'Arsenic naturel (zones volc.)',
                bc: '#4ade80',
                pcc: '#4ade80',
              },
              {
                t: 'Guyane',
                b: '89%',
                pc: '85%',
                r: 'Turbidité, microbiologie',
                bc: '#f59e0b',
                pcc: '#ef4444',
              },
              {
                t: 'Mayotte',
                b: '84%',
                pc: '79%',
                r: 'Turbidité, nitrates, microbiologie',
                bc: '#ef4444',
                pcc: '#ef4444',
              },
              {
                t: 'Métropole',
                b: '99%',
                pc: '98%',
                r: 'Nitrates localisés',
                bc: '#4ade80',
                pcc: '#4ade80',
              },
            ].map((row) => (
              <tr key={row.t} className="hover:bg-slate-800/30">
                <td className="px-3 py-2 font-medium text-gray-200">{row.t}</td>
                <td className="px-3 py-2" style={{ color: row.bc }}>
                  {row.b}
                </td>
                <td className="px-3 py-2" style={{ color: row.pcc }}>
                  {row.pc}
                </td>
                <td className="px-3 py-2 text-gray-400 text-xs">{row.r}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Collapse title="Chlordécone : mécanisme de contamination et zones concernées">
        <p className="mb-3">
          La contamination au chlordécone est <strong>géographiquement concentrée</strong> dans les
          zones de culture bananière intensive : principalement le Nord-Basse-Terre et le Nord
          Grande-Terre en Guadeloupe, et le Nord-Atlantique et le Nord-Caraïbe en Martinique.
        </p>
        <p className="mb-3">
          Le chlordécone est extrêmement persistant dans les sols (demi-vie estimée à plusieurs
          décennies). Il peut migrer vers les nappes phréatiques et les cours d'eau lors de fortes
          pluies. Les sources captées en zones contaminées font l'objet de mesures de précaution
          strictes.
        </p>
        <p>
          Le Plan chlordécone IV (2021-2027) prévoit 92 M€ de mesures, dont le renforcement du
          contrôle sanitaire des eaux et le développement de captages alternatifs.
        </p>
      </Collapse>

      <Collapse title="Turbidité : le problème des îles tropicales en période cyclonique">
        <p className="mb-3">
          La turbidité (teneur en matières en suspension) est un problème récurrent dans les DOM,
          particulièrement après les épisodes de fortes pluies et passages cycloniques. Elle rend
          l'eau impropre à la consommation et surcharge les stations de traitement.
        </p>
        <p>
          En Guadeloupe, les épisodes de turbidité élevée entraînent régulièrement des interruptions
          de distribution ou des recommandations de faire bouillir l'eau, affectant des dizaines de
          milliers d'habitants.
        </p>
      </Collapse>

      <Collapse title="Arsenic naturel à La Réunion : une spécificité géologique">
        <p>
          En raison de l'activité volcanique, certaines zones de La Réunion présentent des teneurs
          naturelles en arsenic dans les eaux souterraines. Des stations de déferrisation et de
          démanganisation ont été installées pour réduire ces teneurs sous les seuils réglementaires
          (10 µg/L selon la directive UE 2020/2184). La situation est globalement maîtrisée.
        </p>
      </Collapse>
    </div>
  );
}

function TabTarifs() {
  return (
    <div>
      <SectionTitle icon={DollarSign}>
        Tarifs de l'eau dans les DOM : une inégalité structurelle
      </SectionTitle>
      <p className="text-gray-300 text-sm mb-6 leading-relaxed">
        Le prix de l'eau est fixé localement par chaque collectivité délégataire. Dans les DOM, la
        combinaison de réseaux dégradés, de faibles économies d'échelle et de coûts d'importation de
        matériaux engendre des tarifs systématiquement supérieurs à la moyenne métropolitaine.
        L'UFC-Que Choisir et la Cour des Comptes ont documenté ces écarts.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <DataCard
          label="Prix moyen eau potable DOM"
          value="~3,80 €/m³"
          sub="abonnement inclus"
          highlight
        />
        <DataCard
          label="Prix moyen eau potable métropole"
          value="~2,10 €/m³"
          sub="abonnement inclus"
        />
        <DataCard label="Écart moyen DOM/métropole" value="+81%" sub="Source : UFC-QC 2023" />
        <DataCard
          label="Variation max. intra-DOM"
          value="x3"
          sub="entre organismes d'un même territoire"
        />
      </div>

      <InfoBox color="cyan" title="📊 Méthode tarifaire : comment lire une facture d'eau ?">
        La facture d'eau comprend deux parties : <strong>la part fixe (abonnement)</strong>,
        indépendante de la consommation, et <strong>la part variable (prix au m³)</strong>,
        proportionnelle à la consommation. En France, l'assainissement représente en moyenne 40–50 %
        de la facture totale. Les données SISPEA (DGALN) permettent de comparer les services
        eau+assainissement.
      </InfoBox>

      <SectionTitle icon={BarChart2}>
        Comparatif tarifaire eau+assainissement (prix TTC, 120 m³/an)
      </SectionTitle>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-800">
            <tr>
              <th className="text-left px-3 py-2 text-gray-300">Territoire / Organisme</th>
              <th className="text-left px-3 py-2 text-gray-300">Prix m³ eau pot.</th>
              <th className="text-left px-3 py-2 text-gray-300">Prix m³ assainis.</th>
              <th className="text-left px-3 py-2 text-gray-300">Abonnement/mois</th>
              <th className="text-left px-3 py-2 text-gray-300">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {[
              {
                t: 'GDEG — Guadeloupe',
                ep: '4,85 €',
                as: '2,45 €',
                ab: '9,75 €',
                s: 'SISPEA 2023',
              },
              {
                t: 'Régie Basse-Terre — GP',
                ep: '4,60 €',
                as: '1,90 €',
                ab: '9,20 €',
                s: 'SISPEA 2023',
              },
              {
                t: 'ODYSSI — Martinique',
                ep: '3,95 €',
                as: '2,20 €',
                ab: '8,50 €',
                s: 'SISPEA 2023',
              },
              {
                t: 'CAP Nord — Martinique',
                ep: '4,10 €',
                as: '2,35 €',
                ab: '8,90 €',
                s: 'SISPEA 2023',
              },
              {
                t: 'SPL Eau Réunion — Nord',
                ep: '2,80 €',
                as: '1,65 €',
                ab: '7,20 €',
                s: 'SISPEA 2023',
              },
              {
                t: 'CISE Réunion — Ouest',
                ep: '3,10 €',
                as: '1,80 €',
                ab: '7,80 €',
                s: 'SISPEA 2023',
              },
              { t: 'Cayenne — Guyane', ep: '3,50 €', as: '1,95 €', ab: '8,10 €', s: 'SISPEA 2023' },
              {
                t: 'SMEG — Mayotte',
                ep: '5,20 €',
                as: 'N/A',
                ab: '12,40 €',
                s: 'ARS Mayotte 2023',
              },
              {
                t: 'Métropole (médiane)',
                ep: '2,10 €',
                as: '1,55 €',
                ab: '6,50 €',
                s: 'UFC-QC 2023',
              },
            ].map((row) => (
              <tr key={row.t} className="hover:bg-slate-800/30">
                <td className="px-3 py-2 font-medium text-gray-200 text-xs">{row.t}</td>
                <td className="px-3 py-2 text-cyan-300 font-semibold">{row.ep}</td>
                <td className="px-3 py-2 text-blue-300">{row.as}</td>
                <td className="px-3 py-2 text-gray-300">{row.ab}</td>
                <td className="px-3 py-2 text-gray-500 text-xs">{row.s}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InfoBox color="amber" title="⚠️ Données indicatives">
        Les tarifs présentés sont des exemples représentatifs issus du système SISPEA (DGALN) et des
        rapports ARS. Ils peuvent évoluer annuellement par délibération des assemblées locales. Les
        consommations réelles, la part redevances et les taxes locales peuvent modifier
        significativement le montant final de la facture.
      </InfoBox>

      <Collapse title="Pourquoi l'eau est-elle si chère dans les DOM ?">
        <p className="mb-3">
          <strong>1. Géographie et insularité :</strong> Les réseaux insulaires sont fragmentés et
          nécessitent plus de linéaire de canalisations par habitant. Les pièces de rechange et
          équipements doivent être importés, souvent à des coûts majorés (effet Octroi de Mer sur
          les matériaux).
        </p>
        <p className="mb-3">
          <strong>2. Pertes sur réseau :</strong> Un taux de fuite de 60% en Guadeloupe signifie que
          les coûts de production sont répartis sur une eau effectivement livrée deux fois moins
          importante, gonflant mécaniquement le prix au m³ facturé.
        </p>
        <p className="mb-3">
          <strong>3. Coût de traitement :</strong> La turbidité récurrente et les contaminations
          nécessitent des stations de traitement plus performantes et coûteuses que dans la majorité
          des zones métropolitaines.
        </p>
        <p>
          <strong>4. Faibles économies d'échelle :</strong> Les bassins de population plus réduits
          (100 000 à 500 000 habitants par territoire) ne permettent pas les mêmes économies
          d'échelle qu'une métropole de 2 millions d'habitants.
        </p>
      </Collapse>
    </div>
  );
}

function TabInfrastructure() {
  return (
    <div>
      <SectionTitle icon={Wrench}>
        L'état des réseaux : un héritage de sous-investissement
      </SectionTitle>
      <p className="text-gray-300 text-sm mb-6 leading-relaxed">
        La Cour des Comptes, dans son rapport de 2020 sur les services d'eau dans les DOM, a dressé
        un constat sévère : des décennies de sous-investissement ont conduit à un état de
        délabrement avancé des réseaux, particulièrement en Guadeloupe. Le taux de renouvellement
        annuel des canalisations y est estimé à moins de 0,5 % contre 0,8 % recommandé en métropole.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <DataCard
          label="Taux de fuite Guadeloupe"
          value="~60%"
          sub="vs 20% en métropole"
          highlight
        />
        <DataCard label="Taux de fuite Martinique" value="~35%" sub="Source : SISPEA 2022" />
        <DataCard label="Taux de fuite La Réunion" value="~22%" sub="Proche de la métropole" />
        <DataCard
          label="Linéaire réseau Guadeloupe"
          value="~4 200 km"
          sub="dont ~40% à rénover urgence"
        />
        <DataCard
          label="Âge moyen canalisations DOM"
          value="35–50 ans"
          sub="Source : Cour des Comptes 2020"
        />
        <DataCard
          label="Besoin d'investissement DOM"
          value="~2,5 Md€"
          sub="horizon 2030 — estimation État"
        />
      </div>

      <InfoBox color="red" title="🚨 Crise Guadeloupe : un réseau en urgence">
        La Guadeloupe présente la situation la plus critique. Des coupures d'eau pouvant durer
        plusieurs jours concernent régulièrement des quartiers entiers, notamment dans la zone de la
        Basse-Terre. En 2022, le gouvernement a déclenché une procédure d'urgence et débloqué 40 M€
        de crédits exceptionnels. Le diagnostic : canalisations amiante-ciment datant des années
        1960-1970, joints défaillants, pompes hors service.
      </InfoBox>

      <SectionTitle icon={TrendingUp}>Taux de fuite comparés (pertes sur réseau)</SectionTitle>
      <div className="space-y-3 mb-6">
        {[
          {
            t: 'Guadeloupe',
            v: 60,
            note: 'Situation critique, plan urgence déclenché',
            c: '#ef4444',
          },
          { t: 'Guyane', v: 45, note: 'Réseaux ruraux très dégradés', c: '#f59e0b' },
          { t: 'Mayotte', v: 42, note: 'Réseau partiel, extensions en cours', c: '#f59e0b' },
          { t: 'Martinique', v: 35, note: 'Améliorations en cours via ODYSSI', c: '#f59e0b' },
          { t: 'La Réunion', v: 22, note: 'Réseau le mieux entretenu des DOM', c: '#4ade80' },
          { t: 'Métropole', v: 20, note: 'Référence nationale (ONEMA)', c: '#22d3ee' },
        ].map((row) => (
          <div key={row.t} className="bg-slate-800/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-200">{row.t}</span>
              <span className="text-sm font-bold" style={{ color: row.c }}>
                {row.v}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full"
                style={{ width: `${row.v}%`, background: row.c }}
              />
            </div>
            <p className="text-xs text-gray-500">{row.note}</p>
          </div>
        ))}
      </div>

      <Collapse title="Plan de renouvellement des réseaux : ce qui est prévu">
        <p className="mb-3">
          Les Contrats de Convergence et de Transformation (CCT) 2019-2022 puis 2023-2027 prévoient
          des financements spécifiques pour la rénovation des réseaux d'eau dans les DROM. Ces
          contrats combinent crédits État, FEDER (Fonds européens de développement régional) et
          crédits des collectivités locales.
        </p>
        <p className="mb-3">
          Le Plan Eau 2023 a ajouté une enveloppe spécifique outre-mer de 50 M€ supplémentaires pour
          les réseaux les plus dégradés, avec une priorité pour la Guadeloupe et Mayotte.
        </p>
        <p>
          L'objectif national fixé par la DGALN est de ramener le taux de fuite sous les 30 % dans
          tous les DOM d'ici 2030, ce qui nécessite de tripler le rythme de renouvellement des
          canalisations.
        </p>
      </Collapse>

      <Collapse title="Assainissement : le parent pauvre de l'investissement">
        <p className="mb-3">
          L'assainissement (collecte et traitement des eaux usées) est encore plus sous-financé que
          l'eau potable dans les DOM. Des zones urbanisées importantes ne sont toujours pas
          raccordées à des systèmes d'assainissement collectif conformes.
        </p>
        <p>
          En Guyane, plus de 30 % de la population utilise encore des systèmes d'assainissement non
          collectifs (fosses septiques) dont l'état et le contrôle sont insuffisants. En Mayotte, la
          situation est encore plus précaire avec des rejets directs dans le milieu naturel dans
          certaines zones.
        </p>
      </Collapse>
    </div>
  );
}

function TabActeurs() {
  return (
    <div>
      <SectionTitle icon={Users}>Qui gère l'eau dans les DOM ?</SectionTitle>
      <p className="text-gray-300 text-sm mb-6 leading-relaxed">
        La gestion de l'eau est une compétence{' '}
        <strong className="text-white">communale ou intercommunale</strong> en France. Les communes
        peuvent choisir la gestion en régie (service public direct) ou la délégation de service
        public (DSP) à un opérateur privé. Dans les DOM, les deux modes coexistent, avec une
        tendance à la consolidation intercommunale.
      </p>

      <SectionTitle icon={MapPin}>Principaux opérateurs par territoire</SectionTitle>
      <div className="space-y-4 mb-6">
        {[
          {
            territoire: 'Guadeloupe 🇬🇵',
            color: '#22d3ee',
            operateurs: [
              {
                nom: 'GDEG (Générale des Eaux Guadeloupe)',
                type: 'Filiale Veolia',
                zone: 'Grande-Terre & Marie-Galante',
                contrat: 'DSP',
              },
              {
                nom: 'SMO Guadeloupe',
                type: 'Syndicat Mixte Ouvert',
                zone: 'Production principale',
                contrat: 'Coord. territoriale',
              },
              {
                nom: 'Régie Basse-Terre',
                type: 'Régie publique',
                zone: 'Secteur Basse-Terre',
                contrat: 'Régie directe',
              },
            ],
          },
          {
            territoire: 'Martinique 🇲🇶',
            color: '#818cf8',
            operateurs: [
              {
                nom: 'ODYSSI',
                type: 'Syndicat mixte intercommunal',
                zone: 'Centre & Sud',
                contrat: 'Service public',
              },
              {
                nom: 'CAP Nord',
                type: "Communauté d'agglo.",
                zone: 'Nord Martinique',
                contrat: 'Régie',
              },
              {
                nom: 'ODE Martinique',
                type: "Office De l'Eau",
                zone: 'Coordination régionale',
                contrat: 'Observatoire',
              },
            ],
          },
          {
            territoire: 'La Réunion 🇷🇪',
            color: '#4ade80',
            operateurs: [
              {
                nom: 'SPL Eau de La Réunion',
                type: 'Société Publique Locale',
                zone: 'Nord & Est',
                contrat: 'SPL',
              },
              {
                nom: 'CISE Réunion (Suez)',
                type: 'Filiale Suez',
                zone: 'Ouest & Sud',
                contrat: 'DSP',
              },
              {
                nom: "Office de l'Eau Réunion",
                type: 'EP local',
                zone: 'Coordination régionale',
                contrat: 'Observatoire',
              },
            ],
          },
          {
            territoire: 'Guyane 🇬🇫',
            color: '#f59e0b',
            operateurs: [
              {
                nom: 'Eau et Électricité de Guyane (EEG)',
                type: 'Filiale EDF-SEEAG',
                zone: 'Cayenne + communes',
                contrat: 'DSP',
              },
              {
                nom: 'Communes isolées',
                type: 'Régies locales',
                zone: 'Intérieur & fleuves',
                contrat: 'Régie',
              },
              {
                nom: 'ODE Guyane',
                type: "Office De l'Eau",
                zone: 'Coordination régionale',
                contrat: 'Observatoire',
              },
            ],
          },
          {
            territoire: 'Mayotte 🇾🇹',
            color: '#ef4444',
            operateurs: [
              {
                nom: "SMEG (Sté Mahoraise d'Eau et de Gaz)",
                type: 'Filiale Veolia',
                zone: 'Réseau principal',
                contrat: 'DSP',
              },
              {
                nom: 'Département de Mayotte',
                type: 'Collectivité',
                zone: 'Coordination & financement',
                contrat: 'Tutelle',
              },
            ],
          },
        ].map(({ territoire, color, operateurs }) => (
          <div
            key={territoire}
            className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50"
          >
            <div
              className="px-4 py-3 font-semibold text-sm"
              style={{ color, borderBottom: `1px solid ${color}33`, background: `${color}11` }}
            >
              {territoire}
            </div>
            <div className="divide-y divide-slate-700/40">
              {operateurs.map((op) => (
                <div key={op.nom} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-200">{op.nom}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-gray-400 flex-shrink-0">
                      {op.contrat}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {op.type} — {op.zone}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SectionTitle icon={Globe}>Acteurs institutionnels de contrôle et de soutien</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {[
          {
            nom: 'ARS (Agences Régionales de Santé)',
            role: "Contrôle de la qualité de l'eau potable, analyses, autorisation des captages",
            couleur: '#22d3ee',
          },
          {
            nom: 'DGALN / SISPEA',
            role: 'Ministère de la Transition écologique — collecte des données tarifaires et techniques (SISPEA)',
            couleur: '#60a5fa',
          },
          {
            nom: "Offices de l'Eau DOM",
            role: 'Connaissance des ressources, soutien technique aux collectivités, observatoires territoriaux',
            couleur: '#818cf8',
          },
          {
            nom: 'BRGM',
            role: 'Bureau de Recherches Géologiques et Minières — étude des ressources souterraines, hydrogéologie',
            couleur: '#4ade80',
          },
          {
            nom: 'UFC-Que Choisir',
            role: 'Comparatif tarifaire annuel, alertes consommateurs, rapports sur la qualité des services',
            couleur: '#f59e0b',
          },
          {
            nom: 'Cour des Comptes',
            role: 'Contrôle de la gestion des services, rapports sur les finances des collectivités locales',
            couleur: '#ef4444',
          },
        ].map((a) => (
          <div key={a.nom} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-sm font-semibold mb-1" style={{ color: a.couleur }}>
              {a.nom}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">{a.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabFocus() {
  return (
    <div>
      <SectionTitle icon={AlertTriangle}>Mayotte : la crise la plus aiguë de France</SectionTitle>
      <InfoBox color="red" title="🚨 Mayotte : état d'urgence hydrique structurel">
        Mayotte est le territoire français où l'accès à l'eau potable est le plus précaire. En 2024,
        une restriction d'eau sévère (alimentation 1 jour sur 2 dans certaines zones) a été
        maintenue pendant plusieurs semaines. Les causes sont multiples : infrastructure
        insuffisante, croissance démographique rapide (+3,8% par an), ressources en eau limitées.
      </InfoBox>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <DataCard
          label="Pop. sans accès eau potable réseau"
          value="~18%"
          sub="Source : ARS Mayotte 2023"
          highlight
        />
        <DataCard label="Taux de fuite réseau" value="~42%" sub="SISPEA 2022" />
        <DataCard
          label="Prix moyen eau potable SMEG"
          value="5,20 €/m³"
          sub="le plus élevé des DOM"
        />
        <DataCard
          label="Capacité stockage eau Mayotte"
          value="~7 jours"
          sub="en période de sécheresse"
        />
        <DataCard
          label="Besoins investissement urgents"
          value="~400 M€"
          sub="Estimation DGALN 2023"
        />
        <DataCard
          label="Croissance démographique"
          value="+3,8%/an"
          sub="pression sur les ressources"
        />
      </div>

      <Collapse title="La crise de 2024 : anatomie d'une rupture d'approvisionnement">
        <p className="mb-3">En 2023-2024, Mayotte a subi une crise hydrique majeure combinant :</p>
        <ul className="list-disc list-inside space-y-2 mb-3">
          <li>Une sécheresse exceptionnelle (précipitations inférieures de 40% à la normale)</li>
          <li>
            Des retards dans la construction de la deuxième retenue d'eau (Retenue de Dzoumogné)
          </li>
          <li>Une consommation dépassant les capacités de la retenue de Combani</li>
          <li>Des fuites massives sur le réseau de distribution dégradé</li>
        </ul>
        <p>
          En réponse, l'État a déployé des camions-citernes, augmenté les transferts d'eau depuis la
          Réunion par bateau, et accéléré le calendrier des travaux d'urgence. Un plan
          d'investissement exceptionnel de 400 M€ a été annoncé pour 2024-2027.
        </p>
      </Collapse>

      <SectionTitle icon={MapPin}>Guyane : l'enjeu des zones isolées</SectionTitle>
      <InfoBox color="amber" title="🌿 Guyane : 18% du territoire sans réseau public">
        La Guyane est le seul DROM où une fraction significative de la population n'a pas accès à un
        réseau public d'eau potable. Les communautés amérindiennes et bushinengué de l'intérieur et
        des fleuves frontaliers (Maroni, Oyapock) dépendent essentiellement de l'eau de pluie et des
        cours d'eau, sans traitement standardisé.
      </InfoBox>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <DataCard
          label="Pop. zones isolées sans réseau"
          value="~15 000"
          sub="Communes du fleuve"
          highlight
        />
        <DataCard
          label="Taux de turbidité eaux de surface"
          value="Élevé"
          sub="en saison des pluies"
        />
        <DataCard
          label="Distance Cayenne → St-Laurent"
          value="~250 km"
          sub="Accès routier seul, partiel"
        />
        <DataCard
          label="Nb. communes sans service eau"
          value="~8"
          sub="Source : SISPEA Guyane 2022"
        />
      </div>

      <Collapse title="Les défis spécifiques de la Guyane en matière d'eau">
        <p className="mb-3">
          La Guyane couvre 84 000 km² — l'équivalent du Portugal. 90% du territoire est forêt
          amazonienne. Les communes de l'intérieur (Saint-Laurent-du-Maroni, Maripasoula,
          Papaichton, Grand-Santi…) sont soit non raccordées à un réseau national, soit desservies
          par des systèmes locaux insuffisants.
        </p>
        <p className="mb-3">
          La pollution au mercure des cours d'eau, due à l'orpaillage illégal (ASGMI), aggrave la
          situation dans certaines zones, rendant l'eau de rivière impropre à la consommation sans
          traitement spécialisé.
        </p>
        <p>
          Le Plan Eau 2023 prévoit un soutien spécifique aux communes de l'intérieur guyanais, avec
          la mise en place de stations de traitement autonomes et de citernes villageoises.
        </p>
      </Collapse>
    </div>
  );
}

function TabSources() {
  return (
    <div>
      <SectionTitle icon={BookOpen}>Sources officielles utilisées dans cette enquête</SectionTitle>

      <div className="space-y-3 mb-8">
        {[
          {
            label: "Cour des Comptes — Services d'eau et d'assainissement dans les DOM (2020)",
            url: 'https://www.ccomptes.fr/fr/publications/les-services-deau-et-dassainissement-dans-les-departements-doutre-mer',
            note: "Rapport complet sur la gestion et le financement des services d'eau dans les 5 DROM. Constat de sous-investissement chronique.",
          },
          {
            label: 'DGALN / SISPEA — Données eau et assainissement',
            url: 'https://www.services.eaufrance.fr/',
            note: "Système d'Information sur les Services Publics d'Eau et d'Assainissement. Tarifs, rendements, taux de fuite.",
          },
          {
            label: 'Directive UE 2020/2184 — Eau potable',
            url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32020L2184',
            note: "Nouvelle directive européenne sur la qualité de l'eau potable. Normes renforcées, transparence obligatoire.",
          },
          {
            label: 'Loi LEMA n° 2006-1772 — Légifrance',
            url: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000000649171/',
            note: "Loi sur l'Eau et les Milieux Aquatiques. Cadre juridique français de la gestion de l'eau.",
          },
          {
            label: 'Plan Eau 2023 — 53 mesures (Gouvernement)',
            url: 'https://www.ecologie.gouv.fr/plan-eau',
            note: 'Plan national de sobriété hydrique, réutilisation des eaux usées, soutien aux outre-mer.',
          },
          {
            label: 'Santé Publique France — Chlordécone',
            url: 'https://www.santepubliquefrance.fr/determinants-de-sante/exposition-a-des-substances-chimiques/pesticides/chlordecone',
            note: 'Données épidémiologiques, zones de contamination, mesures de gestion du risque.',
          },
          {
            label: 'UFC-Que Choisir — Comparatif eau potable France 2023',
            url: 'https://www.quechoisir.org/',
            note: 'Comparaison tarifaire nationale, alertes qualité, recommandations consommateurs.',
          },
          {
            label: 'BRGM — Ressources en eaux souterraines DOM',
            url: 'https://www.brgm.fr/fr/enjeux-societaux/eau',
            note: 'Hydrogéologie des territoires ultramarins, études de vulnérabilité des nappes.',
          },
        ].map((src) => (
          <div
            key={src.label}
            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
          >
            <div className="flex items-start gap-2">
              <ExternalLink className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-cyan-400 hover:text-cyan-300 leading-tight"
                >
                  {src.label}
                </a>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{src.note}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle icon={TrendingUp}>Pistes de réforme : ce que les données imposent</SectionTitle>
      <div className="space-y-3 mb-6">
        {[
          {
            n: '1',
            title: 'Accélérer le renouvellement des réseaux',
            detail:
              'Porter le taux annuel de renouvellement des canalisations de 0,3 % à 1,5 % dans les DOM les plus déficitaires. Financement : FEDER, dotations État, tarification progressive.',
            c: '#22d3ee',
          },
          {
            n: '2',
            title: 'Transparence tarifaire renforcée',
            detail:
              'Obligation de publication annuelle des données SISPEA pour toutes les collectivités délégataires dans les DOM. Rapport comparatif public par ARS.',
            c: '#60a5fa',
          },
          {
            n: '3',
            title: 'Gratuité des premiers m³ vitaux',
            detail:
              "Expérimentation d'une allocation d'eau gratuite (ex. 10 m³/mois par foyer) dans les territoires les plus pauvres (Mayotte, Guyane intérieure). Couverture par solidarité nationale.",
            c: '#4ade80',
          },
          {
            n: '4',
            title: "Plan d'urgence Mayotte et Guyane intérieure",
            detail:
              'Plan décennal spécifique à ces deux territoires, avec gouvernance directe État-collectivité et objectifs chiffrés annuels de raccordement.',
            c: '#f59e0b',
          },
          {
            n: '5',
            title: 'Mutualisation régionale des expertises',
            detail:
              "Créer un réseau interDOM des Offices de l'eau, BRGM et ARS pour partager les bonnes pratiques et optimiser les investissements.",
            c: '#a78bfa',
          },
        ].map((r) => (
          <div key={r.n} className="flex gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5"
              style={{ background: `${r.c}22`, border: `1.5px solid ${r.c}`, color: r.c }}
            >
              {r.n}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{r.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{r.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <InfoBox color="cyan" title="🔍 Lien vers le comparateur de prix de l'eau">
        Cette enquête est complémentaire du comparateur de tarifs{' '}
        <Link to="/recherche-prix/eau" className="text-cyan-400 hover:text-cyan-300 underline">
          Prix de l'eau dans les DOM
        </Link>{' '}
        et de la{' '}
        <Link to="/conference-eau" className="text-cyan-400 hover:text-cyan-300 underline">
          Conférence expert eau
        </Link>{' '}
        à destination des élus et institutionnels.
      </InfoBox>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────── */

const EnqueteEau: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('contexte');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>Enquête : L'Eau dans les DOM — Tarifs, qualité et accès — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Dossier d'investigation complet sur l'eau dans les territoires ultramarins : qualité, tarifs, infrastructures dégradées, chlordécone, focus Mayotte et Guyane."
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/enquete-eau" />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/enquete-eau"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/enquete-eau"
        />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 pb-16 pt-6">
        {/* Back navigation */}
        <div className="mb-4 flex flex-wrap gap-3">
          <Link
            to="/recherche-prix/eau"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Comparateur prix de l'eau
          </Link>
          <Link
            to="/conference-eau"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-cyan-300 transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5" /> Conférence expert
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-6">
          <HeroImage
            src={PAGE_HERO_IMAGES.enqueteEau}
            alt="Infrastructure eau DOM — canalisations et traitement de l'eau"
            gradient="from-slate-950 to-cyan-900"
            height="h-48 sm:h-64"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-6 h-6 text-cyan-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                Dossier d'enquête
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow leading-tight">
              💧 L'Eau dans les DOM
              <br />
              sous la loupe
            </h1>
            <p className="text-cyan-100 text-sm mt-2 drop-shadow max-w-2xl">
              Tarifs inégaux, réseaux dégradés, contaminations historiques, crises hydriques.
              L'enquête complète de l'Observatoire A KI PRI SA YÉ sur l'eau dans les territoires
              ultramarins.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs text-cyan-300">
                📊 ARS · SISPEA · Cour des Comptes · Offices de l'Eau
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
            label="Écart tarifaire moyen DOM/Métropole"
            value="+81%"
            sub="Source : UFC-QC 2023"
            highlight
          />
          <DataCard label="Taux fuite réseau Guadeloupe" value="~60%" sub="vs 20% en métropole" />
          <DataCard label="Pop. sans accès eau Mayotte" value="~18%" sub="ARS Mayotte 2023" />
          <DataCard label="Investissement FEDER eau DOM" value="~800 M€" sub="Prog. 2021-2027" />
        </div>

        {/* Disclaimer */}
        <InfoBox color="amber" title="⚠️ Note méthodologique">
          Toutes les données sont issues de sources officielles publiques (ARS, SISPEA/DGALN,
          Offices de l'eau DOM, Cour des Comptes, UFC-Que Choisir). Les tarifs cités sont des
          exemples représentatifs — la tarification est fixée localement par chaque collectivité.
          Cette page vise à informer, pas à remplacer une consultation juridique ou technique.
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
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-800 border border-slate-700 text-gray-400 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'contexte' && <TabContexte />}
        {activeTab === 'qualite' && <TabQualite />}
        {activeTab === 'tarifs' && <TabTarifs />}
        {activeTab === 'infrastructure' && <TabInfrastructure />}
        {activeTab === 'acteurs' && <TabActeurs />}
        {activeTab === 'focus' && <TabFocus />}
        {activeTab === 'sources' && <TabSources />}

        {/* Bottom CTA */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/recherche-prix/eau"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            <Droplet className="w-4 h-4" />
            Comparer les tarifs
          </Link>
          <Link
            to="/conference-eau"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-medium text-sm transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            Conférence institutionnelle
          </Link>
          <Link
            to="/observatoire"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium text-sm transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            Observatoire des prix
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EnqueteEau;
