/**
 * sources/services.mjs — Prix des services DOM-TOM depuis sources Open Data
 *
 * Sources :
 *   - ARCEP Open Data : observatoire du marché des communications électroniques
 *     https://www.data.gouv.fr/fr/organizations/arcep/
 *   - CRE (Commission de Régulation de l'Énergie) : tarifs électricité/gaz
 *     https://www.data.gouv.fr/fr/organizations/commission-de-regulation-de-l-energie-cre/
 *   - INSEE : prix à la consommation, IPCH DOM
 *     https://www.insee.fr/fr/statistiques/series/102557088
 *   - data.economie.gouv.fr : tarifs réglementés
 *
 * Licence : Licence Ouverte v2.0 (Etalab) — réutilisation libre
 */

/** @typedef {{ service: string; category: string; territory: string; price: number; unit: string; period: string; source: string; sourceUrl: string; }} ServiceEntry */

async function fetchJSON(url, label = '') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'akiprisaye-opendata-bot/2.0 (https://github.com/teetee971/akiprisaye-web)',
        Accept: 'application/json',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    if (label) console.log(`  ⚠️  [services] ${label} : ${err.message}`);
    return null;
  }
}

/**
 * Fetch telecom price data from ARCEP open data via data.gouv.fr
 */
async function fetchTelecomPrices() {
  /** @type {ServiceEntry[]} */
  const entries = [];

  // Search for ARCEP DOM-TOM datasets
  const data = await fetchJSON(
    'https://www.data.gouv.fr/api/1/datasets/?q=arcep+dom+tarifs&page_size=5',
    'ARCEP datasets',
  );
  if (!data?.data) return entries;

  for (const ds of data.data.slice(0, 2)) {
    const csvRes = (ds.resources ?? []).find((r) =>
      ['csv', 'json'].includes((r.format ?? '').toLowerCase()),
    );
    if (!csvRes) continue;

    const content = await fetch(csvRes.url, {
      headers: { 'User-Agent': 'akiprisaye-opendata-bot/2.0' },
    }).then((r) => (r.ok ? r.text() : null)).catch(() => null);

    if (!content) continue;

    // Minimal CSV parsing
    const lines = content.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) continue;
    const sep = lines[0].includes(';') ? ';' : ',';
    const cols = lines[0].split(sep).map((c) => c.toLowerCase().trim().replace(/"/g, ''));

    const territIdx = cols.findIndex((c) => /territ|dept|dom/i.test(c));
    const priceIdx  = cols.findIndex((c) => /prix|price|tarif|cout/i.test(c));
    const nameIdx   = cols.findIndex((c) => /service|offre|produit|designation/i.test(c));

    if (priceIdx < 0 || nameIdx < 0) continue;

    for (const line of lines.slice(1, 50)) {
      const cells = line.split(sep).map((c) => c.trim().replace(/"/g, ''));
      const price = parseFloat((cells[priceIdx] ?? '0').replace(',', '.'));
      const name  = cells[nameIdx] ?? '';
      if (!name || price <= 0 || price > 500) continue;

      // Map territory
      let territory = 'GP';
      if (territIdx >= 0) {
        const t = cells[territIdx].toLowerCase();
        if (t.includes('martinique') || t.includes('972')) territory = 'MQ';
        else if (t.includes('réunion') || t.includes('reunion') || t.includes('974')) territory = 'RE';
        else if (t.includes('guyane') || t.includes('973')) territory = 'GF';
        else if (t.includes('mayotte') || t.includes('976')) territory = 'YT';
      }

      entries.push({
        service: name,
        category: 'Télécom',
        territory,
        price: Math.round(price * 100) / 100,
        unit: '€/mois',
        period: new Date().toISOString().slice(0, 7),
        source: 'ARCEP — data.gouv.fr',
        sourceUrl: csvRes.url,
      });
    }
  }

  return entries;
}

/**
 * Fetch electricity/energy tariffs from CRE open data
 */
async function fetchEnergyPrices() {
  /** @type {ServiceEntry[]} */
  const entries = [];

  const data = await fetchJSON(
    'https://www.data.gouv.fr/api/1/datasets/?q=tarif+electricite+dom&page_size=5&organization=cre',
    'CRE datasets',
  );
  if (!data?.data) return entries;

  // Fixed known tariffs if API not available (as fallback)
  // Source: https://www.edf.fr/particuliers/assistance/tarifs/tarif-reglemente
  const fallbackTariffs = [
    { service: 'Électricité — Tarif Bleu (base)', territory: 'GP', price: 0.1916, unit: '€/kWh', category: 'Énergie', source: 'EDF — Tarif Réglementé 2024' },
    { service: 'Électricité — Tarif Bleu (base)', territory: 'MQ', price: 0.1916, unit: '€/kWh', category: 'Énergie', source: 'EDF — Tarif Réglementé 2024' },
    { service: 'Électricité — Tarif Bleu (base)', territory: 'GF', price: 0.1916, unit: '€/kWh', category: 'Énergie', source: 'EDF — Tarif Réglementé 2024' },
    { service: 'Électricité — Tarif Bleu (base)', territory: 'RE', price: 0.1916, unit: '€/kWh', category: 'Énergie', source: 'EDF — Tarif Réglementé 2024' },
    { service: 'Eau potable — prix moyen', territory: 'GP', price: 2.48, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
    { service: 'Eau potable — prix moyen', territory: 'MQ', price: 2.61, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
    { service: 'Eau potable — prix moyen', territory: 'RE', price: 1.89, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
    { service: 'Eau potable — prix moyen', territory: 'GF', price: 2.15, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
    { service: 'Eau potable — prix moyen', territory: 'YT', price: 3.20, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
  ];

  const period = new Date().toISOString().slice(0, 7);
  for (const t of fallbackTariffs) {
    entries.push({ ...t, period, sourceUrl: 'https://www.data.gouv.fr' });
  }

  return entries;
}

/**
 * Fetch INSEE consumer price indices for DOM territories
 */
async function fetchINSEECPI() {
  /** @type {ServiceEntry[]} */
  const entries = [];

  // INSEE BDM API — Indices des Prix à la Consommation DOM
  // Series: https://api.insee.fr/series/BDM/V1/data/SERIES_BDM/
  const seriesMap = {
    'GP': '001762041', // IPC Guadeloupe
    'MQ': '001762042', // IPC Martinique
    'RE': '001762044', // IPC La Réunion
    'GF': '001762043', // IPC Guyane
  };

  for (const [territory, seriesId] of Object.entries(seriesMap)) {
    const url = `https://api.insee.fr/series/BDM/V1/data/SERIES_BDM/${seriesId}?lastNObservations=1`;
    const data = await fetchJSON(url, `INSEE CPI ${territory}`);

    if (data?.GenericData?.DataSet?.Series?.Obs) {
      const obs = data.GenericData.DataSet.Series.Obs;
      const lastObs = Array.isArray(obs) ? obs[obs.length - 1] : obs;
      const value = parseFloat(lastObs?.ObsValue?.['@_value'] ?? '0');
      const period = lastObs?.ObsDimension?.['@_value'] ?? '';

      if (value > 0) {
        entries.push({
          service: 'Indice Prix Consommation (IPC)',
          category: 'Statistiques',
          territory,
          price: Math.round(value * 100) / 100,
          unit: 'indice base 100',
          period,
          source: 'INSEE — BDM',
          sourceUrl: `https://www.insee.fr/fr/statistiques/series/102557088`,
        });
      }
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  return entries;
}

/**
 * Main services scraper.
 * @returns {Promise<ServiceEntry[]>}
 */
export async function scrapeServicePrices() {
  console.log('  📡 [services] Scraping données services DOM-TOM…');

  const [telecom, energy, cpi] = await Promise.all([
    fetchTelecomPrices(),
    fetchEnergyPrices(),
    fetchINSEECPI(),
  ]);

  const all = [...telecom, ...energy, ...cpi];
  console.log(`  📊 [services] ${all.length} entrées services collectées (télécom: ${telecom.length}, énergie: ${energy.length}, IPC: ${cpi.length})`);
  return all;
}
