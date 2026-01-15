# How to Add a New Territory

## Single-File Territory Management ⭐

Adding a new territory to AkiPriSaYe requires modifying **only one file**: `src/constants/territories.ts`

No need to touch:
- ❌ Components
- ❌ Routing configuration  
- ❌ Business logic
- ❌ Database schemas
- ❌ API endpoints

---

## Step-by-Step Guide

### Step 1: Add Territory ID to Type

Open `src/constants/territories.ts` and add the new territory code to the `TerritoryId` type:

```typescript
export type TerritoryId = 
  | 'GP' // Guadeloupe
  | 'MQ' // Martinique
  | 'GF' // Guyane
  | 'RE' // La Réunion
  | 'YT' // Mayotte
  | 'PF' // Polynésie française
  | 'NC' // Nouvelle-Calédonie
  | 'WF' // Wallis-et-Futuna
  | 'MF' // Saint-Martin
  | 'BL' // Saint-Barthélemy
  | 'PM' // Saint-Pierre-et-Miquelon
  | 'TF' // TAAF
  | 'FR' // France métropolitaine
  | 'SM'; // ← ADD YOUR NEW TERRITORY HERE
```

### Step 2: Add Territory Configuration

In the same file, add the complete territory configuration to the `TERRITORIES` object:

```typescript
export const TERRITORIES: Record<TerritoryId, Territory> = {
  // ... existing territories ...
  
  // ============ Your New Territory ============
  SM: {
    code: 'SM',
    name: 'Saint-Martin (NL)',
    fullName: 'Partie néerlandaise de Saint-Martin',
    type: 'Autres',              // DROM | COM | Autres | Metro
    inseeCode: undefined,         // INSEE code if available
    center: { lat: 18.0425, lng: -63.0548 }, // Geographic center
    zoom: 12,                     // Default map zoom level
    flag: '🇸🇽',                   // Emoji flag
    active: true,                 // Enable this territory
    currency: 'ANG',              // ISO 4217 currency code
    locale: 'nl-SX',              // BCP 47 locale code
    timezone: 'America/Lower_Princes', // IANA timezone
    meta: { 
      country: 'Netherlands',
      region: 'Caribbean'
    },
  },
};
```

### Step 3: Done! ✅

That's it! Your new territory is now automatically available in:

- ✅ **All dropdowns and selectors** - Territory selector components
- ✅ **Territory filters** - Filter bars, search forms
- ✅ **Map displays** - Interactive maps with proper center/zoom
- ✅ **Price comparisons** - Multi-territory price analysis
- ✅ **Statistics dashboards** - Aggregate data views
- ✅ **Price formatting** - Correct currency and locale formatting
- ✅ **API queries** - Filtered by territory code
- ✅ **Reports and exports** - Territory-specific data

---

## Configuration Fields Reference

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `code` | `TerritoryId` | Unique territory identifier (2-letter ISO or custom) | `'GP'` |
| `name` | `string` | Short display name | `'Guadeloupe'` |
| `fullName` | `string` | Official full name | `'Département de la Guadeloupe'` |
| `type` | `'DROM' \| 'COM' \| 'Autres' \| 'Metro'` | Territory classification | `'DROM'` |
| `center` | `{ lat: number, lng: number }` | Geographic center coordinates | `{ lat: 16.265, lng: -61.551 }` |
| `zoom` | `number` | Default map zoom level (6-13) | `11` |
| `flag` | `string` | Unicode emoji flag | `'🇬🇵'` |
| `active` | `boolean` | Enable/disable territory | `true` |
| `currency` | `string` | ISO 4217 currency code | `'EUR'` or `'XPF'` |
| `locale` | `string` | BCP 47 locale for formatting | `'fr-FR'` |
| `timezone` | `string` | IANA timezone identifier | `'America/Guadeloupe'` |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `inseeCode` | `string?` | INSEE official code | `'971'` |
| `meta` | `object?` | Additional metadata | `{ country: 'France', region: 'Antilles' }` |

---

## Territory Types

Choose the appropriate type for your territory:

- **`DROM`** - Département et Région d'Outre-Mer (GP, MQ, GF, RE, YT)
- **`COM`** - Collectivité d'Outre-Mer (PF, NC, WF, MF, BL, PM)
- **`Autres`** - Other territories (TF, special cases)
- **`Metro`** - Metropolitan France (FR - for comparisons)

---

## Currency Codes Reference

Common currencies in French territories:

- **EUR** - Euro (DROM, most COM)
- **XPF** - CFP Franc (Polynésie française, Nouvelle-Calédonie, Wallis-et-Futuna)
- **USD** - US Dollar (if applicable)
- **ANG** - Netherlands Antillean Guilder (Sint Maarten NL part)

