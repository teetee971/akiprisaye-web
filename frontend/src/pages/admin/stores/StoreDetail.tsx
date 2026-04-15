 
/**
 * StoreDetail - Store Detail View
 * Features: full store info, map display, edit/delete actions
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Edit, Trash2, MapPin, Phone, Building, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import { GlassCard } from '../../../components/ui/glass-card';
import {
  getStore,
  getStoreStatic,
  deleteStore,
  type Store,
} from '../../../services/admin/storeAdminService';
import { isStaticPreviewEnv } from '../../../services/admin/runtimeEnv';
import type { TerritoryCode } from '../../../types/extensions';
import { StoreOpenStatus } from '../../../components/store/StoreOpenStatus';
import { StoreHoursDisplay } from '../../../components/store/StoreHoursDisplay';
import { getStoreHours } from '../../../services/storeHoursService';

// Fix for Leaflet default marker icon
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

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

export default function StoreDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadStore();
    }
  }, [id]);

  const loadStore = async () => {
    try {
      setLoading(true);
      const data = isStaticPreviewEnv()
        ? await getStoreStatic(id!)
        : await getStore(id!);
      if (!data) throw new Error('Enseigne introuvable');
      setStore(data);
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'enseigne');
      console.error('Error loading store:', error);
      navigate('/admin/stores');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!store) return;

    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer l'enseigne "${store.name}" ?`
      )
    ) {
      return;
    }

    try {
      await deleteStore(store.id);
      toast.success('Enseigne supprimée avec succès');
      navigate('/admin/stores');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      console.error('Error deleting store:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/80"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-12 text-white/60">
        Enseigne introuvable
      </div>
    );
  }

  const territory = TERRITORIES.find((t) => t.code === store.territory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{store.name}</h1>
          <p className="text-white/60 mt-1">
            {territory ? territory.name : store.territory}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/admin/stores/${store.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Edit className="h-5 w-5" />
            Modifier
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <Trash2 className="h-5 w-5" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Store Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Details */}
        <GlassCard title="Informations">
          <div className="space-y-4">
            {/* Open Status */}
            <div>
              <div className="text-sm text-white/60 mb-1">Statut d'ouverture</div>
              <StoreOpenStatus
                hours={getStoreHours(store.id, store.territory?.toLowerCase())}
              />
            </div>
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-white/60 mt-0.5" />
              <div>
                <div className="text-sm text-white/60">ID de marque</div>
                <div className="text-white/90 font-medium">
                  {store.brandId}
                </div>
                {store.brandName && (
                  <div className="text-sm text-white/60">
                    {store.brandName}
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-white/60 mt-0.5" />
              <div>
                <div className="text-sm text-white/60">Adresse</div>
                <div className="text-white/90">
                  {store.address}
                  <br />
                  {store.postalCode} {store.city}
                </div>
              </div>
            </div>

            {/* Phone */}
            {store.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-white/60 mt-0.5" />
                <div>
                  <div className="text-sm text-white/60">Téléphone</div>
                  <div className="text-white/90">{store.phone}</div>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <span
                  className={store.isActive ? 'text-green-400' : 'text-red-400'}
                >
                  {store.isActive ? '🟢' : '🔴'}
                </span>
              </div>
              <div>
                <div className="text-sm text-white/60">Statut</div>
                <div className="text-white/90">
                  {store.isActive ? 'Actif' : 'Inactif'}
                </div>
              </div>
            </div>

            {/* Coordinates */}
            {store.latitude && store.longitude && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-white/60 mt-0.5" />
                <div>
                  <div className="text-sm text-white/60">Coordonnées GPS</div>
                  <div className="text-white/90 font-mono text-sm">
                    {store.latitude.toFixed(6)}, {store.longitude.toFixed(6)}
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            {(store.createdAt || store.updatedAt) && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                {store.createdAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-white/60" />
                    <span className="text-white/60">Créé le:</span>
                    <span className="text-white/80">
                      {new Date(store.createdAt).toLocaleDateString('fr-FR', {
                        dateStyle: 'medium',
                      })}
                    </span>
                  </div>
                )}
                {store.updatedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-white/60" />
                    <span className="text-white/60">Modifié le:</span>
                    <span className="text-white/80">
                      {new Date(store.updatedAt).toLocaleDateString('fr-FR', {
                        dateStyle: 'medium',
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Map */}
        {store.latitude && store.longitude && (
          <GlassCard title="Localisation">
            <div className="h-[400px] rounded-lg overflow-hidden">
              <MapContainer
                center={[store.latitude, store.longitude]}
                zoom={15}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[store.latitude, store.longitude]}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{store.name}</div>
                      <div className="text-gray-600">
                        {store.address}
                        <br />
                        {store.postalCode} {store.city}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </GlassCard>
        )}

        {/* No Map Card */}
        {(!store.latitude || !store.longitude) && (
          <GlassCard title="Localisation">
            <div className="flex flex-col items-center justify-center h-[400px] text-white/60">
              <MapPin className="h-12 w-12 mb-4" />
              <p>Aucune coordonnée GPS disponible</p>
              <button
                onClick={() => navigate(`/admin/stores/${store.id}/edit`)}
                className="mt-4 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
              >
                Ajouter des coordonnées
              </button>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Opening Hours */}
      <GlassCard title="Horaires d'ouverture">
        <StoreHoursDisplay
          hours={getStoreHours(store.id, store.territory?.toLowerCase())}
          className="text-white/80"
        />
      </GlassCard>
    </div>
  );
}
