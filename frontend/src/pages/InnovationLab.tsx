/**
 * InnovationLab — Feuille de route des innovations suggérées
 *
 * Présente 12 idées d'évolution innovantes pour la plateforme A KI PRI SA YÉ,
 * classées par impact et faisabilité, avec vote citoyen.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES, INNOVATION_IMAGES } from '../config/imageAssets';

// ─── Data ──────────────────────────────────────────────────────────────────────

type Phase = 'now' | 'soon' | 'later';

interface Innovation {
  id: string;
  emoji: string;
  titre: string;
  description: string;
  detail: string;
  phase: Phase;
  impact: 'high' | 'medium';
  tags: string[];
  accentColor: string;
  route?: string;  // live route if already implemented
}

const INNOVATIONS: Innovation[] = [
  {
    id: 'chatbot',
    emoji: '🤖',
    titre: 'Assistant IA conversationnel "Demandez à AKI"',
    description: 'Posez vos questions en langage naturel : "Où est le lait le moins cher cette semaine à Fort-de-France ?"',
    detail: 'Un chatbot intégré à la plateforme, entraîné sur les données de l\'observatoire citoyen, répond aux questions sur les prix, les territoires et les droits des consommateurs en temps réel. Basé sur RAG (Retrieval-Augmented Generation) sur notre base de données.',
    phase: 'soon',
    impact: 'high',
    tags: ['IA', 'Chat', 'Prix', 'Accessibilité'],
    accentColor: '#6366f1',
  },
  {
    id: 'alertes',
    emoji: '🔔',
    titre: 'Alertes prix intelligentes & personnalisées',
    description: 'Soyez notifié automatiquement quand un produit de votre liste dépasse un seuil ou chute brusquement.',
    detail: 'Système de push notifications (PWA) ou email hebdomadaire personnalisé. Détection automatique des anomalies de prix (+30% en 7 jours = alerte immédiate). Intégration avec le comparateur de panier existant.',
    phase: 'soon',
    impact: 'high',
    tags: ['Notifications', 'IA', 'Panier'],
    accentColor: '#f59e0b',
  },
  {
    id: 'scan-ia',
    emoji: '📸',
    titre: 'Scan IA des étiquettes — zéro friction',
    description: 'Pointez votre téléphone sur n\'importe quelle étiquette de prix : l\'IA lit, compare et alerte en 2 secondes.',
    detail: 'Amélioration de l\'OCR existant avec un modèle de vision (GPT-4o Vision ou PaddleOCR) pour une reconnaissance parfaite même sur étiquettes froissées, floutées ou en angle. Comparaison instantanée inter-territoire au moment du scan.',
    phase: 'now',
    impact: 'high',
    tags: ['OCR', 'IA Vision', 'Mobile', 'UX'],
    accentColor: '#22c55e',
    route: '/scan-ocr',
    emoji: '📈',
    titre: 'IA prédictive des prix — "Acheter maintenant ou attendre ?"',
    description: 'Prédiction de l\'évolution des prix sur 4-8 semaines basée sur les données historiques et les indicateurs macro.',
    detail: 'Modèle de time-series (Prophet ou LSTM) entraîné sur les snapshots observatoire + données inflation mondiale (pétrole, fret maritime, météo tropicale pour les DCP saisonniers). Affichage : "Ce produit devrait baisser dans 3 semaines — probabilité 74 %".',
    phase: 'soon',
    impact: 'high',
    tags: ['Prédiction', 'ML', 'Time-series'],
    accentColor: '#3b82f6',
  },
  {
    id: 'bot-whatsapp',
    emoji: '💬',
    titre: 'Bot WhatsApp / Telegram',
    description: '"C\'est combien le Nutella à Carrefour Martinique ?" — directement dans votre messagerie.',
    detail: 'Bot accessible via WhatsApp Business API ou Telegram Bot API. Commandes vocales optionnelles via Whisper API. Particulièrement adapté aux populations ayant une fracture numérique avec les apps web. Signalement de prix par photo possible.',
    phase: 'later',
    impact: 'high',
    tags: ['WhatsApp', 'Telegram', 'Accessibilité', 'Bot'],
    accentColor: '#10b981',
  },
  {
    id: 'heatmap',
    emoji: '🗺️',
    titre: 'Carte thermique des prix',
    description: 'Visualisez sur une carte les zones les plus chères par catégorie de produit — par commune, par zone urbaine.',
    detail: 'Heatmap Leaflet superposée à la carte des magasins existante. Gradient de couleur (vert = bon marché, rouge = cher) calculé sur les relevés géolocalisés de l\'observatoire. Filtrable par catégorie, par date, par territoire.',
    phase: 'soon',
    impact: 'medium',
    tags: ['Carte', 'Visualisation', 'Géolocalisation'],
    accentColor: '#0ea5e9',
  },
  {
    id: 'achats-groupes',
    emoji: '🤝',
    titre: 'Groupements d\'achats citoyens',
    description: 'Rejoignez ou créez un groupe pour négocier collectivement de meilleurs prix auprès des grossistes et importateurs.',
    detail: 'Marketplace citoyenne permettant de constituer des commandes groupées. Système de vote pour choisir les produits prioritaires. Notification automatique quand le seuil de commande est atteint. Lien direct avec les distributeurs DOM partenaires.',
    phase: 'later',
    impact: 'high',
    tags: ['Communauté', 'Négociation', 'Marketplace'],
    accentColor: '#f97316',
  },
  {
    id: 'api-ouverte',
    emoji: '🔗',
    titre: 'API publique ouverte pour chercheurs & journalistes',
    description: 'Permettre aux économistes, journalistes et ONG d\'accéder aux données pour des analyses indépendantes.',
    detail: 'API REST documentée (OpenAPI 3.0) avec authentification par token. Endpoints : prix par EAN, évolution temporelle, comparaisons territoire. Quotas gratuits pour la recherche académique. Webhook temps réel pour les partenaires institutionnels (OPMR, INSEE).',
    phase: 'later',
    impact: 'medium',
    tags: ['API', 'Open Data', 'Recherche', 'Transparence'],
    accentColor: '#8b5cf6',
  },
  {
    id: 'extension',
    emoji: '🌐',
    titre: 'Extension navigateur — compare en ligne',
    description: 'Quand vous achetez sur Amazon, Cdiscount ou un site de livraison DOM, l\'extension affiche le prix local et le surcoût vs métropole.',
    detail: 'Extension Chrome/Firefox/Safari. Détection automatique du produit via EAN ou nom. Affichage discret (badge) du prix observatoire correspondant. Signalement de prix online possible. Impact majeur pour les achats e-commerce vers les DOM.',
    phase: 'later',
    impact: 'high',
    tags: ['Extension', 'E-commerce', 'Navigateur'],
    accentColor: '#ec4899',
  },
  {
    id: 'score-enseigne',
    emoji: '⭐',
    titre: 'Score citoyen multi-critères des enseignes',
    description: 'Prix, qualité produits, accessibilité, service — un score transparent calculé par les citoyens.',
    detail: 'Système d\'évaluation vérifié : seuls les utilisateurs ayant scanné un reçu dans le magasin peuvent voter. Score composite = 40% prix (données observatoire) + 30% qualité produits + 20% service + 10% accessibilité PMR. Droit de réponse officielle pour les enseignes.',
    phase: 'soon',
    impact: 'medium',
    tags: ['Avis', 'Score', 'Enseignes', 'Communauté'],
    accentColor: '#fbbf24',
  },
  {
    id: 'dashboard-mairie',
    emoji: '🏛️',
    titre: 'Tableau de bord public pour mairies & CCAS',
    description: 'Un écran d\'information automatique pour les halls de mairie, CCAS et centres sociaux — mis à jour en temps réel.',
    detail: 'Mode kiosque (plein écran, pas de menu) affichant les prix du marché local, les alertes de la semaine et le comparatif enseignes. Compatible TV connectée, tablette murale. Mise à jour automatique via WebSocket. Gratuit pour les collectivités.',
    phase: 'later',
    impact: 'medium',
    tags: ['B2G', 'Mairie', 'Affichage public', 'Kiosque'],
    accentColor: '#64748b',
  },
  {
    id: 'calculateur-octroi',
    emoji: '🧮',
    titre: 'Calculateur pédagogique de l\'octroi de mer',
    description: 'Saisissez un produit → l\'outil décompose son prix : fret + octroi de mer + marge + TVA = prix final.',
    detail: 'Outil interactif et pédagogique qui décompose un prix en ses composantes structurelles. Basé sur les taux officiels DGDDI + données Armateurs de France. Objectif : rendre visible ce qui est invisible dans le ticket de caisse. Partage sur réseaux sociaux.',
    phase: 'now',
    impact: 'medium',
    tags: ['Pédagogie', 'Octroi de mer', 'Transparence', 'Outil'],
    accentColor: '#a855f7',
    route: '/calculateur-octroi',
    emoji: '📄',
    titre: 'Rapport citoyen PDF exportable',
    description: 'Générez en un clic un rapport PDF personnalisé sur les prix de votre territoire, à partager avec élus, associations ou médias.',
    detail: 'Export PDF via la bibliothèque jsPDF ou html2canvas : inclut graphiques d\'évolution, comparatif inter-enseignes, analyse IA du mois, sources officielles. Idéal pour les associations de consommateurs, les OPMR et les journalistes locaux. Un outil de plaidoyer citoyen.',
    phase: 'soon',
    impact: 'high',
    tags: ['PDF', 'Export', 'Plaidoyer', 'Associations'],
    accentColor: '#f43f5e',
    route: '/rapport-citoyen',
    emoji: '🎖️',
    titre: 'Programme de fidélité citoyen',
    description: 'Gagnez des badges et des points en contribuant à l\'observatoire : chaque scan vérifié compte.',
    detail: 'Gamification complète : badges territoire, streak de contributions, classement mensuel des top-contributeurs, certificat numérique de "Gardien des prix". Les contributeurs les plus actifs reçoivent un accès prioritaire aux nouvelles fonctionnalités et un impact visible sur les données publiques.',
    phase: 'soon',
    impact: 'medium',
    tags: ['Gamification', 'Communauté', 'Engagement', 'Badges'],
    accentColor: '#f59e0b',
  },
  {
    id: 'mode-offline',
    emoji: '📶',
    titre: 'Mode hors-ligne complet (PWA améliorée)',
    description: 'Consultez les prix et scannez des produits même sans connexion internet — crucial dans les zones rurales des DOM.',
    detail: 'Service Worker avancé avec stratégie cache-first pour les données de prix locales. Synchronisation différée des scans OCR quand la connexion revient. Stockage IndexedDB local des 500 produits les plus consultés par territoire. Impact fort pour les zones blanches de Guyane, Mayotte et la Réunion (hauts).',
    phase: 'soon',
    impact: 'high',
    tags: ['PWA', 'Offline', 'Accessibilité', 'Zones rurales'],
    accentColor: '#0ea5e9',
    route: '/dlc-antigaspi',
    emoji: '🏛️',
    titre: 'Intégration officielle avec les OPMR',
    description: 'Partage automatique des relevés citoyens avec les Observatoires des Prix, Marges et Revenus de chaque territoire.',
    detail: 'API bidirectionnelle avec les OPMR (Guadeloupe, Martinique, Réunion, etc.) : nos données citoyennes enrichissent leurs rapports officiels ; leurs prix de référence valident nos relevés. Publication conjointe du bulletin mensuel. Reconnaissance institutionnelle de la plateforme.',
    phase: 'later',
    impact: 'high',
    tags: ['OPMR', 'Institutionnel', 'API', 'Officiel'],
    accentColor: '#64748b',
  },
  {
    id: 'analyse-ticket',
    emoji: '🧾',
    titre: 'Analyse IA complète du ticket de caisse',
    description: 'Photographiez votre ticket complet — l\'IA décompose chaque ligne, identifie les produits chers et suggère des substituts moins chers.',
    detail: 'OCR multi-lignes sur ticket entier (GPT-4o Vision ou Tesseract). Pour chaque produit détecté : prix, EAN si lisible, comparaison inter-enseignes, suggestion de substitut équivalent moins cher. Calcul automatique du "panier alternatif optimal" avec économie totale estimée.',
    phase: 'now',
    impact: 'high',
    tags: ['OCR', 'Ticket', 'IA Vision', 'Économies'],
    accentColor: '#10b981',
    route: '/scan-ocr',
  },
  {
    id: 'podcast-ia',
    emoji: '🎙️',
    titre: 'Podcast IA hebdomadaire — "La Voix des Prix"',
    description: 'La lettre hebdomadaire transformée en podcast audio de 5 minutes, générée automatiquement en créole et en français.',
    detail: 'Pipeline complet sans intervention humaine : lettre IA → synthèse vocale (OpenAI TTS ou ElevenLabs) → fichier MP3 publié automatiquement → RSS podcast compatible Spotify, Apple Podcasts, Deezer. Versions bilingues français/créole martiniquais ou guadeloupéen. Idéal pour les personnes peu à l\'aise avec la lecture ou en déplacement.',
    phase: 'soon',
    impact: 'high',
    tags: ['Audio', 'Podcast', 'Créole', 'Accessibilité', 'TTS'],
    accentColor: '#f43f5e',
  },
  {
    id: 'medicaments',
    emoji: '💊',
    titre: 'Comparateur de prix des médicaments',
    description: 'Les médicaments coûtent jusqu\'à 40 % plus cher dans les DOM. Comparez les prix des pharmacies par territoire en temps réel.',
    detail: 'Intégration avec la base de données publique de l\'ANSM (Agence Nationale de Sécurité du Médicament) et du Comité Économique des Produits de Santé. Comparaison des génériques vs princeps. Alerte automatique quand un médicament est disponible moins cher dans une pharmacie voisine. Source officielle : data.ansm.sante.fr.',
    phase: 'soon',
    impact: 'high',
    tags: ['Santé', 'Médicaments', 'ANSM', 'Pharmacie'],
    accentColor: '#06b6d4',
    route: '/analyse-nutri',
    emoji: '⛽',
    titre: 'Baromètre carburant DOM — prix à la pompe en temps réel',
    description: 'Le prix de l\'essence et du gasoil est réglementé dans certains DOM mais varie en pratique. Suivez et comparez.',
    detail: 'Intégration avec l\'API gouvernementale des prix des carburants (prix-carburants.gouv.fr). Carte interactive des stations-service les moins chères par territoire. Alerte SMS/push quand un prix passe sous un seuil. Comparaison avec le prix métropolitain et calcul du surcoût annuel pour une famille type DOM.',
    phase: 'now',
    impact: 'high',
    tags: ['Carburant', 'Transport', 'API gov', 'Carte'],
    accentColor: '#f59e0b',
    route: '/comparateur-carburants',
    emoji: '🗣️',
    titre: 'Interface en langues régionales — créole, tahitien, kanak',
    description: 'La plateforme traduite en créole martiniquais, guadeloupéen, réunionnais, tahitien et langues kanak pour toucher tous les citoyens.',
    detail: 'Internationalisation (i18n) complète via react-i18next. Traductions humaines validées par des locuteurs natifs + IA pour les mises à jour automatiques. Touche des populations qui se sentent exclues des outils numériques en français standard. Partenariat possible avec l\'Académie Créole de Martinique et l\'Académie des Langues Kanak.',
    phase: 'later',
    impact: 'high',
    tags: ['i18n', 'Créole', 'Tahitien', 'Inclusion', 'Langues'],
    accentColor: '#8b5cf6',
  },
  {
    id: 'impact-carbone',
    emoji: '🌿',
    titre: 'Empreinte carbone du panier de courses',
    description: 'Pour chaque produit importé par bateau, affichez son bilan carbone. Favorisez les productions locales DOM.',
    detail: 'Base de données carbone (Agrybalise / Base Carbone ADEME) croisée avec l\'origine des produits (étiquetage + EAN). Calcul de l\'empreinte CO₂ du panier complet en kg équivalent CO₂. Badge "Produit local" pour les produits fabriqués dans le territoire. Score éco-citoyen mensuel. Partenariat avec les chambres d\'agriculture DOM.',
    phase: 'later',
    impact: 'medium',
    tags: ['Écologie', 'Carbone', 'ADEME', 'Local', 'Durabilité'],
    accentColor: '#22c55e',
  },
  {
    id: 'loyers-immobilier',
    emoji: '🏠',
    titre: 'Observatoire des loyers & coût du logement',
    description: 'Le logement représente 30-40 % du budget des ménages DOM. Comparez les loyers et charges entre communes et territoires.',
    detail: 'Collecte citoyenne des loyers (anonymisée) + données ADIL (Agences Départementales d\'Information sur le Logement). Carte de chaleur des loyers par commune. Calcul du "reste pour vivre" après logement selon territoire et revenu médian. Comparatif DOM vs métropole des charges (eau, électricité, internet). Source : observatoire-des-loyers.adil.org.',
    phase: 'later',
    impact: 'high',
    tags: ['Logement', 'Loyers', 'ADIL', 'Budget', 'Pouvoir d\'achat'],
    accentColor: '#0ea5e9',
  },
  {
    id: 'widget-embarquable',
    emoji: '🔌',
    titre: 'Widget embarquable pour associations & médias',
    description: 'Un petit composant que n\'importe quelle association ou journal local peut intégrer sur son site pour afficher les prix du marché.',
    detail: 'Widget JavaScript < 10 Ko, intégrable via une simple balise <script>. Configure par territoire, par catégorie de produit et par thème (clair/sombre). API REST publique en arrière-plan. Mis à jour automatiquement. Les journaux locaux, les syndicats de consommateurs et les mairies peuvent l\'afficher en temps réel. Marque blanche possible.',
    phase: 'soon',
    impact: 'medium',
    tags: ['Widget', 'Embed', 'API', 'Médias', 'Associations'],
    accentColor: '#6366f1',
  },
  {
    id: 'budget-simulateur',
    emoji: '🧮',
    titre: 'Simulateur budgétaire familial DOM',
    description: 'Saisissez votre composition familiale et votre salaire : l\'outil calcule ce qu\'il vous reste réellement après toutes les dépenses contraintes.',
    detail: 'Simulateur interactif : revenus (salaire, APL, allocs) − dépenses contraintes (loyer médian local, alimentation panier type, carburant, assurances, factures) = reste pour vivre. Comparaison avec le territoire voisin et la métropole. Identification des postes où économiser. Lien direct vers le comparateur de prix pour les produits alimentaires. Sources : CAF, INSEE, IEDOM.',
    phase: 'soon',
    impact: 'high',
    tags: ['Budget', 'Famille', 'Simulateur', 'CAF', 'Pouvoir d\'achat'],
    accentColor: '#f97316',
    route: '/simulateur-budget',
    emoji: '🚨',
    titre: 'Alerte rupture de stock & pénuries',
    description: 'Signalement citoyen des ruptures de stock anormales (notamment produits de première nécessité) avec carte temps réel.',
    detail: 'Formulaire rapide de signalement de rupture (produit, magasin, date). Carte en temps réel des pénuries par territoire. Détection automatique des patterns anormaux (si 5+ signalements du même produit dans 24h → alerte). Notification aux élus et OPMR concernés. Particulièrement pertinent pour les DOM en période cyclonique ou de grève portuaire.',
    phase: 'soon',
    impact: 'high',
    tags: ['Rupture', 'Pénurie', 'Alerte', 'Signalement', 'Crise'],
    accentColor: '#ef4444',
    route: '/alertes-rupture',
    emoji: '⚖️',
    titre: 'Rédacteur IA de lettres de réclamation',
    description: 'Vous avez payé trop cher ? L\'IA rédige automatiquement votre lettre de réclamation officielle à envoyer à l\'enseigne ou à la DGCCRF.',
    detail: 'À partir du produit, du prix constaté et du prix de référence observatoire, l\'IA génère une lettre de réclamation formelle prête à envoyer. Modèles pré-remplis pour : surcharge de prix injustifiée, publicité mensongère sur promotion, non-respect du bouclier qualité-prix. Export PDF + envoi email intégré. Lien direct vers dgccrf.fr pour signalement officiel.',
    phase: 'later',
    impact: 'medium',
    tags: ['IA', 'Réclamation', 'DGCCRF', 'Droit', 'Consommateur'],
    accentColor: '#a855f7',
    route: '/ia-reclamation',
  },
];

const PHASE_LABELS: Record<Phase, { label: string; color: string; bg: string; border: string }> = {
  now:   { label: '🚀 Priorité haute',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)'  },
  soon:  { label: '📅 Prochaine étape', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' },
  later: { label: '🔭 Vision long terme', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)' },
};

// ─── Component ─────────────────────────────────────────────────────────────────

function InnovationCard({ item, votes, onVote }: {
  item: Innovation;
  votes: Record<string, number>;
  onVote: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const phase = PHASE_LABELS[item.phase];

  return (
    <div style={{
      padding: '1.1rem 1.2rem',
      background: 'rgba(15,23,42,0.75)',
      border: `1px solid ${item.accentColor}33`,
      borderLeft: `3px solid ${item.accentColor}`,
      borderRadius: 14,
      transition: 'border-color 0.2s ease',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        {INNOVATION_IMAGES[item.id] ? (
          <img
            src={INNOVATION_IMAGES[item.id]}
            alt={item.titre}
            style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10, flexShrink: 0, border: `1px solid ${item.accentColor}33` }}
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span style={{ fontSize: '1.6rem', flexShrink: 0, lineHeight: 1 }}>{item.emoji}</span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#e2e8f0', lineHeight: 1.3 }}>{item.titre}</h3>
            <span style={{ ...{ padding: '2px 8px', borderRadius: 20, fontSize: '0.62rem', fontWeight: 700, whiteSpace: 'nowrap' }, color: phase.color, background: phase.bg, border: `1px solid ${phase.border}` }}>
              {phase.label}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.55 }}>{item.description}</p>
        </div>

        {/* Vote button */}
        <button
          onClick={() => onVote(item.id)}
          aria-label={`Voter pour ${item.titre}`}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
            padding: '0.45rem 0.65rem', borderRadius: 10, flexShrink: 0,
            background: votes[item.id] ? `${item.accentColor}22` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${votes[item.id] ? `${item.accentColor}55` : 'rgba(148,163,184,0.15)'}`,
            color: votes[item.id] ? item.accentColor : '#475569',
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '0.9rem' }}>{votes[item.id] ? '❤️' : '🤍'}</span>
          <span style={{ fontSize: '0.62rem', fontWeight: 700 }}>{votes[item.id] || 0}</span>
        </button>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.6rem', alignItems: 'center' }}>
        {item.tags.map((tag) => (
          <span key={tag} style={{ fontSize: '0.62rem', color: '#475569', padding: '1px 7px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
            {tag}
          </span>
        ))}
        {item.route && (
          <Link to={item.route}
            style={{ marginLeft: '0.25rem', fontSize: '0.65rem', padding: '2px 9px', borderRadius: 20, background: `${item.accentColor}18`, border: `1px solid ${item.accentColor}44`, color: item.accentColor, textDecoration: 'none', fontWeight: 700 }}>
            ✅ Accéder →
          </Link>
        )}
      </div>

      {/* Expand detail */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{ marginTop: '0.65rem', background: 'none', border: 'none', cursor: 'pointer', color: item.accentColor, fontSize: '0.72rem', fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
      >
        {expanded ? '▲ Réduire' : '▼ Voir le détail technique'}
      </button>
      {expanded && (
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.65, padding: '0.7rem 0.9rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(148,163,184,0.08)' }}>
          {item.detail}
        </p>
      )}
    </div>
  );
}

export default function InnovationLab() {
  const [filter, setFilter] = useState<Phase | 'all'>('all');
  const [votes, setVotes] = useState<Record<string, number>>({});

  function handleVote(id: string) {
    setVotes((prev) => ({
      ...prev,
      [id]: prev[id] ? 0 : 1,
    }));
  }

  const filtered = filter === 'all' ? INNOVATIONS : INNOVATIONS.filter((i) => i.phase === filter);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '1.5rem 1rem 3rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Back */}
        <div style={{ marginBottom: '1rem' }}>
          <Link to="/" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}>← Retour à l'accueil</Link>
        </div>

        <HeroImage
          src={PAGE_HERO_IMAGES.innovationLab}
          alt="Innovation Lab"
          gradient="from-slate-950 to-indigo-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            🔬 Innovation Lab
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
            Les prochaines évolutions de la plateforme — votez pour vos priorités
          </p>
        </HeroImage>

        {/* Phase filters */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {([['all', '✨ Tout voir', '#94a3b8'], ['now', '🚀 Priorité', '#22c55e'], ['soon', '📅 Bientôt', '#fbbf24'], ['later', '🔭 Vision', '#60a5fa']] as const).map(([key, label, color]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '0.4rem 1rem', borderRadius: 20, border: `1.5px solid ${filter === key ? color : 'rgba(148,163,184,0.2)'}`,
                background: filter === key ? `${color}18` : 'transparent',
                color: filter === key ? color : '#64748b', fontSize: '0.78rem', fontWeight: filter === key ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filtered.map((item) => (
            <InnovationCard key={item.id} item={item} votes={votes} onVote={handleVote} />
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: '2rem', padding: '1.25rem 1.5rem', borderRadius: 16, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.65 }}>
            💡 Vous avez une autre idée d'innovation ? Soumettez-la directement à l'équipe !
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/suggestions" style={{ padding: '0.5rem 1.2rem', borderRadius: 8, background: 'rgba(99,102,241,0.8)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>
              ✉️ Suggérer une innovation
            </Link>
            <Link to="/analyse-concurrence" style={{ padding: '0.5rem 1.2rem', borderRadius: 8, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.35)', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>
              🔭 Analyse concurrentielle
            </Link>
            <Link to="/roadmap" style={{ padding: '0.5rem 1.2rem', borderRadius: 8, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
              📋 Roadmap complète
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
