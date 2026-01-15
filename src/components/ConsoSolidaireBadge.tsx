import { Heart, Award, Leaf } from 'lucide-react';

interface BadgeProps {
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  contributions: number;
  localPurchases: number;
  co2Saved: number;
}

export function ConsoSolidaireBadge({ level, contributions, localPurchases, co2Saved }: BadgeProps) {
  const badges = {
    bronze: { icon: '🥉', color: 'bg-amber-700', min: 10, label: 'Bronze' },
    silver: { icon: '🥈', color: 'bg-slate-400', min: 50, label: 'Argent' },
    gold: { icon: '🥇', color: 'bg-yellow-500', min: 100, label: 'Or' },
    platinum: { icon: '💎', color: 'bg-purple-600', min: 200, label: 'Platine' }
  };

  const badge = badges[level];

  return (
    <div 
      className={`${badge.color} text-white rounded-xl p-6 shadow-lg`}
      role="region"
      aria-label={`Badge Citoyen ${badge.label}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-5xl" role="img" aria-label={`Badge ${badge.label}`}>
          {badge.icon}
        </div>
        <Award className="w-8 h-8" aria-hidden="true" />
      </div>
      <h3 className="text-2xl font-bold mb-2">
        Citoyen {badge.label.toUpperCase()}
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4" aria-hidden="true" />
          <span>{contributions} contributions</span>
        </div>
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4" aria-hidden="true" />
          <span>{localPurchases} achats locaux</span>
        </div>
        <div className="flex items-center gap-2">
          <span role="img" aria-label="Planète">🌍</span>
          <span>{co2Saved}kg CO₂ économisés</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/30">
        <p className="text-xs opacity-90">
          {level === 'platinum' 
            ? 'Vous êtes un champion de la consommation solidaire !' 
            : `Plus que ${badges[level === 'bronze' ? 'silver' : level === 'silver' ? 'gold' : 'platinum'].min - contributions} contributions pour le niveau suivant`
          }
        </p>
      </div>
    </div>
  );
}
