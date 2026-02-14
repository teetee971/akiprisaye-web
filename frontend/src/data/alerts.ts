import type { Alert } from '../types/market';

export const alertsDataset: Alert[] = [
  {
    id: 'alert-gp-logistique-1',
    severity: 'critical',
    territory: 'gp',
    title: 'Tension logistique sur les produits frais',
    message: 'Retards d’acheminement signalés sur plusieurs références périssables.',
    sourceName: 'Observatoire local',
    sourceUrl: '/transparence',
    startsAt: '2026-02-12T08:00:00.000Z',
    endsAt: '2026-02-16T20:00:00.000Z',
  },
  {
    id: 'alert-mq-info-1',
    severity: 'info',
    territory: 'mq',
    title: 'Nouvelle collecte citoyenne ouverte',
    message: 'Vous pouvez partager vos tickets pour améliorer la couverture locale.',
    sourceName: 'A KI PRI SA YÉ',
    sourceUrl: '/contribuer-prix',
    startsAt: '2026-02-10T08:00:00.000Z',
  },
  {
    id: 'alert-fr-warning-1',
    severity: 'warning',
    territory: 'fr',
    title: 'Données partielles sur certaines enseignes',
    message: 'Le module observation consolide encore des relevés sur 48h.',
    sourceName: 'Pipeline data',
    startsAt: '2026-02-11T08:00:00.000Z',
    endsAt: '2026-02-20T18:00:00.000Z',
  },
];
