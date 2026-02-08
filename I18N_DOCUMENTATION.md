# Multi-Language Support (i18n) - AKiPriSaYe

## Overview

AKiPriSaYe supports 5 languages to serve users across French DOM-TOM territories:
- **Français (fr)** - French (universal)
- **Kréyòl Gwadloupéyen (gcf)** - Guadeloupean Creole
- **Kréyòl Matiniké (acf)** - Martinican Creole
- **Kréol Rényoné (rcf)** - Reunionese Creole
- **Kréyòl Gwiyanè (gcr)** - Guyanese Creole

## Architecture

### Core Files

```
frontend/
├── src/
│   ├── i18n/
│   │   ├── index.ts              # i18next configuration
│   │   └── languages.ts          # Language definitions
│   ├── components/i18n/
│   │   ├── LanguageSelector.tsx  # Language selector component
│   │   ├── LocalizedText.tsx     # Text localization component
│   │   ├── LanguageSuggestionModal.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   └── useLanguage.ts        # Language management hook
│   └── context/
│       └── LanguageProvider.tsx  # i18n context provider
└── public/
    └── locales/
        ├── fr/                   # French translations
        ├── gcf/                  # Guadeloupean Creole
        ├── acf/                  # Martinican Creole
        ├── rcf/                  # Reunionese Creole
        └── gcr/                  # Guyanese Creole
            ├── common.json       # Common UI elements
            ├── home.json         # Home page
            ├── store.json        # Store pages
            ├── search.json       # Search
            ├── product.json      # Products
            ├── cart.json         # Shopping cart
            ├── profile.json      # User profile
            ├── gamification.json # Gamification
            ├── alerts.json       # Alerts
            ├── map.json          # Map
            ├── inflation.json    # Inflation dashboard
            ├── reviews.json      # Reviews
            ├── errors.json       # Error messages
            └── validation.json   # Form validation
```

## Usage

### 1. Using the Translation Hook

The most common way to use translations is with the `useTranslation` hook:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');
  
  return (
    <div>
      <h1>{t('app.name')}</h1>
      <p>{t('app.tagline')}</p>
    </div>
  );
}
```

### 2. Using Multiple Namespaces

```tsx
import { useTranslation } from 'react-i18next';

function StoreInfo() {
  const { t } = useTranslation(['common', 'store']);
  
  return (
    <div>
      <h2>{t('store:details.title')}</h2>
      <button>{t('common:actions.save')}</button>
    </div>
  );
}
```

### 3. Interpolation

Pass dynamic values to translations:

```tsx
const { t } = useTranslation('store');

// Translation: "{{count}} avis"
<p>{t('reviews.count', { count: 5 })}</p>
// Output: "5 avis"

// Translation: "Ferme à {{time}}"
<p>{t('closesAt', { time: '18:00' })}</p>
// Output: "Ferme à 18:00"
```

### 4. Formatting Numbers, Dates, and Prices

Use the `useLocalizedFormat` hook for consistent formatting:

```tsx
import { useLocalizedFormat } from '../components/i18n/LocalizedText';

function PriceDisplay() {
  const { formatPrice, formatDate, formatPercent } = useLocalizedFormat();
  
  return (
    <div>
      <p>Prix: {formatPrice(12.99)}</p>
      <p>Date: {formatDate(new Date())}</p>
      <p>Remise: {formatPercent(15)}</p>
    </div>
  );
}
```

### 5. Language Selection

Add the language selector to your UI:

```tsx
import { LanguageSelector } from '../components/i18n';

function Settings() {
  return (
    <div>
      {/* Dropdown variant (default) */}
      <LanguageSelector />
      
      {/* Compact variant (just flag emoji) */}
      <LanguageSelector variant="compact" />
      
      {/* List variant (all languages displayed) */}
      <LanguageSelector variant="list" />
    </div>
  );
}
```

### 6. Using the Language Hook

For more advanced language management:

```tsx
import { useLanguage } from '../hooks/useLanguage';

