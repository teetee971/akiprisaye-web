import PriceStats from '../components/PriceStats';

export default function LifeCost(){
  return (
    <div className="container py-6 space-y-4">
      <h1 className="text-2xl font-extrabold">Vie chère</h1>
      <PriceStats />
      <p className="text-sm opacity-70">Données démo — branchement aux sources réelles à venir.</p>
    </div>
  );
}
