import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GlassCard } from '@/components/ui/glass-card';
import {
  createProduct,
  updateProduct,
  getProduct,
  searchOpenFoodFacts,
  type CreateProductInput,
} from '@/services/admin/productAdminService';
import type { ProductCategory, Unit } from '@/types/product';
import { Package, Save, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const PRODUCT_CATEGORIES: ProductCategory[] = [
  'alimentaire',
  'boissons',
  'hygiene',
  'entretien',
  'bebe',
  'viande',
  'poisson',
  'fruits-legumes',
  'pain-patisserie',
  'produits-laitiers',
  'epicerie',
  'surgeles',
  'autre',
];

const UNITS: Unit[] = ['g', 'kg', 'ml', 'L', 'unité'];

const productSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  brand: z.string().optional(),
  category: z.enum([
    'alimentaire',
    'boissons',
    'hygiene',
    'entretien',
    'bebe',
    'viande',
    'poisson',
    'fruits-legumes',
    'pain-patisserie',
    'produits-laitiers',
    'epicerie',
    'surgeles',
    'autre',
  ]),
  ean: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{8}$|^\d{13}$/.test(val),
      'L\'EAN doit contenir 8 ou 13 chiffres'
    ),
  description: z.string().optional(),
  unit: z.enum(['g', 'kg', 'ml', 'L', 'unité']),
  quantity: z.number().positive('La quantité doit être positive'),
  imageUrl: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val),
      'L\'URL doit commencer par http:// ou https://'
    ),
});

type ProductFormData = z.infer<typeof productSchema>;

export function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [searchingOFF, setSearchingOFF] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      brand: '',
      category: 'alimentaire',
      ean: '',
      description: '',
      unit: 'g',
      quantity: 0,
      imageUrl: '',
    },
  });

  const eanValue = watch('ean');

  useEffect(() => {
    if (isEditMode && id) {
      loadProduct(id);
    }
  }, [id, isEditMode]);

  const loadProduct = async (productId: string) => {
    setLoading(true);
    try {
      const product = await getProduct(productId);
      reset({
        name: product.name,
        brand: product.brand || '',
        category: product.category,
        ean: product.ean || '',
        description: product.description || '',
        unit: product.unit,
        quantity: product.quantity,
        imageUrl: product.imageUrl || '',
      });
    } catch {
      toast.error('Erreur lors du chargement du produit');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFoodFactsSearch = async () => {
    if (!eanValue || eanValue.length < 8) {
      toast.error('Veuillez entrer un code EAN valide');
      return;
    }

    setSearchingOFF(true);
    try {
      const result = await searchOpenFoodFacts(eanValue);

      if (result.name) setValue('name', result.name);
      if (result.brand) setValue('brand', result.brand);
      if (result.imageUrl) setValue('imageUrl', result.imageUrl);

      // Try to map category
      if (result.category) {
        const categoryLower = result.category.toLowerCase();
        if (categoryLower.includes('boisson') || categoryLower.includes('drink')) {
          setValue('category', 'boissons');
        } else if (categoryLower.includes('viande') || categoryLower.includes('meat')) {
          setValue('category', 'viande');
        } else if (categoryLower.includes('poisson') || categoryLower.includes('fish')) {
          setValue('category', 'poisson');
        } else if (
          categoryLower.includes('fruit') ||
          categoryLower.includes('legume') ||
          categoryLower.includes('vegetable')
        ) {
          setValue('category', 'fruits-legumes');
        } else if (categoryLower.includes('lait') || categoryLower.includes('dairy')) {
          setValue('category', 'produits-laitiers');
        } else {
          setValue('category', 'alimentaire');
        }
      }

      toast.success('Produit trouvé sur OpenFoodFacts !');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Produit non trouvé');
    } finally {
      setSearchingOFF(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setSubmitting(true);
    try {
      const productData: CreateProductInput = {
        name: data.name,
        brand: data.brand || undefined,
        category: data.category,
        ean: data.ean || undefined,
        description: data.description || undefined,
        unit: data.unit,
        quantity: data.quantity,
        imageUrl: data.imageUrl || undefined,
      };

      if (isEditMode && id) {
        await updateProduct(id, productData);
        toast.success('Produit mis à jour avec succès');
      } else {
        await createProduct(productData);
        toast.success('Produit créé avec succès');
      }

      navigate('/admin/products');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde du produit'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <GlassCard>
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="mt-4 text-slate-600">Chargement...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Package className="w-8 h-8" />
          {isEditMode ? 'Modifier le produit' : 'Nouveau produit'}
        </h1>
      </div>

      <GlassCard>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="pf-nom-produit" className="mb-2 block text-sm font-medium text-slate-700">
              Nom du produit <span className="text-red-400">*</span>
            </label>
            <input
              
              id="pf-nom-produit"
              type="text"
              {...register('name')}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Lait demi-écrémé"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Brand */}
          <div>
            <label htmlFor="pf-marque" className="mb-2 block text-sm font-medium text-slate-700">
              Marque
            </label>
            <input
              
              id="pf-marque"
              type="text"
              {...register('brand')}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Lactel"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="pf-categorie" className="mb-2 block text-sm font-medium text-slate-700">
              Catégorie <span className="text-red-400">*</span>
            </label>
            <select
              
              id="pf-categorie"
              {...register('category')}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-400">{errors.category.message}</p>
            )}
          </div>

          {/* EAN with OpenFoodFacts search */}
          <div>
            <label htmlFor="pf-ean" className="mb-2 block text-sm font-medium text-slate-700">
              Code EAN (8 ou 13 chiffres)
            </label>
            <div className="flex gap-2">
              <input
                 id="pf-ean"
                 
                type="text"
                {...register('ean')}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 3760074380329"
                maxLength={13}
              />
              {eanValue && eanValue.length >= 8 && (
                <button
                  type="button"
                  onClick={handleOpenFoodFactsSearch}
                  disabled={searchingOFF}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {searchingOFF ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  OpenFoodFacts
                </button>
              )}
            </div>
            {errors.ean && (
              <p className="mt-1 text-sm text-red-400">{errors.ean.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="pf-description" className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              
              id="pf-description"
              {...register('description')}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description du produit..."
            />
          </div>

          {/* Unit and Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-unite" className="mb-2 block text-sm font-medium text-slate-700">
              Unité <span className="text-red-400">*</span>
              </label>
              <select
                
              id="pf-unite"
              {...register('unit')}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              {errors.unit && (
                <p className="mt-1 text-sm text-red-400">{errors.unit.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="pf-quantite" className="mb-2 block text-sm font-medium text-slate-700">
              Quantité <span className="text-red-400">*</span>
              </label>
              <input
                
              id="pf-quantite"
              type="number"
                step="0.01"
                {...register('quantity', { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 500"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-400">{errors.quantity.message}</p>
              )}
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="pf-image-url" className="mb-2 block text-sm font-medium text-slate-700">
              URL de l'image
            </label>
            <input
              
              id="pf-image-url"
              type="url"
              {...register('imageUrl')}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-400">{errors.imageUrl.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditMode ? 'Mettre à jour' : 'Créer'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
              Annuler
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
