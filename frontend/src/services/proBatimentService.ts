/**
 * proBatimentService.ts
 *
 * Marketplace des professionnels du bâtiment
 *
 * Collection Firestore : pros_batiment
 * Document ProBatiment :
 *   uid              string        Firebase Auth uid
 *   siret            string        SIRET 14 chiffres (validé Luhn)
 *   siren            string        9 premiers chiffres
 *   tva              string        numéro TVA FR calculé
 *   raisonSociale    string        nom légal de l'entreprise
 *   formeJuridique   string        eurl | sarl | micro | ei | ...
 *   gerantPrenom     string
 *   gerantNom        string
 *   email            string
 *   telephone        string
 *   adresse          string
 *   codePostal       string
 *   ville            string
 *   territoire       string        GP | MQ | RE | GF | YT | ...
 *   metiers          string[]      liste des corps de métier
 *   specialites      string[]      spécialités détaillées
 *   description      string        présentation libre
 *   zoneIntervention string[]      villes / zones couvertes
 *   tarifHoraire     number|null   tarif moyen HT (€/h)
 *   certifications   string[]      RGE, Qualibat, label...
 *   assuranceDecen   boolean       assurance décennale obligatoire
 *   anneeCreation    number|null
 *   documents        DocRecord[]   KBIS, identité, assurance...
 *   status           ProBatStatus  pending | verified | rejected | suspended
 *   verifiedAt       Timestamp|null
 *   verifiedBy       string|null   uid admin
 *   adminNote        string|null
 *   plan             ProBatPlan    free | essentiel | premium
 *   planActiveSince  Timestamp|null
 *   commissionRate   number        % commission sur devis (défaut 5)
 *   totalContacts    number        nb de contacts envoyés par clients
 *   createdAt        Timestamp
 *   updatedAt        Timestamp
 *
 * Collection Firestore : contacts_pros_batiment
 * (enregistrement des mises en relation + facturation commission)
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COL_PROS = 'pros_batiment';
const COL_CONTACTS = 'contacts_pros_batiment';

// ── Enumerations ──────────────────────────────────────────────────────────────

export type ProBatStatus = 'pending' | 'verified' | 'rejected' | 'suspended';
export type ProBatPlan = 'free' | 'essentiel' | 'premium';

// ── Corps de métiers — liste exhaustive intérieur + extérieur ─────────────────

/**
 * Catégories de corps de métiers pour l'organisation de l'annuaire.
 */
export type MetierCategorie =
  | 'gros_oeuvre'
  | 'couverture_etancheite'
  | 'facade_exterieur'
  | 'terrassement_vrd'
  | 'cloisons_isolation'
  | 'revetements_sols_murs'
  | 'peinture_decoration'
  | 'menuiserie_interieure'
  | 'menuiserie_exterieure'
  | 'serrurerie_metallerie'
  | 'plomberie_sanitaire'
  | 'electricite_domotique'
  | 'cvc'
  | 'vitrerie_verriere'
  | 'amenagement_exterieur'
  | 'piscine_spa'
  | 'dom_tom_specifique';

export const METIER_CATEGORIE_LABELS: Record<MetierCategorie, string> = {
  gros_oeuvre: '🧱 Gros Œuvre & Structure',
  couverture_etancheite: '🏠 Couverture & Étanchéité',
  facade_exterieur: '🏗️ Façade & Murs Extérieurs',
  terrassement_vrd: '⛏️ Terrassement & VRD',
  cloisons_isolation: '🪟 Cloisons & Isolation',
  revetements_sols_murs: '🟫 Revêtements Sols & Murs',
  peinture_decoration: '🎨 Peinture & Décoration',
  menuiserie_interieure: '🚪 Menuiserie Intérieure',
  menuiserie_exterieure: '🪟 Menuiserie Extérieure',
  serrurerie_metallerie: '🔩 Serrurerie & Métallerie',
  plomberie_sanitaire: '🔧 Plomberie & Sanitaire',
  electricite_domotique: '⚡ Électricité & Domotique',
  cvc: '🌀 Climatisation & Ventilation',
  vitrerie_verriere: '🔆 Vitrerie & Verrière',
  amenagement_exterieur: '🌿 Aménagement Extérieur',
  piscine_spa: '🏊 Piscine & Spa',
  dom_tom_specifique: '🌴 Spécialités DOM-TOM',
};

