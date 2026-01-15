# 📊 Plan d'Intégration des Données Officielles

**Date:** 2026-01-13  
**Statut:** Spécification pour implémentation future  
**Objectif:** Intégrer automatiquement les données officielles avec mises à jour toutes les 3 heures

---

## 🎯 Vue d'Ensemble

Ce document décrit l'architecture et le plan d'implémentation pour remplacer les données de démonstration par des données officielles provenant de sources gouvernementales françaises.

### Objectifs
- ✅ Remplacer toutes les données de démonstration par des données officielles
- ✅ Automatiser la collecte et mise à jour des données toutes les 3 heures
- ✅ Garantir la traçabilité complète (source, date, lien)
- ✅ Gérer les erreurs et indisponibilités des sources
- ✅ Maintenir la compatibilité avec le système d'avertissement actuel

---

## 📍 Sources de Données Officielles

### 1. INSEE (Institut National de la Statistique et des Études Économiques)

**API Disponible:** Oui - API Sirene et données économiques

**Endpoints utiles:**
- **IPC (Indice des Prix à la Consommation):** 
  - URL: `https://api.insee.fr/series/BDM/v1/data/SERIES_BDM/{idbank}`
  - Authentification: Token OAuth2
  - Documentation: https://api.insee.fr/catalogue/
  
- **Données territoriales:**
  - Disponibles via l'API avec filtres géographiques
  - Codes territoires DOM-TOM disponibles

**Données extraites:**
- Indices des prix par catégorie de produits
- Évolution mensuelle des prix
- Comparaisons territoriales

**Format de sortie:**
```json
{
  "metadata": {
    "dataStatus": "OFFICIEL",
    "source": "INSEE",
    "lastUpdate": "2026-01-13T12:00:00Z"
  },
  "data": {
    "territoire": "GP",
    "indice": 115.3,
    "base": "Base 100 en 2015",
    "date": "2026-01",
    "lien_source": "https://www.insee.fr/fr/statistiques/..."
  }
}
```

### 2. OPMR (Observatoires des Prix, des Marges et des Revenus)

**API Disponible:** Non - Données en PDF

**Sources par territoire:**
- **Guadeloupe:** https://www.guadeloupe.gouv.fr/Publications/Observatoire-des-prix
- **Martinique:** https://www.martinique.gouv.fr/Publications/Observatoire-des-prix
- **Guyane:** https://www.guyane.gouv.fr/Publications/Observatoire-des-prix
- **La Réunion:** https://www.reunion.gouv.fr/Publications/Observatoire-des-prix
- **Mayotte:** https://www.mayotte.gouv.fr/Publications/Observatoire-des-prix

**Format des publications:**
- Rapports mensuels en PDF
- Tableaux de prix par catégorie de produits
- Comparaisons avec la métropole

**Stratégie d'extraction:**
1. Scraping automatisé des pages de publication
2. Téléchargement des PDF les plus récents
3. Extraction OCR/parsing des tableaux de prix
4. Validation et transformation en JSON

**Outils recommandés:**
- `pdfplumber` ou `tabula-py` pour extraction de tableaux PDF
- `beautifulsoup4` pour scraping web
- `pandas` pour transformation de données

### 3. DGCCRF (Direction Générale de la Concurrence, de la Consommation et de la Répression des Fraudes)

**API Disponible:** Non - Publications PDF et pages web

**Sources:**
- Rapports "vie chère" annuels/semestriels
- URL: https://www.economie.gouv.fr/dgccrf/Publications

**Données extraites:**
- Analyses comparatives de prix
- Rapports sur les écarts de prix DOM-TOM / Métropole
- Études sectorielles

**Utilisation:**
- Données de contexte et validation
- Méthodologie de référence
- Compléments aux données INSEE/OPMR

### 4. Prix-Carburants.gouv.fr

**API Disponible:** Oui - API publique XML

**Endpoints:**
- Prix instantanés: `https://donnees.roulez-eco.fr/opendata/instantane`
- Historique quotidien: `https://donnees.roulez-eco.fr/opendata/annee/{year}`

