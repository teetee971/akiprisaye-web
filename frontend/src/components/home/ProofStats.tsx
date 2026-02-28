const stats = [
  { label: 'territoires', value: '12' },
  { label: 'produits', value: '5 000+' },
  { label: 'scans', value: '1 200+' },
];

export default function ProofStats() {
  return (
    <section className="grid grid-cols-3 gap-2">
      {stats.map((item) => (
        <article key={item.label} className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center">
          <p className="text-lg font-bold text-white">{item.value}</p>
          <p className="text-xs text-slate-400">{item.label}</p>
        </article>
      ))}
    </section>
  );
}
