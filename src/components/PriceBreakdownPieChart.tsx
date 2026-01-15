import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PriceBreakdown {
  productCost: number;
  margin: number;
  octroi: number;
  tva: number;
  transport: number;
}

interface PriceBreakdownPieChartProps {
  breakdown: PriceBreakdown;
}

export function PriceBreakdownPieChart({ breakdown }: PriceBreakdownPieChartProps) {
  const data = [
    { name: 'Coût produit', value: breakdown.productCost, color: '#3b82f6' },
    { name: 'Marge distributeur', value: breakdown.margin, color: '#10b981' },
    { name: 'Octroi de mer', value: breakdown.octroi, color: '#f59e0b' },
    { name: 'TVA', value: breakdown.tva, color: '#ef4444' },
    { name: 'Transport/Logistique', value: breakdown.transport, color: '#8b5cf6' }
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
        Décomposition du Prix
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `${value.toFixed(2)}€`}
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {data.map(item => (
          <div key={item.name} className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
            </span>
            <strong className="text-slate-900 dark:text-white">
              {item.value.toFixed(2)}€
            </strong>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <span className="font-semibold text-slate-900 dark:text-white">Prix Total</span>
        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
          {total.toFixed(2)}€
        </span>
      </div>
    </div>
  );
}