**Documentation:** https://www.prix-carburants.gouv.fr/rubrique/opendata/

**Données extraites:**
- Prix par territoire (y compris DOM-TOM)
- Évolution temporelle
- Prix par type de carburant

---

## 🏗️ Architecture du Système

### Composants Principaux

```
┌─────────────────────────────────────────────────────────┐
│                  GitHub Actions                          │
│              (Cron: toutes les 3 heures)                │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│              Data Fetchers (Node.js)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  INSEE   │  │   OPMR   │  │ Carburant│             │
│  │ Fetcher  │  │ Fetcher  │  │ Fetcher  │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────┐
│            Data Transformer & Validator                  │
│  - Normalisation format JSON                             │
│  - Ajout metadata (source, date, lien)                  │
│  - Validation schéma                                     │
│  - Détection anomalies                                   │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│              Data Storage                                │
│  - Commit dans src/data/*.json                          │
│  - Historique Git complet                               │
│  - Backup archives mensuelles                           │
└─────────────────────────────────────────────────────────┘
```

### Flux de Données

1. **Déclenchement:** GitHub Actions cron (0 */3 * * * - toutes les 3h)
2. **Collecte:** Scripts Node.js appellent les APIs/scraping
3. **Transformation:** Normalisation vers format standardisé
4. **Validation:** Vérification cohérence et complétude
5. **Commit:** Push automatique si changements détectés
6. **Notification:** Logs et alertes en cas d'erreur

---

## 📦 Structure des Fichiers de Données

### Format Standardisé

```json
{
  "metadata": {
    "version": "2026.01",
    "dataStatus": "OFFICIEL",
    "lastUpdate": "2026-01-13T12:00:00Z",
    "nextUpdate": "2026-01-13T15:00:00Z",
    "sources": [
      {
        "name": "INSEE",
        "type": "API",
        "url": "https://api.insee.fr/...",
        "lastFetch": "2026-01-13T12:00:00Z",
        "status": "success"
      },
      {
        "name": "OPMR Guadeloupe",
        "type": "PDF",
        "url": "https://www.guadeloupe.gouv.fr/.../rapport-dec-2025.pdf",
        "lastFetch": "2026-01-13T12:05:00Z",
        "status": "success"
      }
    ],
    "quality": {
      "completeness": 95.5,
      "lastValidation": "2026-01-13T12:10:00Z",
      "anomalies": []
    }
  },
  "data": {
    // Données spécifiques selon le fichier
  }
}
```

### Fichiers à Mettre à Jour

1. **src/data/ievr-data.json**
   - Sources: INSEE IPC + OPMR
   - Fréquence: Mensuelle (mais vérification toutes les 3h)
   
2. **src/data/budget_reference.json**
   - Sources: CAF, Service-public.fr, INSEE
   - Fréquence: Annuelle avec ajustements trimestriels

3. **src/data/prices-history.json**
   - Sources: OPMR + Prix-Carburants
   - Fréquence: Mensuelle (historique append-only)

4. **src/data/produits_formats.json**
   - Sources: OPMR rapports
   - Fréquence: Mensuelle

5. **src/data/budget-vital.json**
   - Sources: INSEE + CAF
   - Fréquence: Trimestrielle

6. **src/data/territories-ilpp.json**
   - Sources: OPMR + INSEE
   - Fréquence: Mensuelle

7. **src/data/faux-bons-plans.json**
   - Sources: OPMR relevés
   - Fréquence: Mensuelle

---

## 🛠️ Plan d'Implémentation

### Phase 1: Infrastructure (Semaine 1)

**Objectifs:**
- ✅ Créer structure de scripts de collecte
- ✅ Configurer GitHub Actions
- ✅ Mettre en place logging et monitoring

**Tâches:**

1. **Créer dossier `scripts/data-collection/`**
```bash
scripts/
  data-collection/
    fetchers/
      insee-fetcher.js
      opmr-fetcher.js
      carburants-fetcher.js
      dgccrf-fetcher.js
    transformers/
      data-normalizer.js
      validator.js
    utils/
      http-client.js
      pdf-parser.js
      logger.js
    index.js
```

