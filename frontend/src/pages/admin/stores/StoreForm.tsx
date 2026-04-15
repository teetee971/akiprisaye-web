/**
 * StoreForm - Create/Edit Store Form
 * Features: validation with react-hook-form + zod, geocoding
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassCard } from '../../../components/ui/glass-card';
import {
  createStore,
  updateStore,
  getStore,
  getStoreStatic,
  type CreateStoreInput,
  type UpdateStoreInput,
} from '../../../services/admin/storeAdminService';
import { isStaticPreviewEnv } from '../../../services/admin/runtimeEnv';
import { geocodeAddress } from '../../../services/geocodingService';
import type { TerritoryCode } from '../../../types/extensions';

const TERRITORIES: { code: TerritoryCode; name: string }[] = [
  { code: 'GP', name: 'Guadeloupe' },
  { code: 'MQ', name: 'Martinique' },
  { code: 'GF', name: 'Guyane' },
  { code: 'RE', name: 'Réunion' },
  { code: 'YT', name: 'Mayotte' },
  { code: 'PM', name: 'Saint-Pierre-et-Miquelon' },
  { code: 'BL', name: 'Saint-Barthélemy' },
  { code: 'MF', name: 'Saint-Martin' },
  { code: 'WF', name: 'Wallis-et-Futuna' },
  { code: 'PF', name: 'Polynésie française' },
  { code: 'NC', name: 'Nouvelle-Calédonie' },
];

// Validation schema
const storeSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  brandId: z.string().min(1, 'L\'ID de marque est requis'),
  address: z.string().min(5, 'L\'adresse doit contenir au moins 5 caractères'),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres'),
  city: z.string().min(2, 'La ville est requise'),
  territory: z.enum([
    'GP',
    'MQ',
    'GF',
    'RE',
    'YT',
    'PM',
    'BL',
    'MF',
    'WF',
    'PF',
    'NC',
  ]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z
    .string()
    .regex(
      /^(\+\d{1,3}[- ]?)?\d{10}$/,
      'Format de téléphone invalide (ex: 0590123456)'
    )
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional(),
});

type StoreFormData = z.infer<typeof storeSchema>;

export default function StoreForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id && id !== 'new';
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: '',
      brandId: '',
      address: '',
      postalCode: '',
      city: '',
      territory: 'GP',
      latitude: undefined,
      longitude: undefined,
      phone: '',
      isActive: true,
    },
  });

  const address = watch('address');
  const postalCode = watch('postalCode');
  const city = watch('city');

  useEffect(() => {
    if (isEditMode) {
      loadStore();
    }
  }, [id, isEditMode]);

  const loadStore = async () => {
    try {
      setLoading(true);
      const store = isStaticPreviewEnv()
        ? await getStoreStatic(id!)
        : await getStore(id!);
      if (!store) throw new Error('Enseigne introuvable');
      setValue('name', store.name);
      setValue('brandId', store.brandId);
      setValue('address', store.address);
      setValue('postalCode', store.postalCode);
      setValue('city', store.city);
      setValue('territory', store.territory as 'GP' | 'MQ' | 'RE' | 'GF' | 'YT' | 'BL' | 'MF' | 'NC' | 'PF' | 'WF' | 'PM');
      setValue('latitude', store.latitude);
      setValue('longitude', store.longitude);
      setValue('phone', store.phone || '');
      setValue('isActive', store.isActive);
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'enseigne');
      console.error('Error loading store:', error);
      navigate('/admin/stores');
    } finally {
      setLoading(false);
    }
  };

  const handleGeocode = async () => {
    if (!address || !city) {
      toast.error('Veuillez renseigner l\'adresse et la ville');
      return;
    }

    setGeocoding(true);
    try {
      const fullAddress = `${address}, ${postalCode} ${city}`;
      const result = await geocodeAddress(fullAddress);

      if (result.success && result.coordinates) {
        setValue('latitude', result.coordinates.lat);
        setValue('longitude', result.coordinates.lon);
        toast.success('Coordonnées géographiques récupérées avec succès');
      } else {
        toast.error(result.error || 'Impossible de géolocaliser cette adresse');
      }
    } catch (error) {
      toast.error('Erreur lors de la géolocalisation');
      console.error('Geocoding error:', error);
    } finally {
      setGeocoding(false);
    }
  };

  const onSubmit = async (data: StoreFormData) => {
    setLoading(true);
    try {
      if (isEditMode) {
        // Update existing store
        const updateData: UpdateStoreInput = {
          name: data.name,
          address: data.address,
          postalCode: data.postalCode,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          phone: data.phone || undefined,
          isActive: data.isActive,
        };
        await updateStore(id!, updateData);
        toast.success('Enseigne mise à jour avec succès');
      } else {
        // Create new store
        const createData: CreateStoreInput = {
          name: data.name,
          brandId: data.brandId,
          address: data.address,
          postalCode: data.postalCode,
          city: data.city,
          territory: data.territory,
          latitude: data.latitude,
          longitude: data.longitude,
          phone: data.phone || undefined,
        };
        await createStore(createData);
        toast.success('Enseigne créée avec succès');
      }
      navigate('/admin/stores');
    } catch (error) {
      toast.error(
        isEditMode
          ? 'Erreur lors de la mise à jour'
          : 'Erreur lors de la création'
      );
      console.error('Error saving store:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/80"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {isEditMode ? 'Modifier l\'enseigne' : 'Nouvelle enseigne'}
        </h1>
      </div>

      {/* Form */}
      <GlassCard>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="sf-nom" className="block text-sm font-medium text-white/90 mb-2">
              Nom <span className="text-red-400">*</span>
            </label>
            <input
              
              id="sf-nom"
              type="text"
              {...register('name')}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Ex: Carrefour Market"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Brand ID */}
          <div>
            <label htmlFor="sf-id-marque" className="block text-sm font-medium text-white/90 mb-2">
              ID de marque <span className="text-red-400">*</span>
            </label>
            <input
              
              id="sf-id-marque"
              type="text"
              {...register('brandId')}
              disabled={isEditMode}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Ex: carrefour"
            />
            {errors.brandId && (
              <p className="mt-1 text-sm text-red-400">
                {errors.brandId.message}
              </p>
            )}
          </div>

          {/* Territory */}
          <div>
            <label htmlFor="sf-territoire" className="block text-sm font-medium text-white/90 mb-2">
              Territoire <span className="text-red-400">*</span>
            </label>
            <select
              
              id="sf-territoire"
              {...register('territory')}
              disabled={isEditMode}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {TERRITORIES.map((territory) => (
                <option key={territory.code} value={territory.code}>
                  {territory.name} ({territory.code})
                </option>
              ))}
            </select>
            {errors.territory && (
              <p className="mt-1 text-sm text-red-400">
                {errors.territory.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="sf-adresse" className="block text-sm font-medium text-white/90 mb-2">
              Adresse <span className="text-red-400">*</span>
            </label>
            <input
              
              id="sf-adresse"
              type="text"
              {...register('address')}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Ex: 12 Rue de la République"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-400">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* Postal Code & City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sf-code-postal" className="block text-sm font-medium text-white/90 mb-2">
                Code postal <span className="text-red-400">*</span>
              </label>
              <input
                
                id="sf-code-postal"
                type="text"
                {...register('postalCode')}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="97100"
              />
              {errors.postalCode && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.postalCode.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="sf-ville" className="block text-sm font-medium text-white/90 mb-2">
                Ville <span className="text-red-400">*</span>
              </label>
              <input
                
                id="sf-ville"
                type="text"
                {...register('city')}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Pointe-à-Pitre"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.city.message}
                </p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="sf-telephone" className="block text-sm font-medium text-white/90 mb-2">
                Téléphone
            </label>
            <input
              
                id="sf-telephone"
                type="tel"
              {...register('phone')}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="0590123456"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-400">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Coordinates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="block text-sm font-medium text-white/90">
              Coordonnées GPS
            </span>
              <button
                type="button"
                onClick={handleGeocode}
                disabled={geocoding || !address || !city}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <MapPin className="h-4 w-4" />
                {geocoding ? 'Géolocalisation...' : 'Géolocaliser'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sf-latitude" className="block text-xs text-white/60 mb-1">
                  Latitude
                </label>
                <input
                  
                  id="sf-latitude"
                  type="number"
                  step="any"
                  {...register('latitude', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="16.2415"
                />
              </div>

              <div>
                <label htmlFor="sf-longitude" className="block text-xs text-white/60 mb-1">
                  Longitude
                </label>
                <input
                  
                  id="sf-longitude"
                  type="number"
                  step="any"
                  {...register('longitude', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="-61.5331"
                />
              </div>
            </div>
          </div>

          {/* Active Status (only in edit mode) */}
          {isEditMode && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-white/90 cursor-pointer"
              >
                Enseigne active
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => navigate('/admin/stores')}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              {loading
                ? 'Enregistrement...'
                : isEditMode
                ? 'Mettre à jour'
                : 'Créer'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
