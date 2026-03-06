import { Link } from 'react-router-dom';
import HeroSearch from '../components/home/HeroSearch';
import TerritoryChips from '../components/home/TerritoryChips';
import ProofStats from '../components/home/ProofStats';
import HowItWorks from '../components/home/HowItWorks';
import HomeFAQ from '../components/home/HomeFAQ';
import ConseilBudgetDuJour from '../components/home/ConseilBudgetDuJour';

export default function HomePage() {
  return (
    <div className="space-y-8 pb-28 md:pb-12">
      <HeroSearch />
      <TerritoryChips />
      <ConseilBudgetDuJour />
      <ProofStats />
      <HowItWorks />

      <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-lg font-semibold text-white">Passez à l’action</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link to="/search" className="rounded-xl bg-emerald-500 px-4 py-3 text-center font-semibold text-slate-950">
            Rechercher un produit
          </Link>
          <Link to="/scanner?mode=ticket" className="rounded-xl border border-slate-700 px-4 py-3 text-center text-slate-100">
            Scanner un ticket
          </Link>
        </div>
        <p className="text-xs text-slate-400">
          Exemple de comparaison détaillé disponible dans l&apos;<Link to="/observatoire" className="text-emerald-400">observatoire</Link>.
        </p>
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-lg font-semibold text-white">Fonctionnalités avancées</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link to="/alertes-prix" className="rounded-xl border border-slate-700 px-3 py-3 text-center text-slate-100 hover:border-emerald-500 hover:text-emerald-400">
            🔔 Alertes Prix
          </Link>
          <Link to="/liste-intelligente" className="rounded-xl border border-slate-700 px-3 py-3 text-center text-slate-100 hover:border-emerald-500 hover:text-emerald-400">
            🛒 Liste Intelligente
          </Link>
          <Link to="/tableau-inflation" className="rounded-xl border border-slate-700 px-3 py-3 text-center text-slate-100 hover:border-emerald-500 hover:text-emerald-400">
            📈 Inflation
          </Link>
          <Link to="/gamification" className="rounded-xl border border-slate-700 px-3 py-3 text-center text-slate-100 hover:border-emerald-500 hover:text-emerald-400">
            🏆 Mon Profil
          </Link>
        </div>
      </section>

      <HomeFAQ />
    </div>
  );
}
