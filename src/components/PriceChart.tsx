import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type PriceChartPoint = {
  observedAt: string;
  price: number;
};

type PriceChartProps = {
  data: PriceChartPoint[];
};

export function PriceChart({ data }: PriceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <XAxis
          dataKey="observedAt"
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="price" stroke="#2563eb" />
      </LineChart>
    </ResponsiveContainer>
  );
}
