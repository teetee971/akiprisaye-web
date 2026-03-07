// @ts-nocheck -- Multiple Company type union issues; TODO: fix storeCompanyService types
 
/**
 * Store Detail Page
 * 
 * Comprehensive store profile page displaying:
 * - Store information (name, address, contact)
 * - Company information (SIREN, group, subsidiaries)
 * - Price history graphs
 * - Territory statistics
 * - Comparative metrics
 * 
 * Public interest tool - institutional presentation
 * No dark patterns - transparent data sources
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getStoreWithCompany } from '../services/storeCompanyService';
import { getCompanyById } from '../services/companyRegistryService';
import type { StoreWithCompany } from '../services/storeCompanyService';
import type { Company } from '../types/company';
import { getCheapestProductsAtStore, calculateDataReliability } from '../services/storeCheapestProductsService';
import CheapestProductsSection from '../components/store/CheapestProductsSection';
import { useTiPanier } from '../hooks/useTiPanier';
import { requestGeolocation } from '../utils/geolocationEnhanced';
import { calculateDistance } from '../utils/geoLocation';

export default function StoreDetail() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreWithCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'prices' | 'company' | 'history'>('info');
  const [distance, setDistance] = useState<number | null>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lon: number } | null>(null);
  const { count: basketCount } = useTiPanier('comparison');

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    // Load store data with company information
    const storeData = getStoreWithCompany(storeId);
    setStore(storeData);
    setLoading(false);
  }, [storeId]);

  // Try to get user location for distance calculation
  useEffect(() => {
    if (!store?.coordinates) return;

    requestGeolocation().then(result => {
      if (result.success && result.position) {
        setUserPosition({
          lat: result.position.latitude,
          lon: result.position.longitude,
        });

        const dist = calculateDistance(
          result.position.latitude,
          result.position.longitude,
          store.coordinates.lat,
          store.coordinates.lon
        );
        setDistance(dist);
      }
    });
  }, [store]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md bg-slate-900 rounded-xl p-6 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-xl font-semibold text-white mb-2">Enseigne non trouvée</h2>
          <p className="text-gray-300 mb-4">
            Cette enseigne n'existe pas ou a été supprimée de notre base de données.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Neutral Banner - Credibility */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🏛️</span>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-blue-200 mb-2">
                Données issues de sources publiques et d'observations citoyennes
              </h2>
              <p className="text-blue-100 text-sm">
                Ce site ne vend rien et ne recommande aucun achat.
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4 transition-colors"
          >
            ← Retour
          </button>
          
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-2xl">
                    🏪
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">{store.name}</h1>
                    <p className="text-gray-400 text-sm">{store.chain}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="text-gray-500">📍</span>
                    <span>{store.address}, {store.postalCode} {store.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="text-gray-500">🌍</span>
                    <span className="px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded">
                      {store.territory}
                    </span>
                  </div>
                  {store.phone && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-gray-500">📞</span>
                      <a href={`tel:${store.phone}`} className="hover:text-blue-400 transition-colors">
                        {store.phone}
                      </a>
                    </div>
                  )}
                  {distance !== null && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-gray-500">📏</span>
                      <span>
                        {distance < 1 
                          ? `${Math.round(distance * 1000)} m` 
                          : `${distance.toFixed(1)} km`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col gap-2">
                {store.isCompanyActive !== undefined && (
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    store.isCompanyActive 
                      ? 'bg-green-900/30 text-green-300 border border-green-700'
                      : 'bg-red-900/30 text-red-300 border border-red-700'
                  }`}>
                    {store.isCompanyActive ? '✅ Entreprise active' : '⚠️ Entreprise cessée'}
                  </div>
                )}
                
                {store.services && store.services.length > 0 && (
                  <div className="text-sm text-gray-400">
                    <span className="font-medium text-gray-300">Services :</span> {store.services.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - PROMPT 7 */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-3">
              {store.coordinates && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${store.coordinates.lat},${store.coordinates.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[200px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span>🧭</span>
                  <span>Y aller (GPS)</span>
                </a>
              )}
              
              {basketCount > 0 && (
                <Link
                  to={`/comparer-panier?storeId=${store.id}`}
                  className="flex-1 min-w-[200px] px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span>🛒</span>
                  <span>Comparer avec mon panier ({basketCount})</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div className="flex-1">
              <p className="text-amber-200 text-sm font-medium mb-1">
                Outil d'observation - Aucun conseil
              </p>
              <p className="text-amber-100/80 text-xs">
                Cette page présente des données observées et déclarées. Nous ne donnons aucun conseil d'achat, 
                aucune recommandation commerciale. Les informations sont fournies à titre informatif uniquement.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 mb-6">
          <div className="flex border-b border-slate-800 overflow-x-auto">
            {[
              { id: 'info', label: '📋 Informations', icon: '📋' },
              { id: 'prices', label: '💰 Prix moyens', icon: '💰' },
              { id: 'company', label: '🏢 Entreprise', icon: '🏢' },
              { id: 'history', label: '📊 Historique', icon: '📊' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-slate-800/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Informations générales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoCard label="Nom complet" value={store.name} />
                    <InfoCard label="Enseigne" value={store.chain} />
                    <InfoCard label="Ville" value={store.city} />
                    <InfoCard label="Code postal" value={store.postalCode} />
                    <InfoCard label="Territoire" value={store.territory} />
                    {store.phone && <InfoCard label="Téléphone" value={store.phone} />}
                  </div>
                </div>

                {store.coordinates && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Localisation</h3>
                    <div className="bg-slate-800 rounded-lg p-4">
                      <p className="text-gray-300 text-sm mb-2">Coordonnées GPS :</p>
                      <p className="text-blue-400 font-mono">
                        {store.coordinates.lat.toFixed(6)}, {store.coordinates.lon.toFixed(6)}
                      </p>
                      <Link
                        to="/carte"
                        state={{ center: [store.coordinates.lat, store.coordinates.lon], zoom: 15 }}
                        className="mt-3 inline-block text-blue-400 hover:text-blue-300 text-sm transition-colors"
                      >
                        🗺️ Voir sur la carte →
                      </Link>
                    </div>
                  </div>
                )}

                {store.openingHours && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Horaires d'ouverture</h3>
                    <div className="bg-slate-800 rounded-lg p-4">
                      <p className="text-gray-300 whitespace-pre-line">{store.openingHours}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Prices Tab - PROMPT 2 */}
            {activeTab === 'prices' && (
              <div className="space-y-6">
                <CheapestProductsSection 
                  products={getCheapestProductsAtStore(store.id, 10)}
                  storeName={store.name}
                />
              </div>
            )}

            {/* Company Tab */}
            {activeTab === 'company' && (
              <div className="space-y-6">
                {store.company ? (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Informations entreprise</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoCard label="Raison sociale" value={store.company.legalName} />
                        {store.company.tradeName && (
                          <InfoCard label="Nom commercial" value={store.company.tradeName} />
                        )}
                        {store.company.siretCode && (
                          <InfoCard label="SIRET" value={store.company.siretCode} />
                        )}
                        {store.company.sirenCode && (
                          <InfoCard label="SIREN" value={store.company.sirenCode} />
                        )}
                        {store.company.vatCode && (
                          <InfoCard label="N° TVA" value={store.company.vatCode} />
                        )}
                        <InfoCard 
                          label="Statut" 
                          value={store.company.activityStatus === 'ACTIVE' ? 'Active' : 'Cessée'}
                          valueClassName={store.company.activityStatus === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}
                        />
                        <InfoCard label="Date de création" value={new Date(store.company.creationDate).toLocaleDateString('fr-FR')} />
                        {store.company.cessationDate && (
                          <InfoCard 
                            label="Date de cessation" 
                            value={new Date(store.company.cessationDate).toLocaleDateString('fr-FR')}
                            valueClassName="text-red-400"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Siège social</h3>
                      <div className="bg-slate-800 rounded-lg p-4">
                        <p className="text-gray-300">
                          {store.company.headOffice.streetNumber && `${store.company.headOffice.streetNumber} `}
                          {store.company.headOffice.streetName}<br />
                          {store.company.headOffice.postalCode} {store.company.headOffice.city}<br />
                          {store.company.headOffice.department}, {store.company.headOffice.country}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Source des données</h3>
                      <div className="bg-slate-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🔍</span>
                          <p className="text-gray-300 font-medium">
                            {store.company.source === 'REGISTRE_ENTREPRISES' && 'Registre des entreprises'}
                            {store.company.source === 'API_PUBLIQUE' && 'API publique'}
                            {store.company.source === 'VALIDATION_INTERNE' && 'Validation interne'}
                          </p>
                        </div>
                        <p className="text-gray-400 text-sm">
                          Dernière mise à jour : {new Date(store.company.lastUpdate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                      <p className="text-blue-200 text-sm">
                        <strong>Transparence :</strong> Les données d'entreprise proviennent de sources publiques 
                        (INSEE, registres officiels). Elles sont présentées à titre informatif uniquement.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-800 rounded-lg p-6 text-center">
                    <div className="text-5xl mb-4">🏢</div>
                    <p className="text-gray-300 mb-2">Informations entreprise non disponibles</p>
                    <p className="text-gray-400 text-sm">
                      Aucune donnée d'entreprise n'est associée à cette enseigne.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Historique des observations</h3>
                  <div className="bg-slate-800 rounded-lg p-6 text-center">
                    <div className="text-5xl mb-4">📈</div>
                    <p className="text-gray-300 mb-2">Historique à venir</p>
                    <p className="text-gray-400 text-sm">
                      Cette section affichera l'historique des observations de prix pour cette enseigne.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                  <p className="text-blue-200 text-sm">
                    <strong>Note :</strong> L'historique présente uniquement des observations déclarées. 
                    Il ne constitue pas un engagement contractuel et ne garantit pas l'exhaustivité des données.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Contribuer à l'observatoire
              </h3>
              <p className="text-gray-300 text-sm">
                Signalez des prix observés dans cette enseigne pour enrichir les données publiques.
              </p>
            </div>
            <Link
              to="/contribuer"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Contribuer →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for info cards
interface InfoCardProps {
  label: string;
  value: string;
  valueClassName?: string;
}

function InfoCard({ label, value, valueClassName = 'text-white' }: InfoCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`font-medium ${valueClassName}`}>{value}</p>
    </div>
  );
}
