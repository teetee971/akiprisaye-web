import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Zod schemas pour la validation des données A KI PRI SA YÉ
export const priceHistoryEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  price: z.number().min(0, "Price must be positive"),
});

export const productSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  price: z.number().min(0, "Price must be positive"),
  store: z.string().min(1, "Store is required"),
  territory: z.string().min(1, "Territory is required"),
  updatedAt: z.string().min(1, "UpdatedAt is required"),
  imageUrl: z.string().min(1, "Image URL is required").refine(
    (url) => url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://'),
    "Image URL must be a valid absolute or relative path"
  ),
  priceHistory: z.array(priceHistoryEntrySchema),
});

export const storeSchema = z.object({
  id: z.string().min(1, "Store ID is required"),
  name: z.string().min(1, "Store name is required"),
  territories: z.array(z.string().min(1, "Territory ID is required")),
  averageScore: z.number().min(0).max(5, "Average score must be between 0 and 5"),
  priceIndex: z.number().min(0, "Price index must be positive"),
  stabilityScore: z.number().min(0).max(5, "Stability score must be between 0 and 5"),
  availabilityScore: z.number().min(0).max(5, "Availability score must be between 0 and 5"),
  logo: z.string().min(1, "Logo URL is required").refine(
    (url) => url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://'),
    "Logo URL must be a valid absolute or relative path"
  ),
  storeCount: z.number().int().min(0, "Store count must be a non-negative integer"),
});

export const territorySchema = z.object({
  id: z.string().min(1, "Territory ID is required"),
  name: z.string().min(1, "Territory name is required"),
  lat: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  lng: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  population: z.number().int().min(0, "Population must be a non-negative integer"),
  priceIndex: z.number().min(0, "Price index must be positive"),
  storeCount: z.number().int().min(0, "Store count must be a non-negative integer"),
});

export const filtersSchema = z.object({
  search: z.string(),
  category: z.string(),
  store: z.string(),
  territory: z.string(),
});

// Array schemas for validation of complete datasets
export const productsArraySchema = z.array(productSchema);
export const storesArraySchema = z.array(storeSchema);
export const territoriesArraySchema = z.array(territorySchema);

// Types pour l'application A KI PRI SA YÉ (inférés des schemas zod)
export type PriceHistoryEntry = z.infer<typeof priceHistoryEntrySchema>;
export type Product = z.infer<typeof productSchema>;
export type Store = z.infer<typeof storeSchema>;
export type Territory = z.infer<typeof territorySchema>;
export type Filters = z.infer<typeof filtersSchema>;

// Types pour les actions de comparaison
export interface CompareToggleResult {
  success: boolean;
  action: 'added' | 'removed' | 'blocked';
  message: string;
  currentCount: number;
}

export interface ProductsContextType {
  // Data states
  products: Product[];
  stores: Store[];
  territories: Territory[];
  loading: boolean;
  error: string | null;
  
  // Filter states
  filters: Filters;
  filteredProducts: Product[];
  
  // Comparison and user list states
  compareList: string[];
  userList: string[];
  
  // Derived selectors
  compareProducts: Product[];
  
  // Actions
  setFilters: (newFilters: Partial<Filters>) => void;
  toggleCompare: (productId: string) => CompareToggleResult;
  addToList: (productId: string) => void;
  removeFromList: (productId: string) => void;
  clearFilters: () => void;
  clearCompareList: () => void;
}