export type MetierBatiment =
  // ── Gros Œuvre & Structure ──────────────────────────────────────────────────
  | 'maconnerie_generale'
  | 'beton_arme'
  | 'dalle_beton'
  | 'fondations_semelles'
  | 'charpente_bois'
  | 'charpente_metallique'
  | 'ossature_bois'
  | 'demolition_deconstruction'
  // ── Couverture & Étanchéité ─────────────────────────────────────────────────
  | 'couverture_toles'
  | 'couverture_tuiles'
  | 'couverture_bac_acier'
  | 'etancheite_toiture_terrasse'
  | 'zinguerie_gouttiere'
  | 'isolation_toiture'
  // ── Façade & Murs extérieurs ────────────────────────────────────────────────
  | 'ravalement_facade'
  | 'enduit_crepi_facade'
  | 'peinture_facade'
  | 'bardage_exterieur'
  | 'isolation_thermique_exterieure'
  | 'pierre_naturelle_exterieure'
  // ── Terrassement & VRD ──────────────────────────────────────────────────────
  | 'terrassement_gros_oeuvre'
  | 'voirie_reseaux_divers'
  | 'drainage_assainissement_ext'
  | 'nivellement_remblai'
  // ── Cloisons & Isolation ────────────────────────────────────────────────────
  | 'cloison_seche_ba13'
  | 'faux_plafond'
  | 'platrerie_enduit_interieur'
  | 'chape_ragreage'
  | 'isolation_phonique'
  | 'isolation_thermique_interieure'
  // ── Revêtements Sols & Murs ─────────────────────────────────────────────────
  | 'carrelage_sol'
  | 'carrelage_mural_faience'
  | 'parquet_plancher_bois'
  | 'sol_stratifie_pvc_vinyle'
  | 'moquette_revetement_souple'
  | 'pierre_marbre_interieur'
  | 'beton_cire_microcement'
  // ── Peinture & Décoration ───────────────────────────────────────────────────
  | 'peinture_interieure'
  | 'peinture_exterieure'
  | 'revetement_mural_papier_peint'
  | 'enduit_decoratif'
  | 'lasure_vernis_teinture'
  // ── Menuiserie Intérieure ───────────────────────────────────────────────────
  | 'menuiserie_interieure_portes'
  | 'cuisine_amenagee'
  | 'placard_dressing_sur_mesure'
  | 'escalier_interieur'
  | 'amenagement_interieur_sur_mesure'
  // ── Menuiserie Extérieure ───────────────────────────────────────────────────
  | 'fenetres_double_vitrage'
  | 'porte_entree_blindee'
  | 'volets_roulants_battants'
  | 'pergola_veranda'
  | 'brise_soleil_casquette'
  | 'portail_garage'
  // ── Serrurerie & Métallerie ─────────────────────────────────────────────────
  | 'serrurerie_blindage'
  | 'grilles_garde_corps'
  | 'portail_automatique'
  | 'escalier_metallique'
  | 'structure_metallique'
  // ── Plomberie & Sanitaire ───────────────────────────────────────────────────
  | 'plomberie_installation_sanitaire'
  | 'salle_de_bain_renovation'
  | 'chauffe_eau_solaire'
  | 'reseau_eau_potable_eu_ep'
  | 'recuperation_eau_de_pluie'
  | 'assainissement_fosse_microstation'
  // ── Électricité & Domotique ─────────────────────────────────────────────────
  | 'electricite_courant_fort'
  | 'courant_faible_alarme_reseau'
  | 'domotique_maison_connectee'
  | 'tableau_electrique_mise_normes'
  | 'eclairage_led_exterieur'
  | 'photovoltaique_solaire'
  | 'borne_recharge_irve'
  // ── CVC ─────────────────────────────────────────────────────────────────────
  | 'climatisation_split_multisplit'
  | 'ventilation_vmc_vmi'
  | 'pompe_a_chaleur'
  | 'chauffage_installation'
  // ── Vitrerie & Verrière ─────────────────────────────────────────────────────
  | 'vitrerie_remplacement_vitrage'
  | 'verriere_verre_feuillete'
  | 'film_solaire_teinte'
  // ── Aménagement Extérieur ───────────────────────────────────────────────────
  | 'cloture_grillage_gabion'
  | 'dallage_terrasse_exterieure'
  | 'jardinage_entretien_espaces_verts'
  | 'arrosage_automatique'
  | 'paysagiste_amenagement'
  | 'abattage_elagage'
  // ── Piscine & Spa ───────────────────────────────────────────────────────────
  | 'piscine_construction'
  | 'piscine_renovation_entretien'
  | 'spa_jacuzzi_balneo'
  // ── Spécialités DOM-TOM ─────────────────────────────────────────────────────
  | 'protection_cyclonique'
  | 'traitement_humidite_tropicale'
  | 'toiture_parasol_debord'
  | 'ventilation_naturelle_tropicale'
  | 'fondations_anticycloniques';

