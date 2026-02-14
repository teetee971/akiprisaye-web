import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Point = {
  date: string;
  median: number;
  min?: number;
  max?: number;
  n?: number;
};

export function PriceMiniChart({ data }: { data: Point[] }) {
  if (!data?.length) return null;

  return (
    <div style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="date" hide />
          <YAxis domain={['dataMin', 'dataMax']} width={40} />
          <Tooltip />
          <Line type="monotone" dataKey="median" dot={false} strokeWidth={2} stroke="#1d4ed8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PriceMiniChart;
