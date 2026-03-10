/**
 * EvaluationMagasins — Notation des magasins par les utilisateurs
 * Route : /evaluation-magasins
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Star, MapPin, ThumbsUp, ShoppingBag, Search, Info, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ── Données exemple ───────────────────────────────────────────────────────────

interface StoreRating {
  id: string;
  name: string;
  territory: string;
  address: string;
  sector: string;
  sectorEmoji: string;
  sectorColor: string;
  storeImage: string;
  ratings: { service: number; proprete: number; disponibilite: number };
  totalReviews: number;
  lastReview: string;
}

const EXAMPLE_RATINGS: StoreRating[] = [
  {
    id: '1',
    name: 'Carrefour Désirade',
    territory: 'Guadeloupe',
    address: 'ZAC de Jarry, Baie-Mahault',
    sector: 'Alimentaire',
    sectorEmoji: '🛒',
    sectorColor: 'bg-amber-100 text-amber-800',
    storeImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 3.8, proprete: 4.1, disponibilite: 4.3 },
    totalReviews: 142,
    lastReview: '2024-12-10',
  },
  {
    id: '2',
    name: 'Champion Lamentin',
    territory: 'Martinique',
    address: 'Centre Commercial Galeria, Le Lamentin',
    sector: 'Alimentaire',
    sectorEmoji: '🛒',
    sectorColor: 'bg-amber-100 text-amber-800',
    storeImage: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 4.0, proprete: 3.9, disponibilite: 3.7 },
    totalReviews: 89,
    lastReview: '2024-12-08',
  },
  {
    id: '3',
    name: 'Leader Price Saint-Denis',
    territory: 'La Réunion',
    address: 'Rue du Maréchal Leclerc, Saint-Denis',
    sector: 'Alimentaire',
    sectorEmoji: '🛒',
    sectorColor: 'bg-amber-100 text-amber-800',
    storeImage: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 3.5, proprete: 3.8, disponibilite: 4.0 },
    totalReviews: 61,
    lastReview: '2024-12-05',
  },
  {
    id: '4',
    name: 'Monoprix Nouméa Centre',
    territory: 'Nouvelle-Calédonie',
    address: "Rue de l'Alma, Nouméa",
    sector: 'Alimentaire',
    sectorEmoji: '🛒',
    sectorColor: 'bg-amber-100 text-amber-800',
    storeImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 4.2, proprete: 4.3, disponibilite: 4.0 },
    totalReviews: 134,
    lastReview: '2024-11-25',
  },
  {
    id: '5',
    name: 'Pharmacie du Bourg',
    territory: 'Guadeloupe',
    address: 'Centre-ville, Sainte-Anne',
    sector: 'Pharmacie',
    sectorEmoji: '💊',
    sectorColor: 'bg-green-100 text-green-800',
    storeImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 4.5, proprete: 4.7, disponibilite: 3.9 },
    totalReviews: 38,
    lastReview: '2024-12-09',
  },
  {
    id: '6',
    name: 'Pharmacie Centrale Cayenne',
    territory: 'Guyane',
    address: 'Avenue du Général de Gaulle, Cayenne',
    sector: 'Pharmacie',
    sectorEmoji: '💊',
    sectorColor: 'bg-green-100 text-green-800',
    storeImage: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 3.9, proprete: 4.4, disponibilite: 3.7 },
    totalReviews: 45,
    lastReview: '2024-12-01',
  },
  {
    id: '7',
    name: 'Boulangerie Chez Ti-Marie',
    territory: 'Martinique',
    address: 'Rue Victor Hugo, Fort-de-France',
    sector: 'Boulangerie',
    sectorEmoji: '🥖',
    sectorColor: 'bg-orange-100 text-orange-800',
    storeImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 4.8, proprete: 4.6, disponibilite: 4.2 },
    totalReviews: 75,
    lastReview: '2024-12-11',
  },
  {
    id: '8',
    name: 'Boulangerie Maison Doucet',
    territory: 'La Réunion',
    address: 'Rue de la Paix, Saint-Pierre',
    sector: 'Boulangerie',
    sectorEmoji: '🥖',
    sectorColor: 'bg-orange-100 text-orange-800',
    storeImage: 'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 4.7, proprete: 4.5, disponibilite: 4.3 },
    totalReviews: 83,
    lastReview: '2024-11-30',
  },
  {
    id: '9',
    name: 'Boutique Orange Fort-de-France',
    territory: 'Martinique',
    address: 'Rue de la République, Fort-de-France',
    sector: 'Téléphonie',
    sectorEmoji: '📱',
    sectorColor: 'bg-blue-100 text-blue-800',
    storeImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 3.2, proprete: 4.0, disponibilite: 3.5 },
    totalReviews: 54,
    lastReview: '2024-12-07',
  },
  {
    id: '10',
    name: 'Leroy Merlin Jarry',
    territory: 'Guadeloupe',
    address: 'ZAC de Jarry, Baie-Mahault',
    sector: 'Bricolage',
    sectorEmoji: '🔨',
    sectorColor: 'bg-gray-100 text-gray-700',
    storeImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 3.6, proprete: 3.9, disponibilite: 4.1 },
    totalReviews: 112,
    lastReview: '2024-12-06',
  },
  {
    id: '11',
    name: 'Restaurant Le Balisier',
    territory: 'Guadeloupe',
    address: 'Bord de mer, Gosier',
    sector: 'Restaurant',
    sectorEmoji: '🍽️',
    sectorColor: 'bg-red-100 text-red-800',
    storeImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 4.6, proprete: 4.4, disponibilite: 4.7 },
    totalReviews: 203,
    lastReview: '2024-12-12',
  },
  {
    id: '12',
    name: 'Snack Chez Doudou',
    territory: 'Martinique',
    address: 'Rue des Artisans, Le François',
    sector: 'Restaurant',
    sectorEmoji: '🍽️',
    sectorColor: 'bg-red-100 text-red-800',
    storeImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 4.3, proprete: 4.1, disponibilite: 4.5 },
    totalReviews: 91,
    lastReview: '2024-12-09',
  },
  {
    id: '13',
    name: 'Marché Couvert de Saint-Paul',
    territory: 'La Réunion',
    address: 'Place du Marché, Saint-Paul',
    sector: 'Marché',
    sectorEmoji: '🌿',
    sectorColor: 'bg-lime-100 text-lime-800',
    storeImage: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 4.3, proprete: 3.7, disponibilite: 4.8 },
    totalReviews: 167,
    lastReview: '2024-12-10',
  },
  {
    id: '14',
    name: 'Marché de Matoury',
    territory: 'Guyane',
    address: 'Avenue de la Liberté, Matoury',
    sector: 'Marché',
    sectorEmoji: '🌿',
    sectorColor: 'bg-lime-100 text-lime-800',
    storeImage: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 4.0, proprete: 3.5, disponibilite: 4.6 },
    totalReviews: 52,
    lastReview: '2024-11-22',
  },
  {
    id: '15',
    name: 'Zara Galeria Lamentin',
    territory: 'Martinique',
    address: 'Centre Commercial Galeria, Le Lamentin',
    sector: 'Mode',
    sectorEmoji: '👗',
    sectorColor: 'bg-purple-100 text-purple-800',
    storeImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 3.9, proprete: 4.2, disponibilite: 3.6 },
    totalReviews: 88,
    lastReview: '2024-12-04',
  },
  {
    id: '16',
    name: 'Décathlon Basse-Terre',
    territory: 'Guadeloupe',
    address: 'Route Nationale, Basse-Terre',
    sector: 'Sport',
    sectorEmoji: '🏋️',
    sectorColor: 'bg-indigo-100 text-indigo-800',
    storeImage: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 4.1, proprete: 4.3, disponibilite: 4.0 },
    totalReviews: 97,
    lastReview: '2024-12-03',
  },
  {
    id: '17',
    name: 'Beauté Tropicale Schoelcher',
    territory: 'Martinique',
    address: 'Centre Commercial, Schoelcher',
    sector: 'Beauté',
    sectorEmoji: '💄',
    sectorColor: 'bg-pink-100 text-pink-800',
    storeImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fm=webp&fit=crop&w=800&q=80',
    ratings: { service: 4.4, proprete: 4.6, disponibilite: 3.8 },
    totalReviews: 56,
    lastReview: '2024-11-28',
  },
];

const ALL_SECTORS = ['Tous', ...Array.from(new Set(EXAMPLE_RATINGS.map((s) => s.sector)))];

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
      <span className="text-xs text-gray-600 ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

function avgRating(r: StoreRating['ratings']): number {
  return Math.round(((r.service + r.proprete + r.disponibilite) / 3) * 10) / 10;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function EvaluationMagasins() {
  const [showForm, setShowForm] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [selectedSector, setSelectedSector] = useState('Tous');
  const [form, setForm] = useState({ storeName: '', service: 0, proprete: 0, disponibilite: 0, comment: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRatingSubmitted(true);
    setShowForm(false);
  };

  const filteredRatings =
    selectedSector === 'Tous'
      ? EXAMPLE_RATINGS
      : EXAMPLE_RATINGS.filter((s) => s.sector === selectedSector);

  return (
    <>
      <Helmet>
        <title>Évaluation des magasins — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Notez la qualité de service, la propreté et la disponibilité des produits dans votre magasin — A KI PRI SA YÉ"
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/evaluation-magasins" />
      </Helmet>

      <div className="min-h-screen bg-amber-50/40">
        <div className="px-4 pt-4 max-w-3xl mx-auto">
          <HeroImage
            src={PAGE_HERO_IMAGES.evaluationMagasins}
            alt="Évaluation des magasins par les citoyens"
            gradient="from-slate-950 to-amber-900"
            height="h-40 sm:h-52"
          >
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-amber-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                Évaluations citoyennes
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow">
              ⭐ Évaluation des magasins
            </h1>
            <p className="text-amber-100 text-sm mt-1 drop-shadow">
              Service, propreté, disponibilité : notez les magasins de votre territoire
            </p>
          </HeroImage>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 pb-20 space-y-6">

          {/* Avertissement bêta */}
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Fonctionnalité en développement (V3). Les avis présentés sont des exemples.
              La persistance et la modération des avis réels seront disponibles prochainement.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              <Star className="w-4 h-4" />
              Évaluer un magasin
            </button>
            <Link
              to="/carte"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors text-sm"
            >
              <Search className="w-4 h-4" />
              Trouver un magasin sur la carte
            </Link>
          </div>

          {/* Succès */}
          {ratingSubmitted && (
            <div className="flex gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <ThumbsUp className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">
                Merci pour votre évaluation ! Elle sera examinée et publiée après modération.
              </p>
            </div>
          )}

          {/* Formulaire d'évaluation */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Form header image */}
              <div className="relative h-24 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fm=webp&fit=crop&w=800&q=80"
                  alt="Évaluer un magasin"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-900/70 to-orange-800/50 flex items-center px-5">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-300" />
                    <h3 className="font-bold text-white text-lg">Évaluer un magasin</h3>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">
                    Nom du magasin
                  </label>
                  <input
                    type="text"
                    value={form.storeName}
                    onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                    placeholder="Ex: Carrefour Jarry"
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80"
                    required
                  />
                </div>

                {(['service', 'proprete', 'disponibilite'] as const).map((criterion) => (
                  <div key={criterion}>
                    <label className="block text-sm font-medium text-amber-900 mb-1">
                      {criterion === 'proprete' ? 'Propreté' : criterion === 'disponibilite' ? 'Disponibilité produits' : 'Qualité de service'}
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setForm({ ...form, [criterion]: star })}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-7 h-7 ${star <= form[criterion] ? 'text-amber-500 fill-amber-500' : 'text-amber-200 fill-amber-100'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    placeholder="Décrivez votre expérience..."
                    rows={3}
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none bg-white/80"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm transition-colors"
                  >
                    Envoyer l'évaluation
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 border border-amber-300 text-amber-700 rounded-xl text-sm hover:bg-amber-100 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Exemples d'évaluations */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              <h2 className="font-bold text-gray-900">
                Évaluations récentes{' '}
                <span className="text-gray-400 font-normal text-sm">(exemples)</span>
              </h2>
            </div>

            {/* Filtre par secteur */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {ALL_SECTORS.map((sector) => (
                <button
                  key={sector}
                  onClick={() => setSelectedSector(sector)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedSector === sector
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>

            {/* Cartes magasins */}
            {filteredRatings.map((store) => (
              <div key={store.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                {/* Banner image */}
                <div className="relative h-32">
                  <img
                    src={store.storeImage}
                    alt={store.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                  {/* Sector badge */}
                  <span className={`absolute top-2.5 right-3 text-xs font-semibold px-2 py-0.5 rounded-full ${store.sectorColor}`}>
                    {store.sectorEmoji} {store.sector}
                  </span>
                  {/* Store name overlaid */}
                  <p className="absolute bottom-2.5 left-3 font-bold text-white text-sm drop-shadow-md">
                    {store.name}
                  </p>
                  {/* Rating badge */}
                  <div className="absolute bottom-2.5 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-white font-bold text-sm">{avgRating(store.ratings).toFixed(1)}</span>
                    <span className="text-white/70 text-xs">({store.totalReviews})</span>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span>{store.address} · {store.territory}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Service</span>
                      <StarRating value={store.ratings.service} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Propreté</span>
                      <StarRating value={store.ratings.proprete} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Disponibilité</span>
                      <StarRating value={store.ratings.disponibilite} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
