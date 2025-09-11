import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Radar as RadarIcon } from "lucide-react";
import { ChartAnimation } from "./RankingAnimations";
import type { StoreMetrics, RankingData } from './StoreMetrics';

interface ScoreVisualizationProps {
  rankingData: RankingData;
  selectedTerritory?: string;
  selectedCategory?: string;
}

// Tropical color palette for charts
const CHART_COLORS = [
  '#0ea5e9', // Ocean blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#f97316', // Orange
  '#84cc16', // Lime
  '#ec4899', // Pink
  '#6366f1'  // Indigo
];

export default function ScoreVisualization({ 
  rankingData, 
  selectedTerritory, 
  selectedCategory 
}: ScoreVisualizationProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const { metrics, territoryAnalysis, categoryAnalysis } = rankingData;

  // Prepare data for different chart types
  const prepareOverviewData = () => {
    return metrics.slice(0, 10).map((metric, index) => ({
      name: metric.storeName,
      score: metric.overallScore,
      priceCompetitiveness: metric.priceCompetitiveness,
      territorialCoverage: metric.territorialCoverage,
      diversity: (metric.productDiversity / 10) * 100, // Normalize to 0-100
      stability: metric.priceStability,
      rank: index + 1
    }));
  };

  const prepareRadarData = () => {
    return metrics.slice(0, 5).map(metric => ({
      store: metric.storeName,
      'Score Global': metric.overallScore,
      'Prix': metric.priceCompetitiveness,
      'Couverture': metric.territorialCoverage,
      'Diversité': Math.min(100, (metric.productDiversity / 5) * 100),
      'Stabilité': metric.priceStability
    }));
  };

  const prepareTerritoryData = () => {
    return Object.entries(territoryAnalysis).map(([territory, data]) => ({
      name: territory,
      stores: data.storeCount,
      products: data.productCount,
      avgPrice: data.averagePrice
    }));
  };

  const preparePriceComparisonData = () => {
    return metrics.slice(0, 8).map(metric => ({
      name: metric.storeName,
      'Prix moyen': metric.averagePrice,
      'Compétitivité': metric.priceCompetitiveness
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              {entry.dataKey.includes('Prix') && typeof entry.value === 'number' ? '€' : 
               entry.dataKey.includes('Score') || entry.dataKey.includes('Compétitivité') || 
               entry.dataKey.includes('Couverture') || entry.dataKey.includes('Stabilité') ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" data-testid="score-visualization-container">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2" data-testid="tab-comparison">
            <RadarIcon className="h-4 w-4" />
            Comparaison
          </TabsTrigger>
          <TabsTrigger value="territory" className="flex items-center gap-2" data-testid="tab-territory">
            <PieChartIcon className="h-4 w-4" />
            Territoires
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2" data-testid="tab-trends">
            <TrendingUp className="h-4 w-4" />
            Tendances
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Bar Charts */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Scores Bar Chart */}
            <Card data-testid="card-overall-scores">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Scores globaux
                  {selectedTerritory && (
                    <Badge variant="outline">{selectedTerritory}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartAnimation>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareOverviewData()}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="name" 
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="score" 
                        fill="#0ea5e9"
                        radius={[2, 2, 0, 0]}
                        name="Score global"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartAnimation>
              </CardContent>
            </Card>

            {/* Price Competitiveness Chart */}
            <Card data-testid="card-price-competitiveness">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Compétitivité prix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={preparePriceComparisonData()}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis yAxisId="left" orientation="left" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      yAxisId="right"
                      dataKey="Compétitivité" 
                      fill="#10b981"
                      radius={[2, 2, 0, 0]}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="Prix moyen" 
                      stroke="#f59e0b"
                      strokeWidth={2}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparison Tab - Radar Chart */}
        <TabsContent value="comparison" className="space-y-6">
          <Card data-testid="card-radar-comparison">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RadarIcon className="h-5 w-5" />
                Comparaison multi-critères
                <Badge variant="outline">Top 5</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <RadarChart data={prepareRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="store" fontSize={12} />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    fontSize={10}
                    tick={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {['Score Global', 'Prix', 'Couverture', 'Diversité', 'Stabilité'].map((metric, index) => (
                    <Radar
                      key={metric}
                      name={metric}
                      dataKey={metric}
                      stroke={CHART_COLORS[index]}
                      fill={CHART_COLORS[index]}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Territory Tab - Pie Charts and Territory Analysis */}
        <TabsContent value="territory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Territory Distribution */}
            <Card data-testid="card-territory-distribution">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Répartition par territoire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={prepareTerritoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="stores"
                    >
                      {prepareTerritoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Store Performance by Territory */}
            <Card data-testid="card-territory-performance">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance par territoire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={prepareTerritoryData()}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="stores" fill="#06b6d4" name="Enseignes" />
                    <Bar dataKey="products" fill="#10b981" name="Produits" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab - Line Charts */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <Card data-testid="card-score-distribution">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Distribution des scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prepareOverviewData()}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="rank" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#0ea5e9" 
                      strokeWidth={3}
                      dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                      name="Score global"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="priceCompetitiveness" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                      name="Compétitivité prix"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="territorialCoverage" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                      name="Couverture territoriale"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Price Trends */}
            <Card data-testid="card-price-trends">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendances prix moyens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={preparePriceComparisonData()}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="Prix moyen" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <Card data-testid="card-summary-stats">
        <CardHeader>
          <CardTitle>Statistiques du classement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {metrics.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Enseignes classées
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {metrics.length > 0 ? metrics[0].overallScore.toFixed(0) : '0'}
              </div>
              <div className="text-sm text-muted-foreground">
                Meilleur score
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Object.keys(territoryAnalysis).length}
              </div>
              <div className="text-sm text-muted-foreground">
                Territoires
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {metrics.reduce((sum, m) => sum + m.totalProducts, 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                Produits analysés
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}