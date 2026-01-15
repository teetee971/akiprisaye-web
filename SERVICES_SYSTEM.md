# Système de Comparaison de Services v5.0.0

## Vue d'ensemble

Le système de comparaison de services permet aux citoyens de comparer les prix et conditions des services essentiels dans les territoires d'outre-mer : vols, bateaux, internet, mobile, eau et électricité.

---

## 📊 Base de Données : `services-prices.json`

### Métadonnées
- **Version**: 1.0.0
- **Dernière mise à jour**: 2025-01-05
- **Territoires**: GP, MQ, GF, RE
- **Taille**: 33 KB

### Catégories de Services

#### 1. ✈️ Transport Aérien (12 routes)

**Compagnies aériennes** :
- Air France (vols long-courriers)
- Air Caraïbes (vols long et moyens courriers)
- Corsair (vols long-courriers économiques)
- Air Antilles (vols inter-îles)

**Routes principales** :
- **GP → Paris** : 3 options (€320-€650 moyenne)
  - Air France (PTP→CDG) : €650 moy, 8h30, quotidien
  - Air Caraïbes (PTP→ORY) : €620 moy, 8h45, quotidien
  - Corsair (PTP→ORY) : €580 moy, 8h40, 5×/semaine

- **MQ → Paris** : 2 options (€640-€670 moyenne)
  - Air France (FDF→CDG) : €670 moy, 8h20
  - Air Caraïbes (FDF→ORY) : €640 moy, 8h35

- **GF → Paris** : 2 options (€720-€750 moyenne)
  - Air France (CAY→CDG) : €750 moy, 8h50
  - Air Caraïbes (CAY→ORY) : €720 moy, 9h00

- **RE → Paris** : 2 options (€800-€850 moyenne)
  - Air France (RUN→CDG) : €850 moy, 11h00
  - Corsair (RUN→ORY) : €800 moy, 11h15

- **Inter-îles** :
  - GP → MQ : €120 moy, 40min, quotidien
  - GP → Saint-Barthélemy : €140 moy, 15min

**Structure de données** :
```typescript
{
  id: string,
  provider: string,
  route: {
    from: string,
    to: string,
    fromCode: string,  // Code IATA
    toCode: string
  },
  price: {
    min: number,
    max: number,
    average: number,
    currency: "EUR"
  },
  duration: string,
  frequency: string,
  reliability: {
    score: 85-96,
    level: "high",
    confirmations: 22-50
  }
}
```

---

#### 2. 🚢 Transport Maritime (5 routes)

**Opérateurs** :
- L'Express des Îles (liaisons principales)
- Jeans for Freedom (liaisons locales)

**Routes** :
- **GP → MQ** : €95 moy, 3h30, quotidien
- **GP → Dominique** : €80 moy, 2h45, 5×/semaine
- **GP → Marie-Galante** : €42 moy, 45min, quotidien
- **Trois-Rivières → Les Saintes** : €35 moy, 20min, quotidien
- **MQ → Sainte-Lucie** : €90 moy, 1h30, 4×/semaine

**Tarification** :
- Prix minimum : passager seul
- Prix maximum : passager + véhicule
- Prix moyen : passager + options standards

**Structure de données** :
```typescript
{
  id: string,
  provider: string,
  route: {
    from: string,
    to: string
  },
  price: {
    min: number,  // Passager
    max: number,  // + véhicule
    average: number
  },
  duration: string,
  frequency: string,
  reliability: { score: 87-93, level: "high" }
}
```

---

#### 3. 📡 Internet (10 offres)

**Fournisseurs** :
- **Orange Caraïbe** : Leader fibre/ADSL
- **SFR Caraïbe** : Alternative compétitive
- **Only** : Opérateur low-cost (GP uniquement)

**Offres par territoire** :

**Guadeloupe** (4 offres) :
- Orange Fibre 300 : 300/100 Mbps, €39.99/mois + TV + appels
- Orange Fibre 1 Gb : 1000/400 Mbps, €49.99/mois + TV 4K
- SFR Fibre 500 : 500/200 Mbps, €42.99/mois + TV
- Only Fibre 300 : 300/100 Mbps, €34.99/mois (sans TV, sans engagement)