function LanguageInfo() {
  const { 
    currentLanguage, 
    languages, 
    changeLanguage,
    isCreole 
  } = useLanguage();
  
  return (
    <div>
      <p>Current: {currentLanguage.native}</p>
      <p>Is Creole: {isCreole ? 'Yes' : 'No'}</p>
      
      <select onChange={(e) => changeLanguage(e.target.value)}>
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.native}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## Translation Files Structure

Each namespace JSON file follows this structure:

```json
{
  "category": {
    "key": "Translation text",
    "keyWithVar": "Text with {{variable}}",
    "nested": {
      "deepKey": "Deep translation"
    }
  }
}
```

### Common Namespace Keys

- `app.*` - Application name and branding
- `nav.*` - Navigation items
- `actions.*` - Action buttons (add, edit, delete, etc.)
- `auth.*` - Authentication related
- `status.*` - Status messages (loading, error, etc.)
- `time.*` - Time-related labels
- `units.*` - Measurement units
- `price.*` - Price-related labels
- `language.*` - Language selection

## Territory-Based Language Suggestions

The system automatically detects the user's territory and suggests the appropriate Creole language:

| Territory Code | Suggested Language |
|----------------|-------------------|
| GP | Guadeloupean Creole (gcf) |
| MQ | Martinican Creole (acf) |
| RE | Reunionese Creole (rcf) |
| GF | Guyanese Creole (gcr) |
| Others | French (fr) |

This is implemented via `LanguageSuggestionModal` which appears on first visit.

## Adding New Translations

### 1. Add to French Translation File

First, add the new key to the French version:

```json
// frontend/public/locales/fr/common.json
{
  "newFeature": {
    "title": "Nouveau titre",
    "description": "Description de la nouvelle fonctionnalité"
  }
}
```

### 2. Add to All Creole Languages

Then add the same keys to all Creole language files:
- `locales/gcf/common.json`
- `locales/acf/common.json`
- `locales/rcf/common.json`
- `locales/gcr/common.json`

### 3. Use in Components

```tsx
const { t } = useTranslation('common');

<h2>{t('newFeature.title')}</h2>
<p>{t('newFeature.description')}</p>
```

## Best Practices

### 1. Always Provide Fallback

```tsx
{t('key', { defaultValue: 'Fallback text' })}
```

### 2. Use Namespaces

Organize translations by feature/page for better maintainability:

```tsx
// Good
const { t } = useTranslation(['store', 'common']);
t('store:details.title')

// Avoid
const { t } = useTranslation();
t('storeDetailsTitle')
```

### 3. Keep Keys Descriptive

```tsx
// Good
t('store:priceIndex.cheap')

// Avoid
t('label1')
```

### 4. Handle Plurals

Use plural forms for count-based translations:

```json
{
  "items": "{{count}} article",
  "items_plural": "{{count}} articles"
}
```

### 5. Formatting in Translations

Use the built-in formatters for consistency:

```tsx
// Good
formatPrice(12.99)

// Avoid
`€${price.toFixed(2)}`
```

## Testing

Visit `/test-i18n` in development mode to test all language features:

```
http://localhost:3000/#/test-i18n
```

This page demonstrates:
- All language selector variants
- Translation interpolation
- Number/date/price formatting
- Namespace usage
- Language switching

## Configuration

The i18n configuration is in `frontend/src/i18n/index.ts`:

```typescript
i18n.init({
  fallbackLng: 'fr',              // Default language
  supportedLngs: [...],           // Supported languages
  ns: [...],                      // Namespaces
  defaultNS: 'common',            // Default namespace
  // ... other config
});
```

## Debugging

Enable i18n debugging in development:

```typescript
// In frontend/src/i18n/index.ts
i18n.init({
  debug: import.meta.env.DEV,  // Enable debug mode
  // ...
});
```

This will log:
- Missing translations
- Namespace loading
- Language changes

## Browser Language Detection

The system detects language in this order:
1. `localStorage` (user's saved preference)
2. URL query parameter (`?lang=gcf`)
3. Browser language
4. HTML lang attribute
5. Fallback to French

## Accessibility

The language selector components are fully accessible:
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Performance

- Translations are lazy-loaded per namespace
- Language files are cached in browser
- Tree-shaking removes unused translations in production
- Gzip compression on served translation files

## Support

For issues or questions about the i18n system:
1. Check the test page: `/test-i18n`
2. Review browser console for i18n errors
3. Verify translation files exist and are valid JSON
4. Check namespace is loaded in component

## Future Enhancements

Potential improvements for the i18n system:
- [ ] Translation management UI for contributors
- [ ] Automatic missing translation detection
- [ ] Translation memory/glossary
- [ ] Community translation platform
- [ ] Additional DOM-TOM languages (e.g., Mahorese, Tahitian)