/** Groupe chaque métier dans sa catégorie pour l'affichage en sections. */
export const METIER_PAR_CATEGORIE: Record<MetierCategorie, MetierBatiment[]> = {
  gros_oeuvre: [
    'maconnerie_generale',
    'beton_arme',
    'dalle_beton',
    'fondations_semelles',
    'charpente_bois',
    'charpente_metallique',
    'ossature_bois',
    'demolition_deconstruction',
  ],
  couverture_etancheite: [
    'couverture_toles',
    'couverture_tuiles',
    'couverture_bac_acier',
    'etancheite_toiture_terrasse',
    'zinguerie_gouttiere',
    'isolation_toiture',
  ],
  facade_exterieur: [
    'ravalement_facade',
    'enduit_crepi_facade',
    'peinture_facade',
    'bardage_exterieur',
    'isolation_thermique_exterieure',
    'pierre_naturelle_exterieure',
  ],
  terrassement_vrd: [
    'terrassement_gros_oeuvre',
    'voirie_reseaux_divers',
    'drainage_assainissement_ext',
    'nivellement_remblai',
  ],
  cloisons_isolation: [
    'cloison_seche_ba13',
    'faux_plafond',
    'platrerie_enduit_interieur',
    'chape_ragreage',
    'isolation_phonique',
    'isolation_thermique_interieure',
  ],
  revetements_sols_murs: [
    'carrelage_sol',
    'carrelage_mural_faience',
    'parquet_plancher_bois',
    'sol_stratifie_pvc_vinyle',
    'moquette_revetement_souple',
    'pierre_marbre_interieur',
    'beton_cire_microcement',
  ],
  peinture_decoration: [
    'peinture_interieure',
    'peinture_exterieure',
    'revetement_mural_papier_peint',
    'enduit_decoratif',
    'lasure_vernis_teinture',
  ],
  menuiserie_interieure: [
    'menuiserie_interieure_portes',
    'cuisine_amenagee',
    'placard_dressing_sur_mesure',
    'escalier_interieur',
    'amenagement_interieur_sur_mesure',
  ],
  menuiserie_exterieure: [
    'fenetres_double_vitrage',
    'porte_entree_blindee',
    'volets_roulants_battants',
    'pergola_veranda',
    'brise_soleil_casquette',
    'portail_garage',
  ],
  serrurerie_metallerie: [
    'serrurerie_blindage',
    'grilles_garde_corps',
    'portail_automatique',
    'escalier_metallique',
    'structure_metallique',
  ],
  plomberie_sanitaire: [
    'plomberie_installation_sanitaire',
    'salle_de_bain_renovation',
    'chauffe_eau_solaire',
    'reseau_eau_potable_eu_ep',
    'recuperation_eau_de_pluie',
    'assainissement_fosse_microstation',
  ],
  electricite_domotique: [
    'electricite_courant_fort',
    'courant_faible_alarme_reseau',
    'domotique_maison_connectee',
    'tableau_electrique_mise_normes',
    'eclairage_led_exterieur',
    'photovoltaique_solaire',
    'borne_recharge_irve',
  ],
  cvc: [
    'climatisation_split_multisplit',
    'ventilation_vmc_vmi',
    'pompe_a_chaleur',
    'chauffage_installation',
  ],
  vitrerie_verriere: [
    'vitrerie_remplacement_vitrage',
    'verriere_verre_feuillete',
    'film_solaire_teinte',
  ],
  amenagement_exterieur: [
    'cloture_grillage_gabion',
    'dallage_terrasse_exterieure',
    'jardinage_entretien_espaces_verts',
    'arrosage_automatique',
    'paysagiste_amenagement',
    'abattage_elagage',
  ],
  piscine_spa: ['piscine_construction', 'piscine_renovation_entretien', 'spa_jacuzzi_balneo'],
  dom_tom_specifique: [
    'protection_cyclonique',
    'traitement_humidite_tropicale',
    'toiture_parasol_debord',
    'ventilation_naturelle_tropicale',
    'fondations_anticycloniques',
  ],
};

