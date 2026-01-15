# Company Registry Module

## Overview

The **Company Registry** is a centralized module providing institutional-grade management of company/enterprise data for the A KI PRI SA YÉ application. It enables tracking of stores' parent companies, their legal status, and business information.

## Key Features

- ✅ **Multi-identifier Lookup**: Retrieve company data using ANY single identifier (SIRET, SIREN, VAT, or internal ID)
- ✅ **Business Logic**: Automatic activity status derivation, SIREN/SIRET consistency checks
- ✅ **Validation**: Comprehensive validation of French business identifiers
- ✅ **Store Integration**: Link stores to their parent companies
- ✅ **Alert System Ready**: Detect inactive companies for consumer protection

## Data Model

### Company Interface

```typescript
interface Company {
  id: string;                    // Unique internal identifier
  
  // Official identifiers
  siretCode?: string;            // 14 digits - Establishment identifier
  sirenCode?: string;            // 9 digits - Company identifier
  vatCode?: string;              // FR + 2 chars + 9 digits
  
  // Identity
  legalName: string;             // Full legal name
  tradeName?: string;            // Commercial name
  
  // Legal status
  activityStatus: "ACTIVE" | "CEASED";
  creationDate: string;          // ISO 8601 (YYYY-MM-DD)
  cessationDate?: string;        // If CEASED
  
  // Location
  headOffice: HeadOffice;        // Address details
  geoLocation: GeoLocation;      // GPS coordinates
  
  // Metadata
  lastUpdate: string;            // ISO 8601
  source: CompanyDataSource;     // Data origin
}
```

### SIREN vs SIRET

- **SIREN** (9 digits): Identifies the company (1 SIREN → N establishments)
- **SIRET** (14 digits): SIREN + NIC (5 digits) = Identifies a specific establishment
- **Headquarters**: SIRET ending in `00001`

## Usage Examples

### 1. Basic Company Lookup

```typescript
import { getCompany } from '@/services/companyRegistryService';

// Lookup by ANY identifier
const company = getCompany('652200196');           // SIREN
const company2 = getCompany('65220019600018');     // SIRET
const company3 = getCompany('FR91652200196');      // VAT
const company4 = getCompany('company-carrefour-france'); // ID

// All return the same Company object
```

### 2. Store-Company Integration

```typescript
import { getStoreWithCompany } from '@/services/storeCompanyService';

// Get store with enriched company data
const store = getStoreWithCompany('carrefour_baie_mahault');

console.log(store.name);                    // "Carrefour Baie-Mahault"
console.log(store.company?.legalName);      // "Carrefour Hypermarchés SAS"
console.log(store.companyStatus);           // "ACTIVE"
console.log(store.isCompanyActive);         // true
```

### 3. Territory Filtering with Companies

```typescript
import { getStoresByTerritoryWithCompanies } from '@/services/storeCompanyService';

// Get all Guadeloupe stores with company info
const stores = getStoresByTerritoryWithCompanies('Guadeloupe');

stores.forEach(store => {
  console.log(`${store.name} - ${store.company?.tradeName}`);
  if (!store.isCompanyActive) {
    console.warn(`⚠️ Company inactive!`);
  }
});
```

### 4. Detecting Inactive Companies

```typescript
import { getStoresWithInactiveCompanies } from '@/services/storeCompanyService';

// Alert system: find stores with ceased companies
const inactiveStores = getStoresWithInactiveCompanies();

inactiveStores.forEach(store => {
  console.warn(
    `Alert: ${store.name} operated by ${store.company?.legalName} (CEASED)`
  );
});
```

### 5. Validation

```typescript
import {
  isValidSiret,
  isValidSiren,
  isValidVat,
  validateCompany
} from '@/utils/companyValidation';

// Validate identifiers
isValidSiret('65220019600018');        // true
isValidSiren('652200196');             // true
isValidVat('FR91652200196');           // true

// Validate complete company object
const result = validateCompany(company);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### 6. Multi-establishment Lookup

```typescript
import {
  getCompaniesBySiren,
  getHeadquarters
} from '@/services/companyRegistryService';

// Get all establishments for a SIREN
const establishments = getCompaniesBySiren('732829320');
console.log(`${establishments.length} establishments found`);

// Get headquarters
const hq = getHeadquarters('732829320');
console.log('HQ:', hq?.legalName);
```

## Integration Points

### A. Interactive Map

Display company information on store markers:

```typescript
const store = getStoreWithCompany(storeId);

// Map marker info
{
  name: store.name,
  company: store.company?.tradeName,
  status: store.companyStatus,
  badge: store.isCompanyActive ? '✅' : '❌'
}
```

### B. Ticket Scanner

Validate company status when scanning receipts:

```typescript
const company = getCompanyForStore(scannedStoreId);

if (company?.activityStatus === 'CEASED') {
  // Alert: "Product sold by inactive company"
  showAlert('⚠️ Company inactive in this territory');
}
```

### C. Store Listings

```typescript
const stores = getAllStoresWithCompanies();

