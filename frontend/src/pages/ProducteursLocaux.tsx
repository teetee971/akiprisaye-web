/**
 * ProducteursLocaux.tsx
 *
 * Annuaire des producteurs locaux des DOM — circuit court.
 * Route : /producteurs-locaux
 */

import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Leaf,
  MapPin,
  Search,
  Phone,
  Clock,
  Star,
  ChevronRight,
  ArrowLeft,
  ShoppingBag,
  BarChart3,
  ShieldCheck,
  Truck,
  Store,
  Database,
  ClipboardList,
  AlertTriangle,
  Target,
} from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Producteur {
  id: string;
  nom: string;
  territoire: string;
  ville: string;
  telephone?: string;
  description: string;
  specialites: string[];
  certification: string;
  modeVente: string[];
  jours: string;
  note?: number;
  nbAvis?: number;
  paniers: { label: string; prix: number; prixHabituel: number }[];
  image: string;
  source: string;
}

/* ─── Données ─────────────────────────────────────────────────────────────── */

const PRODUCTEURS: Producteur[] = [
  {
    id: 'op-caraibes-melonniers',
    nom: 'Association Caraïbes Melonniers',
    territoire: 'Guadeloupe',
    ville: 'Le Moule',
    description:
      'Organisation de producteurs fruits et légumes en Guadeloupe. Fiche intégrée pour mise en relation locale et qualification terrain.',
    specialites: ['Fruits', 'Légumes', 'Organisation de producteurs'],
    certification: '🧾 OP 971FL2402',
    modeVente: ['Contact via organisation'],
    jours: 'À confirmer',
    paniers: [],
    image:
      'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4e6?auto=format&fm=webp&fit=crop&w=800&q=80',
    source: 'https://www.agroberichtenbuitenland.nl/',
  },
  {
    id: 'op-sicapag',
    nom: 'SARL SICAPAG',
    territoire: 'Guadeloupe',
    ville: 'Lamentin',
    description:
      'Organisation de producteurs référencée sur la filière fruits et légumes. Données en cours de vérification locale.',
    specialites: ['Fruits', 'Légumes', 'Approvisionnement local'],
    certification: '🧾 OP 971FL2424',
    modeVente: ['Contact via organisation'],
    jours: 'À confirmer',
    paniers: [],
    image:
      'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fm=webp&fit=crop&w=800&q=80',
    source: 'https://www.agroberichtenbuitenland.nl/',
  },
  {
    id: 'op-sicacfrel',
    nom: 'SAS SICACFEL',
    territoire: 'Guadeloupe',
    ville: 'Saint-François',
    description:
      'Structure OP fruits et légumes. Acteur de regroupement pour améliorer la distribution locale.',
    specialites: ['Fruits', 'Légumes', 'Coopération agricole'],
    certification: '🧾 OP 971FL2449',
    modeVente: ['Contact via organisation'],
    jours: 'À confirmer',
    paniers: [],
    image:
      'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fm=webp&fit=crop&w=800&q=80',
    source: 'https://www.agroberichtenbuitenland.nl/',
  },
  {
    id: 'op-gie-mhm',
    nom: 'GIE Maraîcher et Horticole de Martinique',
    territoire: 'Martinique',
    ville: 'Saint-Joseph',
    description:
      'Organisation de producteurs martiniquais pour les filières maraîchères et horticoles.',
    specialites: ['Maraîchage', 'Horticulture', 'Fruits et légumes'],
    certification: '🧾 OP 972FL2425',
    modeVente: ['Contact via organisation'],
    jours: 'À confirmer',
    paniers: [],
    image:
      'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?auto=format&fm=webp&fit=crop&w=800&q=80',
    source: 'https://www.agroberichtenbuitenland.nl/',
  },
  {
    id: 'op-ananas-mq',
    nom: 'SCA Ananas Martinique',
    territoire: 'Martinique',
    ville: 'Le Lorrain',
    description: 'Coopérative ananas en Martinique, acteur structurant de la filière fruits.',
    specialites: ['Ananas', 'Fruits tropicaux', 'Coopérative'],
    certification: '🧾 OP 972FL2437',
    modeVente: ['Contact via organisation'],
    jours: 'À confirmer',
    paniers: [],
    image:
      'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fm=webp&fit=crop&w=800&q=80',
    source: 'https://www.agroberichtenbuitenland.nl/',
  },
  {
    id: 'op-sica2m',
    nom: 'SICA des Maraîchers de Martinique (SICA2M)',
    territoire: 'Martinique',
    ville: 'Ducos',
    description:
      'Organisation de producteurs maraîchers dédiée au renforcement de l’approvisionnement local.',
    specialites: ['Maraîchage', 'Légumes', 'Approvisionnement territorial'],
    certification: '🧾 OP 972FL2448',
    modeVente: ['Contact via organisation'],
    jours: 'À confirmer',
    paniers: [],
    image:
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fm=webp&fit=crop&w=800&q=80',
    source: 'https://www.agroberichtenbuitenland.nl/',
  },
  {
    id: 'chambre-reunion',
    nom: 'Chambre d’agriculture de La Réunion',
    territoire: 'La Réunion',
    ville: 'Saint-Denis',
    description:
      'Point d’entrée institutionnel pour identifier producteurs, coopératives et filières réunionnaises.',
    specialites: ['Annuaire filières', 'Accompagnement', 'Production locale'],
    certification: '🏛️ Source institutionnelle',
    modeVente: ['Orientation vers les filières'],
    jours: 'Consulter le site',
    paniers: [],
    image:
      'https://images.unsplash.com/photo-1612444332120-2b06a35b5f89?auto=format&fm=webp&fit=crop&w=800&q=80',
    source: 'https://reunion.chambre-agriculture.fr/',
  },
  {
    id: 'daaf-guyane',
    nom: 'DAAF Guyane — Filières agricoles',
    territoire: 'Guyane',
    ville: 'Cayenne',
    description: 'Source publique pour identifier les acteurs agricoles et les filières en Guyane.',
    specialites: ['Filières locales', 'Maraîchage', 'Agriculture vivrière'],
    certification: '🏛️ Source institutionnelle',
    modeVente: ['Orientation vers les acteurs'],
    jours: 'Consulter le site',
    paniers: [],
    image:
      'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fm=webp&fit=crop&w=800&q=80',
    source: 'https://daaf.guyane.agriculture.gouv.fr/',
  },
  {
    id: 'daaf-mayotte',
    nom: 'DAAF Mayotte — Acteurs agricoles',
    territoire: 'Mayotte',
    ville: 'Mamoudzou',
    description:
      'Point de départ pour recenser maraîchers, agriculteurs et structures de filière à Mayotte.',
    specialites: ['Réseaux agricoles', 'Filières locales', 'Structures d’appui'],
    certification: '🏛️ Source institutionnelle',
    modeVente: ['Orientation vers les acteurs'],
    jours: 'Consulter le site',
    paniers: [],
    image:
      'https://images.unsplash.com/photo-1595535873420-a599195b3f4a?auto=format&fm=webp&fit=crop&w=800&q=80',
    source: 'https://daaf.mayotte.agriculture.gouv.fr/',
  },
];