**Martinique** (2 offres) :
- Orange Fibre 300 : €39.99/mois
- SFR Fibre 500 : €42.99/mois

**Guyane** (1 offre) :
- Orange Fibre 300 : €44.99/mois (infrastructure + coûteuse)

**Réunion** (2 offres) :
- Orange Fibre 500 : €41.99/mois
- SFR Fibre 1 Gb : €45.99/mois

**Caractéristiques** :
- Vitesses : 300 Mbps - 1 Gbps download
- TV incluse (150-200 chaînes) ou sans TV
- Appels illimités fixes + mobiles
- Installation : €39-€59
- Engagement : 12 mois ou sans engagement

**Structure de données** :
```typescript
{
  id: string,
  provider: string,
  name: string,
  speed: {
    download: number,  // Mbps
    upload: number
  },
  price: {
    monthly: number,
    installation?: number
  },
  features: string[],  // ["TV incluse", "Appels illimités"]
  commitment: string,  // "12 mois" | "sans engagement"
  reliability: { score: 88-96, level: "high" }
}
```

---

#### 4. 📱 Mobile (12 offres)

**Opérateurs** :
- **Orange Caraïbe Mobile** : Meilleure couverture
- **SFR Caraïbe Mobile** : Compétitif
- **Digicel** : Alternative locale

**Offres par territoire** :

**Guadeloupe** (4 offres) :
- Orange 20 Go : €19.99/mois, appels illimités
- Orange 100 Go : €29.99/mois, appels illimités, 4G+
- SFR 50 Go : €24.99/mois, appels/SMS illimités
- Digicel 30 Go : €22.99/mois, appels illimités

**Martinique** (2 offres) :
- Orange 20 Go : €19.99/mois
- SFR 50 Go : €24.99/mois

**Guyane** (2 offres) :
- Orange 20 Go : €21.99/mois (légèrement plus cher)
- Digicel 40 Go : €25.99/mois

**Réunion** (2 offres) :
- Orange 40 Go : €23.99/mois
- SFR 80 Go : €27.99/mois

**Caractéristiques** :
- Data : 20 GB - 100 GB
- Appels illimités
- SMS/MMS illimités
- 4G/4G+
- Sans engagement

**Structure de données** :
```typescript
{
  id: string,
  provider: string,
  name: string,
  data: number,  // GB
  price: {
    monthly: number
  },
  features: string[],
  commitment: string,
  reliability: { score: 87-95, level: "high" }
}
```

---

#### 5. 💧 Eau (9 communes)

**Fournisseurs par territoire** :
- **GP** : Générale des Eaux Guadeloupe
- **MQ** : ODYSSI
- **GF** : SGEG
- **RE** : CISE Réunion

**Tarification** :

**Guadeloupe** (3 communes) :
- **Pointe-à-Pitre** : €8.50/mois + €2.85/m³ → €45/mois moy
- **Le Gosier** : €8.50/mois + €2.90/m³ → €47/mois moy
- **Baie-Mahault** : €8.50/mois + €2.88/m³ → €46/mois moy

**Martinique** (2 communes) :
- **Fort-de-France** : €9.20/mois + €3.10/m³ → €52/mois moy
- **Schoelcher** : €9.20/mois + €3.05/m³ → €51/mois moy

**Guyane** (2 communes) :
- **Cayenne** : €10.50/mois + €3.45/m³ → €60/mois moy
- **Rémire-Montjoly** : €10.50/mois + €3.50/m³ → €62/mois moy

**Réunion** (2 communes) :
- **Saint-Denis** : €7.80/mois + €2.65/m³ → €42/mois moy
- **Saint-Pierre** : €7.80/mois + €2.70/m³ → €43/mois moy

**Consommations moyennes** :
- Petit foyer : 8 m³/mois
- Foyer moyen : 12 m³/mois
- Grand foyer : 20 m³/mois

