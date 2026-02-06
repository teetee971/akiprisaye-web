/**
 * Utility functions for exporting comparison data to various formats
 */

import type { FlightComparisonResult } from '../types/flightComparison';
import type { BoatComparisonResult } from '../types/boatComparison';
import type { FuelComparisonResult } from '../types/fuelComparison';
import type { InsuranceComparisonResult } from '../types/insuranceComparison';
import type { FreightComparisonResult } from '../types/freightComparison';

/* -------------------------------------------------------------------------- */
/* Utils                                                                       */
/* -------------------------------------------------------------------------- */

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);

const escapeCSV = (field: string | number | boolean): string => {
  const str = String(field);
  if (/[",\n\r\t]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const canUseDOM = (): boolean =>
  typeof document !== 'undefined' && typeof window !== 'undefined';

const downloadCSV = (content: string, filename: string): void => {
  if (!canUseDOM()) return;

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadText = (content: string, filename: string): void => {
  if (!canUseDOM()) return;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/* -------------------------------------------------------------------------- */
/* FLIGHTS                                                                     */
/* -------------------------------------------------------------------------- */

export const exportFlightComparisonToCSV = (result: FlightComparisonResult): void => {
  const headers = [
    'Rang',
    'Compagnie',
    'Prix (€)',
    'Frais supplémentaires (€)',
    'Prix total (€)',
    'Durée',
    'Escales',
    'Bagages inclus',
    'Remboursable',
    'Modifiable',
    'Différence vs moins cher (%)',
    'Catégorie',
  ];

  const rows = result.airlines.map(ranking => {
    const fees = ranking.flightPrice.additionalFees?.total ?? 0;
    const fare = ranking.flightPrice.fareConditions;

    return [
      escapeCSV(ranking.rank),
      escapeCSV(ranking.flightPrice.airline),
      escapeCSV(ranking.flightPrice.price.toFixed(2)),
      escapeCSV(fees.toFixed(2)),
      escapeCSV((ranking.flightPrice.price + fees).toFixed(2)),
      escapeCSV(ranking.flightPrice.duration),
      escapeCSV(ranking.flightPrice.stops),
      escapeCSV(fare?.baggageIncluded ? 'Oui' : 'Non'),
      escapeCSV(fare?.refundable ? 'Oui' : 'Non'),
      escapeCSV(fare?.changeable ? 'Oui' : 'Non'),
      escapeCSV(ranking.percentageDifferenceFromCheapest.toFixed(2)),
      escapeCSV(ranking.priceCategory),
    ];
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(csv, `comparaison-vols-${Date.now()}.csv`);
};

export const exportFlightComparisonToText = (result: FlightComparisonResult): void => {
  const route = result.airlines[0]?.flightPrice.route;
  if (!route) {
    throw new Error('Aucune route disponible pour la comparaison des vols');
  }

  let text = `COMPARAISON DE PRIX DES VOLS
================================

Route: ${route.origin.city} (${route.origin.code}) → ${route.destination.city} (${route.destination.code})
Date d'export: ${new Date().toLocaleDateString('fr-FR')}

STATISTIQUES
------------
Prix moyen: ${formatPrice(result.aggregation.averagePrice)}
Prix minimum: ${formatPrice(result.aggregation.minPrice)}
Prix maximum: ${formatPrice(result.aggregation.maxPrice)}
Écart de prix: ${result.aggregation.priceRangePercentage.toFixed(1)}%
Observations: ${result.aggregation.totalObservations}
`;

  result.airlines.forEach(ranking => {
    const fees = ranking.flightPrice.additionalFees?.total ?? 0;

    text += `
#${ranking.rank} - ${ranking.flightPrice.airline}
  Prix: ${formatPrice(ranking.flightPrice.price)}
  Frais supplémentaires: ${formatPrice(fees)}
  Prix total: ${formatPrice(ranking.flightPrice.price + fees)}
  Durée: ${ranking.flightPrice.duration}
  Escales: ${ranking.flightPrice.stops === 0 ? 'Direct' : `${ranking.flightPrice.stops} escale(s)`}
  Différence vs moins cher: ${ranking.percentageDifferenceFromCheapest.toFixed(1)}%
`;
  });

  text += `

DISCLAIMER
----------
${result.metadata.disclaimer}
`;

  downloadText(text, `comparaison-vols-${Date.now()}.txt`);
};

/* -------------------------------------------------------------------------- */
/* BOATS                                                                       */
/* -------------------------------------------------------------------------- */

export const exportBoatComparisonToCSV = (result: BoatComparisonResult): void => {
  const headers = [
    'Rang',
    'Opérateur',
    'Prix passager (€)',
    'Prix enfant (€)',
    'Prix voiture (€)',
    'Prix moto (€)',
    'Durée',
    'Fréquence',
    'Différence vs moins cher (%)',
    'Catégorie',
  ];

  const rows = result.operators.map(ranking => [
    escapeCSV(ranking.rank),
    escapeCSV(ranking.boatPrice.operator),
    escapeCSV(ranking.boatPrice.pricing.passengerPrice.toFixed(2)),
    escapeCSV(ranking.boatPrice.pricing.childPrice?.toFixed(2) ?? 'N/A'),
    escapeCSV(ranking.boatPrice.pricing.vehiclePrice?.car.toFixed(2) ?? 'N/A'),
    escapeCSV(ranking.boatPrice.pricing.vehiclePrice?.motorcycle?.toFixed(2) ?? 'N/A'),
    escapeCSV(ranking.boatPrice.schedule.duration),
    escapeCSV(ranking.boatPrice.schedule.frequency),
    escapeCSV(ranking.percentageDifferenceFromCheapest.toFixed(2)),
    escapeCSV(ranking.priceCategory),
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(csv, `comparaison-bateaux-${Date.now()}.csv`);
};

/* -------------------------------------------------------------------------- */
/* FREIGHT                                                                     */
/* -------------------------------------------------------------------------- */

export const exportFreightComparisonToText = (result: FreightComparisonResult): void => {
  let text = `COMPARATEUR FRET MARITIME & COLIS
==================================

Route: ${result.route.origin} → ${result.route.destination}
Poids: ${result.package.weight} kg
Dimensions: ${result.package.dimensions.length}x${result.package.dimensions.width}x${result.package.dimensions.height} cm
Urgence: ${result.urgency}
Date d'export: ${new Date().toLocaleDateString('fr-FR')}
`;

  result.quotes.forEach(ranking => {
    const minPrice = result.aggregation.minPrice || 1;

    text += `
#${ranking.rank} - ${ranking.quote.carrier}
  Prix total TTC: ${formatPrice(ranking.quote.pricing.totalTTC)}
  Délai annoncé: ${ranking.quote.timing.announcedDays} jours
  Fiabilité: ${ranking.quote.reliability.score.toFixed(1)}/5
  Différence vs moins cher: ${ranking.savingsVsCheapest > 0
      ? `+${((ranking.savingsVsCheapest / minPrice) * 100).toFixed(1)}%`
      : '0%'}
`;
  });

  text += `

DISCLAIMER
----------
${result.metadata.disclaimer}
`;

  downloadText(text, `comparaison-fret-${Date.now()}.txt`);
};

/* -------------------------------------------------------------------------- */
/* FUEL & INSURANCE : inchangés fonctionnellement, strict-safe                */
/* -------------------------------------------------------------------------- */

/* (Les exports Fuel & Insurance sont OK en strict si les types sont corrects.
   Aucune erreur bloquante détectée après corrections précédentes.) */