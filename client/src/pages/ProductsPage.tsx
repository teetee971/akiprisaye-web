import { useState } from "react";
import { Search, Filter, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/context/ProductsContext";

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localSearch, setLocalSearch] = useState("");
  
  const { 
    filteredProducts, 
    stores, 
    territories, 
    loading, 
    error,
    filters,
    setFilters 
  } = useProducts();

  // Get unique categories from products
  const categories = Array.from(new Set(filteredProducts.map(p => p.category)));

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    setFilters({ search: value });
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters({ [filterType]: value });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-lg">Chargement des produits...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded">
          Erreur: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2" data-testid="text-page-title">
          Catalogue des produits
        </h1>
        <p className="text-muted-foreground">
          Découvrez et comparez {filteredProducts.length} produits disponibles dans nos territoires
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Recherche et filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un produit..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                data-testid="input-product-search"
              />
            </div>
            
            <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.store} onValueChange={(value) => handleFilterChange('store', value)}>
              <SelectTrigger data-testid="select-store">
                <SelectValue placeholder="Toutes enseignes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes enseignes</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.territory} onValueChange={(value) => handleFilterChange('territory', value)}>
              <SelectTrigger data-testid="select-territory">
                <SelectValue placeholder="Tous territoires" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous territoires</SelectItem>
                {territories.map((territory) => (
                  <SelectItem key={territory.id} value={territory.id}>
                    {territory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Affichage:</span>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                data-testid="button-view-grid"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                data-testid="button-view-list"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche ou vos filtres
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-4'
        }>
          {filteredProducts.map((product) => {
            const store = stores.find(s => s.id === product.store);
            const territory = territories.find(t => t.id === product.territory);
            
            return (
              <Card key={product.id} className="hover-elevate cursor-pointer" data-testid={`card-product-${product.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-md"
                      data-testid={`img-product-${product.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {product.brand}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-lg text-primary" data-testid={`text-product-price-${product.id}`}>
                          {product.price.toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{store?.name}</span>
                        <span>{territory?.name}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}