// ── Labels ────────────────────────────────────────────────────────────────────

export const METIER_LABELS: Record<MetierBatiment, string> = {
  // Gros Œuvre
  maconnerie_generale: '🧱 Maçonnerie générale',
  beton_arme: '🏗️ Béton armé & coffrage',
  dalle_beton: '🏗️ Dalle béton',
  fondations_semelles: '⚓ Fondations & semelles filantes',
  charpente_bois: '🪵 Charpente bois',
  charpente_metallique: '🔩 Charpente métallique',
  ossature_bois: '🌲 Construction ossature bois',
  demolition_deconstruction: '💥 Démolition & déconstruction',
  // Couverture
  couverture_toles: '🏠 Couverture tôles ondulées',
  couverture_tuiles: '🏠 Couverture tuiles',
  couverture_bac_acier: '🏠 Couverture bac acier / zinc',
  etancheite_toiture_terrasse: '💧 Étanchéité toiture-terrasse',
  zinguerie_gouttiere: '🌧️ Zinguerie & gouttières',
  isolation_toiture: '🌡️ Isolation combles & toiture',
  // Façade
  ravalement_facade: '🏢 Ravalement de façade',
  enduit_crepi_facade: '🪣 Enduit & crépissage façade',
  peinture_facade: '🎨 Peinture façade extérieure',
  bardage_exterieur: '🪵 Bardage bois / PVC / composite',
  isolation_thermique_exterieure: '🌡️ ITE — Isolation thermique extérieure',
  pierre_naturelle_exterieure: '🪨 Pierre naturelle & moellons',
  // Terrassement
  terrassement_gros_oeuvre: '⛏️ Terrassement gros œuvre',
  voirie_reseaux_divers: '🛣️ VRD — Voirie & réseaux divers',
  drainage_assainissement_ext: '💧 Drainage & assainissement',
  nivellement_remblai: '🚜 Nivellement & remblai',
  // Cloisons
  cloison_seche_ba13: '🪟 Cloison sèche BA13 / Placoplâtre',
  faux_plafond: '⬜ Faux-plafond & staff',
  platrerie_enduit_interieur: '🪣 Plâtrerie & enduit intérieur',
  chape_ragreage: '🪵 Chape & ragréage sol',
  isolation_phonique: '🔇 Isolation phonique',
  isolation_thermique_interieure: '🌡️ Isolation thermique intérieure',
  // Revêtements
  carrelage_sol: '🟫 Carrelage sol',
  carrelage_mural_faience: '🟦 Carrelage mural & faïence',
  parquet_plancher_bois: '🟤 Parquet & plancher bois',
  sol_stratifie_pvc_vinyle: '🟨 Sol stratifié, PVC, vinyle',
  moquette_revetement_souple: '🟧 Moquette & revêtement souple',
  pierre_marbre_interieur: '🪨 Marbre, granit, pierre intérieure',
  beton_cire_microcement: '⚫ Béton ciré & micro-ciment',
  // Peinture
  peinture_interieure: '🎨 Peinture intérieure',
  peinture_exterieure: '🖌️ Peinture extérieure & façade',
  revetement_mural_papier_peint: '🗞️ Revêtement mural & papier peint',
  enduit_decoratif: '✨ Enduit décoratif & tadelakt',
  lasure_vernis_teinture: '🪵 Lasure, vernis & teinture',
  // Menuiserie intérieure
  menuiserie_interieure_portes: '🚪 Menuiserie intérieure & portes',
  cuisine_amenagee: '🍳 Cuisine équipée & aménagée',
  placard_dressing_sur_mesure: '👔 Placards & dressing sur mesure',
  escalier_interieur: '🪜 Escalier intérieur bois / métal',
  amenagement_interieur_sur_mesure: '🏠 Aménagement intérieur sur mesure',
  // Menuiserie extérieure
  fenetres_double_vitrage: '🪟 Fenêtres double vitrage ALU/PVC',
  porte_entree_blindee: "🚪 Porte d'entrée & blindage",
  volets_roulants_battants: '🔄 Volets roulants & battants',
  pergola_veranda: '🌿 Pergola, véranda & abri jardin',
  brise_soleil_casquette: '☀️ Brise-soleil & casquette',
  portail_garage: '🚗 Portail & porte de garage',
  // Serrurerie
  serrurerie_blindage: '🔐 Serrurerie & blindage',
  grilles_garde_corps: '🛡️ Grilles & garde-corps',
  portail_automatique: '🤖 Portail automatique',
  escalier_metallique: '🔩 Escalier métallique',
  structure_metallique: '⚙️ Structure métallique',
  // Plomberie
  plomberie_installation_sanitaire: '🔧 Plomberie & installation sanitaire',
  salle_de_bain_renovation: '🛁 Rénovation salle de bain',
  chauffe_eau_solaire: '☀️ Chauffe-eau & thermique solaire',
  reseau_eau_potable_eu_ep: '💧 Réseaux eau potable / EU / EP',
  recuperation_eau_de_pluie: '🌧️ Récupération eau de pluie',
  assainissement_fosse_microstation: '🚽 Assainissement autonome',
  // Électricité
  electricite_courant_fort: '⚡ Électricité courant fort',
  courant_faible_alarme_reseau: '📡 Courant faible, alarme, réseau',
  domotique_maison_connectee: '🏠 Domotique & maison connectée',
  tableau_electrique_mise_normes: '⚡ Tableau électrique & mise aux normes',
  eclairage_led_exterieur: '💡 Éclairage LED & extérieur',
  photovoltaique_solaire: '☀️ Panneaux photovoltaïques (RGE)',
  borne_recharge_irve: '🔌 Borne recharge IRVE',
  // CVC
  climatisation_split_multisplit: '❄️ Climatisation split & multi-split',
  ventilation_vmc_vmi: '🌀 Ventilation VMC / VMI',
  pompe_a_chaleur: '♨️ Pompe à chaleur',
  chauffage_installation: '🔥 Chauffage & installation',
  // Vitrerie
  vitrerie_remplacement_vitrage: '🔆 Vitrerie & remplacement vitrage',
  verriere_verre_feuillete: '🪟 Verrière & verre feuilleté',
  film_solaire_teinte: '🕶️ Film solaire & teinte',
  // Extérieur
  cloture_grillage_gabion: '🚧 Clôture grillage & gabion',
  dallage_terrasse_exterieure: '🟫 Dallage & terrasse extérieure',
  jardinage_entretien_espaces_verts: '🌿 Jardinage & entretien espaces verts',
  arrosage_automatique: '💦 Arrosage automatique',
  paysagiste_amenagement: '🌳 Paysagiste & aménagement paysager',
  abattage_elagage: '🪓 Abattage & élagage',
  // Piscine
  piscine_construction: '🏊 Construction piscine',
  piscine_renovation_entretien: '🏊 Rénovation & entretien piscine',
  spa_jacuzzi_balneo: '💆 Spa, jacuzzi & balnéo',
  // DOM-TOM
  protection_cyclonique: '🌀 Protection cyclonique (volets, persiennes)',
  traitement_humidite_tropicale: '💧 Traitement humidité & moisissures tropicales',
  toiture_parasol_debord: '🏠 Toiture parasol & débord tropical',
  ventilation_naturelle_tropicale: '🌬️ Ventilation naturelle tropicale',
  fondations_anticycloniques: '⚓ Fondations & constructions anticycloniques',
};

