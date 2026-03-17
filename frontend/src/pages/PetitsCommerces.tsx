/**
 * PetitsCommerces.tsx
 *
 * Annuaire des petits commerces de proximité dans les DOM.
 * Commerces locaux : boulangeries, épiceries, boucheries, traiteurs,
 * quincailleries, pharmacies, tabacs-presse...
 *
 * Route : /petits-commerces
 */

import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Store, MapPin, Search, Filter, Phone, Clock,
  Star, ChevronRight, ArrowLeft, Leaf,
  ShoppingBag, Utensils, Pill, Scissors, Wrench,
  BookOpen, Coffee, Heart,
} from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { UpgradeGate } from '../components/billing/UpgradeGate';
import { UpgradeBanner } from '../components/billing/UpgradeBanner';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Commerce {
  id: string;
  nom: string;
  categorie: string;
  categorieIcon: React.ElementType;
  categorieColor: string;
  territoire: string;
  ville: string;
  adresse: string;
  telephone?: string;
  horaires: string;
  specialites: string[];
  prix: 'bas' | 'moyen' | 'élevé';
  note: number;
  nbAvis: number;
  local: boolean;
  description: string;
  image: string;
}

/* ─── Données des commerces ────────────────────────────────────────────── */

const COMMERCES: Commerce[] = [
  // ── GUADELOUPE ──
  {
    id: 'gc-001', nom: 'Épicerie Ti Bò Kay', categorie: 'Épicerie', categorieIcon: ShoppingBag,
    categorieColor: 'text-amber-400 bg-amber-400/10',
    territoire: 'Guadeloupe', ville: 'Pointe-à-Pitre', adresse: '12 Rue Frébault',
    telephone: '0590 82 14 77', horaires: 'Lun–Sam 7h–19h · Dim 7h–13h',
    specialites: ['Produits antillais', 'Épices créoles', 'Rhum agricole', 'Légumes pays'],
    prix: 'bas', note: 4.6, nbAvis: 87, local: true,
    description: 'Épicerie créole de quartier depuis 1978. Spécialiste des produits du terroir guadeloupéen.',
    image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'gc-002', nom: 'Boulangerie Dorée des Antilles', categorie: 'Boulangerie', categorieIcon: Coffee,
    categorieColor: 'text-orange-400 bg-orange-400/10',
    territoire: 'Guadeloupe', ville: 'Basse-Terre', adresse: '5 Avenue du Général de Gaulle',
    telephone: '0590 81 22 33', horaires: 'Mar–Dim 5h30–13h',
    specialites: ['Pain kassav', 'Bokit', 'Gâteau patate', 'Pain rassis tradition'],
    prix: 'bas', note: 4.8, nbAvis: 203, local: true,
    description: 'Artisan boulanger depuis 3 générations. Pain au levain naturel et pâtisseries créoles.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'gc-003', nom: 'Boucherie Chez Rosette', categorie: 'Boucherie', categorieIcon: Utensils,
    categorieColor: 'text-red-400 bg-red-400/10',
    territoire: 'Guadeloupe', ville: 'Capesterre-Belle-Eau', adresse: 'Marché Municipal, Stand 7',
    telephone: '0590 86 41 05', horaires: 'Mar · Jeu · Sam 6h–12h',
    specialites: ['Cabri en sauce', 'Porc frais', 'Boudin créole', 'Colombo poulet'],
    prix: 'moyen', note: 4.7, nbAvis: 145, local: true,
    description: 'Viande locale de qualité. Rosette prépare aussi des plats cuisinés à emporter.',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'gc-004', nom: 'Quincaillerie Zoreilles', categorie: 'Quincaillerie', categorieIcon: Wrench,
    categorieColor: 'text-slate-400 bg-slate-400/10',
    territoire: 'Guadeloupe', ville: 'Les Abymes', adresse: '88 Route de Chauvel',
    telephone: '0590 90 55 12', horaires: 'Lun–Sam 7h30–18h',
    specialites: ['Outillage BTP', 'Visserie inox', 'Peinture anti-humidité', 'Plomberie'],
    prix: 'moyen', note: 4.2, nbAvis: 54, local: false,
    description: 'Tout pour vos travaux. Conseil personnalisé, livraison possible sur grand Basse-Terre.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'gc-005', nom: 'Pharmacie du Bourg', categorie: 'Pharmacie', categorieIcon: Pill,
    categorieColor: 'text-green-400 bg-green-400/10',
    territoire: 'Guadeloupe', ville: 'Sainte-Anne', adresse: 'Place du Bourg',
    telephone: '0590 88 11 34', horaires: 'Lun–Sam 8h–19h · Sam 8h–12h30',
    specialites: ['Médicaments sans ordonnance', 'Parapharmacie', 'Phytothérapie créole'],
    prix: 'moyen', note: 4.5, nbAvis: 38, local: false,
    description: 'Pharmacie de proximité. Équipe attentionnée, conseil en phytothérapie antillaise.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fm=webp&fit=crop&w=800&q=80',
  },

  // ── MARTINIQUE ──
  {
    id: 'mq-001', nom: 'Ti Case Épicerie Fine', categorie: 'Épicerie', categorieIcon: ShoppingBag,
    categorieColor: 'text-amber-400 bg-amber-400/10',
    territoire: 'Martinique', ville: 'Saint-Pierre', adresse: '3 Rue Victor Hugo',
    telephone: '0596 78 22 44', horaires: 'Lun–Sam 7h–19h · Dim 8h–13h',
    specialites: ['Rhum HSE', 'Cacao martiniquais', 'Vanille Péi', 'Confiture goyave'],
    prix: 'moyen', note: 4.7, nbAvis: 112, local: true,
    description: 'Épicerie fine spécialisée en produits martiniquais d\'exception. Idéale pour les cadeaux.',
    image: 'https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'mq-002', nom: 'Traiteur Manman Mijo', categorie: 'Traiteur', categorieIcon: Utensils,
    categorieColor: 'text-pink-400 bg-pink-400/10',
    territoire: 'Martinique', ville: 'Le Lamentin', adresse: '15 Rue du Centre',
    telephone: '0596 51 09 87', horaires: 'Lun–Ven 10h–18h · Sam 9h–14h',
    specialites: ['Féroce d\'avocat', 'Accras morue', 'Curry poulet', 'Matété crabe'],
    prix: 'moyen', note: 4.9, nbAvis: 267, local: true,
    description: 'Cuisine traditionnelle martiniquaise depuis 1995. Commandes sur mesure pour événements.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'mq-003', nom: 'Librairie Caraïbes', categorie: 'Librairie', categorieIcon: BookOpen,
    categorieColor: 'text-indigo-400 bg-indigo-400/10',
    territoire: 'Martinique', ville: 'Fort-de-France', adresse: 'Centre Commercial La Galleria',
    telephone: '0596 60 23 11', horaires: 'Lun–Sam 9h–19h',
    specialites: ['Littérature antillaise', 'BD locale', 'Presse régionale', 'Cartes postales'],
    prix: 'moyen', note: 4.3, nbAvis: 91, local: true,
    description: 'La référence de la littérature caribéenne. Rayon jeunesse en créole disponible.',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'mq-004', nom: 'Salon Tresses & Beauté', categorie: 'Coiffure', categorieIcon: Scissors,
    categorieColor: 'text-purple-400 bg-purple-400/10',
    territoire: 'Martinique', ville: 'Sainte-Marie', adresse: '22 Rue du Marché',
    telephone: '0596 69 48 73', horaires: 'Mar–Sam 9h–18h',
    specialites: ['Tresses africaines', 'Locks dreadlocks', 'Soins naturels', 'Extensions'],
    prix: 'moyen', note: 4.6, nbAvis: 78, local: true,
    description: 'Spécialiste des cheveux afro. Produits 100% naturels, soins à base de plantes créoles.',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fm=webp&fit=crop&w=800&q=80',
  },

  // ── LA RÉUNION ──
  {
    id: 're-001', nom: 'Épicerie Péi Zot', categorie: 'Épicerie', categorieIcon: ShoppingBag,
    categorieColor: 'text-amber-400 bg-amber-400/10',
    territoire: 'La Réunion', ville: 'Saint-Denis', adresse: '7 Rue Pasteur',
    telephone: '0262 21 33 58', horaires: 'Lun–Sam 6h30–19h30 · Dim 7h–12h30',
    specialites: ['Rougail tomates péi', 'Miel Bourbon', 'Vanille Bourbon', 'Épices réunionnaises'],
    prix: 'bas', note: 4.5, nbAvis: 134, local: true,
    description: 'Épicerie 100% Réunion. Jean-Paul sélectionne uniquement des producteurs de l\'île.',
    image: 'https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 're-002', nom: 'Boucherie Charcuterie Bardot', categorie: 'Boucherie', categorieIcon: Utensils,
    categorieColor: 'text-red-400 bg-red-400/10',
    territoire: 'La Réunion', ville: 'Saint-Pierre', adresse: 'Marché de Saint-Pierre, Allée B',
    telephone: '0262 25 87 41', horaires: 'Mar · Jeu · Sam · Dim 5h30–12h',
    specialites: ['Porc fumé Péi', 'Canard au tamarin', 'Carry poulet', 'Saucisses créoles'],
    prix: 'moyen', note: 4.8, nbAvis: 189, local: true,
    description: 'Éleveur et boucher. Volailles et porcs élevés sur l\'île, abattage local.',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 're-003', nom: 'Pharmacie Altitude Cilaos', categorie: 'Pharmacie', categorieIcon: Pill,
    categorieColor: 'text-green-400 bg-green-400/10',
    territoire: 'La Réunion', ville: 'Cilaos', adresse: 'Rue Mac-Auliffe',
    telephone: '0262 31 72 08', horaires: 'Lun–Sam 8h–12h30 · 14h–18h30',
    specialites: ['Produits altitude', 'Phytothérapie réunionnaise', 'Lentilles de Cilaos'],
    prix: 'moyen', note: 4.4, nbAvis: 29, local: false,
    description: 'Seule pharmacie des cirques. Service essentiel pour les randonneurs et résidents.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fm=webp&fit=crop&w=800&q=80',
  },

  // ── GUYANE ──
  {
    id: 'gf-001', nom: 'Épicerie Creole Way', categorie: 'Épicerie', categorieIcon: ShoppingBag,
    categorieColor: 'text-amber-400 bg-amber-400/10',
    territoire: 'Guyane', ville: 'Cayenne', adresse: '44 Avenue du Général de Gaulle',
    telephone: '0594 31 02 67', horaires: 'Lun–Sam 7h–20h · Dim 8h–14h',
    specialites: ['Cachiri', 'Couac manioc', 'Piment gros sel', 'Cuisses de tortue (saison)'],
    prix: 'bas', note: 4.3, nbAvis: 67, local: true,
    description: 'Épicerie multiculturelle regroupant produits créoles, bushinengué et amérindiens.',
    image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'gf-002', nom: 'Artisan Aïmiti Bijoux', categorie: 'Artisanat', categorieIcon: Heart,
    categorieColor: 'text-rose-400 bg-rose-400/10',
    territoire: 'Guyane', ville: 'Saint-Laurent-du-Maroni', adresse: 'Village artisanal du bord du Maroni',
    horaires: 'Mer–Dim 9h–17h',
    specialites: ['Bijoux graines naturelles', 'Tembés bushinengué', 'Vannerie amérindienne'],
    prix: 'moyen', note: 4.9, nbAvis: 44, local: true,
    description: 'Artisanat traditionnel des peuples du fleuve. Chaque pièce est unique et certifiée.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fm=webp&fit=crop&w=800&q=80',
  },

  // ── MAYOTTE ──
  {
    id: 'yt-001', nom: 'Épicerie Duka la Mwana', categorie: 'Épicerie', categorieIcon: ShoppingBag,
    categorieColor: 'text-amber-400 bg-amber-400/10',
    territoire: 'Mayotte', ville: 'Mamoudzou', adresse: '2 Rue du Commerce',
    telephone: '0269 61 12 45', horaires: 'Lun–Dim 6h–20h',
    specialites: ['Produits mahorais', 'Épices de Mayotte', 'Poisson frais', 'Riz Basmati vrac'],
    prix: 'bas', note: 4.1, nbAvis: 56, local: true,
    description: 'Épicerie familiale mahoraise. Produits locaux au meilleur prix, achat en vrac.',
    image: 'https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
];

/* ─── Catégories ─────────────────────────────────────────────────────────── */

const CATEGORIES = ['Tous', 'Épicerie', 'Boulangerie', 'Boucherie', 'Traiteur', 'Pharmacie',
  'Quincaillerie', 'Librairie', 'Coiffure', 'Artisanat'];

const TERRITOIRES = ['Tous', 'Guadeloupe', 'Martinique', 'La Réunion', 'Guyane', 'Mayotte'];

/* ─── Price badge ────────────────────────────────────────────────────────── */

function PrixBadge({ niveau }: { niveau: Commerce['prix'] }) {
  const map = {
    bas:    { label: '€ Prix bas',    cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    moyen:  { label: '€€ Prix moyen', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    élevé:  { label: '€€€ Élevé',    cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  };
  const { label, cls } = map[niveau];
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>{label}</span>;
}

/* ─── Star display ─────────────────────────────────────────────────────── */

function Stars({ note }: { note: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= Math.round(note) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
        />
      ))}
    </span>
  );
}

/* ─── Commerce card ──────────────────────────────────────────────────────── */

function CommerceCard({ c }: { c: Commerce }) {
  const Icon = c.categorieIcon;
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-orange-500/40 transition-all">
      {/* Image */}
      <div className="relative h-36 overflow-hidden">
        <img src={c.image} alt={c.nom} width={400} height={144} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
          <span className="text-white font-bold text-sm leading-tight drop-shadow">{c.nom}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${c.categorieColor}`}>
            <Icon className="w-3 h-3" />{c.categorie}
          </span>
        </div>
        {c.local && (
          <div className="absolute top-2 right-2 bg-green-500/90 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
            <Leaf className="w-3 h-3" />Local
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Rating + price */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Stars note={c.note} />
            <span className="text-amber-400 font-bold text-sm">{c.note.toFixed(1)}</span>
            <span className="text-slate-500 text-xs">({c.nbAvis} avis)</span>
          </div>
          <PrixBadge niveau={c.prix} />
        </div>

        {/* Location */}
        <div className="flex items-start gap-1.5 mb-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300">{c.adresse} · <span className="text-orange-300">{c.ville}</span></p>
        </div>

        {/* Horaires */}
        <div className="flex items-start gap-1.5 mb-3">
          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">{c.horaires}</p>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 leading-relaxed mb-3">{c.description}</p>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1 mb-3">
          {c.specialites.slice(0, 3).map(s => (
            <span key={s} className="text-xs bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded-full">{s}</span>
          ))}
        </div>

        {/* Phone */}
        {c.telephone && (
          <a
            href={`tel:${c.telephone}`}
            className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium"
          >
            <Phone className="w-3.5 h-3.5" />{c.telephone}
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */

const PetitsCommerces: React.FC = () => {
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('Tous');
  const [territoire, setTerritoire] = useState('Tous');
  const [localOnly, setLocalOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = COMMERCES;
    if (territoire !== 'Tous') list = list.filter(c => c.territoire === territoire);
    if (categorie !== 'Tous') list = list.filter(c => c.categorie === categorie);
    if (localOnly) list = list.filter(c => c.local);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.nom.toLowerCase().includes(q) ||
        c.ville.toLowerCase().includes(q) ||
        c.specialites.some(s => s.toLowerCase().includes(q)) ||
        c.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, categorie, territoire, localOnly]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>Petits commerces de proximité — DOM-TOM — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Annuaire des petits commerces locaux dans les DOM : épiceries, boulangeries, boucheries, traiteurs, pharmacies. Prix, horaires et avis citoyens."
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/petits-commerces" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/petits-commerces" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/petits-commerces" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 pb-16 pt-6">
        {/* Back navigation */}
        <div className="mb-4 flex flex-wrap gap-3">
          <Link to="/solidarite"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Économie locale
          </Link>
          <Link to="/producteurs-locaux"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-300 transition-colors">
            🌾 Producteurs locaux
          </Link>
          <Link to="/marches-locaux"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-300 transition-colors">
            📍 Marchés locaux
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-6">
          <HeroImage
            src={PAGE_HERO_IMAGES.petitsCommerces}
            alt="Petit commerce de proximité dans les DOM"
            gradient="from-slate-950 to-orange-900"
            height="h-44 sm:h-56"
          >
            <div className="flex items-center gap-2 mb-2">
              <Store className="w-6 h-6 text-orange-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-orange-300">
                Commerce local
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow leading-tight">
              🏪 Petits commerces<br />de proximité
            </h1>
            <p className="text-orange-100 text-sm mt-2 drop-shadow max-w-2xl">
              Trouvez les épiceries, boulangeries, boucheries et artisans locaux de votre territoire.
              Prix repères, horaires et avis citoyens.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-1 bg-orange-500/20 border border-orange-500/40 rounded-full text-xs text-orange-300">
                {COMMERCES.length} commerces répertoriés
              </span>
              <span className="px-2 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-300">
                🌿 {COMMERCES.filter(c => c.local).length} commerces 100% locaux
              </span>
            </div>
          </HeroImage>
        </div>

        {/* Search + filters */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-6 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un commerce, une spécialité, une ville…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Territory filter */}
          <div className="flex flex-wrap gap-2">
            {TERRITOIRES.map(t => (
              <button
                key={t}
                onClick={() => setTerritoire(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  territoire === t
                    ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300'
                    : 'bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Category + local toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={categorie}
              onChange={e => setCategorie(e.target.value)}
              className="px-3 py-1.5 bg-slate-700/60 border border-slate-600/50 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500/50"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={() => setLocalOnly(l => !l)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                localOnly
                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                  : 'bg-slate-700/50 border-slate-600/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              {localOnly ? '✓ Local uniquement' : 'Local uniquement'}
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-slate-400 mb-4">
          <span className="font-semibold text-white">{filtered.length}</span> commerce{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun commerce ne correspond à votre recherche</p>
            <button
              onClick={() => { setSearch(''); setCategorie('Tous'); setTerritoire('Tous'); setLocalOnly(false); }}
              className="mt-3 text-orange-400 hover:text-orange-300 text-sm underline underline-offset-2"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filtered.map(c => <CommerceCard key={c.id} c={c} />)}
          </div>
        )}

        {/* Contribute CTA */}
        <div className="bg-orange-900/20 border border-orange-700/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-orange-300 mb-1">📢 Vous connaissez un commerce local ?</p>
            <p className="text-sm text-gray-400">
              Signalez-nous les épiceries, artisans et petits commerces de votre quartier.
              Ensemble, construisons l'annuaire citoyen des DOM.
            </p>
          </div>
          <Link
            to="/contribuer-prix"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            Contribuer
          </Link>
        </div>

        {/* Bottom navigation */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/producteurs-locaux"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-700/30 hover:bg-green-700/50 border border-green-700/40 text-green-300 rounded-xl font-medium text-sm transition-colors">
            🌾 Producteurs locaux
          </Link>
          <Link to="/marches-locaux"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-700/30 hover:bg-blue-700/50 border border-blue-700/40 text-blue-300 rounded-xl font-medium text-sm transition-colors">
            📍 Marchés locaux
          </Link>
          <Link to="/evaluation-magasins"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-700/30 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded-xl font-medium text-sm transition-colors">
            ⭐ Évaluer les magasins
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PetitsCommerces;
