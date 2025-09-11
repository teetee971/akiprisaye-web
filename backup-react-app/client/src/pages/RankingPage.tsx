import { useState, useMemo } from "react";
import { useProducts } from "@/context/ProductsContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Trophy, Download, Filter, Crown } from "lucide-react";
import StoreMetrics, { useStoreRanking } from "@/components/StoreMetrics";
import StoreRankingCard from "@/components/StoreRankingCard";
import ScoreVisualization from "@/components/ScoreVisualization";
import { useToast } from "@/hooks/use-toast";
import { exportRankingToCSV, exportRankingToJSON, shareRanking } from "@/utils/exportUtils";

export default function RankingPage() {
  const { products, stores, territories, loading } = useProducts();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedTerritory, setSelectedTerritory] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [activeTab, setActiveTab] = useState('ranking');

  // Use the hook to get ranking data
  const rankingHookData = useStoreRanking(
    selectedTerritory === "all" ? undefined : selectedTerritory,
    selectedCategory === "all" ? undefined : selectedCategory
  );

  // Get unique categories from products data
  const uniqueCategories = useMemo(() => {
    if (!products || products.length === 0) return [];
    return Array.from(new Set(products.map(p => p.category))).sort();
  }, [products]);

  const handleStoreSelect = (storeId: string) => {
    // Navigate to products page with store filter using react-router-dom
    navigate(`/produits?store=${storeId}`);
  };

  const handleExportRanking = async () => {
    // Use the already calculated ranking data
    if (!rankingHookData || rankingHookData.loading) {
      toast({
        title: "Données non disponibles",
        description: "Les données de classement ne sont pas encore chargées.",
        variant: "destructive"
      });
      return;
    }

    try {
      await exportRankingToCSV(
        { 
          metrics: rankingHookData.metrics, 
          territoryAnalysis: rankingHookData.territoryAnalysis, 
          categoryAnalysis: rankingHookData.categoryAnalysis 
        },
        stores,
        {
          territory: selectedTerritory === "all" ? undefined : selectedTerritory,
          category: selectedCategory === "all" ? undefined : selectedCategory
        }
      );
      toast({
        title: "Export réussi",
        description: "Le classement a été téléchargé au format CSV.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le classement.",
        variant: "destructive"
      });
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <Skeleton className="h-10 w-80 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-heading font-bold mb-2 flex items-center gap-3" data-testid="text-ranking-page-title">
                <Crown className="h-8 w-8 text-yellow-500" />
                Palmarès des enseignes
              </h1>
              <p className="text-lg text-muted-foreground">
                Découvrez les enseignes les mieux notées et les plus compétitives des territoires d'outre-mer
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {stores?.length || 0} enseignes analysées
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportRanking}
                data-testid="button-export-ranking"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6" data-testid="card-ranking-filters">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Territoire</label>
                <Select 
                  value={selectedTerritory} 
                  onValueChange={setSelectedTerritory}
                >
                  <SelectTrigger className="w-full" data-testid="select-territory-ranking">
                    <SelectValue placeholder="Choisir un territoire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les territoires</SelectItem>
                    {territories.map((territory) => (
                      <SelectItem key={territory.id} value={territory.name}>
                        {territory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Catégorie</label>
                <Select 
                  value={selectedCategory} 
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full" data-testid="select-category-ranking">
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Affichage</label>
                <Select 
                  value={viewMode} 
                  onValueChange={(value) => setViewMode(value as 'cards' | 'compact')}
                >
                  <SelectTrigger className="w-full" data-testid="select-view-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cards">Cartes détaillées</SelectItem>
                    <SelectItem value="compact">Vue compacte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-2 mb-6">
            <TabsTrigger value="ranking" className="flex items-center gap-2" data-testid="tab-ranking">
              <Trophy className="h-4 w-4" />
              Classement
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4" />
              Analyses
            </TabsTrigger>
          </TabsList>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="space-y-6">
            <StoreMetrics
              selectedTerritory={selectedTerritory === "all" ? undefined : selectedTerritory}
              selectedCategory={selectedCategory === "all" ? undefined : selectedCategory}
            >
              {(rankingData) => {
                if (rankingData.metrics.length === 0) {
                  return (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Aucune enseigne trouvée</h3>
                        <p className="text-muted-foreground">
                          Essayez de modifier vos filtres pour voir les résultats.
                        </p>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <div className={`grid gap-4 ${
                    viewMode === 'compact' 
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                      : 'grid-cols-1 lg:grid-cols-2'
                  }`}>
                    {rankingData.metrics.map((metrics, index) => {
                      const store = stores.find(s => s.id === metrics.storeId);
                      if (!store) return null;
                      
                      return (
                        <StoreRankingCard
                          key={metrics.storeId}
                          metrics={metrics}
                          rank={index + 1}
                          store={store}
                          onStoreClick={handleStoreSelect}
                          showDetailedMetrics={viewMode === 'cards'}
                          compact={viewMode === 'compact'}
                        />
                      );
                    })}
                  </div>
                );
              }}
            </StoreMetrics>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <StoreMetrics
              selectedTerritory={selectedTerritory === "all" ? undefined : selectedTerritory}
              selectedCategory={selectedCategory === "all" ? undefined : selectedCategory}
            >
              {(rankingData) => (
                <ScoreVisualization 
                  rankingData={rankingData}
                  selectedTerritory={selectedTerritory === "all" ? undefined : selectedTerritory}
                  selectedCategory={selectedCategory === "all" ? undefined : selectedCategory}
                />
              )}
            </StoreMetrics>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}