const TERRITOIRES = ['Tous', 'Guadeloupe', 'Martinique', 'La Réunion', 'Guyane', 'Mayotte'];

const TERRITOIRES_AUDIT = [
  'Guadeloupe (971)',
  'Martinique (972)',
  'Guyane (973)',
  'La Réunion (974)',
  'Mayotte (976)',
  'Saint-Martin (978)',
  'Saint-Barthélemy (977)',
  'Saint-Pierre-et-Miquelon (975)',
  'Polynésie française',
  'Nouvelle-Calédonie',
  'Wallis-et-Futuna',
];

const AXES_AUDIT = [
  {
    icon: Database,
    titre: 'Cartographie de l’offre locale',
    description:
      'Recensement exhaustif des maraîchers, agriculteurs, coopératives, transformateurs et logisticiens.',
  },
  {
    icon: Truck,
    titre: 'Logistique et distribution',
    description:
      'Analyse des goulets d’étranglement : chaîne du froid, transport inter-îles, ruptures et délais.',
  },
  {
    icon: Store,
    titre: 'Demande et débouchés',
    description:
      'Qualification des besoins des cantines, hôpitaux, commerces de proximité et marchés communaux.',
  },
  {
    icon: ShieldCheck,
    titre: 'Fiabilité et gouvernance data',
    description:
      'Validation croisée des données via sources institutionnelles, appels de contrôle et mise à jour trimestrielle.',
  },
];

