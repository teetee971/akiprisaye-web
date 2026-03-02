export * from './types';

// Exports ciblés pour éviter les collisions OFFProduct / QuantityParsed
export {
  parseQuantity,
  mapCategory,
  mapOFFToProduct,
  getProductByBarcode,
} from './openFoodFactsService';

export { levenshteinDistance } from './conflictResolver';

// Services (default exports)
export { default as openFoodFactsService } from './openFoodFactsService';
export { default as conflictResolverService } from './conflictResolver';
