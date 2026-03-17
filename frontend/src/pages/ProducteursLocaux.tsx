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
  Leaf, MapPin, Search, Phone, Clock,
  Star, ChevronRight, ArrowLeft, ShoppingBag,
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
  note: number;
  nbAvis: number;
  paniers: { label: string; prix: number; prixHabituel: number }[];
  image: string;
}

/* ─── Données ─────────────────────────────────────────────────────────────── */

const PRODUCTEURS: Producteur[] = [
  {
    id: 'prod-tijardin-gp',
    nom: 'Ferme Ti Jardin',
    territoire: 'Guadeloupe',
    ville: 'Capesterre-Belle-Eau',
    telephone: '0590 12 34 56',
    description: 'Maraîchage diversifié en agriculture biologique depuis 2003. Légumes de saison, herbes aromatiques et plantes médicinales tropicales.',
    specialites: ['Légumes racine', 'Salades', 'Herbes aromatiques', 'Giraumon', 'Patate douce'],
    certification: '🌿 BIO AB',
    modeVente: ['Vente directe à la ferme', 'Marché de Capesterre', 'Livraison Pointe-à-Pitre'],
    jours: 'Ven–Sam sur place · Marché Mar & Sam',
    note: 4.8, nbAvis: 92,
    paniers: [
      { label: 'Panier Fond de Cuisine 🥗 (5 kg légumes saison)', prix: 15.00, prixHabituel: 22.50 },
      { label: 'Panier Herbes & Épices (assortiment)', prix: 8.00, prixHabituel: 12.00 },
    ],
    image: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4e6?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-manioc-gp',
    nom: 'GAEC Manioc des Grands-Fonds',
    territoire: 'Guadeloupe',
    ville: 'Grands-Fonds',
    telephone: '0590 93 48 21',
    description: 'Producteur de manioc et de dérivés (farine, couac, gâteau). Transformation artisanale sur place.',
    specialites: ['Manioc frais', 'Farine de manioc', 'Couac', 'Gâteau manioc'],
    certification: '🏡 Agriculture locale',
    modeVente: ['Vente directe', 'Marché du Gosier'],
    jours: 'Mar · Sam matin',
    note: 4.6, nbAvis: 53,
    paniers: [
      { label: 'Colis Manioc (3 kg frais + 1 kg couac)', prix: 12.00, prixHabituel: 18.00 },
    ],
    image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-cooppeyi-mq',
    nom: 'Coopérative Péyi Martinique',
    territoire: 'Martinique',
    ville: 'Le Lamentin',
    telephone: '0596 77 88 99',
    description: 'Regroupement de 12 producteurs martiniquais pour la souveraineté alimentaire. Bannanes, ananas, épices et produits transformés locaux.',
    specialites: ['Bananes Cavendish', 'Ananas Victoria', 'Épices créoles', 'Piment confit', 'Sirop de canne'],
    certification: '✅ Zéro Chlordécone certifié',
    modeVente: ['Marché du Lamentin', 'Drive fermier', 'Livraison Fort-de-France'],
    jours: 'Lun–Sam — commandes en ligne 24h/7j',
    note: 4.7, nbAvis: 134,
    paniers: [
      { label: 'Pack Fraîcheur Fruits 🍍 (assortiment tropical)', prix: 10.00, prixHabituel: 16.00 },
      { label: 'Colis Épices Péyi (5 bocaux assortis)', prix: 18.00, prixHabituel: 26.00 },
    ],
    image: 'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-cacao-mq',
    nom: 'Plantation Cacao Madinina',
    territoire: 'Martinique',
    ville: 'Ajoupa-Bouillon',
    telephone: '0596 53 31 04',
    description: 'L\'une des dernières plantations de cacao de la Martinique. Chocolat artisanal bean-to-bar, visites possibles.',
    specialites: ['Fèves de cacao Trinitario', 'Chocolat noir 70%', 'Cacao en poudre', 'Beurre de cacao'],
    certification: '🍫 Artisanal · AOP en cours',
    modeVente: ['Boutique sur place', 'Marché de Saint-Pierre', 'Commande en ligne'],
    jours: 'Mer–Dim 9h–16h30',
    note: 4.9, nbAvis: 78,
    paniers: [
      { label: 'Coffret Chocolat Martinique (4 tablettes artisanales)', prix: 22.00, prixHabituel: 32.00 },
    ],
    image: 'https://images.unsplash.com/photo-1511381939415-e44f12a5fa73?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-vanilla-re',
    nom: 'Domaine Vanille Bourbon Péi',
    territoire: 'La Réunion',
    ville: 'Sainte-Suzanne',
    telephone: '0262 52 18 73',
    description: 'Producteur familial de vanille Bourbon de La Réunion. Gousses charnues, séchage traditionnel. Export et vente directe.',
    specialites: ['Vanille Bourbon gousse', 'Extrait de vanille', 'Sucre vanillé artisanal'],
    certification: '🌿 Indication Géographique Protégée',
    modeVente: ['Vente directe', 'Marché forain Saint-Denis', 'E-shop'],
    jours: 'Sur RDV · Marché Sam Saint-Denis',
    note: 4.9, nbAvis: 167,
    paniers: [
      { label: 'Sachet 5 gousses Bourbon IGP', prix: 9.50, prixHabituel: 15.00 },
      { label: 'Pack cadeau Vanille (gousses + extrait)', prix: 24.00, prixHabituel: 36.00 },
    ],
    image: 'https://images.unsplash.com/photo-1612444332120-2b06a35b5f89?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-lentilles-re',
    nom: 'CUMA Lentilles de Cilaos',
    territoire: 'La Réunion',
    ville: 'Cilaos',
    telephone: '0262 31 74 00',
    description: 'Lentilles de Cilaos, produites dans le cirque volcanique à 1 200 m d\'altitude. Produit emblématique réunionnais, IGP.',
    specialites: ['Lentilles blondes Cilaos IGP', 'Lentilles brunes', 'Farines légumineuses'],
    certification: '🏔️ IGP Lentilles de Cilaos',
    modeVente: ['Marchés de La Réunion', 'Grands supermarchés locaux', 'Vente directe cirque'],
    jours: 'Disponibles en saison (mai–sept) · Stock limité',
    note: 4.7, nbAvis: 215,
    paniers: [
      { label: 'Sac Lentilles Cilaos IGP 1 kg', prix: 5.50, prixHabituel: 8.00 },
    ],
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-pêche-gf',
    nom: 'Coopérative Pêche Cayenne',
    territoire: 'Guyane',
    ville: 'Cayenne',
    telephone: '0594 25 11 08',
    description: 'Pêcheurs artisanaux guyanais. Poissons et crustacés pêchés le matin même, vendus à l\'arrivée des pirogues.',
    specialites: ['Acoupa', 'Vivaneau', 'Crevettes géantes', 'Coulirou fumé', 'Matoutou'],
    certification: '🎣 Pêche artisanale durable',
    modeVente: ['Port de pêche Cayenne', 'Marché central', 'Abonnement hebdomadaire'],
    jours: 'Mar–Sam dès 6h (arrivage) · stock limité',
    note: 4.6, nbAvis: 89,
    paniers: [
      { label: 'Colis Poissons frais (3 kg assortis)', prix: 18.00, prixHabituel: 26.00 },
      { label: 'Crevettes géantes 1 kg (fraîches)', prix: 14.00, prixHabituel: 20.00 },
    ],
    image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-ylang-yt',
    nom: 'Distillerie Ylang Maweni',
    territoire: 'Mayotte',
    ville: 'Kani-Kéli',
    telephone: '0269 62 05 18',
    description: 'Distillation artisanale d\'ylang-ylang de Mayotte. Huile essentielle d\'exception, utilisée par les grandes parfumeries.',
    specialites: ['Huile essentielle ylang-ylang', 'Eau florale ylang', 'Savon artisanal Coco-Ylang'],
    certification: '🌸 Production Mahoraise',
    modeVente: ['Vente directe distillerie', 'Marchés de Mamoudzou'],
    jours: 'Lun–Sam sur RDV',
    note: 4.8, nbAvis: 41,
    paniers: [
      { label: 'Flacon HE Ylang-Ylang Mayotte 10 ml', prix: 12.00, prixHabituel: 18.00 },
    ],
    image: 'https://images.unsplash.com/photo-1595535873420-a599195b3f4a?auto=format&fm=webp&fit=crop&w=800&q=80',
  },
];

