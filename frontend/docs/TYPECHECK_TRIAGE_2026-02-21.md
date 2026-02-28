# Typecheck triage (2026-02-21)

## Command used

```bash
npm run -C frontend typecheck
```

## Result summary

- Total TS errors: **1230**
- Current typecheck status: **failing**
- Main issue is **pre-existing TS debt** unrelated to this PR scope (scanner/list UX)

## Top error codes (frequency)

1. `TS2532` — 382
2. `TS18048` — 232
3. `TS2322` — 166
4. `TS2345` — 96
5. `TS7016` — 81
6. `TS7006` — 59
7. `TS2339` — 32
8. `TS7005` — 30
9. `TS2305` — 28
10. `TS2304` — 18
11. `TS2307` — 14
12. `TS2367` — 12
13. `TS18047` — 11
14. `TS7031` — 9
15. `TS2769` — 8
16. `TS2459` — 6
17. `TS7053` — 5
18. `TS2552` — 5
19. `TS2538` — 5
20. `TS2724` — 4

## Top files (error volume)

1. `src/test/institutionalPortalService.test.ts` — 63
2. `src/components/__tests__/ProductSearch.debounce.test.tsx` — 33
3. `src/services/__tests__/priceComparisonService.test.ts` — 32
4. `src/services/__tests__/transportPriceService.test.ts` — 32
5. `src/services/productPhotoAnalysisService.ts` — 29
6. `src/services/__tests__/foodBasketService.test.ts` — 23
7. `src/portal/institutionalPortalService.ts` — 22
8. `src/services/indicatorCalculationService.ts` — 21
9. `src/components/ScanProductPWA.tsx` — 20
10. `src/services/__tests__/landMobilityPriceService.test.ts` — 20
11. `src/services/__tests__/housingCostService.test.ts` — 18
12. `src/services/__tests__/indicatorCalculationService.test.ts` — 18
13. `src/services/anomalyDetectionService.ts` — 18
14. `src/utils/cameraQualityAnalyzer.ts` — 18
15. `src/services/basketPricingService.ts` — 17
16. `src/services/ingredientEvolutionService.ts` — 17
17. `src/services/transportHistoryService.ts` — 16
18. `src/hooks/__tests__/useLocalHistory.test.ts` — 15
19. `src/services/foodBasketService.ts` — 14
20. `src/App.tsx` — 13

## Recommended strategy (single-path, minimal scope impact)

Chosen path: **keep typecheck non-blocking in merge gate for now**, and track TS debt remediation as a dedicated follow-up stream.

Why:
- Current PR scope is mobile scanner/list usability and OFF rendering.
- Fixing >1200 TS errors now would be a broad refactor with high regression risk.
- Existing workflows already run build+tests as hard checks and typecheck as informational in pre-merge context.

## Safe next steps (TS debt batching)

1. Batch A: `TS7016` + missing declaration shims (`*.d.ts`) for JS modules.
2. Batch B: nullability errors (`TS2532`, `TS18048`) in non-critical test files first.
3. Batch C: core services (`indicatorCalculationService`, `anomalyDetectionService`, `foodBasketService`).
4. Move to blocking typecheck only when total errors are near zero and CI is stable for 1-2 weeks.
