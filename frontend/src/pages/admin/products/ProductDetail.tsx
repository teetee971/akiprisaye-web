import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GlassCard } from '@/components/ui/glass-card';
import {
  getProduct,
  getProductStatic,
  deleteProduct,
  type Product,
} from '@/services/admin/productAdminService';
import { isStaticPreviewEnv } from '@/services/admin/runtimeEnv';
import {
  Edit,
  Trash2,
  Barcode,
  Image as ImageIcon,
  Tag,
  Weight,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = isStaticPreviewEnv()
        ? await getProductStatic(productId)
        : await getProduct(productId);
      if (!data) throw new Error('Produit introuvable');
      setProduct(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load product');
      toast.error('Erreur lors du chargement du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !id) return;

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
      return;
    }

    try {
      await deleteProduct(id);
      toast.success('Produit supprimé avec succès');
      navigate('/admin/products');
    } catch {
      toast.error('Erreur lors de la suppression du produit');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <GlassCard>
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="mt-4 text-white/60">Chargement du produit...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <GlassCard>
          <div className="text-center py-12">
            <p className="text-red-400">{error || 'Produit non trouvé'}</p>
            <button
              onClick={() => navigate('/admin/products')}
              className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Retour à la liste
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate('/admin/products')}
          className="flex items-center gap-2 text-white/70 hover:text-white/90 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à la liste
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/admin/products/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Main content */}
      <GlassCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Image */}
          <div className="md:col-span-1">
            <div className="aspect-square rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <ImageIcon className="w-16 h-16 text-white/30" />
                  <p className="text-white/40 text-sm">Pas d'image</p>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white/90 mb-2">
                {product.name}
              </h1>
              {product.brand && (
                <p className="text-lg text-white/70">{product.brand}</p>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white/50 mb-1">Catégorie</p>
                  <span className="px-3 py-1 rounded-md bg-white/10 text-white/80 text-sm">
                    {product.category}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Weight className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white/50 mb-1">Quantité</p>
                  <p className="text-white/90">
                    {product.quantity} {product.unit}
                  </p>
                </div>
              </div>

              {product.ean && (
                <div className="flex items-start gap-3">
                  <Barcode className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white/50 mb-1">Code EAN</p>
                    <p className="text-white/90 font-mono">{product.ean}</p>
                  </div>
                </div>
              )}

              {product.createdAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white/50 mb-1">Date de création</p>
                    <p className="text-white/90">
                      {new Date(product.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold text-white/80 mb-2">
                  Description
                </h3>
                <p className="text-white/70 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Additional Info Card */}
      {(product.updatedAt || product.id) && (
        <GlassCard className="mt-6">
          <h3 className="text-lg font-semibold text-white/80 mb-4">
            Informations techniques
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/50">ID:</span>
              <span className="ml-2 text-white/80 font-mono">{product.id}</span>
            </div>
            {product.updatedAt && (
              <div>
                <span className="text-white/50">Dernière modification:</span>
                <span className="ml-2 text-white/80">
                  {new Date(product.updatedAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
