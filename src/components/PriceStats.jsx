import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data = [
  { m: 'Jan', riz: 12.2, huile: 3.8, sucre: 1.05 },
  { m: 'Fév', riz: 12.4, huile: 3.9, sucre: 1.07 },
  { m: 'Mar', riz: 12.6, huile: 4.0, sucre: 1.10 },
  { m: 'Avr', riz: 12.5, huile: 3.95, sucre: 1.09 },
  { m: 'Mai', riz: 12.7, huile: 4.1, sucre: 1.12 },
  { m: 'Juin', riz: 12.9, huile: 4.2, sucre: 1.15 }
];

export default function PriceStats(){
  return (
    <div className="card p-4 h-72">
      <div className="font-semibold mb-2">Évolution des prix (démo)</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="4 4" />
          <XAxis dataKey="m" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="riz" strokeWidth={2} dot={false}/>
          <Line type="monotone" dataKey="huile" strokeWidth={2} dot={false}/>
          <Line type="monotone" dataKey="sucre" strokeWidth={2} dot={false}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