Full list: [ISO 4217 currency codes](https://en.wikipedia.org/wiki/ISO_4217)

---

## Timezone Reference

Find IANA timezone identifiers:

- Americas: `America/Guadeloupe`, `America/Martinique`, `America/Cayenne`, `America/Miquelon`
- Indian Ocean: `Indian/Reunion`, `Indian/Mayotte`, `Indian/Kerguelen`
- Pacific: `Pacific/Tahiti`, `Pacific/Noumea`, `Pacific/Wallis`
- Europe: `Europe/Paris` (Metropolitan France)

Full list: [IANA Time Zone Database](https://www.iana.org/time-zones)

---

## Helper Functions Available

Once you've added your territory, use these functions throughout the codebase:

### Get Territory Info
```typescript
import { getTerritory } from '@/constants/territories';

const territory = getTerritory('SM');
console.log(territory.name);      // "Saint-Martin (NL)"
console.log(territory.currency);  // "ANG"
console.log(territory.timezone);  // "America/Lower_Princes"
```

### Get All Active Territories
```typescript
import { getActiveTerritories } from '@/constants/territories';

const territories = getActiveTerritories();
// Returns array of all territories where active === true
```

### Get Dropdown Options
```typescript
import { getTerritoriesAsOptions } from '@/constants/territories';

const options = getTerritoriesAsOptions(includeAll: true);
// Returns: [
//   { value: 'ALL', label: '🌍 Tous les territoires' },
//   { value: 'GP', label: '🇬🇵 Guadeloupe' },
//   { value: 'SM', label: '🇸🇽 Saint-Martin (NL)' },
//   ...
// ]
```

### Format Price for Territory
```typescript
import { formatPriceForTerritory } from '@/constants/territories';

const price1 = formatPriceForTerritory(99.99, 'GP');
// "99,99 €" (Euro with French formatting)

const price2 = formatPriceForTerritory(5000, 'PF');
// "5 000 XPF" (CFP Franc with appropriate formatting)

const price3 = formatPriceForTerritory(50, 'SM');
// "50,00 ANG" (Netherlands Antillean Guilder)
```

---

## Testing Your New Territory

After adding a territory, verify it works correctly:

### 1. Build Test
```bash
npm run build
```
Should complete with no TypeScript errors.

### 2. Unit Tests
```bash
npm run test:ci
```
All existing tests should still pass.

### 3. Manual Verification

Visit these pages to verify the territory appears:

- **Territory Selector** - Check dropdown menus
- **Price Comparisons** - Verify territory in comparison tables
- **Map View** - Ensure map centers correctly
- **Statistics Dashboard** - Check territory in data filters
- **Reports** - Verify territory-specific exports work

---

## Common Currencies by Region

### Euro (EUR) - €
- Guadeloupe (GP)
- Martinique (MQ)
- Guyane (GF)
- La Réunion (RE)
- Mayotte (YT)
- Saint-Martin FR (MF)
- Saint-Barthélemy (BL)
- Saint-Pierre-et-Miquelon (PM)
- Metropolitan France (FR)

### CFP Franc (XPF) - F
- Polynésie française (PF)
- Nouvelle-Calédonie (NC)
- Wallis-et-Futuna (WF)

---

## Example: Real-World Addition

### Adding Clipperton Island

```typescript
// 1. Add to TerritoryId type
export type TerritoryId = 
  // ... existing IDs
  | 'CP'; // Clipperton

// 2. Add to TERRITORIES
export const TERRITORIES: Record<TerritoryId, Territory> = {
  // ... existing territories
  
  CP: {
    code: 'CP',
    name: 'Clipperton',
    fullName: 'Île de Clipperton (Île de la Passion)',
    type: 'Autres',
    inseeCode: '989',
    center: { lat: 10.3, lng: -109.22 },
    zoom: 12,
    flag: '🇨🇵',
    active: false, // No permanent population
    currency: 'EUR', // Administered by France
    locale: 'fr-FR',
    timezone: 'Etc/GMT+10', // ~10 hours behind UTC
    meta: { 
      country: 'France',
      region: 'Pacific Ocean',
      note: 'Uninhabited atoll'
    },
  },
};
```

Result: Clipperton is now in the system but `active: false` means it won't appear in dropdowns by default.

---

## Feature Flags

Use the `active` field as a simple feature flag:

- `active: true` - Territory appears in all selectors and filters
- `active: false` - Territory exists in data but hidden from users

This is useful for:
- Testing new territories before public launch
- Temporarily disabling territories with data issues
- Phased rollout of coverage

---

## Best Practices

### ✅ DO

- Use official ISO codes when available (GP, MQ, etc.)
- Include accurate geographic coordinates
- Use correct ISO 4217 currency codes
- Set `active: false` for territories without data
- Add helpful metadata in the `meta` field
- Use appropriate zoom levels (6-7 for large, 12-13 for small)

### ❌ DON'T

- Don't use custom codes when ISO codes exist
- Don't skip currency/locale/timezone (required for formatting)
- Don't set `active: true` without verifying data availability
- Don't use approximate coordinates (use precise center)
- Don't forget to add the ID to the `TerritoryId` type

---

## Support

If you encounter issues after adding a territory:

1. **Build errors?** - Check TypeScript type in `TerritoryId`
2. **Not appearing in dropdown?** - Verify `active: true`
3. **Wrong currency format?** - Check `currency` and `locale` fields
4. **Map positioning off?** - Verify `center` coordinates and `zoom`
5. **Timezone issues?** - Confirm IANA timezone is valid

---

## Summary

Adding a new territory is designed to be **simple and safe**:

1. Edit `src/constants/territories.ts`
2. Add territory ID to type
3. Add territory configuration object
4. Build & test
5. Deploy ✅

**No components modified. No routing changed. No business logic touched.**

This is the power of centralized configuration! 🚀

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-11  
**Maintainer**: Development Team
