import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Filter, RotateCcw } from 'lucide-react';
import InteractiveMap from '@/components/InteractiveMap';
import { useProducts } from '@/context/ProductsContext';

export default function MapPage() {
  const navigate = useNavigate();
  const { loading, error, setFilters } = useProducts();
  const [selectedTerritory, setSelectedTerritory] = useState<string | undefined>();

  const handleTerritorySelect = (territoryId: string) => {
    setSelectedTerritory(prevSelected => 
      prevSelected === territoryId ? undefined : territoryId
    );
  };

  const handleFilterByTerritory = () => {
    if (selectedTerritory) {
      setFilters({ territory: selectedTerritory });
      navigate('/produits');
    }
  };

  const handleResetSelection = () => {
    setSelectedTerritory(undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-heading font-bold mb-2" data-testid="text-map-page-title">
              Carte des territoires
            </h1>
            <p className="text-muted-foreground">
              Explorez les prix par territoire d'outre-mer
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="text-6xl">🗺️</div>
              <div className="text-lg font-medium">Chargement de la carte...</div>
              <div className="text-sm text-muted-foreground">Préparation des données des territoires</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-heading font-bold mb-2" data-testid="text-map-page-title">
              Carte des territoires
            </h1>
            <p className="text-muted-foreground">
              Explorez les prix par territoire d'outre-mer
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="text-6xl">⚠️</div>
              <div className="text-lg font-medium text-destructive">Erreur de chargement</div>
              <div className="text-sm text-muted-foreground">{error}</div>
              <Button onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* En-tête de la page */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2" data-testid="text-map-page-title">
              Carte des territoires
            </h1>
            <p className="text-muted-foreground">
              Explorez les prix par territoire d'outre-mer français
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {selectedTerritory && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleFilterByTerritory}
                  data-testid="button-filter-by-territory"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Voir les produits
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleResetSelection}
                  data-testid="button-reset-selection"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Carte interactive */}
        <InteractiveMap
          selectedTerritory={selectedTerritory}
          onTerritorySelect={handleTerritorySelect}
          data-testid="interactive-map"
        />

        {/* Aide utilisateur */}
        <div className="text-center text-sm text-muted-foreground">
          💡 Cliquez sur un territoire pour voir ses statistiques et accéder aux produits
        </div>
      </div>
    </div>
  );
}