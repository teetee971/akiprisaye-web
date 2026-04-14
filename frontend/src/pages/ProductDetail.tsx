import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCachedProduct } from '../services/freemium';
import { useAuth } from '../context/AuthContext';
import { priceAlertService } from '../services/priceAlertService';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import ShareButton from '../components/comparateur/ShareButton';

function formatPrice(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const product = id ? getCachedProduct(id) : null;

  useEffect(() => {
    if (user && id) {
      priceAlertService.checkIfFollowing(user.uid, id).then(setIsFollowing);
    }
  }, [user, id]);

  if (!product) {
    return <div className="max-w-3xl mx-auto p-4">Produit introuvable. <Link to="/comparateur" className="text-blue-600">Retour</Link></div>;
  }

  const toggleAlert = async () => {
    if (!user || !id) return;
    setLoading(true);
    try {
      await priceAlertService.createAlert({
        productId: id,
        userId: user.uid,
        productName: String(product.title ?? 'Produit'),
        targetPrice: Number(product.price) || 0
      });
      setIsFollowing(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const current = formatPrice(product.price);
  const min = current ?? 0;
  const median = current ?? 0;
  const max = current ?? 0;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <Link to="/comparateur" className="text-blue-600 flex items-center gap-1 text-sm">← Retour comparateur</Link>
      
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">{String(product.title ?? 'Produit')}</h1>
        <div className="flex items-center gap-2">
          <ShareButton
            title={`${String(product.title ?? 'Produit')} — A KI PRI SA YÉ`}
            description={`Prix constaté : ${formatPrice(product.price) ?? '—'} € · Comparez les prix dans votre territoire`}
            productId={id}
            variant="compact"
          />
          {user && (
            <button 
              type="button"
              onClick={toggleAlert}
              disabled={loading || isFollowing}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
                isFollowing 
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-600' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-yellow-400 hover:text-yellow-500'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : isFollowing ? <BellOff size={18} /> : <Bell size={18} />}
              <span className="text-xs font-medium">{isFollowing ? 'Alerte active' : 'Suivre le prix'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="border rounded-p-3 p-3">
          <p className="text-sm text-slate-500">Min</p>
          <p className="font-bold">{min} €</p>
        </div>
        <div className="border rounded-p-3 p-3">
          <p className="text-sm text-slate-500">Médiane</p>
          <p className="font-bold">{median} €</p>
        </div>
        <div className="border rounded-p-3 p-3">
          <p className="text-sm text-slate-500">Max</p>
          <p className="font-bold">{max} €</p>
        </div>
      </div>
    </div>
  );
}
