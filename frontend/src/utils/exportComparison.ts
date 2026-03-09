/**
 * Utility functions for exporting comparison data to various formats
 */

import type { FlightComparisonResult } from '../types/flightComparison';
import type { BoatComparisonResult } from '../types/boatComparison';
import type { FuelComparisonResult } from '../types/fuelComparison';
import type { InsuranceComparisonResult } from '../types/insuranceComparison';
import type { FreightComparisonResult } from '../types/freightComparison';

/**
 * Format price as EUR currency
 */
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

/**
 * Escape CSV field to prevent injection, parsing errors and CSV injection (Excel)
 */
const escapeCSV = (field: string | number | boolean): string => {
  let str = String(field);

  // Protection against CSV Injection (Excel / LibreOffice)
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  if (/[,"\n\r\t]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

/**
 * -------------------------
 * FLIGHTS
 * -------------------------
 */

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

  const rows = result.airlines.map(ranking => [
    escapeCSV(ranking.rank),
    escapeCSV(ranking.flightPrice.airline),
    escapeCSV(ranking.flightPrice.price.toFixed(2)),
    escapeCSV(ranking.flightPrice.additionalFees?.total.toFixed(2) || '0.00'),
    escapeCSV((ranking.flightPrice.price + (ranking.flightPrice.additionalFees?.total || 0)).toFixed(2)),
    escapeCSV(ranking.flightPrice.duration ?? ''),
    escapeCSV(ranking.flightPrice.stops),
    escapeCSV(ranking.flightPrice.fareConditions.baggageIncluded ? 'Oui' : 'Non'),
    escapeCSV(ranking.flightPrice.fareConditions.refundable ? 'Oui' : 'Non'),
    escapeCSV(ranking.flightPrice.fareConditions.changeable ? 'Oui' : 'Non'),
    escapeCSV(ranking.percentageDifferenceFromCheapest.toFixed(2)),
    escapeCSV(ranking.priceCategory),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(csvContent, `comparaison-vols-${Date.now()}.csv`);
};

export const exportFlightComparisonToText = (result: FlightComparisonResult): void => {
  const route = result.airlines[0]?.flightPrice.route;
  if (!route) {
    downloadText('Aucune donnée disponible', `comparaison-vols-${Date.now()}.txt`);
    return;
  }

  let text = `COMPARAISON DE PRIX DES VOLS\n`;
  text += `================================\n\n`;
  text += `Route: ${route.origin.city} (${route.origin.code}) → ${route.destination.city} (${route.destination.code})\n`;
  text += `Date d'export: ${new Date().toLocaleDateString('fr-FR')}\n\n`;

  text += `STATISTIQUES\n------------\n`;
  text += `Prix moyen: ${formatPrice(result.aggregation.averagePrice)}\n`;
  text += `Prix minimum: ${formatPrice(result.aggregation.minPrice)}\n`;
  text += `Prix maximum: ${formatPrice(result.aggregation.maxPrice)}\n`;
  text += `Écart de prix: ${result.aggregation.priceRangePercentage.toFixed(1)}%\n`;
  text += `Observations: ${result.aggregation.totalObservations}\n\n`;

  text += `COMPARAISON PAR COMPAGNIE\n-------------------------\n`;
  result.airlines.forEach(ranking => {
    text += `\n#${ranking.rank} - ${ranking.flightPrice.airline}\n`;
    text += `  Prix: ${formatPrice(ranking.flightPrice.price)}\n`;
    text += `  Durée: ${ranking.flightPrice.duration}\n`;
    text += `  Escales: ${ranking.flightPrice.stops === 0 ? 'Direct' : `${ranking.flightPrice.stops} escale(s)`}\n`;
    text += `  Différence vs moins cher: ${ranking.percentageDifferenceFromCheapest > 0 ? '+' : ''}${ranking.percentageDifferenceFromCheapest.toFixed(1)}%\n`;
  });

  text += `\n\nDISCLAIMER\n----------\n${result.metadata.disclaimer}\n`;
  downloadText(text, `comparaison-vols-${Date.now()}.txt`);
};

/**
 * -------------------------
 * BOATS
 * -------------------------
 */

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
    escapeCSV(ranking.boatPrice.pricing.childPrice?.toFixed(2) || 'N/A'),
    escapeCSV(ranking.boatPrice.pricing.vehiclePrice?.car.toFixed(2) || 'N/A'),
    escapeCSV(ranking.boatPrice.pricing.vehiclePrice?.motorcycle?.toFixed(2) || 'N/A'),
    escapeCSV(ranking.boatPrice.schedule.duration),
    escapeCSV(ranking.boatPrice.schedule.frequency),
    escapeCSV(ranking.percentageDifferenceFromCheapest.toFixed(2)),
    escapeCSV(ranking.priceCategory),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(csvContent, `comparaison-bateaux-${Date.now()}.csv`);
};

export const exportBoatComparisonToText = (result: BoatComparisonResult): void => {
  const route = result.operators[0]?.boatPrice.route;
  if (!route) {
    downloadText('Aucune donnée disponible', `comparaison-bateaux-${Date.now()}.txt`);
    return;
  }

  let text = `COMPARAISON DE PRIX DES BATEAUX / FERRIES\n`;
  text += `========================================\n\n`;
  text += `Route: ${route.origin.city} → ${route.destination.city}\n`;
  text += `Date d'export: ${new Date().toLocaleDateString('fr-FR')}\n\n`;

  text += `COMPARAISON PAR OPÉRATEUR\n-------------------------\n`;
  result.operators.forEach(ranking => {
    text += `\n#${ranking.rank} - ${ranking.boatPrice.operator}\n`;
    text += `  Prix passager: ${formatPrice(ranking.boatPrice.pricing.passengerPrice)}\n`;
    text += `  Durée: ${ranking.boatPrice.schedule.duration}\n`;
    text += `  Fréquence: ${ranking.boatPrice.schedule.frequency}\n`;
  });

  text += `\n\nDISCLAIMER\n----------\n${result.metadata.disclaimer}\n`;
  downloadText(text, `comparaison-bateaux-${Date.now()}.txt`);
};

/**
 * -------------------------
 * FREIGHT
 * -------------------------
 */

export const exportFreightComparisonToCSV = (result: FreightComparisonResult): void => {
  const headers = [
    'Rang',
    'Transporteur',
    'Prix total TTC (€)',
    'Délai annoncé (jours)',
    'Délai réel moyen (jours)',
    'Score fiabilité',
    'Taux ponctualité (%)',
    'Catégorie',
  ];

  const rows = result.quotes.map(r => [
    escapeCSV(r.rank),
    escapeCSV(r.quote.carrier),
    escapeCSV(r.quote.pricing.totalTTC.toFixed(2)),
    escapeCSV(r.quote.timing.announcedDays),
    escapeCSV(r.quote.timing.realDaysAverage ?? r.quote.timing.announcedDays),
    escapeCSV(r.quote.reliability.score.toFixed(1)),
    escapeCSV((r.quote.reliability.onTimeRate * 100).toFixed(1)),
    escapeCSV(r.priceCategory),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(csvContent, `comparaison-fret-${Date.now()}.csv`);
};

export const exportFreightComparisonToText = (result: FreightComparisonResult): void => {
  let text = `COMPARATEUR FRET MARITIME & COLIS\n`;
  text += `==================================\n\n`;
  text += `Route: ${result.route.origin} → ${result.route.destination}\n`;
  text += `Poids: ${result.package.weight} kg\n`;
  text += `Date d'export: ${new Date().toLocaleDateString('fr-FR')}\n\n`;

  result.quotes.forEach(r => {
    text += `\n#${r.rank} - ${r.quote.carrier}\n`;
    text += `  Prix total TTC: ${formatPrice(r.quote.pricing.totalTTC)}\n`;
    text += `  Délai annoncé: ${r.quote.timing.announcedDays} jours\n`;
    text += `  Fiabilité: ${r.quote.reliability.score.toFixed(1)}/5\n`;
  });

  text += `\n\nDISCLAIMER\n----------\n${result.metadata.disclaimer}\n`;
  downloadText(text, `comparaison-fret-${Date.now()}.txt`);
};

/**
 * -------------------------
 * FUEL
 * -------------------------
 */

export const exportFuelComparisonToText = (result: FuelComparisonResult): void => {
  let text = `COMPARAISON DES PRIX DES CARBURANTS\n`;
  text += `====================================\n\n`;
  text += `Territoire: ${result.territory}\n`;
  text += `Carburant: ${result.fuelType}\n`;
  text += `Date: ${new Date(result.comparisonDate).toLocaleDateString('fr-FR')}\n\n`;

  result.rankedPrices.forEach((r, i) => {
    text += `\n${i + 1}. ${r.fuelPrice.station.name} - ${formatPrice(r.fuelPrice.pricePerLiter)}/L\n`;
  });

  downloadText(text, `comparaison-carburants-${Date.now()}.txt`);
};

/**
 * -------------------------
 * INSURANCE
 * -------------------------
 */

export const exportInsuranceComparisonToCSV = (result: InsuranceComparisonResult): void => {
  const headers = [
    'Rang',
    'Assureur',
    'Offre',
    'Prix annuel (€)',
    'Différence (%)',
    'Catégorie',
  ];

  const rows = result.rankedOffers.map(r => [
    escapeCSV(r.rank),
    escapeCSV(r.insurance.providerName),
    escapeCSV(r.insurance.offerName),
    escapeCSV(r.insurance.annualPriceTTC.toFixed(2)),
    escapeCSV(r.percentageDifferenceFromCheapest.toFixed(1)),
    escapeCSV(r.priceCategory),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(csvContent, `comparaison-assurances-${Date.now()}.csv`);
};

export const exportInsuranceComparisonToText = (result: InsuranceComparisonResult): void => {
  let text = `COMPARAISON DES ASSURANCES\n`;
  text += `==========================\n\n`;
  text += `Type: ${result.insuranceType}\n`;
  text += `Territoire: ${result.territory}\n\n`;

  result.rankedOffers.forEach((r, i) => {
    text += `\n${i + 1}. ${r.insurance.providerName} - ${formatPrice(r.insurance.annualPriceTTC)}\n`;
  });

  downloadText(text, `comparaison-assurances-${Date.now()}.txt`);
};

/**
 * -------------------------
 * DOWNLOAD HELPERS
 * -------------------------
 */

const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const downloadText = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};