2. **Configurer GitHub Actions**

Créer `.github/workflows/update-official-data.yml`:
```yaml
name: Update Official Data

on:
  schedule:
    # Toutes les 3 heures
    - cron: '0 */3 * * *'
  workflow_dispatch: # Déclenchement manuel

jobs:
  update-data:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          npm ci
          cd scripts/data-collection
          npm ci
      
      - name: Fetch official data
        env:
          INSEE_API_KEY: ${{ secrets.INSEE_API_KEY }}
          INSEE_API_SECRET: ${{ secrets.INSEE_API_SECRET }}
        run: node scripts/data-collection/index.js
      
      - name: Commit and push if changed
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add src/data/*.json
          git diff --staged --quiet || git commit -m "🤖 Mise à jour automatique des données officielles"
          git push
      
      - name: Notify on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '⚠️ Échec mise à jour données officielles',
              body: 'La mise à jour automatique a échoué. Voir logs: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}',
              labels: ['data-update', 'automated']
            })
```

3. **Créer package.json pour scripts**
```json
{
  "name": "data-collection-scripts",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "axios": "^1.6.0",
    "pdfplumber": "^1.0.0",
    "cheerio": "^1.0.0-rc.12",
    "zod": "^3.22.0",
    "winston": "^3.11.0"
  }
}
```

### Phase 2: Fetchers INSEE (Semaine 2)

**Objectif:** Implémenter collecte données INSEE

**Code exemple: `scripts/data-collection/fetchers/insee-fetcher.js`**

```javascript
import axios from 'axios';
import { logger } from '../utils/logger.js';

export class INSEEFetcher {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseURL = 'https://api.insee.fr';
    this.token = null;
  }

  async authenticate() {
    try {
      const response = await axios.post(
        'https://api.insee.fr/token',
        'grant_type=client_credentials',
        {
          auth: {
            username: this.apiKey,
            password: this.apiSecret
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      this.token = response.data.access_token;
      logger.info('INSEE: Authentification réussie');
    } catch (error) {
      logger.error('INSEE: Échec authentification', error);
      throw error;
    }
  }

  async fetchIPCData(territoire, startDate, endDate) {
    if (!this.token) await this.authenticate();
    
    try {
      // IPC par territoire DOM-TOM
      const territorySeriesIds = {
        'GP': '001763852', // Guadeloupe
        'MQ': '001763853', // Martinique
        'GF': '001763854', // Guyane
        'RE': '001763855', // La Réunion
        'YT': '001763856', // Mayotte
        'FR': '001763850'  // France métropolitaine
      };
      
      const seriesId = territorySeriesIds[territoire];
      
      const response = await axios.get(
        `${this.baseURL}/series/BDM/v1/data/SERIES_BDM/${seriesId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json'
          },
          params: {
            startPeriod: startDate,
            endPeriod: endDate
          }
        }
      );
      
      logger.info(`INSEE: IPC récupéré pour ${territoire}`);
      return this.transformIPCData(response.data, territoire);
    } catch (error) {
      logger.error(`INSEE: Erreur récupération IPC ${territoire}`, error);
      throw error;
    }
  }

  transformIPCData(rawData, territoire) {
    return {
      territoire,
      source: 'INSEE',
      type: 'IPC',
      lastFetch: new Date().toISOString(),
      data: rawData.Obs.map(obs => ({
        date: obs.TIME_PERIOD,
        valeur: parseFloat(obs.OBS_VALUE),
        unite: 'Indice base 100',
        lien: `https://www.insee.fr/fr/statistiques/${rawData.idbank}`
      }))
    };
  }

  async fetchBudgetMenages() {
    // Récupération données budget des ménages
    // API INSEE nécessite endpoints spécifiques
    // À compléter selon disponibilité API
  }
}
```

### Phase 3: Fetchers OPMR (Semaine 3)

**Objectif:** Scraping et parsing PDF OPMR

**Code exemple: `scripts/data-collection/fetchers/opmr-fetcher.js`**

```javascript
import axios from 'axios';
import cheerio from 'cheerio';
import { PDFParser } from '../utils/pdf-parser.js';
import { logger } from '../utils/logger.js';