/**
 * Correspondance code NAF INSEE → corps de métier(s) MetierBatiment.
 * Utilisé lors de l'import automatique depuis l'API Sirene.
 */
export const NAF_TO_METIERS: Record<string, MetierBatiment[]> = {
  '41.10A': ['maconnerie_generale', 'beton_arme'],
  '41.20A': ['maconnerie_generale', 'beton_arme', 'fondations_semelles'],
  '41.20B': ['maconnerie_generale', 'beton_arme'],
  '43.11Z': ['demolition_deconstruction'],
  '43.12A': ['terrassement_gros_oeuvre', 'nivellement_remblai'],
  '43.12B': ['terrassement_gros_oeuvre', 'voirie_reseaux_divers'],
  '43.13Z': ['fondations_semelles', 'terrassement_gros_oeuvre'],
  '43.21A': ['electricite_courant_fort', 'tableau_electrique_mise_normes'],
  '43.21B': ['electricite_courant_fort', 'courant_faible_alarme_reseau'],
  '43.22A': ['plomberie_installation_sanitaire', 'reseau_eau_potable_eu_ep'],
  '43.22B': ['climatisation_split_multisplit', 'ventilation_vmc_vmi', 'pompe_a_chaleur'],
  '43.29A': [
    'isolation_toiture',
    'isolation_thermique_interieure',
    'isolation_thermique_exterieure',
  ],
  '43.29B': ['isolation_phonique', 'isolation_thermique_interieure'],
  '43.31Z': ['cloison_seche_ba13', 'faux_plafond', 'platrerie_enduit_interieur'],
  '43.32A': ['menuiserie_interieure_portes', 'fenetres_double_vitrage', 'volets_roulants_battants'],
  '43.32B': ['serrurerie_blindage', 'grilles_garde_corps', 'portail_automatique'],
  '43.32C': ['amenagement_interieur_sur_mesure', 'cuisine_amenagee'],
  '43.33Z': ['carrelage_sol', 'carrelage_mural_faience', 'parquet_plancher_bois'],
  '43.34Z': ['peinture_interieure', 'peinture_exterieure', 'vitrerie_remplacement_vitrage'],
  '43.39Z': ['enduit_decoratif', 'revetement_mural_papier_peint', 'beton_cire_microcement'],
  '43.91A': ['charpente_bois', 'ossature_bois'],
  '43.91B': ['couverture_toles', 'couverture_tuiles', 'couverture_bac_acier'],
  '43.99A': ['etancheite_toiture_terrasse'],
  '43.99B': ['structure_metallique', 'charpente_metallique', 'escalier_metallique'],
  '43.99C': ['maconnerie_generale', 'beton_arme', 'dalle_beton', 'fondations_semelles'],
  '43.99D': ['terrassement_gros_oeuvre', 'drainage_assainissement_ext'],
  '43.99E': ['maconnerie_generale'],
  '81.30Z': ['paysagiste_amenagement', 'jardinage_entretien_espaces_verts'],
  '81.10Z': ['dallage_terrasse_exterieure', 'cloture_grillage_gabion'],
};

