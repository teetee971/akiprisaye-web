import ProductCard from '../components/ProductCard';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../lib/api';

export default function Favorites(){
  const { data } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const products = (data ?? []).filter(p => p.favorite);
  return (
    <div className="container py-6 space-y-4">
      <h1 className="text-2xl font-extrabold">Favoris</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
