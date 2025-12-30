import { GlassCard } from "../components/ui/glass-card";

export default function Home() {
  return (
    <div className="space-y-6">
      <GlassCard>
        <h1 className="text-2xl font-semibold">
          Comparateur de prix citoyen – DOM-ROM-COM
        </h1>
        <p className="text-gray-300 mt-2">
          Données publiques, transparence totale, aucun suivi commercial.
        </p>
      </GlassCard>

      <GlassCard>
        <ul className="grid grid-cols-2 gap-4 text-sm">
          <li>📍 Tous territoires ultramarins</li>
          <li>📊 Historique & évolution des prix</li>
          <li>🧾 Sources officielles visibles</li>
          <li>⚖️ Service civique, sans publicité</li>
        </ul>
      </GlassCard>
    </div>
  );
}
