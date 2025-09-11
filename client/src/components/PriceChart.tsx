import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PriceHistoryData {
  date: string;
  price: number;
  store: string;
}

interface PriceChartProps {
  data: PriceHistoryData[];
  productName: string;
  territory: string;
}

export default function PriceChart({ data, productName, territory }: PriceChartProps) {
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
    <Card data-testid="card-price-chart">
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