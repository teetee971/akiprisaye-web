/**
 * Contribution Moderation Dashboard
 *
 * Admin interface for moderating citizen contributions
 */

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPendingContributions, moderateContribution } from '../../services/contributionService';

interface Contribution {
  id: string;
  type: 'photo' | 'price' | 'missing_product';
  status: 'pending' | 'approved' | 'rejected';
  productName: string;
  barcode?: string;
  territory: string;
  storeName?: string;
  photoUrl?: string;
  price?: number;
  submittedAt: any;
  userId?: string;
}

export default function ModerationDashboard() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [isModeratingId, setIsModeratingId] = useState<string | null>(null);

  useEffect(() => {
    loadContributions();
  }, []);

  const loadContributions = async () => {
    setLoading(true);
    try {
      const data = await getPendingContributions(50);
      setContributions(data);
    } catch (error) {
      console.error('Failed to load contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (contributionId: string, decision: 'approved' | 'rejected') => {
    if (isModeratingId) return;
    setIsModeratingId(contributionId);
    try {
      await moderateContribution(contributionId, decision, moderationNotes || undefined);
      setContributions((prev) => prev.filter((c) => c.id !== contributionId));
      setSelectedContribution(null);
      setModerationNotes('');
    } catch (error) {
      console.error('Failed to moderate:', error);
      toast.error('Erreur lors de la modération');
    } finally {
      setIsModeratingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🛡️ Modération des Contributions</h1>
        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : contributions.length === 0 ? (
          <div className="text-center py-12">Aucune contribution en attente</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {contributions.map((c) => (
              <div key={c.id} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold">{c.productName}</h3>
                {c.photoUrl && (
                  <img
                    src={c.photoUrl}
                    alt={`Produit ${c.productName}`}
                    width={384}
                    height={192}
                    loading="lazy"
                    className="w-full h-48 object-cover rounded mt-2"
                  />
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleModerate(c.id, 'approved')}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => handleModerate(c.id, 'rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded"
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
