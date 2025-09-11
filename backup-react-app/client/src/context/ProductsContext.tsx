import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import type { Product, Store, Territory, Filters, ProductsContextType, CompareToggleResult } from '@shared/schema';
import { 
  productsArraySchema, 
  storesArraySchema, 
  territoriesArraySchema 
} from '@shared/schema';

// Import des données JSON
import productsData from '@/data/products.json';
import storesData from '@/data/stores.json';
import territoriesData from '@/data/territories.json';

// Création du contexte
const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

// Valeurs initiales pour les filtres
const initialFilters: Filters = {
  search: '',
  category: '',
  store: '',
  territory: '',
};

interface ProductsProviderProps {
  children: ReactNode;
}

export function ProductsProvider({ children }: ProductsProviderProps) {
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFiltersState] = useState<Filters>(initialFilters);
  
  // Safe localStorage helper functions
  const safeParseLocalStorage = (key: string, fallback: string[] = []): string[] => {
    if (typeof window === 'undefined') return fallback;
    
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return fallback;
      
      const parsed = JSON.parse(saved);
      // Validate that parsed result is an array of strings
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return parsed;
      }
      
      console.warn(`Invalid data format in localStorage for ${key}, using fallback`);
      return fallback;
    } catch (error) {
      console.warn(`Failed to parse localStorage data for ${key}:`, error);
      // Clear corrupted data
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to clear corrupted localStorage for ${key}:`, e);
      }
      return fallback;
    }
  };

  const safeSetLocalStorage = (key: string, value: string[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save to localStorage for ${key}:`, error);
    }
  };

  // Comparison and user list states (avec persistance localStorage sécurisée)
  const [compareList, setCompareList] = useState<string[]>(() => 
    safeParseLocalStorage('compareList', [])
  );

  const [userList, setUserList] = useState<string[]>(() => 
    safeParseLocalStorage('userList', [])
  );

  // Chargement initial des données avec validation zod
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulation d'un délai de chargement réaliste
        await new Promise(resolve => setTimeout(resolve, 500));

        // Validation des données avec zod
        console.log('Validation des données en cours...');
        
        const validatedProducts = productsArraySchema.parse(productsData);
        console.log(`✓ ${validatedProducts.length} produits validés`);
        
        const validatedStores = storesArraySchema.parse(storesData);
        console.log(`✓ ${validatedStores.length} magasins validés`);
        
        const validatedTerritories = territoriesArraySchema.parse(territoriesData);
        console.log(`✓ ${validatedTerritories.length} territoires validés`);

        // Validation de l'intégrité référentielle
        const storeIds = new Set(validatedStores.map(store => store.id));
        const territoryIds = new Set(validatedTerritories.map(territory => territory.id));
        
        const invalidProducts = validatedProducts.filter(product => 
          !storeIds.has(product.store) || !territoryIds.has(product.territory)
        );
        
        if (invalidProducts.length > 0) {
          console.warn(`⚠️ ${invalidProducts.length} produits avec références invalides:`, 
            invalidProducts.map(p => ({ id: p.id, store: p.store, territory: p.territory }))
          );
          throw new Error(`${invalidProducts.length} produits ont des références invalides vers des magasins ou territoires inexistants`);
        }

        console.log('✓ Intégrité référentielle validée');

        setProducts(validatedProducts);
        setStores(validatedStores);
        setTerritories(validatedTerritories);
        
        console.log('✓ Toutes les données ont été chargées et validées avec succès');
      } catch (err) {
        console.error('❌ Erreur lors du chargement/validation des données:', err);
        setError(err instanceof Error ? err.message : 'Erreur de validation des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Persistance des listes dans localStorage avec gestion d'erreurs
  useEffect(() => {
    safeSetLocalStorage('compareList', compareList);
  }, [compareList]);

  useEffect(() => {
    safeSetLocalStorage('userList', userList);
  }, [userList]);

  // Logique de filtrage côté client
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filtrage par recherche (nom, marque)
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm)
      );
    }

    // Filtrage par catégorie
    if (filters.category && filters.category !== '') {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Filtrage par enseigne
    if (filters.store && filters.store !== '') {
      filtered = filtered.filter(product => product.store === filters.store);
    }

    // Filtrage par territoire
    if (filters.territory && filters.territory !== '') {
      filtered = filtered.filter(product => product.territory === filters.territory);
    }

    return filtered;
  }, [products, filters]);

  // Sélecteur dérivé pour les produits en comparaison
  const compareProducts = useMemo(() => {
    return compareList.map(productId => 
      products.find(product => product.id === productId)
    ).filter(Boolean) as Product[];
  }, [products, compareList]);

  // Actions pour manipuler les filtres
  const setFilters = (newFilters: Partial<Filters>) => {
    setFiltersState(prevFilters => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  // Action pour réinitialiser les filtres
  const clearFilters = () => {
    setFiltersState(initialFilters);
  };

  // Actions pour la liste de comparaison avec UX améliorée (max 4 produits)
  const toggleCompare = (productId: string): CompareToggleResult => {
    let result: CompareToggleResult;

    setCompareList(prevList => {
      if (prevList.includes(productId)) {
        // Retirer de la comparaison
        const newList = prevList.filter(id => id !== productId);
        result = {
          success: true,
          action: 'removed',
          message: `Produit retiré de la comparaison`,
          currentCount: newList.length,
        };
        return newList;
      } else {
        // Ajouter à la comparaison (max 4)
        if (prevList.length >= 4) {
          // Bloquer l'ajout au lieu de remplacer
          result = {
            success: false,
            action: 'blocked',
            message: `Maximum de 4 produits en comparaison. Retirez un produit pour en ajouter un autre.`,
            currentCount: prevList.length,
          };
          return prevList; // Pas de changement
        } else {
          const newList = [...prevList, productId];
          result = {
            success: true,
            action: 'added',
            message: `Produit ajouté à la comparaison (${newList.length}/4)`,
            currentCount: newList.length,
          };
          return newList;
        }
      }
    });

    return result!;
  };

  const clearCompareList = () => {
    setCompareList([]);
  };

  // Actions pour la liste utilisateur
  const addToList = (productId: string) => {
    setUserList(prevList => {
      if (!prevList.includes(productId)) {
        return [...prevList, productId];
      }
      return prevList;
    });
  };

  const removeFromList = (productId: string) => {
    setUserList(prevList => prevList.filter(id => id !== productId));
  };

  // Valeur du contexte
  const contextValue: ProductsContextType = {
    // Data states
    products,
    stores,
    territories,
    loading,
    error,
    
    // Filter states
    filters,
    filteredProducts,
    
    // Comparison and user list states
    compareList,
    userList,
    
    // Derived selectors
    compareProducts,
    
    // Actions
    setFilters,
    toggleCompare,
    addToList,
    removeFromList,
    clearFilters,
    clearCompareList,
  };

  return (
    <ProductsContext.Provider value={contextValue}>
      {children}
    </ProductsContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte
export function useProducts(): ProductsContextType {
  const context = useContext(ProductsContext);
  
  if (context === undefined) {
    throw new Error('useProducts doit être utilisé à l\'intérieur d\'un ProductsProvider');
  }
  
  return context;
}