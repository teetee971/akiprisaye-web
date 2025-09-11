import { useState } from "react";
import { Grid3X3, List, Package2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/context/ProductsContext";
import FilterBar from "@/components/FilterBar";
import ProductCard from "@/components/ProductCard";

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { 
    filteredProducts, 
    compareList,
    userList,
    loading, 
    error
  } = useProducts();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Filter Skeleton */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-10 w-full mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="w-full h-32 mb-3 rounded-md" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <Skeleton className="h-6 w-20 mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <div className="text-destructive text-lg font-semibold mb-2">
              Erreur de chargement
            </div>
            <p className="text-muted-foreground mb-4">
              Impossible de charger les produits: {error}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              data-testid="button-retry"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Package2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
            Catalogue des produits
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Découvrez et comparez nos produits disponibles dans les territoires d'outre-mer
        </p>
        
        {/* Quick Stats */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>{filteredProducts.length} produits disponibles</span>
          </div>
          {compareList.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <span>{compareList.length} produit{compareList.length > 1 ? 's' : ''} en comparaison</span>
            </div>
          )}
          {userList.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <span>{userList.length} produit{userList.length > 1 ? 's' : ''} dans ma liste</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar showResultsCount={false} />

      {/* View Mode Toggle & Results */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-muted-foreground">
          <strong className="text-foreground">{filteredProducts.length}</strong> résultat{filteredProducts.length !== 1 ? 's' : ''}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">Mode d'affichage:</span>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            data-testid="button-view-grid"
            className="gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden sm:inline">Grille</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            data-testid="button-view-list"
            className="gap-2"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Liste</span>
          </Button>
        </div>
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Package2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              Aucun produit trouvé
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Aucun produit ne correspond à vos critères de recherche. 
              Essayez de modifier vos filtres ou votre recherche.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              data-testid="button-reset-search"
            >
              Voir tous les produits
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'grid grid-cols-1 md:grid-cols-2 gap-4'
        }>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant={viewMode === 'list' ? 'compact' : 'default'}
              showActions={true}
              data-testid={`product-card-${product.id}`}
            />
          ))}
        </div>
      )}

      {/* Load More Button (for future pagination) */}
      {filteredProducts.length > 0 && filteredProducts.length >= 50 && (
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground mb-4">
            Affichage des premiers {filteredProducts.length} résultats
          </p>
          <Button variant="outline" disabled>
            Charger plus de produits
          </Button>
        </div>
      )}
    </div>
  );
}