import React from 'react';
import { getDecision } from '../utils/arbitrage';

interface Product {
  name: string;
  price: number;
  brand: string;
}

interface Props {
  product: Product;
  userDistance: number; // Distance en km
}

const ProductCard: React.FC<Props> = ({ product, userDistance }) => {
  // On estime une économie brute moyenne de 1.50€ pour le test
  const decision = getDecision(1.50, userDistance);

  return (
    <div className="p-4 border border-slate-100 rounded-3xl shadow-sm bg-white mb-4 transition-transform active:scale-95">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.brand}</span>
          <h3 className="text-lg font-black text-slate-900 leading-tight">{product.name}</h3>
        </div>
        <span className="text-2xl font-black text-slate-900">{product.price.toFixed(2)}€</span>
      </div>

      {/* LE BADGE ARBITRAGE V4.8 */}
      <div className={`mt-4 p-3 rounded-2xl flex items-center space-x-3 ${
        decision.rentable ? 'bg-emerald-50 border border-emerald-100' : 'bg-orange-50 border border-orange-100'
      }`}>
        <span className="text-xl">{decision.rentable ? '✅' : '⛽'}</span>
        <div className="flex flex-col">
          <span className={`text-[10px] font-black uppercase tracking-tight ${
            decision.rentable ? 'text-emerald-700' : 'text-orange-700'
          }`}>
            {decision.rentable ? 'Arbitrage Positif' : 'Arbitrage Négatif'}
          </span>
          <p className={`text-xs font-bold ${
            decision.rentable ? 'text-emerald-600' : 'text-orange-600'
          }`}>
            {decision.rentable 
              ? `+${decision.gainReel}€ d'économie réelle` 
              : `Perte de ${Math.abs(parseFloat(decision.gainReel))}€ (Essence)`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
