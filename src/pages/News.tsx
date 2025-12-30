import { GlassCard } from "../components/ui/glass-card";
import SourceFooter from "../components/ui/SourceFooter";

export default function News() {
  return (
    <GlassCard>
      <h2 className="text-lg font-semibold">
        Nouvelle baisse des prix observée
      </h2>
      <p className="text-gray-300 text-sm mt-2">
        La DGCCRF constate une diminution moyenne de 3 % sur certains produits
        alimentaires en Guadeloupe.
      </p>
      <SourceFooter
        sourceName="DGCCRF"
        sourceUrl="https://www.economie.gouv.fr/dgccrf"
      />
    </GlassCard>
  );
}