export const STATUT_LABELS: Record<ProBatStatus, string> = {
  pending: '⏳ En attente de vérification',
  verified: '✅ Professionnel vérifié',
  rejected: '❌ Dossier refusé',
  suspended: '🔒 Compte suspendu',
};

export const STATUT_COLORS: Record<ProBatStatus, string> = {
  pending: 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30',
  verified: 'bg-green-900/30 text-green-300 border-green-500/30',
  rejected: 'bg-red-900/30 text-red-300 border-red-500/30',
  suspended: 'bg-slate-800/60 text-slate-400 border-slate-600/30',
};

export const PLAN_LABELS: Record<ProBatPlan, string> = {
  free: '🆓 Gratuit (1 service)',
  essentiel: '⭐ Essentiel — 14,90 €/mois',
  premium: '💎 Premium — 29,90 €/mois',
};

export const PLAN_FEATURES: Record<ProBatPlan, string[]> = {
  free: [
    '1 service publié',
    "Fiche de base dans l'annuaire",
    'Visible sur la carte',
    'Badge "Pro Bâtiment" en attente de vérification',
  ],
  essentiel: [
    "Jusqu'à 5 services publiés",
    'Badge "Pro Vérifié ✅"',
    "Mise en avant dans l'annuaire",
    'Alertes contacts par email',
    'Commission 5% sur devis accepté',
    'Statistiques de visibilité',
  ],
  premium: [
    'Services illimités',
    'Badge "Premium 💎" prioritaire',
    "En tête de liste dans l'annuaire",
    'Commission réduite 3% sur devis accepté',
    'Analytics avancées',
    'Lien direct vers votre site / WhatsApp',
    'Support prioritaire A KI PRI SA YÉ',
  ],
};

