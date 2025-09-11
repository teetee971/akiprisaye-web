import { Search, Filter, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/context/ProductsContext";

interface FilterBarProps {
  showResultsCount?: boolean;
  compact?: boolean;
}

export default function FilterBar({ showResultsCount = true, compact = false }: FilterBarProps) {
  const { 
    filteredProducts, 
    stores, 
    territories, 
    filters,
    setFilters,
    clearFilters
  } = useProducts();

  // Get unique categories from products
  const { products } = useProducts();
  const categories = Array.from(new Set(products.map(p => p.category))).sort();

  const handleSearchChange = (value: string) => {
    setFilters({ search: value });
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters({ [filterType]: value === "all" ? "" : value });
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(value => value && value.trim() !== '').length;

  if (compact) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un produit..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            data-testid="input-filter-search"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 flex-wrap">
          <Select value={filters.category || "all"} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger className="w-40" data-testid="select-filter-category">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="gap-2"
              data-testid="button-clear-filters"
            >
              <RotateCcw className="h-3 w-3" />
              Effacer
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Filtres de recherche</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="gap-2"
              data-testid="button-clear-filters"
            >
              <RotateCcw className="h-4 w-4" />
              Effacer tous les filtres
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher par nom de produit ou marque..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 text-base"
            data-testid="input-filter-search"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => handleSearchChange('')}
              data-testid="button-clear-search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Selects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Catégorie
            </label>
            <Select value={filters.category || "all"} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger data-testid="select-filter-category">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Store Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Enseigne
            </label>
            <Select value={filters.store || "all"} onValueChange={(value) => handleFilterChange('store', value)}>
              <SelectTrigger data-testid="select-filter-store">
                <SelectValue placeholder="Toutes enseignes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes enseignes</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Territory Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Territoire
            </label>
            <Select value={filters.territory || "all"} onValueChange={(value) => handleFilterChange('territory', value)}>
              <SelectTrigger data-testid="select-filter-territory">
                <SelectValue placeholder="Tous territoires" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous territoires</SelectItem>
                {territories.map((territory) => (
                  <SelectItem key={territory.id} value={territory.id}>
                    {territory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Filtres actifs:</span>
              
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  Recherche: "{filters.search}"
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleSearchChange('')}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              
              {filters.category && (
                <Badge variant="secondary" className="gap-1">
                  Catégorie: {filters.category}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleFilterChange('category', '')}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              
              {filters.store && (
                <Badge variant="secondary" className="gap-1">
                  Enseigne: {stores.find(s => s.id === filters.store)?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleFilterChange('store', '')}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              
              {filters.territory && (
                <Badge variant="secondary" className="gap-1">
                  Territoire: {territories.find(t => t.id === filters.territory)?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleFilterChange('territory', '')}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Results Count */}
        {showResultsCount && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">{filteredProducts.length}</strong> produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
              {activeFiltersCount > 0 && (
                <span> avec les filtres appliqués</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}