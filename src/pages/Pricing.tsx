import { GlassCard } from "../components/ui/glass-card";

export default function Pricing() {
  return (
    <div className="grid gap-4">
      <GlassCard>
        <h3 className="font-semibold">Citoyen</h3>
        <p className="text-sm">3,99 € / mois</p>
        <p className="text-xs text-gray-400">
          Comparaison + alertes prix locales
        </p>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold">Professionnel</h3>
        <p className="text-sm">19 € / mois</p>
        <p className="text-xs text-gray-400">
          Analyses territoriales et historiques
        </p>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold">Institution</h3>
        <p className="text-sm">Licence annuelle</p>
        <p className="text-xs text-gray-400">
          Données publiques, audit et transparence
        </p>
      </GlassCard>
    </div>
  );
}