export class OPMRFetcher {
  constructor() {
    this.territories = {
      'GP': {
        name: 'Guadeloupe',
        url: 'https://www.guadeloupe.gouv.fr/Publications/Observatoire-des-prix'
      },
      'MQ': {
        name: 'Martinique',
        url: 'https://www.martinique.gouv.fr/Publications/Observatoire-des-prix'
      },
      'GF': {
        name: 'Guyane',
        url: 'https://www.guyane.gouv.fr/Publications/Observatoire-des-prix'
      },
      'RE': {
        name: 'La Réunion',
        url: 'https://www.reunion.gouv.fr/Publications/Observatoire-des-prix'
      },
      'YT': {
        name: 'Mayotte',
        url: 'https://www.mayotte.gouv.fr/Publications/Observatoire-des-prix'
      }
    };
  }

  async fetchLatestReport(territoire) {
    try {
      const config = this.territories[territoire];
      if (!config) throw new Error(`Territoire inconnu: ${territoire}`);
      
      logger.info(`OPMR: Récupération rapport ${config.name}`);
      
      // 1. Scraper la page pour trouver le PDF le plus récent
      const response = await axios.get(config.url);
      const $ = cheerio.load(response.data);
      
      // Chercher liens PDF (pattern peut varier selon le site)
      const pdfLinks = [];
      $('a[href$=".pdf"]').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().toLowerCase();
        
        // Filtrer les rapports mensuels de prix
        if (text.includes('prix') || text.includes('observatoire')) {
          pdfLinks.push({
            url: href.startsWith('http') ? href : `${new URL(config.url).origin}${href}`,
            text: $(el).text(),
            date: this.extractDateFromText($(el).text())
          });
        }
      });
      
      // Trier par date décroissante
      pdfLinks.sort((a, b) => b.date - a.date);
      
      if (pdfLinks.length === 0) {
        logger.warn(`OPMR: Aucun PDF trouvé pour ${config.name}`);
        return null;
      }
      
      // 2. Télécharger le PDF le plus récent
      const latestPdf = pdfLinks[0];
      logger.info(`OPMR: Téléchargement ${latestPdf.url}`);
      
      const pdfResponse = await axios.get(latestPdf.url, {
        responseType: 'arraybuffer'
      });
      
      // 3. Parser le PDF pour extraire les tableaux
      const parser = new PDFParser();
      const tables = await parser.extractTables(pdfResponse.data);
      
      // 4. Transformer en format JSON
      return this.transformOPMRData(tables, territoire, latestPdf);
      
    } catch (error) {
      logger.error(`OPMR: Erreur pour ${territoire}`, error);
      throw error;
    }
  }

  extractDateFromText(text) {
    // Patterns communs: "Décembre 2025", "12-2025", etc.
    const patterns = [
      /(\w+)\s+(\d{4})/i,
      /(\d{2})[-\/](\d{4})/
    ];
    
    // Logique d'extraction à implémenter
    // Retourne Date object ou null
    return new Date();
  }

  transformOPMRData(tables, territoire, source) {
    // Transformation des tableaux extraits en format standardisé
    return {
      territoire,
      source: `OPMR ${this.territories[territoire].name}`,
      lastFetch: new Date().toISOString(),
      sourceUrl: source.url,
      reportDate: source.date.toISOString(),
      products: this.extractProducts(tables),
      priceIndices: this.extractIndices(tables)
    };
  }

  extractProducts(tables) {
    // Logique d'extraction des prix produits depuis tableaux PDF
    // À implémenter selon format spécifique des rapports
    return [];
  }

  extractIndices(tables) {
    // Extraction des indices ILPP ou similaires
    return {};
  }
}
```

### Phase 4: Transformation et Validation (Semaine 4)

**Objectif:** Normaliser et valider toutes les données

**Code exemple: `scripts/data-collection/transformers/data-normalizer.js`**

```javascript
import { z } from 'zod';
import { logger } from '../utils/logger.js';

