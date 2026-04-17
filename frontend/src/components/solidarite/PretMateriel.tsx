/**
 * PretMateriel – Bibliothèque d'objets communautaire
 *
 * Fonctionnalités :
 * - Proposer un objet à prêter (jardinage, cuisine, jouets, bricolage, sport…)
 * - Chercher un objet à emprunter par catégorie et territoire
 * - Durée de prêt et conditions définies par le prêteur
 * - Données en localStorage (aucun backend requis)
 * - Anonymat : seul le territoire / quartier est visible
 */

import { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../ui/glass-card';
import { safeLocalStorage } from '../../utils/safeLocalStorage';
import {
  Leaf,
  Wrench,
  UtensilsCrossed,
  Bike,
  Baby,
  Music,
  Camera,
  BookOpen,
  Package,
  HelpCircle,
  Plus,
  X,
  Search,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

export type PretCategory =
  | 'jardinage'
  | 'cuisine'
  | 'jouets'
  | 'bricolage'
  | 'sport'
  | 'musique'
  | 'bebe'
  | 'multimedia'
  | 'livres'
  | 'fete'
  | 'autre';

export type EtatObjet = 'tres_bon' | 'bon' | 'correct';
export type DureePret = '1j' | '2-3j' | '1sem' | '2sem' | 'a_convenir';

export interface ObjetPret {
  id: string;
  category: PretCategory;
  nom: string;
  description: string;
  etat: EtatObjet;
  dureePret: DureePret;
  conditions?: string; // Ex: "Restituer nettoyé", "Caution 20€"
  territoire: string;
  quartier?: string;
  createdAt: string;
  disponible: boolean;
  contactHint?: string;
}

// ─── Constantes ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'akiprisaye_pret_materiel';

const CATEGORIES: { id: PretCategory; label: string; emoji: string; exemples: string }[] = [
  {
    id: 'jardinage',
    label: 'Jardinage',
    emoji: '🌱',
    exemples: 'Tondeuse, taille-haie, débroussailleuse, arrosoir, bêche',
  },
  {
    id: 'cuisine',
    label: 'Cuisine & Électroménager',
    emoji: '🍳',
    exemples: 'Robot pâtissier, centrifugeuse, crêpière, plancha, fondue',
  },
  {
    id: 'jouets',
    label: 'Jouets & Jeux',
    emoji: '🧸',
    exemples: 'Jeux de société, jouets bébé, vélo enfant, trottinette',
  },
  {
    id: 'bricolage',
    label: 'Bricolage & Outillage',
    emoji: '🔧',
    exemples: 'Perceuse, ponceuse, scie sauteuse, échelle, niveau laser',
  },
  {
    id: 'sport',
    label: 'Sport & Loisirs',
    emoji: '⚽',
    exemples: 'Vélo, kayak, surf, randonnée, tentes de camping',
  },
  {
    id: 'musique',
    label: 'Instruments de musique',
    emoji: '🎸',
    exemples: 'Guitare, ukulélé, clavier, percussions',
  },
  {
    id: 'bebe',
    label: 'Puériculture & Bébé',
    emoji: '👶',
    exemples: 'Poussette, siège auto, transat, baby phone, chaise haute',
  },
  {
    id: 'multimedia',
    label: 'Multimédia & Photo',
    emoji: '📷',
    exemples: 'Appareil photo, vidéoprojecteur, écran portable, trépied',
  },
  {
    id: 'livres',
    label: 'Livres & BD',
    emoji: '📚',
    exemples: 'Romans, BD, livres scolaires, encyclopédies, guides',
  },
  {
    id: 'fete',
    label: 'Fête & Événement',
    emoji: '🎉',
    exemples: 'Guirlandes, tréteaux, chaises, sono légère, décoration',
  },
  { id: 'autre', label: 'Autre', emoji: '📦', exemples: 'Tout objet utile non listé ci-dessus' },
];

const ETATS: { id: EtatObjet; label: string; color: string }[] = [
  { id: 'tres_bon', label: 'Très bon état', color: 'text-green-400' },
  { id: 'bon', label: 'Bon état', color: 'text-blue-400' },
  { id: 'correct', label: 'État correct', color: 'text-yellow-400' },
];

const DUREES: { id: DureePret; label: string }[] = [
  { id: '1j', label: '1 journée' },
  { id: '2-3j', label: '2 à 3 jours' },
  { id: '1sem', label: '1 semaine' },
  { id: '2sem', label: '2 semaines' },
  { id: 'a_convenir', label: 'À convenir' },
];

const TERRITOIRES = [
  'Guadeloupe',
  'Martinique',
  'Guyane',
  'La Réunion',
  'Mayotte',
  'Saint-Martin',
  'Saint-Barthélemy',
];

const SAMPLE_OBJETS: ObjetPret[] = [
  {
    id: 'pret-001',
    category: 'jardinage',
    nom: 'Tondeuse électrique Bosch',
    description:
      'Tondeuse électrique filaire, bac 40L, parfaite pour les petits jardins. Câble de 10m inclus.',
    etat: 'tres_bon',
    dureePret: '1sem',
    conditions: 'Restituer nettoyée et rechargée',
    territoire: 'Guadeloupe',
    quartier: 'Les Abymes',
    createdAt: '2026-02-01T09:00:00Z',
    disponible: true,
    contactHint: 'Demander par message',
  },
  {
    id: 'pret-002',
    category: 'cuisine',
    nom: 'Robot pâtissier KitchenAid',
    description:
      'Robot pâtissier complet avec fouet, crochet et feuille. Parfait pour pâtisseries et gâteaux.',
    etat: 'bon',
    dureePret: '2-3j',
    conditions: 'Restituer propre, caution 30€',
    territoire: 'Martinique',
    quartier: 'Fort-de-France',
    createdAt: '2026-02-05T10:00:00Z',
    disponible: true,
    contactHint: 'Demander par message',
  },
  {
    id: 'pret-003',
    category: 'jouets',
    nom: 'Vélo enfant 16 pouces',
    description:
      'Vélo enfant rose avec stabilisateurs amovibles, pour enfant de 4 à 7 ans. Très bon état.',
    etat: 'tres_bon',
    dureePret: '1sem',
    territoire: 'La Réunion',
    quartier: 'Saint-Denis',
    createdAt: '2026-02-08T14:00:00Z',
    disponible: true,
    contactHint: 'Demander par message',
  },
  {
    id: 'pret-004',
    category: 'bricolage',
    nom: 'Perceuse-visseuse Makita sans fil',
    description:
      'Perceuse-visseuse 18V avec 2 batteries et chargeur. Avec coffret de forets assortis.',
    etat: 'bon',
    dureePret: '2-3j',
    conditions: 'Restituer avec les batteries chargées',
    territoire: 'Guadeloupe',
    quartier: 'Baie-Mahault',
    createdAt: '2026-02-10T08:00:00Z',
    disponible: true,
    contactHint: 'Demander par message',
  },
  {
    id: 'pret-005',
    category: 'bebe',
    nom: 'Siège auto groupe 0+/1 Chicco',
    description:
      'Siège auto évolutif de 0 à 18 kg, couleur gris. Certifié ECE R44/04. Très bon état.',
    etat: 'tres_bon',
    dureePret: '2sem',
    territoire: 'Martinique',
    quartier: 'Le Lamentin',
    createdAt: '2026-02-12T11:00:00Z',
    disponible: true,
    contactHint: 'Demander par message',
  },
  {
    id: 'pret-006',
    category: 'fete',
    nom: 'Pack fête : tables + chaises pliantes',
    description:
      '4 tables pliantes 180cm et 20 chaises pliantes blanches. Idéal pour anniversaires et fêtes.',
    etat: 'bon',
    dureePret: 'a_convenir',
    conditions: 'Aide au chargement/déchargement appréciée',
    territoire: 'Guadeloupe',
    quartier: 'Pointe-à-Pitre',
    createdAt: '2026-02-14T16:00:00Z',
    disponible: true,
    contactHint: 'Demander par message',
  },
  {
    id: 'pret-007',
    category: 'sport',
    nom: 'Kayak de mer biplace',
    description:
      'Kayak biplace avec pagaies et gilets de sauvetage. Idéal pour explorer les mangroves.',
    etat: 'bon',
    dureePret: '1j',
    conditions: "Savoir nager obligatoire, restituer rincé à l'eau douce",
    territoire: 'Guadeloupe',
    quartier: 'Sainte-Anne',
    createdAt: '2026-02-15T09:00:00Z',
    disponible: true,
    contactHint: 'Demander par message',
  },
  {
    id: 'pret-008',
    category: 'livres',
    nom: 'Collection livres Martinique & Caraïbes',
    description:
      "15 livres sur l'histoire et la culture des Antilles, romans créoles, guides touristiques.",
    etat: 'bon',
    dureePret: '2sem',
    territoire: 'Martinique',
    quartier: 'Schoelcher',
    createdAt: '2026-02-16T10:00:00Z',
    disponible: true,
    contactHint: 'Demander par message',
  },
];

// ─── Icône de catégorie ─────────────────────────────────────────────────────

function CategoryIcon({
  category,
  className = 'w-4 h-4',
}: {
  category: PretCategory;
  className?: string;
}) {
  const map: Record<PretCategory, React.ReactNode> = {
    jardinage: <Leaf className={className} />,
    cuisine: <UtensilsCrossed className={className} />,
    jouets: <Baby className={className} />,
    bricolage: <Wrench className={className} />,
    sport: <Bike className={className} />,
    musique: <Music className={className} />,
    bebe: <Baby className={className} />,
    multimedia: <Camera className={className} />,
    livres: <BookOpen className={className} />,
    fete: <Package className={className} />,
    autre: <HelpCircle className={className} />,
  };
  return <>{map[category]}</>;
}

// ─── Formulaire de dépôt ────────────────────────────────────────────────────

function DepotForm({
  onDeposer,
  onCancel,
}: {
  onDeposer: (o: ObjetPret) => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState<PretCategory>('jardinage');
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [etat, setEtat] = useState<EtatObjet>('bon');
  const [dureePret, setDureePret] = useState<DureePret>('1sem');
  const [conditions, setConditions] = useState('');
  const [territoire, setTerritoire] = useState('Guadeloupe');
  const [quartier, setQuartier] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !description.trim()) {
      setError('Merci de remplir le nom et la description.');
      return;
    }
    if (nom.trim().length < 5) {
      setError("Le nom de l'objet doit faire au moins 5 caractères.");
      return;
    }
    setError('');
    onDeposer({
      id: `pret-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category,
      nom: nom.trim(),
      description: description.trim(),
      etat,
      dureePret,
      conditions: conditions.trim() || undefined,
      territoire,
      quartier: quartier.trim() || undefined,
      createdAt: new Date().toISOString(),
      disponible: true,
      contactHint: 'Demander par message',
    });
  };

  const catInfo = CATEGORIES.find((c) => c.id === category);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Catégorie */}
      <div>
        <label htmlFor="pret-category" className="block text-sm font-medium text-gray-300 mb-1">
          Catégorie *
        </label>
        <select
          id="pret-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as PretCategory)}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
        {catInfo && <p className="text-xs text-gray-500 mt-1">Ex : {catInfo.exemples}</p>}
      </div>

      {/* Nom */}
      <div>
        <label htmlFor="pret-nom" className="block text-sm font-medium text-gray-300 mb-1">
          Nom de l'objet *
        </label>
        <input
          id="pret-nom"
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          maxLength={80}
          placeholder="Ex: Tondeuse électrique, Robot pâtissier, Vélo enfant…"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="pret-description" className="block text-sm font-medium text-gray-300 mb-1">
          Description *
        </label>
        <textarea
          id="pret-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder="Décrivez l'objet : marque, caractéristiques, accessoires inclus…"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-0.5">{description.length}/400</p>
      </div>

      {/* État + Durée */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pret-etat" className="block text-sm font-medium text-gray-300 mb-1">
            État de l'objet *
          </label>
          <select
            id="pret-etat"
            value={etat}
            onChange={(e) => setEtat(e.target.value as EtatObjet)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {ETATS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pret-duree" className="block text-sm font-medium text-gray-300 mb-1">
            Durée de prêt *
          </label>
          <select
            id="pret-duree"
            value={dureePret}
            onChange={(e) => setDureePret(e.target.value as DureePret)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {DUREES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conditions */}
      <div>
        <label htmlFor="pret-conditions" className="block text-sm font-medium text-gray-300 mb-1">
          Conditions de prêt
        </label>
        <input
          id="pret-conditions"
          type="text"
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          maxLength={120}
          placeholder="Ex: Restituer nettoyé, Caution 20€, Utilisation sur place…"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Territoire + Quartier */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pret-territoire" className="block text-sm font-medium text-gray-300 mb-1">
            Territoire *
          </label>
          <select
            id="pret-territoire"
            value={territoire}
            onChange={(e) => setTerritoire(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {TERRITOIRES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pret-quartier" className="block text-sm font-medium text-gray-300 mb-1">
            Quartier / Ville
          </label>
          <input
            id="pret-quartier"
            type="text"
            value={quartier}
            onChange={(e) => setQuartier(e.target.value)}
            maxLength={60}
            placeholder="Ex: Jarry, Lamentin…"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-600/40 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Déposer l'annonce
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl transition-colors"
        >
          Annuler
        </button>
      </div>
      <p className="text-xs text-gray-500 text-center">
        🔒 Stockage local uniquement — aucune donnée personnelle collectée
      </p>
    </form>
  );
}

// ─── Carte objet ────────────────────────────────────────────────────────────

function ObjetCard({
  objet,
  onDelete,
  onToggle,
}: {
  objet: ObjetPret;
  onDelete?: (id: string) => void;
  onToggle?: (id: string) => void;
}) {
  const cat = CATEGORIES.find((c) => c.id === objet.category);
  const etatInfo = ETATS.find((e) => e.id === objet.etat);
  const dureeInfo = DUREES.find((d) => d.id === objet.dureePret);
  const dateStr = new Date(objet.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <article
      className={`rounded-xl border p-4 transition-opacity ${objet.disponible ? 'bg-slate-800/40 border-slate-600/40' : 'bg-slate-800/20 border-slate-700/30 opacity-60'}`}
      aria-label={`Prêt : ${objet.nom}`}
    >
      <div className="flex items-start gap-3">
        {/* Icône catégorie */}
        <div className="shrink-0 w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center text-green-400">
          <CategoryIcon category={objet.category} className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {cat && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-600/20 text-green-300">
                {cat.emoji} {cat.label}
              </span>
            )}
            {etatInfo && (
              <span className={`text-xs font-medium ${etatInfo.color}`}>● {etatInfo.label}</span>
            )}
            {!objet.disponible && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600/40 text-gray-500">
                Indisponible
              </span>
            )}
          </div>

          <h3 className="font-semibold text-white text-sm leading-snug mb-1">{objet.nom}</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-3">{objet.description}</p>

          {objet.conditions && (
            <p className="text-xs text-amber-400/80 mb-2">⚠️ {objet.conditions}</p>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {dureeInfo && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Prêt {dureeInfo.label}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {objet.quartier ? `${objet.quartier}, ` : ''}
              {objet.territoire}
            </span>
            <span>{dateStr}</span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col gap-1">
          {onToggle && (
            <button
              onClick={() => onToggle(objet.id)}
              className="text-gray-500 hover:text-green-400 transition-colors p-1"
              aria-label={objet.disponible ? 'Marquer indisponible' : 'Marquer disponible'}
              title={objet.disponible ? 'Marquer indisponible' : 'Marquer disponible'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(objet.id)}
              className="text-gray-600 hover:text-red-400 transition-colors p-1"
              aria-label="Supprimer cette annonce"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {objet.disponible && objet.contactHint && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
            <CheckCircle className="w-3 h-3" />
            {objet.contactHint}
          </button>
        </div>
      )}
    </article>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────

export default function PretMateriel() {
  const [objets, setObjets] = useState<ObjetPret[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<PretCategory | 'all'>('all');
  const [filterTerritoire, setFilterTerritoire] = useState('all');
  const [filterDispo, setFilterDispo] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [justDepose, setJustDepose] = useState(false);

  const loadUserObjets = useCallback((): ObjetPret[] => {
    return safeLocalStorage.getJSON<ObjetPret[]>(STORAGE_KEY, []);
  }, []);

  useEffect(() => {
    setObjets([...SAMPLE_OBJETS, ...loadUserObjets()]);
  }, [loadUserObjets]);

  const handleDeposer = (objet: ObjetPret) => {
    const updated = [objet, ...loadUserObjets()];
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setObjets((prev) => [objet, ...prev]);
    setShowForm(false);
    setJustDepose(true);
    setTimeout(() => setJustDepose(false), 4000);
  };

  const handleDelete = (id: string) => {
    const updated = loadUserObjets().filter((o) => o.id !== id);
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setObjets((prev) => prev.filter((o) => o.id !== id));
  };

  const handleToggle = (id: string) => {
    const updatedUser = loadUserObjets().map((o) =>
      o.id === id ? { ...o, disponible: !o.disponible } : o
    );
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    setObjets((prev) => prev.map((o) => (o.id === id ? { ...o, disponible: !o.disponible } : o)));
  };

  const isUserObjet = (id: string) => loadUserObjets().some((o) => o.id === id);

  const filtered = objets.filter((o) => {
    if (filterDispo && !o.disponible) return false;
    if (filterCategory !== 'all' && o.category !== filterCategory) return false;
    if (filterTerritoire !== 'all' && o.territoire !== filterTerritoire) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return o.nom.toLowerCase().includes(q) || o.description.toLowerCase().includes(q);
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
              <RefreshCw className="w-6 h-6 text-green-400" />
              Prêt de Matériel
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Empruntez ou prêtez du matériel à votre communauté — jardinage, cuisine, jouets,
              bricolage…
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Proposer un objet
          </button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700/50">
          {CATEGORIES.slice(0, 3).map((c) => {
            const count = objets.filter((o) => o.category === c.id && o.disponible).length;
            return (
              <div key={c.id} className="text-center">
                <p className="text-xl">{c.emoji}</p>
                <p className="text-sm font-bold text-white">{count}</p>
                <p className="text-xs text-gray-500">{c.label}</p>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Confirmation */}
      {justDepose && (
        <div className="flex items-center gap-2 bg-green-900/30 border border-green-600/40 rounded-xl px-4 py-3">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <p className="text-sm text-green-300">
            Objet publié ! Il est maintenant visible par votre communauté.
          </p>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <GlassCard className="p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Proposer un objet à prêter</h3>
          <DepotForm onDeposer={handleDeposer} onCancel={() => setShowForm(false)} />
        </GlassCard>
      )}

      {/* Filtres catégories */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="Filtrer par catégorie"
      >
        <button
          onClick={() => setFilterCategory('all')}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filterCategory === 'all' ? 'bg-green-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}
        >
          Tout
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterCategory(filterCategory === c.id ? 'all' : c.id)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1 ${filterCategory === c.id ? 'bg-green-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}
          >
            <span>{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* Filtres globaux */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            id="pret-search"
            name="q"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un objet…"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          id="pret-filter-territoire"
          name="filterTerritoire"
          value={filterTerritoire}
          onChange={(e) => setFilterTerritoire(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">Tous les territoires</option>
          {TERRITOIRES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 cursor-pointer">
          <input
            id="pret-filter-dispo"
            name="filterDispo"
            type="checkbox"
            checked={filterDispo}
            onChange={(e) => setFilterDispo(e.target.checked)}
            className="w-4 h-4 rounded accent-green-500"
          />
          <span className="text-sm text-gray-300">Disponibles uniquement</span>
        </label>
      </div>

      <p className="text-xs text-gray-500">
        {filtered.length} objet{filtered.length !== 1 ? 's' : ''} disponible
        {filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Liste */}
      {filtered.length === 0 ? (
        <GlassCard className="py-12 text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">Aucun objet pour ces critères.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-green-400 hover:text-green-300 underline"
          >
            Proposez le premier objet !
          </button>
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((o) => (
            <ObjetCard
              key={o.id}
              objet={o}
              onDelete={isUserObjet(o.id) ? handleDelete : undefined}
              onToggle={isUserObjet(o.id) ? handleToggle : undefined}
            />
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4">
        <p className="text-sm font-semibold text-green-300 mb-2">
          🌱 Pourquoi emprunter plutôt qu'acheter ?
        </p>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>
            • <strong className="text-gray-300">Économie</strong> : évitez d'acheter un objet
            utilisé 2 fois par an
          </li>
          <li>
            • <strong className="text-gray-300">Écologie</strong> : moins de déchets, consommation
            responsable
          </li>
          <li>
            • <strong className="text-gray-300">Solidarité</strong> : renforcer les liens dans votre
            quartier
          </li>
          <li>• Données stockées sur votre appareil — aucune donnée personnelle collectée</li>
        </ul>
      </div>
    </div>
  );
}
