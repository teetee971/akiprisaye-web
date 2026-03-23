import type { NewsItem } from '../types/news';

export const serverNewsFallback: NewsItem[] = [
  {
    id: 'fallback-dossier-gp-000', type: 'dossiers', territory: 'gp', title: 'Enquête : groupe GBH et impact sur les prix en Guadeloupe',
    summary: 'Dossier de synthèse sur les écarts de prix, la structure du marché local et les points de vigilance pour les consommateurs.',
    source_name: 'Observatoire AKPSY', source_url: 'https://akiprisaye.fr/methodologie', canonical_url: 'https://akiprisaye.fr/dossiers/enquete-gbh-guadeloupe',
    published_at: '2026-01-22T09:00:00.000Z', impact: 'fort', isSponsored: false, confidence: 'partner', verified: true,
    tags: ['enquête', 'gbh', 'vie-chère'], evidence: { scope: 'Guadeloupe', confidence: 'partner' },
  },
  {
    id: 'fallback-rappel-gp-001', type: 'rappels', territory: 'gp', title: 'Rappel conso : lot de sardines en conserve',
    summary: 'Présence possible d’histamine au-delà du seuil réglementaire. Vérifiez le lot avant consommation.',
    source_name: 'RappelConso', source_url: 'https://rappel.conso.gouv.fr', canonical_url: 'https://rappel.conso.gouv.fr/fiche-rappel/12345/Interne',
    published_at: '2026-01-21T08:30:00.000Z', impact: 'fort', isSponsored: false, confidence: 'official', verified: true,
    tags: ['alimentaire', 'sécurité', 'rappel'], evidence: { lot: 'LC2501', confidence: 'official' },
  },
  {
    id: 'fallback-bonsplans-mq-002', type: 'bons_plans', territory: 'mq', title: 'Pack éco couches bébé : -22% relevé sur 7 jours',
    summary: 'Promotion observée avec seuil de prix validé sur tickets et relevés magasin.',
    source_name: 'Observatoire AKPSY', source_url: 'https://akiprisaye.fr/methodologie', canonical_url: 'https://akiprisaye.fr/dossiers/promos-couches',
    published_at: '2026-01-20T10:15:00.000Z', impact: 'moyen', isSponsored: false, confidence: 'partner', verified: true,
    expires_at: '2026-01-30T23:59:59.000Z', tags: ['bébé', 'promotion', 'panier'], evidence: { deltaPct: -22, periodDays: 7, confidence: 'partner' },
  },
  {
    id: 'fallback-reg-fr-003', type: 'reglementaire', territory: 'fr', title: 'Mise à jour du barème d’aides énergie 2026',
    summary: 'Nouveaux seuils d’éligibilité pour les ménages modestes annoncés au Journal officiel.',
    source_name: 'Service-Public.fr', source_url: 'https://www.service-public.fr', canonical_url: 'https://www.service-public.fr/particuliers/actualites/A17001',
    published_at: '2026-01-19T07:00:00.000Z', impact: 'fort', isSponsored: false, confidence: 'official', verified: true,
  },
  { id: 'fallback-indice-all-004', type: 'indice', territory: 'all', title: 'Indice panier anti-inflation : légère détente hebdomadaire', summary: 'Baisse moyenne de 1,8% sur un panier de 40 références comparables.', source_name: 'A KI PRI SA YÉ Data', source_url: 'https://akiprisaye.fr/methodologie', published_at: '2026-01-18T16:00:00.000Z', impact: 'info', isSponsored: false, confidence: 'partner', verified: true, tags: ['indice', 'inflation', 'panier'], evidence: { deltaPct: -1.8, periodDays: 7, confidence: 'partner' } },
  { id: 'fallback-dossier-re-005', type: 'dossiers', territory: 're', title: 'Dossier : comment vérifier une vraie promo ?', summary: 'Guide pratique pour distinguer une baisse réelle d’un affichage marketing trompeur.', source_name: 'INC', source_url: 'https://www.inc-conso.fr', canonical_url: 'https://www.inc-conso.fr/content/promotions-comment-les-verifier', published_at: '2026-01-17T13:45:00.000Z', impact: 'info', isSponsored: false, confidence: 'press', verified: true, tags: ['dossier', 'comparatif', 'consommation'] },
  { id: 'fallback-press-gf-006', type: 'press', territory: 'gf', title: 'Vie chère : suivi des écarts de prix import/local', summary: 'Analyse presse basée sur les dernières publications économiques régionales.', source_name: 'FranceInfo', source_url: 'https://www.francetvinfo.fr', canonical_url: 'https://www.francetvinfo.fr/economie/vie-chere-guyane_000001.html', published_at: '2026-01-16T10:00:00.000Z', impact: 'moyen', isSponsored: false, confidence: 'press', verified: false, tags: ['presse', 'écarts-prix'] },
  { id: 'fallback-bonsplans-yt-007', type: 'bons_plans', territory: 'yt', title: 'Panier hygiène : offre locale à confirmer', summary: 'Signalement utilisateur reçu, en cours de vérification par recoupement de tickets.', source_name: 'Communauté AKPSY', source_url: 'https://akiprisaye.fr/contribuer', published_at: '2026-01-15T09:00:00.000Z', impact: 'info', isSponsored: false, confidence: 'user', verified: false, expires_at: '2026-01-22T23:59:59.000Z', tags: ['signalement', 'à confirmer'] },
  { id: 'fallback-reg-gp-008', type: 'reglementaire', territory: 'gp', title: 'Prix carburants : publication préfectorale mensuelle', summary: 'Mise à jour des prix maximums administrés pour le mois en cours.', source_name: 'Préfecture de Guadeloupe', source_url: 'https://www.guadeloupe.gouv.fr', canonical_url: 'https://www.guadeloupe.gouv.fr/Actions-de-l-Etat/Economie-et-emploi/Prix-des-carburants', published_at: '2026-01-14T12:00:00.000Z', impact: 'moyen', isSponsored: false, confidence: 'official', verified: true, tags: ['carburants', 'préfecture'] },
  { id: 'fallback-rappel-fr-009', type: 'rappels', territory: 'fr', title: 'Rappel produit ménager : défaut d’étiquetage', summary: 'Informations de sécurité incomplètes sur des lots distribués nationalement.', source_name: 'DGCCRF', source_url: 'https://www.economie.gouv.fr/dgccrf', canonical_url: 'https://www.economie.gouv.fr/dgccrf/rappel-produit-menager-2026', published_at: '2026-01-13T11:20:00.000Z', impact: 'fort', isSponsored: false, confidence: 'official', verified: true, tags: ['dgccrf', 'sécurité'] },
  { id: 'fallback-dossier-mq-010', type: 'dossiers', territory: 'mq', title: 'Comparatif : 5 enseignes sur un panier de base', summary: 'Étude comparative des prix moyens en Martinique sur produits essentiels.', source_name: 'UFC-Que Choisir', source_url: 'https://www.quechoisir.org', canonical_url: 'https://www.quechoisir.org/comparatif-panier-martinique-n000000/', published_at: '2026-01-12T18:00:00.000Z', impact: 'info', isSponsored: false, confidence: 'press', verified: false, tags: ['comparatif', 'panier'] },
];
