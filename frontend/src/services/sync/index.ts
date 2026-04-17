// Aggregator robuste pour Vite/Rollup : évite les erreurs "is not exported".
// On tolère default export OU named exports, et on fournit toujours les alias attendus.

import * as schedulerMod from './syncScheduler';
import * as loggerMod from './syncLogger';
import * as openPricesMod from './openPricesService';
import * as offMod from './openFoodFactsService';
import * as conflictMod from './conflictResolver';

export * from './types';
export * from './openFoodFactsService';
export * from './openPricesService';
export * from './conflictResolver';
export * from './syncLogger';
export * from './syncScheduler';

export const syncSchedulerService =
  (schedulerMod as any).syncSchedulerService ?? (schedulerMod as any).default ?? schedulerMod;

export const syncLoggerService =
  (loggerMod as any).syncLoggerService ?? (loggerMod as any).default ?? loggerMod;

export const openPricesService =
  (openPricesMod as any).openPricesService ?? (openPricesMod as any).default ?? openPricesMod;

export const openFoodFactsService =
  (offMod as any).openFoodFactsService ?? (offMod as any).default ?? offMod;

export const conflictResolverService =
  (conflictMod as any).conflictResolverService ?? (conflictMod as any).default ?? conflictMod;