// Schémas de validation
const MetadataSchema = z.object({
  version: z.string(),
  dataStatus: z.literal('OFFICIEL'),
  lastUpdate: z.string().datetime(),
  sources: z.array(z.object({
    name: z.string(),
    type: z.enum(['API', 'PDF', 'WEB']),
    url: z.string().url(),
    lastFetch: z.string().datetime(),
    status: z.enum(['success', 'error', 'partial'])
  })),
  quality: z.object({
    completeness: z.number().min(0).max(100),
    lastValidation: z.string().datetime(),
    anomalies: z.array(z.string())
  })
});

export class DataNormalizer {
  
  async normalizeIEVRData(inseeData, opmrData) {
    try {
      const normalized = {
        metadata: {
          version: this.getCurrentVersion(),
          dataStatus: 'OFFICIEL',
          lastUpdate: new Date().toISOString(),
          sources: [
            ...inseeData.sources,
            ...opmrData.sources
          ],
          quality: this.assessQuality(inseeData, opmrData)
        },
        territories: this.mergeTerritoriesData(inseeData, opmrData)
      };
      
      // Validation
      const validated = MetadataSchema.parse(normalized.metadata);
      
      logger.info('IEVR: Données normalisées et validées');
      return normalized;
      
    } catch (error) {
      logger.error('Erreur normalisation IEVR', error);
      throw error;
    }
  }

  assessQuality(inseeData, opmrData) {
    // Calcul score de complétude et détection anomalies
    const requiredFields = ['GP', 'MQ', 'GF', 'RE', 'YT'];
    const presentFields = Object.keys(inseeData.territories || {});
    
    const completeness = (presentFields.length / requiredFields.length) * 100;
    
    const anomalies = [];
    
    // Vérifier cohérence dates
    if (inseeData.lastFetch && opmrData.lastFetch) {
      const timeDiff = Math.abs(
        new Date(inseeData.lastFetch) - new Date(opmrData.lastFetch)
      );
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 30) {
        anomalies.push(`Décalage temporel sources: ${daysDiff.toFixed(0)} jours`);
      }
    }
    
    return {
      completeness,
      lastValidation: new Date().toISOString(),
      anomalies
    };
  }

  getCurrentVersion() {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  mergeTerritoriesData(inseeData, opmrData) {
    // Fusion intelligente des données INSEE et OPMR
    // Prioriser données les plus récentes
    // Conserver traçabilité complète
    return {};
  }
}
```

### Phase 5: Orchestration Principale (Semaine 5)

**Code exemple: `scripts/data-collection/index.js`**

```javascript
import fs from 'fs/promises';
import path from 'path';
import { INSEEFetcher } from './fetchers/insee-fetcher.js';
import { OPMRFetcher } from './fetchers/opmr-fetcher.js';
import { CarburantsFetcher } from './fetchers/carburants-fetcher.js';
import { DataNormalizer } from './transformers/data-normalizer.js';
import { logger } from './utils/logger.js';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