**Structure de données** :
```typescript
{
  id: string,
  provider: string,
  territory: TerritoryCode,
  commune: string,
  price: {
    fixedMonthly: number,
    perCubicMeter: number
  },
  averageMonthlyBill: {
    min: number,
    average: number,
    max: number
  },
  reliability: { score: 87-94, level: "high" }
}
```

---

#### 6. ⚡ Électricité (11 options)

**Fournisseur** : EDF (monopole dans les DOM)
- EDF Guadeloupe
- EDF Martinique
- EDF Guyane
- EDF Réunion

**Types d'offres** :
- **Base** : Même tarif toute la journée
- **Heures Creuses** : Tarif réduit 8h/jour (nuit)
- **Tempo** : Tarifs variables (à venir)

**Tarification par territoire** :

**Guadeloupe** (3 options) :
- Base 6 kVA : €13.50/mois + €0.1825/kWh → €95/mois moy
- Base 9 kVA : €18.20/mois + €0.1825/kWh → €130/mois moy
- HC 6 kVA : €15.20/mois + €0.1950/€0.1450 kWh → €90/mois moy

**Martinique** (3 options) :
- Base 6 kVA : €13.80/mois + €0.1850/kWh → €97/mois moy
- Base 9 kVA : €18.50/mois + €0.1850/kWh → €132/mois moy
- HC 6 kVA : €15.50/mois + €0.1975/€0.1475 kWh → €92/mois moy

**Guyane** (2 options) :
- Base 6 kVA : €14.50/mois + €0.1950/kWh → €105/mois moy
- Base 9 kVA : €19.50/mois + €0.1950/kWh → €140/mois moy

**Réunion** (3 options) :
- Base 6 kVA : €12.80/mois + €0.1750/kWh → €90/mois moy
- Base 9 kVA : €17.20/mois + €0.1750/kWh → €125/mois moy
- HC 6 kVA : €14.50/mois + €0.1875/€0.1375 kWh → €85/mois moy

**Puissances disponibles** :
- 3 kVA : Petit logement
- 6 kVA : Standard (le plus courant)
- 9 kVA : Grand logement
- 12 kVA : Très grand logement

**Structure de données** :
```typescript
{
  id: string,
  provider: string,
  territory: TerritoryCode,
  offerType: "base" | "heures_creuses" | "tempo",
  price: {
    subscription: number,
    perKwh: number,
    perKwhOffPeak?: number
  },
  power: number,  // kVA
  averageMonthlyBill: {
    min: number,
    average: number,
    max: number
  },
  reliability: { score: 92-97, level: "high" }
}
```

---

## 🎯 Fonctionnalités du Comparateur

### Interface Utilisateur

**Sélection de service** :
- 6 boutons visuels avec icônes
- Changement de vue dynamique
- Statistiques en temps réel

**Filtres intelligents** :
- **Vols** : Origine, destination, code aéroport
- **Bateaux** : Port départ, port arrivée
- **Internet** : Territoire, vitesse minimale (slider 50-1000 Mbps)
- **Mobile** : Territoire, data minimale (slider 5-100 GB)
- **Eau** : Territoire, commune
- **Électricité** : Territoire, puissance (3-12 kVA), type d'offre

**Affichage des résultats** :
- Liste triée par prix moyen
- Badges de fiabilité colorés (vert/jaune/orange)
- Détails complets : prix min/moy/max, caractéristiques
- Durée, fréquence pour transports
- Features pour télécoms
- Estimation consommation pour utilities

### Système de Fiabilité

**Scores** : 85-97%
**Niveaux** :
- High (85-100%) : Vert
- Medium (70-84%) : Jaune
- Low (<70%) : Orange

**Sources de données** :
- Official API (sites opérateurs)
- Field observation (relevés terrain)
- User receipts (factures utilisateurs)
- User reports (signalements communautaires)

---

## 🔌 API / Service Layer

### `serviceComparisonService.ts`