const TERRITOIRES = ['Tous', 'Guadeloupe', 'Martinique', 'La Réunion', 'Guyane', 'Mayotte'];

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
        <img src={p.image} alt={p.nom} width={400} height={160} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="absolute top-2 right-2 bg-slate-900/80 border border-green-500/40 text-green-300 text-xs px-2 py-0.5 rounded-full font-semibold">
          {p.certification}
        </div>
        <div className="absolute bottom-2 left-3">
          <p className="text-white font-bold text-base drop-shadow leading-tight">{p.nom}</p>
          <p className="text-green-300 text-xs">{p.ville} · {p.territoire}</p>
        </div>
      </div>

      <div className="p-4">
        {/* Rating */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className={`w-3 h-3 ${i <= Math.round(p.note) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
          ))}
          <span className="text-amber-400 font-bold text-sm">{p.note.toFixed(1)}</span>
          <span className="text-slate-500 text-xs">({p.nbAvis})</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-3">{p.description}</p>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1 mb-3">
          {p.specialites.slice(0, 4).map(s => (
            <span key={s} className="text-xs bg-green-900/30 border border-green-700/40 text-green-300 px-2 py-0.5 rounded-full">{s}</span>
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
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 font-medium mb-2 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {open ? 'Masquer les paniers' : `Voir ${p.paniers.length} panier${p.paniers.length > 1 ? 's' : ''} disponible${p.paniers.length > 1 ? 's' : ''}`}
            </button>
            {open && (
              <div className="space-y-2">
                {p.paniers.map(pan => (
                  <div key={pan.label} className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3">
                    <p className="text-xs text-slate-200 mb-1.5 leading-snug">{pan.label}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-400">{pan.prix.toFixed(2)} €</span>
                        <span className="text-xs text-slate-500 line-through">{pan.prixHabituel.toFixed(2)} €</span>
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
          <a href={`tel:${p.telephone}`}
            className="mt-3 flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 font-medium">
            <Phone className="w-3.5 h-3.5" />{p.telephone}
          </a>
        )}
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
    if (territoire !== 'Tous') list = list.filter(p => p.territoire === territoire);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        p.nom.toLowerCase().includes(q) ||
        p.ville.toLowerCase().includes(q) ||
        p.specialites.some(s => s.toLowerCase().includes(q)) ||
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
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/producteurs-locaux" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/producteurs-locaux" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/producteurs-locaux" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 pb-16 pt-6">
        {/* Back nav */}
        <div className="mb-4 flex flex-wrap gap-3">
          <Link to="/solidarite" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Économie locale
          </Link>
          <Link to="/petits-commerces" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-300 transition-colors">
            🏪 Petits commerces
          </Link>
          <Link to="/marches-locaux" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-300 transition-colors">
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
              🌾 Producteurs locaux
            </h1>
            <p className="text-green-100 text-sm mt-2 drop-shadow max-w-2xl">
              Achetez directement aux producteurs des DOM. Paniers fraîcheur, prix circuit court.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-300">
                {PRODUCTEURS.length} producteurs répertoriés
              </span>
              <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs text-amber-300">
                🧺 {PRODUCTEURS.reduce((n, p) => n + p.paniers.length, 0)} paniers disponibles
              </span>
            </div>
          </HeroImage>
        </div>

        {/* Search + filters */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un producteur, une spécialité…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TERRITOIRES.map(t => (
              <button
                key={t}
                onClick={() => setTerritoire(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  territoire === t
                    ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                    : 'bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:bg-slate-700'
                }`}
              >{t}</button>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          <span className="font-semibold text-white">{filtered.length}</span> producteur{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Leaf className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun producteur ne correspond</p>
            <button onClick={() => { setSearch(''); setTerritoire('Tous'); }}
              className="mt-3 text-green-400 hover:text-green-300 text-sm underline underline-offset-2">
              Réinitialiser
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filtered.map(p => <ProducteurCard key={p.id} p={p} />)}
          </div>
        )}

        {/* CTA */}
        <div className="bg-green-900/20 border border-green-700/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-green-300 mb-1">🌱 Vous êtes producteur local ?</p>
            <p className="text-sm text-gray-400">
              Inscrivez votre exploitation dans l'annuaire citoyen. Rejoignez l'économie de proximité des DOM.
            </p>
          </div>
          <Link to="/contribuer-prix"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-colors">
            <ChevronRight className="w-4 h-4" />
            Référencer mon exploitation
          </Link>
        </div>

        {/* Bottom nav */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/petits-commerces"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-700/30 hover:bg-orange-700/50 border border-orange-700/40 text-orange-300 rounded-xl font-medium text-sm transition-colors">
            🏪 Petits commerces
          </Link>
          <Link to="/marches-locaux"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-700/30 hover:bg-blue-700/50 border border-blue-700/40 text-blue-300 rounded-xl font-medium text-sm transition-colors">
            📍 Marchés locaux
          </Link>
          <Link to="/ti-panie"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-700/30 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded-xl font-medium text-sm transition-colors">
            🧺 Ti Panier solidaire
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProducteursLocaux;
