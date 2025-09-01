import PriceTrendChart from '../components/PriceTrendChart';
import { samplePriceSeries } from '../data/sampleProducts';

export default function PriceWatch() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Vie chère — Tendances</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold mb-2">Riz 5kg · Évolution mensuelle</h3>
          <PriceTrendChart series={samplePriceSeries}/>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold mb-2">Résumé</h3>
          <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300">
            <li>Baisse observée sur 6 mois (démo)</li>
            <li>Prochaine étape : sources réelles (ODR, scrapers, API magasins)</li>
            <li>Alertes quand une enseigne passe sous un seuil</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