const INDICATEURS_CLES = [
  [
    'Taux de couverture locale',
    '% des besoins alimentaires couverts localement',
    '≥ 35% (phase 1)',
  ],
  ['Risque de rupture', 'Nombre de produits critiques en tension / mois', '≤ 5 produits critiques'],
  ['Capacité logistique', 'Part des acteurs disposant transport + stockage', '≥ 60% des acteurs'],
  ['Qualité de la donnée', 'Fiches vérifiées sur les 90 derniers jours', '≥ 85%'],
  ['Réactivité filière', 'Délai moyen commande → livraison', '< 72h en intra-territoire'],
];

/* ─── Panier économie badge ────────────────────────────────────────────── */

function EconomieBadge({ prix, prixHabituel }: { prix: number; prixHabituel: number }) {
  const pct = Math.round(((prixHabituel - prix) / prixHabituel) * 100);
  return (
    <span className="text-xs bg-green-500/20 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full font-semibold">
      -{pct}% vs grande surface
    </span>
  );
}

/* ─── Producteur card ────────────────────────────────────────────────────── */

function ProducteurCard({ p }: { p: Producteur }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-green-500/40 transition-all">
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={p.image}
          alt={p.nom}
          width={400}
          height={160}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="absolute top-2 right-2 bg-slate-900/80 border border-green-500/40 text-green-300 text-xs px-2 py-0.5 rounded-full font-semibold">
          {p.certification}
        </div>
        <div className="absolute bottom-2 left-3">
          <p className="text-white font-bold text-base drop-shadow leading-tight">{p.nom}</p>
          <p className="text-green-300 text-xs">
            {p.ville} · {p.territoire}
          </p>
        </div>
      </div>

      <div className="p-4">
        {/* Rating */}
        {typeof p.note === 'number' ? (
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i <= Math.round(p.note ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
              />
            ))}
            <span className="text-amber-400 font-bold text-sm">{p.note.toFixed(1)}</span>
            <span className="text-slate-500 text-xs">({p.nbAvis ?? 0})</span>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mb-2">Donnée en qualification terrain</p>
        )}

        <p className="text-xs text-slate-300 leading-relaxed mb-3">{p.description}</p>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1 mb-3">
          {p.specialites.slice(0, 4).map((s) => (
            <span
              key={s}
              className="text-xs bg-green-900/30 border border-green-700/40 text-green-300 px-2 py-0.5 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>

        {/* Mode vente + Horaires */}
        <div className="flex items-start gap-1.5 mb-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">{p.modeVente.join(' · ')}</p>
        </div>
        <div className="flex items-start gap-1.5 mb-3">
          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">{p.jours}</p>
        </div>

        {/* Paniers */}
        {p.paniers.length > 0 && (
          <div>
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 font-medium mb-2 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {open
                ? 'Masquer les paniers'
                : `Voir ${p.paniers.length} panier${p.paniers.length > 1 ? 's' : ''} disponible${p.paniers.length > 1 ? 's' : ''}`}
            </button>
            {open && (
              <div className="space-y-2">
                {p.paniers.map((pan) => (
                  <div
                    key={pan.label}
                    className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3"
                  >
                    <p className="text-xs text-slate-200 mb-1.5 leading-snug">{pan.label}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-400">{pan.prix.toFixed(2)} €</span>
                        <span className="text-xs text-slate-500 line-through">
                          {pan.prixHabituel.toFixed(2)} €
                        </span>
                      </div>
                      <EconomieBadge prix={pan.prix} prixHabituel={pan.prixHabituel} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Phone */}
        {p.telephone && (
          <a
            href={`tel:${p.telephone}`}
            className="mt-3 flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 font-medium"
          >
            <Phone className="w-3.5 h-3.5" />
            {p.telephone}
          </a>
        )}
        <a
          href={p.source}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-xs text-blue-300 hover:text-blue-200 underline underline-offset-2"
        >
          Source institutionnelle
        </a>
      </div>
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────────────── */

const ProducteursLocaux: React.FC = () => {
  const [search, setSearch] = useState('');
  const [territoire, setTerritoire] = useState('Tous');

  const filtered = useMemo(() => {
    let list = PRODUCTEURS;
    if (territoire !== 'Tous') list = list.filter((p) => p.territoire === territoire);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.nom.toLowerCase().includes(q) ||
          p.ville.toLowerCase().includes(q) ||
          p.specialites.some((s) => s.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, territoire]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>Producteurs locaux DOM — Circuit court — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Achetez directement aux producteurs locaux des DOM : fruits, légumes, épices, cacao, vanille, poissons. Prix circuit court, paniers disponibles."
        />
        <link
          rel="canonical"
          href="https://teetee971.github.io/akiprisaye-web/producteurs-locaux"
        />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/producteurs-locaux"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/producteurs-locaux"
        />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 pb-16 pt-6">
        {/* Back nav */}
        <div className="mb-4 flex flex-wrap gap-3">
          <Link
            to="/solidarite"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Économie locale
          </Link>
          <Link
            to="/petits-commerces"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-300 transition-colors"
          >
            🏪 Petits commerces
          </Link>
          <Link
            to="/marches-locaux"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-300 transition-colors"
          >
            📍 Marchés locaux
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-6">
          <HeroImage
            src={PAGE_HERO_IMAGES.producteursLocaux}
            alt="Producteurs locaux des DOM"
            gradient="from-slate-950 to-green-900"
            height="h-44 sm:h-56"
          >
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-6 h-6 text-green-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-green-300">
                Circuit court
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow leading-tight">
              🌾 Souveraineté alimentaire ultramarine
            </h1>
            <p className="text-green-100 text-sm mt-2 drop-shadow max-w-2xl">
              Annuaire des maraîchers, agriculteurs et coopératives pour produire local, distribuer
              local et nourrir local.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-300">
                {PRODUCTEURS.length} producteurs répertoriés
              </span>
              <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs text-amber-300">
                🧭 Base de qualification en cours
              </span>
            </div>
          </HeroImage>
        </div>

        <section className="mb-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <h2 className="text-lg sm:text-xl font-bold mb-2">Pourquoi cette page ?</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Cette page structure les acteurs clés de la souveraineté alimentaire dans les
            territoires ultramarins français : maraîchers, agriculteurs, coopératives,
            transformateurs et acheteurs. Chaque fiche est enrichie puis validée avec des sources
            institutionnelles et la qualification terrain.
          </p>
        </section>

        <section className="mb-6 bg-gradient-to-br from-emerald-900/30 to-slate-900 border border-emerald-700/30 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-5 h-5 text-emerald-300" />
            <h2 className="text-lg sm:text-xl font-bold">
              Audit complet DOM-TOM — Enquête souveraineté alimentaire
            </h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            Cette enquête approfondie suit une méthode unique sur l’ensemble des territoires
            ultramarins français : collecte terrain, validation institutionnelle, scoring
            logistique, suivi des risques de rupture et pilotage des actions correctives. L’objectif
            est de produire une photographie opérationnelle et régulièrement mise à jour.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {AXES_AUDIT.map(({ icon: Icon, titre, description }) => (
              <article
                key={titre}
                className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-3"
              >
                <Icon className="w-4 h-4 text-emerald-300 mb-2" />
                <h3 className="font-semibold text-sm mb-1">{titre}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-sky-300" />
            <h2 className="text-lg sm:text-xl font-bold">
              Protocole d’enquête (illustration opérationnelle)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 border border-slate-700/60 rounded-xl p-3">
              <p className="text-xs font-semibold text-sky-300 mb-1">Étape 1 — Sourcing</p>
              <p className="text-xs text-slate-400">
                DAAF, Chambres d’agriculture, ODEADOM, annuaires professionnels, coopératives.
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-700/60 rounded-xl p-3">
              <p className="text-xs font-semibold text-sky-300 mb-1">
                Étape 2 — Qualification terrain
              </p>
              <p className="text-xs text-slate-400">
                Appels, WhatsApp, visite marché/atelier, vérification activité réelle et
                saisonnalité.
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-700/60 rounded-xl p-3">
              <p className="text-xs font-semibold text-sky-300 mb-1">Étape 3 — Scoring</p>
              <p className="text-xs text-slate-400">
                Score fiabilité, score logistique, score couverture locale, score risque rupture.
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-700/60 rounded-xl p-3">
              <p className="text-xs font-semibold text-sky-300 mb-1">Étape 4 — Plan d’action</p>
              <p className="text-xs text-slate-400">
                Mise en relation acheteurs/producteurs, priorisation filières et alertes mensuelles.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-amber-300" />
            <h2 className="text-lg sm:text-xl font-bold">Indicateurs clés de l’audit</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-300 border-b border-slate-700">
                  <th className="py-2 pr-3">Indicateur</th>
                  <th className="py-2 pr-3">Définition</th>
                  <th className="py-2">Objectif pilote</th>
                </tr>
              </thead>
              <tbody>
                {INDICATEURS_CLES.map(([nom, definition, objectif]) => (
                  <tr key={nom} className="border-b border-slate-800">
                    <td className="py-2 pr-3 text-white font-medium">{nom}</td>
                    <td className="py-2 pr-3 text-slate-400">{definition}</td>
                    <td className="py-2 text-emerald-300">{objectif}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-300" />
            <h2 className="text-lg sm:text-xl font-bold">
              Périmètre DOM-TOM couvert par l’enquête
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {TERRITOIRES_AUDIT.map((territoireAudit) => (
              <span
                key={territoireAudit}
                className="px-2.5 py-1 rounded-full text-xs bg-slate-800 border border-slate-700 text-slate-300"
              >
                {territoireAudit}
              </span>
            ))}
          </div>
        </section>

        {/* Search + filters */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un producteur, une spécialité…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TERRITOIRES.map((t) => (
              <button
                key={t}
                onClick={() => setTerritoire(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  territoire === t
                    ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                    : 'bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          <span className="font-semibold text-white">{filtered.length}</span> producteur
          {filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Leaf className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun producteur ne correspond</p>
            <button
              onClick={() => {
                setSearch('');
                setTerritoire('Tous');
              }}
              className="mt-3 text-green-400 hover:text-green-300 text-sm underline underline-offset-2"
            >
              Réinitialiser
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filtered.map((p) => (
              <ProducteurCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-green-900/20 border border-green-700/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-green-300 mb-1">🌱 Vous êtes producteur local ?</p>
            <p className="text-sm text-gray-400">
              Inscrivez votre exploitation dans l'annuaire citoyen. Rejoignez la dynamique de
              souveraineté alimentaire ultramarine.
            </p>
          </div>
          <Link
            to="/contribuer-prix"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            Référencer mon exploitation
          </Link>
        </div>

        <section className="mt-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <h2 className="text-lg sm:text-xl font-bold mb-3">Sources officielles à consulter</h2>
          <ul className="space-y-2 text-sm text-slate-300 list-disc pl-5">
            <li>
              <a
                className="text-blue-300 hover:text-blue-200 underline"
                href="https://chambres-agriculture.fr/"
                target="_blank"
                rel="noreferrer"
              >
                Réseau des Chambres d’agriculture
              </a>
            </li>
            <li>
              <a
                className="text-blue-300 hover:text-blue-200 underline"
                href="https://daaf.guadeloupe.agriculture.gouv.fr/"
                target="_blank"
                rel="noreferrer"
              >
                DAAF Guadeloupe
              </a>
            </li>
            <li>
              <a
                className="text-blue-300 hover:text-blue-200 underline"
                href="https://daaf.martinique.agriculture.gouv.fr/"
                target="_blank"
                rel="noreferrer"
              >
                DAAF Martinique
              </a>
            </li>
            <li>
              <a
                className="text-blue-300 hover:text-blue-200 underline"
                href="https://daaf.guyane.agriculture.gouv.fr/"
                target="_blank"
                rel="noreferrer"
              >
                DAAF Guyane
              </a>
            </li>
            <li>
              <a
                className="text-blue-300 hover:text-blue-200 underline"
                href="https://daaf.reunion.agriculture.gouv.fr/"
                target="_blank"
                rel="noreferrer"
              >
                DAAF La Réunion
              </a>
            </li>
            <li>
              <a
                className="text-blue-300 hover:text-blue-200 underline"
                href="https://daaf.mayotte.agriculture.gouv.fr/"
                target="_blank"
                rel="noreferrer"
              >
                DAAF Mayotte
              </a>
            </li>
            <li>
              <a
                className="text-blue-300 hover:text-blue-200 underline"
                href="https://www.odeadom.fr/"
                target="_blank"
                rel="noreferrer"
              >
                ODEADOM
              </a>
            </li>
          </ul>
        </section>

        {/* Bottom nav */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/petits-commerces"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-700/30 hover:bg-orange-700/50 border border-orange-700/40 text-orange-300 rounded-xl font-medium text-sm transition-colors"
          >
            🏪 Petits commerces
          </Link>
          <Link
            to="/marches-locaux"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-700/30 hover:bg-blue-700/50 border border-blue-700/40 text-blue-300 rounded-xl font-medium text-sm transition-colors"
          >
            📍 Marchés locaux
          </Link>
          <Link
            to="/ti-panie"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-700/30 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded-xl font-medium text-sm transition-colors"
          >
            🧺 Ti Panier solidaire
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProducteursLocaux;