export const COMMISSION_RATES: Record<ProBatPlan, number> = {
  free: 0, // pas de commission → pas de contacts tracés
  essentiel: 5, // 5% sur devis accepté
  premium: 3, // 3% sur devis accepté
};

/** Correspondance type calculateur → corps de métier(s) pertinents (pour "Trouver un Pro"). */
export const CALC_TO_METIERS: Record<string, MetierBatiment[]> = {
  parpaing: ['maconnerie_generale', 'beton_arme', 'fondations_semelles'],
  'dalle-beton': ['dalle_beton', 'beton_arme', 'chape_ragreage'],
  fondations: ['fondations_semelles', 'beton_arme', 'terrassement_gros_oeuvre'],
  chape: ['chape_ragreage', 'carrelage_sol', 'platrerie_enduit_interieur'],
  carrelage: ['carrelage_sol', 'carrelage_mural_faience', 'beton_cire_microcement'],
  peinture: ['peinture_interieure', 'peinture_exterieure', 'enduit_decoratif'],
  enduit: ['enduit_crepi_facade', 'ravalement_facade', 'platrerie_enduit_interieur'],
  toles: ['couverture_toles', 'couverture_bac_acier', 'zinguerie_gouttiere'],
  terrassement: ['terrassement_gros_oeuvre', 'voirie_reseaux_divers', 'nivellement_remblai'],
  cloture: ['cloture_grillage_gabion', 'portail_automatique', 'serrurerie_blindage'],
  'beton-courant': ['beton_arme', 'dalle_beton', 'maconnerie_generale'],
  escalier: ['escalier_interieur', 'escalier_metallique', 'charpente_bois'],
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DocRecord {
  type:
    | 'kbis_insee'
    | 'identite'
    | 'assurance_decennale'
    | 'rge'
    | 'rib'
    | 'attestation_urssaf'
    | 'autre';
  label: string;
  fileName: string;
  uploadedAt: string; // ISO
  status: 'pending' | 'validated' | 'rejected';
}

export interface ProBatimentProfile {
  id: string;
  uid: string;
  siret: string;
  siren: string;
  tva: string;
  raisonSociale: string;
  formeJuridique: string;
  gerantPrenom: string;
  gerantNom: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  territoire: string;
  metiers: MetierBatiment[];
  specialites: string[];
  description: string;
  zoneIntervention: string;
  tarifHoraire: number | null;
  certifications: string[];
  assuranceDecen: boolean;
  anneeCreation: number | null;
  documents: DocRecord[];
  status: ProBatStatus;
  verifiedAt: { seconds: number } | null;
  verifiedBy: string | null;
  adminNote: string | null;
  plan: ProBatPlan;
  planActiveSince: { seconds: number } | null;
  commissionRate: number;
  totalContacts: number;
  createdAt: { seconds: number } | null;
  updatedAt: { seconds: number } | null;
}

export interface ProContactRecord {
  id: string;
  proId: string;
  proName: string;
  clientUserId: string; // 'anonymous' if not connected
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  message: string;
  territory: string;
  metier: MetierBatiment;
  devisEstimate: number | null; // montant devis déclaré
  commissionDue: number | null; // commission plateforme calculée
  status: 'new' | 'contacted' | 'devis_sent' | 'accepted' | 'paid' | 'cancelled';
  createdAt: { seconds: number } | null;
}

// ── SIRET helpers ──────────────────────────────────────────────────────────────

export function validateSiretLuhn(siret: string): boolean {
  const cleaned = siret.replace(/\s/g, '');
  if (!/^\d{14}$/.test(cleaned)) return false;
  let total = 0;
  for (let i = 0; i < 14; i++) {
    let d = parseInt(cleaned[i], 10);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    total += d;
  }
  return total % 10 === 0;
}

export function sirenFromSiret(siret: string): string {
  return siret.replace(/\s/g, '').slice(0, 9);
}

export function tvaFromSiren(siren: string): string {
  const n = parseInt(siren, 10);
  if (isNaN(n)) return '';
  const key = (12 + 3 * (n % 97)) % 97;
  return `FR${String(key).padStart(2, '0')}${siren}`;
}

export function formatSiret(siret: string): string {
  const c = siret.replace(/\s/g, '');
  return `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6, 9)} ${c.slice(9)}`.trim();
}

// ── Write ─────────────────────────────────────────────────────────────────────

export type NewProPayload = Omit<
  ProBatimentProfile,
  | 'id'
  | 'status'
  | 'verifiedAt'
  | 'verifiedBy'
  | 'adminNote'
  | 'totalContacts'
  | 'createdAt'
  | 'updatedAt'
  | 'commissionRate'
  | 'planActiveSince'
>;

export async function registerProBatiment(
  payload: NewProPayload
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!db) return { success: false, error: 'Firebase non disponible' };
  try {
    const ref = await addDoc(collection(db, COL_PROS), {
      ...payload,
      status: 'pending' as ProBatStatus,
      verifiedAt: null,
      verifiedBy: null,
      adminNote: null,
      commissionRate: COMMISSION_RATES[payload.plan],
      totalContacts: 0,
      planActiveSince: payload.plan !== 'free' ? serverTimestamp() : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateProStatus(
  id: string,
  status: ProBatStatus,
  adminNote?: string,
  verifiedByUid?: string
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COL_PROS, id), {
    status,
    adminNote: adminNote ?? null,
    verifiedAt: status === 'verified' ? serverTimestamp() : null,
    verifiedBy: status === 'verified' ? (verifiedByUid ?? null) : null,
    updatedAt: serverTimestamp(),
  });
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getAllProsBatiment(): Promise<ProBatimentProfile[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, COL_PROS), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProBatimentProfile);
  } catch {
    return [];
  }
}

