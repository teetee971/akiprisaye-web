import { useNavigate } from 'react-router-dom';

const territories = [
  { code: 'GP', flag: '🇬🇵', name: 'Guadeloupe' },
  { code: 'MQ', flag: '🇲🇶', name: 'Martinique' },
  { code: 'GF', flag: '🇬🇫', name: 'Guyane' },
  { code: 'RE', flag: '🇷🇪', name: 'Réunion' },
  { code: 'YT', flag: '🇾🇹', name: 'Mayotte' },
  { code: 'NC', flag: '🇳🇨', name: 'Nouvelle-Calédonie' },
  { code: 'PF', flag: '🇵🇫', name: 'Polynésie française' },
  { code: 'BL', flag: '🇧🇱', name: 'Saint-Barthélemy' },
];

export default function TerritoryChips() {
  const navigate = useNavigate();

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Votre territoire</h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {territories.map((territory) => (
          <button
            key={territory.code}
            type="button"
            className="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:border-emerald-400"
            onClick={() => navigate(`/search?territoire=${territory.code}`)}
            aria-label={territory.name}
            title={territory.name}
          >
            <span>{territory.flag}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