return stores.map(store => ({
  name: store.name,
  location: store.city,
  companyName: store.company?.legalName,
  status: store.isCompanyActive ? 'Active' : 'Inactive',
  createdAt: store.company?.creationDate
}));
```

## API Reference

### Company Registry Service

| Function | Description | Returns |
|----------|-------------|---------|
| `getCompany(id)` | Universal lookup | `Company \| null` |
| `getCompanyBySiret(siret)` | Lookup by SIRET | `Company \| null` |
| `getCompaniesBySiren(siren)` | Get all establishments | `Company[]` |
| `getCompanyByVat(vat)` | Lookup by VAT | `Company \| null` |
| `getCompanyById(id)` | Lookup by internal ID | `Company \| null` |
| `searchCompanies(criteria)` | Advanced search | `Company[]` |
| `isCompanyActive(company)` | Check status | `boolean` |
| `getHeadquarters(siren)` | Get HQ for SIREN | `Company \| null` |

### Store-Company Service

| Function | Description | Returns |
|----------|-------------|---------|
| `initializeCompanyRegistry()` | Load seed data | `void` |
| `getCompanyForStore(storeId)` | Get company for store | `Company \| null` |
| `getStoreWithCompany(storeId)` | Enriched store data | `StoreWithCompany \| null` |
| `getAllStoresWithCompanies()` | All stores + companies | `StoreWithCompany[]` |
| `getStoresByTerritoryWithCompanies(territory)` | Territory filter | `StoreWithCompany[]` |
| `isStoreCompanyActive(storeId)` | Check company status | `boolean \| null` |
| `getStoresWithInactiveCompanies()` | Alert detection | `StoreWithCompany[]` |

### Validation Utils

| Function | Description | Returns |
|----------|-------------|---------|
| `isValidSiret(siret)` | Validate SIRET format | `boolean` |
| `isValidSiren(siren)` | Validate SIREN format | `boolean` |
| `isValidVat(vat)` | Validate VAT format | `boolean` |
| `normalizeSiret(siret)` | Clean SIRET | `string \| null` |
| `normalizeSiren(siren)` | Clean SIREN | `string \| null` |
| `normalizeVat(vat)` | Clean VAT | `string \| null` |
| `extractSirenFromSiret(siret)` | Get SIREN from SIRET | `string \| null` |
| `extractSirenFromVat(vat)` | Get SIREN from VAT | `string \| null` |
| `validateCompany(company)` | Full validation | `ValidationResult` |
| `deriveActivityStatus(date)` | Auto-derive status | `ActivityStatus` |

## Business Rules

### Activity Status

```typescript
if (cessationDate exists) {
  activityStatus = "CEASED";
} else {
  activityStatus = "ACTIVE";
}
```

### SIREN/SIRET Consistency

- SIRET must start with the company's SIREN
- One SIREN can have multiple SIRET (different establishments)
- Headquarters SIRET ends with `00001`

### VAT Format

French VAT: `FR` + 2 characters (key) + 9 digits (SIREN)
- Old format: numeric key (e.g., `FR32732829320`)
- New format: alphanumeric key (e.g., `FRA1732829320`)

## Seed Data

The module includes seed data for 12 major companies across multiple sectors:

### Metropolitan France:
1. **Carrefour Hypermarchés SAS** - SIREN: 652200196
2. **Système U Centrale Nationale** - SIREN: 305370809
3. **E.Leclerc** - SIREN: 380350448
4. **Groupement Les Mousquetaires (Intermarché)** - SIREN: 312827367
5. **Leader Price Distribution** - SIREN: 344812416
6. **Match Distribution** - SIREN: 322109027

### French Overseas Territories (DROM):

#### Retail & Distribution:
7. **Groupe Bernard Hayot (GBH)** - SIREN: 313222260 - Operates Carrefour franchises in Guadeloupe, Martinique, Guyane, La Réunion
8. **Groupe Caillé** - SIREN: 318065066 - Major retailer in La Réunion
9. **Groupe Parfait** - SIREN: 324567890 - Retail operations in Guadeloupe and Martinique
10. **Groupe Hayot-Sodiprav** - SIREN: 345123456 - Retail group in Martinique

#### Automotive & Mobility:
11. **Groupe Loret** - SIREN: 356789012 - Automotive concessions in Antilles and Guyane

#### Agro-food Industry:
12. **Sucreries de Bourbon** - SIREN: 367890123 - Sugar production and agro-industrial transformation in La Réunion

All seed companies are marked as `ACTIVE` with verified SIRET/SIREN/VAT codes.

### Multi-Sector Comparison Data

The module includes comparative price indices across three sectors:

- **Grande Distribution** (`src/data/groupes/grande_distribution.json`) - Food retail comparison
- **Distribution Automobile** (`src/data/groupes/distribution_automobile.json`) - Automotive sector comparison  
- **Agro-alimentaire** (`src/data/groupes/agro_alimentaire.json`) - Agro-food products comparison

Each comparison includes:
- Price difference indices (🔴 red: high, 🟠 orange: moderate, 🟢 green: competitive)
- Average price variance vs metropolitan France
- Territorial coverage
- Independent retailers as baseline reference

## Testing

The module has comprehensive test coverage (92 tests total):

```bash
npm test src/test/companyValidation.test.ts      # 35 tests
npm test src/test/companyRegistryService.test.ts # 37 tests
npm test src/test/storeCompanyService.test.ts    # 20 tests
```

## Future Enhancements

- [ ] Real-time sync with INSEE API
- [ ] Company status change history
- [ ] Reliability index based on consumer reports
- [ ] Link products to selling companies
- [ ] Open-data export (CSV/JSON)
- [ ] Company profile pages
- [ ] Advanced search filters

## Contributing

When adding new companies:

1. Verify SIRET/SIREN/VAT with official sources
2. Add to `src/data/seedCompanies.ts`
3. Link stores via `companyId` in `seedStores.js`
4. Add tests if needed
5. Validate with `validateStoreCompanyLinks()`

## License

Part of A KI PRI SA YÉ - Public interest / civic application.