export async function getVerifiedProsByTerritory(territory: string): Promise<ProBatimentProfile[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, COL_PROS),
      where('status', '==', 'verified'),
      where('territoire', '==', territory),
      orderBy('plan', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProBatimentProfile);
  } catch {
    return [];
  }
}

export async function getProById(id: string): Promise<ProBatimentProfile | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, COL_PROS, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as ProBatimentProfile;
  } catch {
    return null;
  }
}

// ── Contact / Commission ──────────────────────────────────────────────────────

export async function recordProContact(
  payload: Omit<ProContactRecord, 'id' | 'status' | 'commissionDue' | 'createdAt'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!db) return { success: false, error: 'Firebase non disponible' };
  try {
    // Retrieve commission rate from pro profile
    const pro = await getProById(payload.proId);
    const rate = pro?.commissionRate ?? 5;
    const commissionDue =
      payload.devisEstimate != null ? Math.round(payload.devisEstimate * rate) / 100 : null;

    const ref = await addDoc(collection(db, COL_CONTACTS), {
      ...payload,
      commissionDue,
      status: 'new' as ProContactRecord['status'],
      createdAt: serverTimestamp(),
    });

    // Increment contact counter on pro profile
    if (pro) {
      await updateDoc(doc(db, COL_PROS, payload.proId), {
        totalContacts: increment(1),
      });
    }

    return { success: true, id: ref.id };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getAllContacts(): Promise<ProContactRecord[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, COL_CONTACTS), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProContactRecord);
  } catch {
    return [];
  }
}
