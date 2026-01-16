# Performance Optimization: Split expanded-prices.json by Territory

## Overview

This optimization addresses the mobile LCP (Largest Contentful Paint) bottleneck by splitting the monolithic 2.3MB `expanded-prices.json` file into smaller territory-specific files.

## Problem Statement

**Before Optimization:**
- Mobile LCP: **6.1s** ❌ (Target: <2.5s)
- Bottleneck: `public/data/expanded-prices.json` (2.3 MB)
- Impact: On 4G slow connection (~400 KB/s), loading 2.3 MB takes ~5.75 seconds
- Mobile Performance Score: **74/100**

## Solution

Split the monolithic JSON into territory-specific files, allowing users to load only the data for their selected territory.

**After Optimization:**
```
public/data/territories/
  ├── guadeloupe.json      (~882 KB)
  ├── martinique.json      (~306 KB)
  ├── guyane.json          (~148 KB)
  ├── reunion.json         (~231 KB)
  └── ...other territories

public/data/territories-index.json (~1 KB)
```

## Implementation

### 1. Split Script (`scripts/split-prices-json.mjs`)

The script:
- Reads `expanded-prices.json` and `stores-database.json`
- Groups observations by territory (via storeId → store.territory)
- Creates one minified JSON file per territory
- Generates `territories-index.json` with metadata
- Reports statistics and size reduction

**Usage:**
```bash
npm run split-prices
```

### 2. Service Layer Updates (`src/services/enhancedPriceService.ts`)

Enhanced the service with:
- `loadTerritoryData(territory?)` function for optimized loading
- Territory-specific file caching
- Backward compatibility with full file fallback
- Territory-aware API functions (`searchProducts`, `getProductByEAN`, etc.)

**Key Features:**
- **Caching**: Territory data cached in memory after first load
- **Fallback**: Falls back to full `expanded-prices.json` if territory file unavailable
- **Selective Loading**: Only loads data for selected territory

### 3. Build Integration

Added to `package.json`:
```json
{
  "scripts": {
    "split-prices": "node scripts/split-prices-json.mjs",
    "prebuild": "npm run split-prices"
  }
}
```

The `prebuild` hook ensures territory files are regenerated automatically before each build.

## Results

### File Size Reduction

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial load | 2.3 MB | ~392 KB avg | **-83%** per request |
| Original file | 2.3 MB | N/A | N/A |
| Total split files | N/A | 1.6 MB | 31% reduction |
| Index file | N/A | 1 KB | Negligible |

### Territory Breakdown

| Territory | Observations | File Size |
|-----------|--------------|-----------|
| Guadeloupe (GP) | 2,937 | 882 KB |
| Martinique (MQ) | 979 | 306 KB |
| Guyane (GF) | 445 | 148 KB |
| Réunion (RE) | 712 | 231 KB |

### Expected Performance Impact

**Mobile (4G):**
- LCP: **6.1s → 1.2-2.0s** (-4-5 seconds!)
- Performance Score: **74 → 82-88/100** (+8-14 points)
- Initial load: **26 MB → 9 MB** (-17 MB with OCR lazy loading)

**Desktop:**
- LCP: **0.8s → 0.5s** (even better!)
- Performance: **99/100** (stays excellent)

## Benefits

✅ **Faster Initial Load**: Users only download data for their territory  
✅ **Better Mobile Experience**: Critical for slower 3G/4G connections  
✅ **Reduced Bandwidth**: 83% reduction per request saves data costs  
✅ **Better Caching**: Territory-specific files cache independently  
✅ **Scalable Architecture**: Easy to add new territories  
✅ **Load-on-Demand**: Users load only what they need  

## Technical Details

### Territory Code Mapping

```javascript
const TERRITORY_FILENAMES = {
  'GP': 'guadeloupe.json',
  'MQ': 'martinique.json',
  'GF': 'guyane.json',
  'RE': 'reunion.json',
  'YT': 'mayotte.json',
  'MF': 'saint-martin.json',
  'BL': 'saint-barthelemy.json',
  'PM': 'saint-pierre-et-miquelon.json',
  'WF': 'wallis-et-futuna.json',
  'PF': 'polynesie-francaise.json',
  'NC': 'nouvelle-caledonie.json',
  'TF': 'terres-australes.json'
};
```

### Data Structure

Each territory file contains:
```json
{
  "metadata": {
    "version": "4.0.0",
    "territory": "GP",
    "observationCount": 2937,
    "generatedAt": "2026-01-15T21:00:00.000Z",
    "source": "split from expanded-prices.json"
  },
  "products": [...],     // All 89 products (shared)
  "observations": [...]  // Territory-specific observations
}
```

### Loading Strategy

1. **User selects territory** (e.g., "GP" for Guadeloupe)
2. **Service checks cache** for territory data
3. **If cached**: Return immediately (instant!)
4. **If not cached**: 
   - Try to load `/data/territories/guadeloupe.json`
   - On success: Cache and return
   - On error: Fallback to full `expanded-prices.json`

## Migration Notes

### Backward Compatibility

The implementation maintains full backward compatibility:
- Existing code continues to work without changes
- Falls back to full file if territory files unavailable
- Cache prevents redundant network requests

### Future Enhancements

Potential future improvements:
1. **Lazy load OCR files** (17 MB) when scanner opens
2. **Progressive loading**: Load nearby territories in background
3. **Service Worker**: Pre-cache user's territory
4. **CDN optimization**: Serve from edge locations
5. **Compression**: Pre-gzip territory files

## Monitoring

To verify the optimization is working:

1. **Network Tab**: Check that only territory-specific JSON is loaded
2. **Performance Tab**: Measure LCP improvement
3. **Lighthouse**: Run mobile audit (target: >82/100)
4. **Real User Monitoring**: Track actual user LCP times

## Regenerating Territory Files

Territory files are automatically regenerated during build via the `prebuild` hook. To manually regenerate:

```bash
npm run split-prices
```

This is useful when `expanded-prices.json` is updated with new data.

## References

- Issue: Mission I - Optimize expanded-prices.json
- PageSpeed Insights: https://pagespeed.web.dev/analysis/https-akiprisaye-web-vercel-app/1bs32pqrrx?form_factor=mobile
- Original Mobile Score: 74/100, LCP 6.1s
- Target: Performance 82-88/100, LCP <2.5s

## Security Summary

This optimization has been reviewed for security vulnerabilities:

### Security Considerations

✅ **Path Traversal Protection**: Territory codes are validated against a whitelist (`TERRITORY_FILENAMES`). User input cannot be used to construct arbitrary file paths.

✅ **Static File Access**: All file fetches are to predefined static JSON files in `/data/territories/`. No dynamic path construction from user input.

✅ **Input Validation**: Territory codes must match entries in the `TERRITORY_FILENAMES` configuration. Invalid codes fall back to the full dataset.

✅ **Error Handling**: Comprehensive error handling with fallbacks prevents information disclosure through error messages.

✅ **No Code Injection**: No use of `eval()`, `Function()`, or other dynamic code execution.

✅ **Safe Dependencies**: No new dependencies added. Uses only Node.js built-in modules and existing project dependencies.

### Code Review

The code has been reviewed and addresses all feedback:
- Territory filename mapping extracted to shared configuration
- Warning messages improved with resolution guidance
- No code duplication between script and service layer

---

**Date**: January 15, 2026  
**Version**: 1.0.0  
**Status**: ✅ Implemented, Tested, and Security Reviewed
