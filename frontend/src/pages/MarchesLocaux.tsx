/**
 * MarchesLocaux.tsx
 *
 * Calendrier et annuaire des marchés locaux des DOM.
 * Route : /marches-locaux
 */

import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { MapPin, Search, Clock, ArrowLeft, Calendar, Star, ChevronRight } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Marche {
  id: string;
  nom: string;
  territoire: string;
  ville: string;
  adresse: string;
  jours: string[]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun → Lun Mar Mer Jeu Ven Sam Dim
  horaires: string;
  categories: string[];
  produits: string[];
  note: number;
  nbAvis: number;
  type: 'forain' | 'couvert' | 'nocturne' | 'producteurs';
  image: string;
  description: string;
}

/* ─── Données ──────────────────────────────────────────────────────────────── */

const MARCHES: Marche[] = [
  // ── GUADELOUPE ──
  {
    id: 'gp-ptapitre',
    nom: 'Marché Saint-Antoine',
    territoire: 'Guadeloupe',
    ville: 'Pointe-à-Pitre',
    adresse: 'Place Gourbeyre',
    jours: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    horaires: '5h30 – 13h',
    categories: ['Alimentaire', 'Épices', 'Artisanat'],
    produits: [
      'Légumes pays',
      'Fruits tropicaux',
      'Épices créoles',
      'Poissons frais',
      'Rhum artisanal',
      'Bokit chaud',
    ],
    note: 4.7,
    nbAvis: 312,
    type: 'couvert',
    description:
      'Le plus grand marché couvert de Guadeloupe. Atmosphère authentique créole, spécialités régionales introuvables en grande surface.',
    image:
      'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'gp-capesterre',
    nom: 'Marché Municipal de Capesterre',
    territoire: 'Guadeloupe',
    ville: 'Capesterre-Belle-Eau',
    adresse: 'Place de la Mairie',
    jours: ['Mar', 'Sam'],
    horaires: '5h – 12h',
    categories: ['Alimentaire', 'Producteurs directs'],
    produits: [
      'Manioc frais',
      'Ignames',
      'Giraumon',
      'Christophines',
      'Herbes aromatiques',
      'Viandes locales',
    ],
    note: 4.5,
    nbAvis: 87,
    type: 'forain',
    description:
      'Marché forain bi-hebdomadaire avec présence de producteurs locaux directs. Très bons prix sur les légumes racines.',
    image:
      'https://images.unsplash.com/photo-1484663020049-bf87a22cc2d7?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'gp-marie-galante',
    nom: 'Marché de Grand-Bourg',
    territoire: 'Guadeloupe',
    ville: 'Grand-Bourg (Marie-Galante)',
    adresse: 'Centre ville',
    jours: ['Dim'],
    horaires: '6h – 12h',
    categories: ['Alimentaire', 'Artisanat', 'Sucre'],
    produits: [
      'Rhum agricole Marie-Galante',
      'Sucre de canne artisanal',
      'Confitures',
      'Légumes',
      'Épices',
    ],
    note: 4.8,
    nbAvis: 53,
    type: 'forain',
    description:
      "Le marché dominical de l'île du Soleil. Incontournable pour le rhum AOC et les produits sucrerie de Marie-Galante.",
    image:
      'https://images.unsplash.com/photo-1567306295427-94503f8300d7?auto=format&fm=webp&fit=crop&w=800&q=80',
  },

  // ── MARTINIQUE ──
  {
    id: 'mq-fdf',
    nom: 'Grand Marché de Fort-de-France',
    territoire: 'Martinique',
    ville: 'Fort-de-France',
    adresse: 'Rue Antoine Siger',
    jours: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    horaires: '5h – 14h',
    categories: ['Alimentaire', 'Fleurs', 'Épices', 'Artisanat'],
    produits: ["Féroce d'avocat", 'Accras', 'Piment confit', 'Bananes', 'Cacao', 'Colliers chou'],
    note: 4.6,
    nbAvis: 425,
    type: 'couvert',
    description:
      'Grand marché couvert historique de Fort-de-France. Ambiance unique, couleurs vives. Spécialités martiniquaises authentiques.',
    image:
      'https://images.unsplash.com/photo-1563906267088-b029e7101114?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'mq-saintpierre',
    nom: 'Marché de Saint-Pierre',
    territoire: 'Martinique',
    ville: 'Saint-Pierre',
    adresse: 'Front de mer',
    jours: ['Sam'],
    horaires: '6h – 12h',
    categories: ['Producteurs directs', 'Alimentaire', 'Artisanat'],
    produits: ['Cacao Martinique', 'Épices rares', 'Poissons locaux', 'Rums agricoles', 'Poteries'],
    note: 4.8,
    nbAvis: 144,
    type: 'producteurs',
    description:
      'Marché de producteurs dominical en bord de mer, avec vue sur la Montagne Pelée. Qualité exceptionnelle.',
    image:
      'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fm=webp&fit=crop&w=800&q=80',
  },

  // ── LA RÉUNION ──
  {
    id: 're-stdenis',
    nom: 'Marché du Chaudron',
    territoire: 'La Réunion',
    ville: 'Saint-Denis',
    adresse: 'Quartier du Chaudron',
    jours: ['Sam'],
    horaires: '5h30 – 12h30',
    categories: ['Alimentaire', 'Épices', 'Plantes'],
    produits: [
      'Vanille Bourbon',
      'Curcuma péi',
      'Miel Bourbon',
      'Bichiques (saison)',
      'Fruits de Saison',
      'Rougails préparés',
    ],
    note: 4.7,
    nbAvis: 198,
    type: 'forain',
    description:
      "Grand marché populaire de Saint-Denis. Spécialités créoles réunionnaises, nombreux producteurs du sud et de l'intérieur.",
    image:
      'https://images.unsplash.com/photo-1567306295427-94503f8300d7?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 're-stpierre',
    nom: 'Marché de Saint-Pierre',
    territoire: 'La Réunion',
    ville: 'Saint-Pierre',
    adresse: 'Place du Marché',
    jours: ['Lun', 'Ven', 'Sam', 'Dim'],
    horaires: '5h – 12h (Lun · Ven) · 5h – 13h (Sam · Dim)',
    categories: ['Alimentaire', 'Artisanat', 'Fleurs'],
    produits: [
      'Lentilles de Cilaos',
      'Grains de café Bourbon',
      'Fleurs tropicales',
      'Légumes bio',
      'Tisanes',
    ],
    note: 4.6,
    nbAvis: 231,
    type: 'couvert',
    description:
      'Marché emblématique du sud de La Réunion. Halle couverte, ambiance festive le week-end.',
    image:
      'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 're-nocturne-fdf',
    nom: 'Marché Nocturne de Saint-Denis',
    territoire: 'La Réunion',
    ville: 'Saint-Denis',
    adresse: 'Barachois',
    jours: ['Ven'],
    horaires: '18h – 22h30',
    categories: ['Street food', 'Artisanat', 'Ambiance'],
    produits: [
      'Samoussas',
      'Bouchons',
      'Carry poulet emporté',
      'Jus de fruits tropicaux',
      'Artisanat local',
    ],
    note: 4.5,
    nbAvis: 167,
    type: 'nocturne',
    description:
      'Marché nocturne en bord de mer. Ambiance créole détendue, street food réunionnaise et artisanat.',
    image:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fm=webp&fit=crop&w=800&q=80',
  },

  // ── GUYANE ──
  {
    id: 'gf-cayenne',
    nom: 'Marché Central de Cayenne',
    territoire: 'Guyane',
    ville: 'Cayenne',
    adresse: 'Rue de la Liberté',
    jours: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    horaires: '5h30 – 13h',
    categories: ['Alimentaire', 'Multi-ethnique', 'Plantes médicinales'],
    produits: [
      'Couac manioc',
      'Poivrons locaux',
      "Crevettes d'élevage",
      'Plantes médicinales amérindiennes',
      'Cachiri (saison)',
    ],
    note: 4.4,
    nbAvis: 112,
    type: 'couvert',
    description:
      'Marché multiculturel reflétant la diversité guyanaise. Créoles, Bushinengués, Amérindiens, Brésiliens — tous présents.',
    image:
      'https://images.unsplash.com/photo-1484663020049-bf87a22cc2d7?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'gf-stlaurent',
    nom: 'Marché du Bord du Maroni',
    territoire: 'Guyane',
    ville: 'Saint-Laurent-du-Maroni',
    adresse: 'Front du Fleuve Maroni',
    jours: ['Mar', 'Ven', 'Sam'],
    horaires: '6h – 12h',
    categories: ['Artisanat', 'Alimentaire', 'Interculturel'],
    produits: ['Artisanat bushinengué', 'Poissons du Maroni', 'Fruits exotiques', 'Vannerie'],
    note: 4.7,
    nbAvis: 67,
    type: 'forain',
    description:
      'Marché frontière Guyane–Suriname. Échanges culturels uniques, produits rares des forêts amazoniennes.',
    image:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fm=webp&fit=crop&w=800&q=80',
  },

  // ── MAYOTTE ──
  {
    id: 'yt-mamoudzou',
    nom: 'Marché Central de Mamoudzou',
    territoire: 'Mayotte',
    ville: 'Mamoudzou',
    adresse: 'Place de la République',
    jours: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    horaires: '5h – 18h',
    categories: ['Alimentaire', 'Épices', 'Artisanat mahorais'],
    produits: [
      'Ylang-ylang frais',
      'Poissons tropicaux',
      'Riz vrac',
      'Épices de Mayotte',
      'Manioc',
      'Tisanes mahoraises',
    ],
    note: 4.2,
    nbAvis: 89,
    type: 'couvert',
    description:
      "Le marché central de Grande-Terre. Ambiance animée 7j/7, produits de l'île et d'importation. Prix accessibles.",
    image:
      'https://images.unsplash.com/photo-1563906267088-b029e7101114?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
];

/* ─── Helpers ──────────────────────────────────────────────────────────── */

const TERRITOIRES = ['Tous', 'Guadeloupe', 'Martinique', 'La Réunion', 'Guyane', 'Mayotte'];

const JOURS_ORDER = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const TYPE_LABEL: Record<Marche['type'], { label: string; cls: string }> = {
  forain: { label: 'Marché forain', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  couvert: { label: 'Marché couvert', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  nocturne: {
    label: 'Marché nocturne',
    cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  producteurs: {
    label: 'Producteurs directs',
    cls: 'bg-green-500/15 text-green-400 border-green-500/30',
  },
};

/* ─── Marché card ──────────────────────────────────────────────────────── */

function MarcheCard({ m }: { m: Marche }) {
  const typeInfo = TYPE_LABEL[m.type];
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-blue-500/40 transition-all">
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={m.image}
          alt={m.nom}
          width={400}
          height={160}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="absolute top-2 right-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${typeInfo.cls}`}>
            {typeInfo.label}
          </span>
        </div>
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-white font-bold text-sm leading-tight drop-shadow">{m.nom}</p>
          <p className="text-blue-300 text-xs">
            {m.ville} · {m.territoire}
          </p>
        </div>
      </div>

      <div className="p-4">
        {/* Rating */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i <= Math.round(m.note) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
            />
          ))}
          <span className="text-amber-400 font-bold text-sm">{m.note.toFixed(1)}</span>
          <span className="text-slate-500 text-xs">({m.nbAvis})</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-3">{m.description}</p>

        {/* Jours */}
        <div className="flex items-center gap-1.5 mb-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <div className="flex flex-wrap gap-1">
            {JOURS_ORDER.map((j) => (
              <span
                key={j}
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  m.jours.includes(j)
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-slate-700/30 text-slate-600'
                }`}
              >
                {j}
              </span>
            ))}
          </div>
        </div>

        {/* Horaires + Address */}
        <div className="flex items-start gap-1.5 mb-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">{m.horaires}</p>
        </div>
        <div className="flex items-start gap-1.5 mb-3">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">{m.adresse}</p>
        </div>

        {/* Products */}
        <div className="flex flex-wrap gap-1">
          {m.produits.slice(0, 4).map((p) => (
            <span
              key={p}
              className="text-xs bg-blue-900/30 border border-blue-700/40 text-blue-300 px-2 py-0.5 rounded-full"
            >
              {p}
            </span>
          ))}
          {m.produits.length > 4 && (
            <span className="text-xs text-slate-500 px-1 py-0.5">+{m.produits.length - 4}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────────────── */

const MarchesLocaux: React.FC = () => {
  const [search, setSearch] = useState('');
  const [territoire, setTerritoire] = useState('Tous');
  const [jourActif, setJourActif] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = MARCHES;
    if (territoire !== 'Tous') list = list.filter((m) => m.territoire === territoire);
    if (jourActif) list = list.filter((m) => m.jours.includes(jourActif));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.nom.toLowerCase().includes(q) ||
          m.ville.toLowerCase().includes(q) ||
          m.produits.some((p) => p.toLowerCase().includes(q)) ||
          m.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, territoire, jourActif]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>Marchés locaux DOM — Calendrier des marchés — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Calendrier et annuaire des marchés locaux des DOM : Guadeloupe, Martinique, La Réunion, Guyane, Mayotte. Horaires, produits, adresses."
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/marches-locaux" />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/marches-locaux"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/marches-locaux"
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
            to="/producteurs-locaux"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-300 transition-colors"
          >
            🌾 Producteurs locaux
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-6">
          <HeroImage
            src={PAGE_HERO_IMAGES.marchesLocaux}
            alt="Marchés locaux des DOM"
            gradient="from-slate-950 to-blue-900"
            height="h-44 sm:h-56"
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-6 h-6 text-blue-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-300">
                Marchés & terroir
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow leading-tight">
              📍 Marchés locaux
              <br />
              des DOM
            </h1>
            <p className="text-blue-100 text-sm mt-2 drop-shadow max-w-2xl">
              Découvrez les marchés près de chez vous — horaires, produits locaux, jours
              d'ouverture.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full text-xs text-blue-300">
                {MARCHES.length} marchés répertoriés
              </span>
              <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs text-purple-300">
                🌙 {MARCHES.filter((m) => m.type === 'nocturne').length} marchés nocturnes
              </span>
            </div>
          </HeroImage>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un marché, un produit, une ville…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Territory */}
          <div className="flex flex-wrap gap-2">
            {TERRITOIRES.map((t) => (
              <button
                key={t}
                onClick={() => setTerritoire(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  territoire === t
                    ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                    : 'bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Day filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-xs text-slate-500">Filtrer par jour :</span>
            {JOURS_ORDER.map((j) => (
              <button
                key={j}
                onClick={() => setJourActif((a) => (a === j ? null : j))}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  jourActif === j
                    ? 'bg-blue-600/30 border border-blue-500/60 text-blue-300'
                    : 'bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {j}
              </button>
            ))}
            {jourActif && (
              <button
                onClick={() => setJourActif(null)}
                className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2"
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          <span className="font-semibold text-white">{filtered.length}</span> marché
          {filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun marché ne correspond</p>
            <button
              onClick={() => {
                setSearch('');
                setTerritoire('Tous');
                setJourActif(null);
              }}
              className="mt-3 text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2"
            >
              Réinitialiser
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filtered.map((m) => (
              <MarcheCard key={m.id} m={m} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-blue-300 mb-1">📍 Vous connaissez un marché local ?</p>
            <p className="text-sm text-gray-400">
              Signalez-nous les marchés forains, nocturnes et de producteurs de votre commune.
              Construisons l'agenda citoyen des DOM.
            </p>
          </div>
          <Link
            to="/contribuer-prix"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            Signaler un marché
          </Link>
        </div>

        {/* Bottom nav */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/petits-commerces"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-700/30 hover:bg-orange-700/50 border border-orange-700/40 text-orange-300 rounded-xl font-medium text-sm transition-colors"
          >
            🏪 Petits commerces
          </Link>
          <Link
            to="/producteurs-locaux"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-700/30 hover:bg-green-700/50 border border-green-700/40 text-green-300 rounded-xl font-medium text-sm transition-colors"
          >
            🌾 Producteurs locaux
          </Link>
          <Link
            to="/evaluation-magasins"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-700/30 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded-xl font-medium text-sm transition-colors"
          >
            ⭐ Évaluer les magasins
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MarchesLocaux;
