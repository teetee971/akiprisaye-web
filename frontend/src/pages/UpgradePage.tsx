import { PLAN_DEFINITIONS } from '../billing/plans';
import { useEntitlements } from '../billing/useEntitlements';

export default function UpgradePage() {
  const { plan } = useEntitlements();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Passer à un plan supérieur</h1>
      <p className="text-slate-300">Plan actuel: <strong>{plan}</strong>. Débloquez les alertes, exports avancés et analyses enrichies.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.values(PLAN_DEFINITIONS).map((definition) => (
          <article key={definition.id} className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
            <h2 className="text-xl font-semibold">{definition.label}</h2>
            <p className="text-sm text-slate-300">Max articles: {definition.quotas.maxItems} · Refresh/jour: {definition.quotas.refreshPerDay}</p>
            <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm text-white">Passer à {definition.id === 'FREE' ? 'ce plan' : definition.id}</button>
          </article>
        ))}
      </div>
      <p className="text-sm text-slate-400">Paiement non activé dans cette version (stub prêt à intégrer Stripe/Paddle).</p>
    </div>
  );
}
