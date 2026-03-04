/**
 * EntraideCoupDeMain – Réseau de coup de main citoyen
 *
 * Fonctionnalités :
 * - Poster une offre ("Je peux aider") ou une demande ("J'ai besoin d'aide")
 * - Parcourir par catégorie : jardinage, bricolage, cuisine, transport…
 * - Données stockées en localStorage (aucun backend requis)
 * - Anonymat préservé : seul le territoire est affiché
 */

import { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../ui/glass-card';
import { safeLocalStorage } from '../../utils/safeLocalStorage';
import {
  Hammer,
  Leaf,
  ChefHat,
  Car,
  Baby,
  ShoppingCart,
  Laptop,
  Scissors,
  Music,
  HelpCircle,
  Plus,
  X,
  HandHeart,
  Search,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

export type AideCategory =
  | 'jardinage'
  | 'bricolage'
  | 'cuisine'
  | 'transport'
  | 'garde_enfants'
  | 'courses'
  | 'informatique'
  | 'couture'
  | 'musique_art'
  | 'autre';

export type AideType = 'offre' | 'demande';

export interface AideAnnonce {
  id: string;
  type: AideType;
  category: AideCategory;
  titre: string;
  description: string;
  disponibilite: string;
  territoire: string;
  quartier?: string;
  createdAt: string;
  contactHint?: string;
}

// ─── Constantes ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'akiprisaye_entraide_annonces';

const CATEGORIES: { id: AideCategory; label: string; emoji: string }[] = [
  { id: 'jardinage',      label: 'Jardinage',         emoji: '🌿' },
  { id: 'bricolage',      label: 'Bricolage',          emoji: '🔨' },
  { id: 'cuisine',        label: 'Cuisine / Repas',    emoji: '🍲' },
  { id: 'transport',      label: 'Transport',          emoji: '🚗' },
  { id: 'garde_enfants',  label: "Garde d'enfants",    emoji: '👶' },
  { id: 'courses',        label: 'Courses',            emoji: '🛒' },
  { id: 'informatique',   label: 'Informatique',       emoji: '💻' },
  { id: 'couture',        label: 'Couture / Retouche', emoji: '🧵' },
  { id: 'musique_art',    label: 'Musique / Art',      emoji: '🎵' },
  { id: 'autre',          label: 'Autre',              emoji: '🤝' },
];

const TERRITOIRES = [
  'Guadeloupe', 'Martinique', 'Guyane', 'La Réunion',
  'Mayotte', 'Saint-Martin', 'Saint-Barthélemy',
];

const SAMPLE_ANNONCES: AideAnnonce[] = [
  {
    id: 'sample-e001',
    type: 'offre',
    category: 'jardinage',
    titre: 'Je propose mon aide pour la taille et le désherbage',
    description: 'Jardinier amateur expérimenté, je peux aider pour taille de haies, désherbage et plantation. Matériel disponible.',
    disponibilite: 'Samedis matin',
    territoire: 'Guadeloupe',
    quartier: 'Les Abymes',
    createdAt: '2026-02-10T08:00:00Z',
    contactHint: 'Répondre à cette annonce',
  },
  {
    id: 'sample-e002',
    type: 'demande',
    category: 'bricolage',
    titre: "Besoin d'aide pour réparer une fuite robinet",
    description: "Fuite sous l'évier de cuisine. Je peux fournir les pièces si quelqu'un peut m'aider à faire la réparation.",
    disponibilite: 'Cette semaine',
    territoire: 'Martinique',
    quartier: 'Fort-de-France',
    createdAt: '2026-02-12T10:30:00Z',
    contactHint: 'Répondre à cette annonce',
  },
  {
    id: 'sample-e003',
    type: 'offre',
    category: 'courses',
    titre: 'Courses pour personnes âgées ou à mobilité réduite',
    description: 'Disponible 2 fois par semaine pour faire les courses pour personnes ne pouvant pas se déplacer.',
    disponibilite: 'Mardi et vendredi',
    territoire: 'La Réunion',
    quartier: 'Saint-Denis',
    createdAt: '2026-02-14T09:00:00Z',
    contactHint: 'Répondre à cette annonce',
  },
  {
    id: 'sample-e004',
    type: 'offre',
    category: 'informatique',
    titre: 'Aide informatique gratuite pour les seniors',
    description: "Je propose d'aider les personnes âgées à utiliser leur smartphone, tablette ou ordinateur. Patience garantie !",
    disponibilite: 'Dimanches après-midi',
    territoire: 'Guadeloupe',
    quartier: 'Pointe-à-Pitre',
    createdAt: '2026-02-15T14:00:00Z',
    contactHint: 'Répondre à cette annonce',
  },
  {
    id: 'sample-e005',
    type: 'demande',
    category: 'transport',
    titre: 'Besoin de transport pour rendez-vous médical',
    description: 'Personne à mobilité réduite cherche covoiturage pour rendez-vous hospitalier le matin.',
    disponibilite: 'Jeudi 9h',
    territoire: 'Guadeloupe',
    quartier: 'Baie-Mahault',
    createdAt: '2026-02-16T07:00:00Z',
    contactHint: 'Répondre à cette annonce',
  },
  {
    id: 'sample-e006',
    type: 'offre',
    category: 'cuisine',
    titre: 'Partage de repas cuisinés en grande quantité',
    description: "Je cuisine souvent en grande quantité, je propose de partager des plats créoles faits maison avec les voisins dans le besoin.",
    disponibilite: 'Weekends',
    territoire: 'Martinique',
    quartier: 'Le Lamentin',
    createdAt: '2026-02-17T12:00:00Z',
    contactHint: 'Répondre à cette annonce',
  },
];

// ─── Icône de catégorie ─────────────────────────────────────────────────────

function CategoryIcon({ category, className = 'w-4 h-4' }: { category: AideCategory; className?: string }) {
  const map: Record<AideCategory, React.ReactNode> = {
    jardinage:     <Leaf className={className} />,
    bricolage:     <Hammer className={className} />,
    cuisine:       <ChefHat className={className} />,
    transport:     <Car className={className} />,
    garde_enfants: <Baby className={className} />,
    courses:       <ShoppingCart className={className} />,
    informatique:  <Laptop className={className} />,
    couture:       <Scissors className={className} />,
    musique_art:   <Music className={className} />,
    autre:         <HelpCircle className={className} />,
  };
  return <>{map[category]}</>;
}

// ─── Formulaire ─────────────────────────────────────────────────────────────

function PublishForm({ onPublish, onCancel }: { onPublish: (a: AideAnnonce) => void; onCancel: () => void }) {
  const [type, setType] = useState<AideType>('offre');
  const [category, setCategory] = useState<AideCategory>('jardinage');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [disponibilite, setDisponibilite] = useState('');
  const [territoire, setTerritoire] = useState('Guadeloupe');
  const [quartier, setQuartier] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim() || !description.trim() || !disponibilite.trim()) {
      setError('Merci de remplir tous les champs obligatoires (*).');
      return;
    }
    if (titre.trim().length < 10) {
      setError('Le titre doit faire au moins 10 caractères.');
      return;
    }
    setError('');
    onPublish({
      id: `aide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type, category,
      titre: titre.trim(),
      description: description.trim(),
      disponibilite: disponibilite.trim(),
      territoire,
      quartier: quartier.trim() || undefined,
      createdAt: new Date().toISOString(),
      contactHint: 'Répondre à cette annonce',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Type */}
      <div className="grid grid-cols-2 gap-3">
        {(['offre', 'demande'] as AideType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
              type === t
                ? t === 'offre' ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            {t === 'offre' ? <><HandHeart className="w-4 h-4" /> Je propose mon aide</> : <><HelpCircle className="w-4 h-4" /> J'ai besoin d'aide</>}
          </button>
        ))}
      </div>

      {/* Catégorie */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Catégorie *</label>
        <select value={category} onChange={(e) => setCategory(e.target.value as AideCategory)}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
      </div>

      {/* Titre */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Titre *</label>
        <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={100}
          placeholder={type === 'offre' ? "Ex: Je propose mon aide pour le jardinage" : "Ex: Besoin d'aide pour peindre mon salon"}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500}
          placeholder="Décrivez votre offre ou besoin en quelques lignes..."
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
        <p className="text-xs text-gray-500 mt-0.5">{description.length}/500</p>
      </div>

      {/* Disponibilité */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Disponibilité *</label>
        <input type="text" value={disponibilite} onChange={(e) => setDisponibilite(e.target.value)} maxLength={60}
          placeholder="Ex: week-ends, lundi après-midi, cette semaine…"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
      </div>

      {/* Territoire + Quartier */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Territoire *</label>
          <select value={territoire} onChange={(e) => setTerritoire(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
            {TERRITOIRES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Quartier / Ville</label>
          <input type="text" value={quartier} onChange={(e) => setQuartier(e.target.value)} maxLength={60}
            placeholder="Ex: Jarry, Lamentin…"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-600/40 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl transition-colors">
          Publier l'annonce
        </button>
        <button type="button" onClick={onCancel} className="px-5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl transition-colors">
          Annuler
        </button>
      </div>
      <p className="text-xs text-gray-500 text-center">🔒 Stockage local uniquement — aucune donnée personnelle collectée</p>
    </form>
  );
}

// ─── Carte d'annonce ────────────────────────────────────────────────────────

function AnnonceCard({ annonce, onDelete }: { annonce: AideAnnonce; onDelete?: (id: string) => void }) {
  const cat = CATEGORIES.find((c) => c.id === annonce.category);
  const isOffre = annonce.type === 'offre';
  const dateStr = new Date(annonce.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <article
      className={`rounded-xl border p-4 ${isOffre ? 'bg-green-900/10 border-green-600/30' : 'bg-orange-900/10 border-orange-600/30'}`}
      aria-label={`${isOffre ? 'Offre' : 'Demande'} : ${annonce.titre}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isOffre ? 'bg-green-600/20 text-green-300' : 'bg-orange-600/20 text-orange-300'}`}>
              {isOffre ? '🤝 Offre' : '🙏 Demande'}
            </span>
            {cat && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-gray-300 flex items-center gap-1">
                <CategoryIcon category={annonce.category} />
                {cat.label}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white text-sm leading-snug mb-1">{annonce.titre}</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-3">{annonce.description}</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{annonce.disponibilite}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{annonce.quartier ? `${annonce.quartier}, ` : ''}{annonce.territoire}</span>
            <span>{dateStr}</span>
          </div>
        </div>
        {onDelete && (
          <button onClick={() => onDelete(annonce.id)} className="shrink-0 text-gray-600 hover:text-red-400 transition-colors" aria-label="Supprimer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {annonce.contactHint && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
            <CheckCircle className="w-3 h-3" />{annonce.contactHint}
          </button>
        </div>
      )}
    </article>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────

export default function EntraideCoupDeMain() {
  const [annonces, setAnnonces] = useState<AideAnnonce[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<AideType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<AideCategory | 'all'>('all');
  const [filterTerritoire, setFilterTerritoire] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [justPublished, setJustPublished] = useState(false);

  const loadUserAnnonces = useCallback((): AideAnnonce[] => {
    const raw = safeLocalStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AideAnnonce[]) : [];
  }, []);

  useEffect(() => {
    setAnnonces([...SAMPLE_ANNONCES, ...loadUserAnnonces()]);
  }, [loadUserAnnonces]);

  const handlePublish = (annonce: AideAnnonce) => {
    const updated = [annonce, ...loadUserAnnonces()];
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setAnnonces((prev) => [annonce, ...prev]);
    setShowForm(false);
    setJustPublished(true);
    setTimeout(() => setJustPublished(false), 4000);
  };

  const handleDelete = (id: string) => {
    const updated = loadUserAnnonces().filter((a) => a.id !== id);
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setAnnonces((prev) => prev.filter((a) => a.id !== id));
  };

  const isUserAnnonce = (id: string) => loadUserAnnonces().some((a) => a.id === id);

  const filtered = annonces.filter((a) => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    if (filterTerritoire !== 'all' && a.territoire !== filterTerritoire) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return a.titre.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <GlassCard className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <HandHeart className="w-6 h-6 text-orange-400" />
              Entraide & Coup de Main
            </h2>
            <p className="text-sm text-gray-400 mt-1">Proposez votre aide ou demandez un coup de main à votre communauté</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors shrink-0">
            <Plus className="w-4 h-4" />Publier une annonce
          </button>
        </div>
      </GlassCard>

      {/* Confirmation */}
      {justPublished && (
        <div className="flex items-center gap-2 bg-green-900/30 border border-green-600/40 rounded-xl px-4 py-3">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <p className="text-sm text-green-300">Annonce publiée ! Elle est visible par votre communauté.</p>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <GlassCard className="p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Nouvelle annonce</h3>
          <PublishForm onPublish={handlePublish} onCancel={() => setShowForm(false)} />
        </GlassCard>
      )}

      {/* Filtres catégories (scroll horizontal) */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrer par catégorie">
        <button onClick={() => setFilterCategory('all')}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filterCategory === 'all' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}>
          Toutes
        </button>
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setFilterCategory(filterCategory === c.id ? 'all' : c.id)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1 ${filterCategory === c.id ? 'bg-orange-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}>
            <span>{c.emoji}</span>{c.label}
          </button>
        ))}
      </div>

      {/* Filtres globaux */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher…"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as AideType | 'all')}
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="all">Offres &amp; Demandes</option>
          <option value="offre">Offres d'aide</option>
          <option value="demande">Demandes d'aide</option>
        </select>
        <select value={filterTerritoire} onChange={(e) => setFilterTerritoire(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="all">Tous les territoires</option>
          {TERRITOIRES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <p className="text-xs text-gray-500">{filtered.length} annonce{filtered.length !== 1 ? 's' : ''}</p>

      {/* Liste */}
      {filtered.length === 0 ? (
        <GlassCard className="py-12 text-center">
          <HandHeart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">Aucune annonce pour ces critères.</p>
          <button onClick={() => setShowForm(true)} className="text-sm text-orange-400 hover:text-orange-300 underline">
            Soyez le premier à publier !
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <AnnonceCard key={a.id} annonce={a} onDelete={isUserAnnonce(a.id) ? handleDelete : undefined} />
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-300 mb-2">ℹ️ Comment ça fonctionne ?</p>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• <strong className="text-gray-300">Offre d'aide</strong> : proposez bénévolement votre temps et vos compétences</li>
          <li>• <strong className="text-gray-300">Demande d'aide</strong> : sollicitez un coup de main ponctuel</li>
          <li>• Données stockées sur votre appareil — aucune donnée personnelle collectée</li>
        </ul>
      </div>
    </div>
  );
}