**Fonctions principales** :

```typescript
// Chargement de la base
loadServicesDatabase(): Promise<ServicesDatabase>

// Providers
getAllProviders(): Promise<ServiceProvider[]>
getProvidersByTerritory(territory: TerritoryCode): Promise<ServiceProvider[]>
getProvidersByType(type: string): Promise<ServiceProvider[]>

// Recherche par catégorie
searchFlights(params: { from?, to? }): Promise<FlightPrice[]>
searchBoats(params: { from?, to? }): Promise<BoatPrice[]>
searchInternet(params: { territory?, minSpeed?, maxPrice? }): Promise<InternetSubscription[]>
searchMobile(params: { territory?, minData?, maxPrice? }): Promise<MobileSubscription[]>
searchWater(params: { territory?, commune? }): Promise<WaterUtility[]>
searchElectricity(params: { territory?, power?, offerType? }): Promise<ElectricityUtility[]>

// Statistiques
getServiceStatistics(): Promise<Statistics>
```

**Cache** : Base de données en mémoire après premier chargement

---

## 📈 Statistiques Globales

### Couverture

- **Fournisseurs** : 20+
  - 4 compagnies aériennes
  - 2 opérateurs maritimes
  - 3 FAI
  - 3 opérateurs mobiles
  - 4 compagnies d'eau
  - 4 branches EDF

- **Offres totales** : 59
  - 12 routes aériennes
  - 5 routes maritimes
  - 10 forfaits internet
  - 12 forfaits mobile
  - 9 tarifications eau
  - 11 tarifications électricité

- **Territoires** : 4
  - Guadeloupe (GP)
  - Martinique (MQ)
  - Guyane (GF)
  - La Réunion (RE)

### Mise à Jour

- **Fréquence** : Hebdomadaire
- **Source** : Sites officiels opérateurs
- **Vérification** : Confirmations multiples
- **Date dernière MAJ** : 2025-01-05

---

## 🚀 Utilisation

### Routes

- Route principale : `/comparateur-services`
- Route alternative : `/services`

### Navigation

Accessible depuis :
- Menu principal
- Comparateur produits (lien croisé)
- Page d'accueil (module dédié)

### Intégration

```typescript
import ServiceComparator from './pages/ServiceComparator';

<Route path="comparateur-services" element={<ServiceComparator />} />
<Route path="services" element={<ServiceComparator />} />
```

---

## 📦 Bundle

- **Taille** : 19.86 kB
- **Gzip** : 4.47 kB
- **TypeScript** : Fully typed
- **Build time** : +0.5s

---

## ✅ Conformité

### Données
- ✅ Lecture seule
- ✅ Sources officielles tracées
- ✅ Mise à jour datée
- ✅ Avertissement explicite (indicatif)
- ✅ Aucune promesse contractuelle

### Technique
- ✅ TypeScript strict
- ✅ Error handling complet
- ✅ Loading states
- ✅ Empty states
- ✅ Mobile responsive

### Sécurité
- ✅ Aucune donnée sensible
- ✅ Aucun tracking utilisateur
- ✅ RGPD compliant
- ✅ Static JSON (CDN-ready)

---

## 🎨 Design

- Tailwind CSS
- Icons: Lucide React
- Palette cohérente avec produits
- Mobile-first responsive
- Accessibility considérée

---

## 🔜 Évolutions Futures

### Court terme
- [ ] Ajout promotions temporaires
- [ ] Calcul économies annuelles
- [ ] Export PDF comparaison

### Moyen terme
- [ ] Intégration API temps réel
- [ ] Historique prix services
- [ ] Alertes changement tarifs
- [ ] Contributions citoyennes

### Long terme
- [ ] Saint-Martin, Saint-Barthélemy
- [ ] Mayotte, Saint-Pierre-et-Miquelon
- [ ] Wallis-et-Futuna, Polynésie
- [ ] Nouvelle-Calédonie

---

**Version** : 5.0.0  
**Date** : 2025-01-07  
**Statut** : Production Ready ✅
