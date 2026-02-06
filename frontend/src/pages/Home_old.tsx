import { GlassCard } from "../components/ui/glass-card";
import VersionBanner from "../components/ui/VersionBanner";

export default function Home() {
  return (
    <div className="space-y-6">

      {/* Centralized public version banner */}
      <VersionBanner />

      {/* Hero principal - Proposition de valeur claire */}
      <GlassCard>
        <h1 className="text-3xl font-semibold leading-tight mb-3">
          Comparateur citoyen des prix<br />
          <span className="text-blue-400 text-2xl">DOM • ROM • COM</span>
        </h1>
        <p className="text-gray-300 text-lg leading-relaxed">
          Observer, comparer et suivre l'évolution réelle des prix<br className="hidden sm:block" />
          dans tous les territoires ultramarins.
        </p>
      </GlassCard>

      {/* Pourquoi ce service existe - Légitimité */}
      <GlassCard>
        <h2 className="text-xl font-semibold mb-3">Pourquoi A KI PRI SA YÉ ?</h2>
        <p className="text-gray-300 leading-relaxed">
          Les écarts de prix entre territoires ultramarins sont réels, 
          mais rarement documentés de manière publique, vérifiable et continue.
        </p>
        <p className="text-gray-300 leading-relaxed mt-3">
          <strong>A KI PRI SA YÉ</strong> est un service citoyen indépendant 
          qui agrège uniquement des données observées et sourcées, 
          sans publicité, sans recommandations commerciales.
        </p>
      </GlassCard>

      {/* Crédibilité - Preuves visibles */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4">Notre engagement</h3>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✔</span>
            <span><strong>Données observées par territoire</strong> (DOM-ROM-COM)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✔</span>
            <span><strong>Historique des prix multi-années</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✔</span>
            <span><strong>Sources publiques et vérifiables</strong></span>
          </li>
        </ul>
      </GlassCard>

    </div>
  );
}
