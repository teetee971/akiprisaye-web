import Carousel from '../components/Carousel';
import ProductCard from '../components/ProductCard';
import PriceStats from '../components/PriceStats';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../lib/api';

export default function Home(){
  const { data, isLoading, error } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const products = data ?? [];

  return (
    <div className="container py-6 space-y-6">
      <Carousel />
      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Produits essentiels</h2>
            {isLoading && <span className="text-xs opacity-70">Chargement…</span>}
            {error && <span className="text-xs text-red-600">Erreur de chargement</span>}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.slice(0,6).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
        <PriceStats />
      </section>
    </div>
  );
}
