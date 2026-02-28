import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeUpgradePrompt, UpgradePromptDetail } from '../../billing/upgradePrompt';

export default function UpgradePromptModal() {
  const [detail, setDetail] = useState<UpgradePromptDetail | null>(null);

  useEffect(() => {
    return subscribeUpgradePrompt((next) => setDetail(next));
  }, []);

  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5">
        <h3 className="mb-2 text-lg font-semibold text-white">Fonctionnalité limitée</h3>
        <p className="mb-4 text-sm text-slate-300">{detail.message ?? 'Cette action nécessite un plan supérieur.'}</p>
        <div className="flex justify-end gap-3">
          <button className="rounded bg-slate-700 px-4 py-2 text-sm" onClick={() => setDetail(null)}>Fermer</button>
          <Link to="/upgrade" className="rounded bg-blue-600 px-4 py-2 text-sm text-white" onClick={() => setDetail(null)}>
            Voir les offres
          </Link>
        </div>
      </div>
    </div>
  );
}
