import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from '@shared/schema';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Interface pour l'ancien usage (rétrocompatibilité)
export interface PriceHistoryData {
  date: string;
  price: number;
  store: string;
}

interface PriceChartProps {
  products: Product[];
  className?: string;
  // Support de l'ancienne API pour rétrocompatibilité
  data?: PriceHistoryData[];
  productName?: string;
  territory?: string;
}

// Configuration des couleurs pour les graphiques selon les couleurs tropicales du design
const CHART_COLORS = [
  "hsl(var(--chart-1))", // Deep ocean blue
  "hsl(var(--chart-2))", // Tropical teal  
  "hsl(var(--chart-3))", // Warm coral
  "hsl(var(--chart-4))", // Sandy beige accent
  "hsl(var(--chart-5))", // Purple accent
];

export default function PriceChart({ products = [], className, data, productName, territory }: PriceChartProps) {
  // Support de l'ancienne API pour rétrocompatibilité
  if (data && productName) {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short'
      });
    };

    const formatPrice = (price: number) => `${price.toFixed(2)}€`;

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-popover border border-popover-border rounded-md shadow-md p-3">
            <p className="font-medium">{formatDate(label)}</p>
            <p className="text-sm text-muted-foreground">{data.store}</p>
            <p className="font-semibold text-primary">
              {formatPrice(payload[0].value)}
            </p>
          </div>
        );
      }
      return null;
    };

    return (
      <Card data-testid="card-price-chart" className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">
            Évolution des prix - {productName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{territory}</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={formatPrice}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
            <span>Derniers 30 jours</span>
            <span>{data.length} relevés de prix</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Nouvelle API pour la comparaison multi-produits
  const validProducts = products.filter(p => p.priceHistory && p.priceHistory.length > 0);
  
  if (validProducts.length === 0) {
    return (
      <Card className={className} data-testid="card-price-chart">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Évolution des prix
            <Badge variant="secondary" className="text-xs">
              Aucune donnée
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Aucun historique disponible</div>
              <p className="text-sm">Les données d'évolution des prix ne sont pas disponibles pour ces produits.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Création du dataset combiné pour le graphique
  const combinedData = useMemo(() => {
    // Collecter toutes les dates uniques
    const allDates = new Set<string>();
    validProducts.forEach(product => {
      product.priceHistory.forEach(entry => {
        allDates.add(entry.date);
      });
    });

    // Créer les points de données pour chaque date
    const sortedDates = Array.from(allDates).sort();
    
    return sortedDates.map(date => {
      const dataPoint: any = {
        date,
        formattedDate: format(parseISO(date), 'dd MMM', { locale: fr }),
        fullDate: format(parseISO(date), 'dd MMMM yyyy', { locale: fr }),
      };

      // Ajouter le prix de chaque produit pour cette date
      validProducts.forEach((product, index) => {
        const priceEntry = product.priceHistory.find(entry => entry.date === date);
        dataPoint[`product${index}`] = priceEntry ? priceEntry.price : null;
        dataPoint[`product${index}Name`] = product.name;
        dataPoint[`product${index}Id`] = product.id;
      });

      return dataPoint;
    });
  }, [validProducts]);

  // Calcul des statistiques de prix pour l'affichage
  const priceStats = useMemo(() => {
    const allPrices = validProducts.flatMap(p => p.priceHistory.map(entry => entry.price));
    return {
      min: Math.min(...allPrices),
      max: Math.max(...allPrices),
      range: Math.max(...allPrices) - Math.min(...allPrices),
    };
  }, [validProducts]);

  // Configuration des couleurs dynamique basée sur le nombre de produits
  const dynamicChartConfig: ChartConfig = {};
  validProducts.forEach((product, index) => {
    const key = `product${index}`;
    dynamicChartConfig[key] = {
      label: product.name.length > 35 ? `${product.name.substring(0, 35)}...` : product.name,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
  });

  return (
    <Card className={className} data-testid="card-price-chart">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Évolution des prix</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs" data-testid="badge-products-count">
              {validProducts.length} produit{validProducts.length > 1 ? 's' : ''}
            </Badge>
            <Badge variant="secondary" className="text-xs" data-testid="badge-price-range">
              {priceStats.min.toFixed(2)}€ - {priceStats.max.toFixed(2)}€
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dynamicChartConfig} className="h-[400px] w-full" data-testid="chart-price-evolution">
          <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="formattedDate"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={combinedData.length > 10 ? Math.floor(combinedData.length / 8) : 0}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}€`}
              domain={['dataMin - 0.1', 'dataMax + 0.1']}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  className="bg-background border rounded-md shadow-lg p-3"
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload?.fullDate || value;
                    }
                    return value;
                  }}
                  formatter={(value, name, props) => {
                    if (value === null || value === undefined) return null;
                    const productName = props.payload?.[`${name}Name`] || name;
                    return [
                      <span key={name} className="font-medium">{`${Number(value).toFixed(2)}€`}</span>,
                      <span key={`${name}-label`} className="text-muted-foreground">
                        {productName.length > 30 ? `${productName.substring(0, 30)}...` : productName}
                      </span>
                    ];
                  }}
                />
              }
            />
            <ChartLegend 
              content={<ChartLegendContent />}
              wrapperStyle={{ paddingTop: '20px' }}
            />
            
            {/* Rendu des lignes pour chaque produit */}
            {validProducts.map((product, index) => {
              const key = `product${index}`;
              const color = CHART_COLORS[index % CHART_COLORS.length];
              
              return (
                <Line
                  key={`${product.id}-${index}`}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ 
                    r: 4, 
                    strokeWidth: 2,
                    fill: color,
                  }}
                  activeDot={{ 
                    r: 6, 
                    strokeWidth: 2,
                    fill: color,
                  }}
                  connectNulls={false}
                  data-testid={`line-product-${product.id}`}
                />
              );
            })}
          </LineChart>
        </ChartContainer>
        
        {/* Informations complémentaires */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600" data-testid="text-min-price">
              {priceStats.min.toFixed(2)}€
            </div>
            <div className="text-sm text-muted-foreground">Prix minimum</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600" data-testid="text-max-price">
              {priceStats.max.toFixed(2)}€
            </div>
            <div className="text-sm text-muted-foreground">Prix maximum</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-primary" data-testid="text-price-variation">
              {priceStats.range.toFixed(2)}€
            </div>
            <div className="text-sm text-muted-foreground">Écart de prix</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}