async function main() {
  logger.info('🚀 Démarrage mise à jour données officielles');
  
  try {
    // 1. Initialiser fetchers
    const inseeFetcher = new INSEEFetcher(
      process.env.INSEE_API_KEY,
      process.env.INSEE_API_SECRET
    );
    const opmrFetcher = new OPMRFetcher();
    const carburantsFetcher = new CarburantsFetcher();
    const normalizer = new DataNormalizer();
    
    // 2. Collecter données INSEE
    logger.info('📊 Collecte données INSEE...');
    const inseeData = {
      ipc: {},
      budget: {}
    };
    
    const territories = ['GP', 'MQ', 'GF', 'RE', 'YT', 'FR'];
    for (const territoire of territories) {
      try {
        inseeData.ipc[territoire] = await inseeFetcher.fetchIPCData(
          territoire,
          '2024-01',
          '2026-01'
        );
      } catch (error) {
        logger.error(`INSEE IPC échoué pour ${territoire}`, error);
      }
    }
    
    // 3. Collecter données OPMR
    logger.info('📋 Collecte données OPMR...');
    const opmrData = {};
    for (const territoire of territories.filter(t => t !== 'FR')) {
      try {
        opmrData[territoire] = await opmrFetcher.fetchLatestReport(territoire);
      } catch (error) {
        logger.error(`OPMR échoué pour ${territoire}`, error);
      }
    }
    
    // 4. Collecter données carburants
    logger.info('⛽ Collecte données carburants...');
    const carburantsData = await carburantsFetcher.fetchAll();
    
    // 5. Normaliser et fusionner
    logger.info('🔄 Normalisation des données...');
    
    const updatedFiles = {};
    
    // IEVR Data
    updatedFiles['ievr-data.json'] = await normalizer.normalizeIEVRData(
      inseeData,
      opmrData
    );
    
    // Budget Reference
    updatedFiles['budget_reference.json'] = await normalizer.normalizeBudgetData(
      inseeData.budget
    );
    
    // Prices History (append-only)
    updatedFiles['prices-history.json'] = await normalizer.appendPriceHistory(
      await readExistingData('prices-history.json'),
      opmrData
    );
    
    // Territories ILPP
    updatedFiles['territories-ilpp.json'] = await normalizer.normalizeILPPData(
      opmrData
    );
    
    // Products Formats
    updatedFiles['produits_formats.json'] = await normalizer.normalizeProductsData(
      opmrData
    );
    
    // Budget Vital
    updatedFiles['budget-vital.json'] = await normalizer.normalizeBudgetVital(
      inseeData.budget,
      opmrData
    );
    
    // 6. Écrire fichiers
    logger.info('💾 Écriture fichiers...');
    for (const [filename, data] of Object.entries(updatedFiles)) {
      const filepath = path.join(DATA_DIR, filename);
      await fs.writeFile(
        filepath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
      logger.info(`✅ ${filename} mis à jour`);
    }
    
    logger.info('✨ Mise à jour terminée avec succès');
    
  } catch (error) {
    logger.error('❌ Erreur lors de la mise à jour', error);
    process.exit(1);
  }
}

async function readExistingData(filename) {
  try {
    const filepath = path.join(DATA_DIR, filename);
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    logger.warn(`Fichier ${filename} non trouvé ou invalide`);
    return null;
  }
}

main();
```

---

## 🔐 Configuration des Secrets

### GitHub Secrets à Configurer

Dans les paramètres du repository → Secrets and variables → Actions:

1. **INSEE_API_KEY**
   - Obtenir sur: https://api.insee.fr/
   - Inscription nécessaire (gratuit)
   
2. **INSEE_API_SECRET**
   - Fourni lors de l'inscription API

### Procédure d'Obtention

1. Créer compte sur portail API INSEE
2. Créer une application
3. Noter les credentials (Key + Secret)
4. Ajouter aux secrets GitHub

---

## 📊 Monitoring et Alertes

### Logs

Tous les logs sont conservés dans GitHub Actions:
- Succès/échec de chaque fetcher
- Anomalies détectées
- Statistiques de complétude

### Alertes

En cas d'échec:
1. Issue GitHub automatique créée
2. Label "data-update" + "automated"
3. Lien vers logs d'exécution

### Dashboard

Créer page `/donnees-officielles/status` avec:
- Date dernière mise à jour réussie
- Statut par source (✅ / ⚠️ / ❌)
- Prochaine mise à jour prévue
- Indicateurs de qualité

---

## 🧪 Tests

### Tests Unitaires

```javascript
// scripts/data-collection/__tests__/insee-fetcher.test.js
import { INSEEFetcher } from '../fetchers/insee-fetcher.js';

describe('INSEEFetcher', () => {
  it('should authenticate successfully', async () => {
    const fetcher = new INSEEFetcher('key', 'secret');
    await expect(fetcher.authenticate()).resolves.not.toThrow();
  });
  
  it('should fetch IPC data for territory', async () => {
    const fetcher = new INSEEFetcher('key', 'secret');
    const data = await fetcher.fetchIPCData('GP', '2025-01', '2025-12');
    expect(data).toHaveProperty('territoire', 'GP');
    expect(data).toHaveProperty('data');
  });
});
```

### Tests d'Intégration

```javascript
// scripts/data-collection/__tests__/integration.test.js
describe('Data Collection Pipeline', () => {
  it('should collect, normalize and save data', async () => {
    // Test complet du pipeline
    // Utiliser données mock pour tests
  });
  
  it('should handle API errors gracefully', async () => {
    // Test gestion d'erreurs
  });
});
```

---

## 📅 Calendrier de Déploiement

### Semaine 1: Infrastructure
- [ ] Créer structure scripts
- [ ] Configurer GitHub Actions
- [ ] Obtenir credentials INSEE
- [ ] Tests de base

### Semaine 2: Fetcher INSEE
- [ ] Implémenter authentification
- [ ] Implémenter récupération IPC
- [ ] Tests unitaires
- [ ] Documentation

### Semaine 3: Fetcher OPMR
- [ ] Implémenter scraping web
- [ ] Implémenter parsing PDF
- [ ] Tests avec vrais PDFs
- [ ] Gestion des variations de format

### Semaine 4: Normalisation
- [ ] Créer schémas validation
- [ ] Implémenter normalizers
- [ ] Détection anomalies
- [ ] Tests de qualité

### Semaine 5: Intégration
- [ ] Script orchestration principal
- [ ] Tests end-to-end
- [ ] Monitoring et alertes
- [ ] Documentation utilisateur

### Semaine 6: Production
- [ ] Déploiement GitHub Actions
- [ ] Première exécution supervisée
- [ ] Ajustements et corrections
- [ ] Retour d'expérience

---

## 🎓 Formation et Documentation

### Documentation Technique

Créer dans `/docs/data-integration/`:
- `API-INSEE.md` - Guide utilisation API
- `OPMR-SCRAPING.md` - Guide scraping et parsing
- `DATA-SCHEMAS.md` - Schémas de données
- `TROUBLESHOOTING.md` - Résolution problèmes

### Documentation Utilisateur

Page publique expliquant:
- Sources des données
- Fréquence des mises à jour
- Méthodologie de collecte
- Traçabilité et transparence

---

## ⚠️ Risques et Mitigations

### Risques Identifiés

1. **API INSEE indisponible**
   - Mitigation: Retry automatique, fallback sur données précédentes
   
2. **Format PDF OPMR change**
   - Mitigation: Alertes automatiques, parsing flexible
   
3. **Rate limiting APIs**
   - Mitigation: Espacement requêtes, cache intelligent
   
4. **Données incomplètes**
   - Mitigation: Validation stricte, affichage transparent des lacunes

5. **GitHub Actions échec**
   - Mitigation: Logs détaillés, notifications, déclenchement manuel

---

## 💰 Coûts Estimés

### Infrastructure
- GitHub Actions: **Gratuit** (2000 minutes/mois pour repos publics)
- APIs INSEE: **Gratuit**
- Hébergement données: **Gratuit** (dans Git)

### Développement
- Estimation: **40-60 heures** de développement
- Maintenance: **2-4 heures/mois**

---

## 📈 Métriques de Succès

### Objectifs à Atteindre

- ✅ 100% des données avec `dataStatus: "OFFICIEL"`
- ✅ Mise à jour réussie > 95% du temps
- ✅ Délai maximum entre source et app < 6h
- ✅ Complétude des données > 90%
- ✅ Zéro donnée placeholder ou estimée

### Suivi

Dashboard mensuel avec:
- Taux de succès des mises à jour
- Temps moyen de mise à jour
- Nombre d'anomalies détectées
- Couverture territoriale

---

## 🚀 Prochaines Étapes

1. **Valider ce plan** avec l'équipe
2. **Créer issue GitHub** avec ce document
3. **Prioriser les phases** selon ressources disponibles
4. **Obtenir credentials API INSEE**
5. **Démarrer Phase 1** (Infrastructure)

---

## 📞 Support et Questions

Pour toute question sur cette spécification:
- Créer issue GitHub avec label "data-integration"
- Mentionner @copilot pour assistance technique
- Consulter documentation officielle des APIs

---

**Document créé:** 2026-01-13  
**Version:** 1.0  
**Auteur:** @copilot  
**Statut:** Spécification complète - Prêt pour implémentation
