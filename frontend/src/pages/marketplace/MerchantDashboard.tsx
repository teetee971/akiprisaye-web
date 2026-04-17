/**
 * MerchantDashboard — Tableau de bord enseigne Marketplace
 *
 * Onglets :
 *  - Aperçu général
 *  - Magasins (StoreManager)
 *  - Produits & Prix
 *  - Analytics
 *  - Facturation
 *  - Visibilité / Promotions
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Store,
  Package,
  BarChart3,
  CreditCard,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Plus,
  Trash2,
  Edit3,
  TrendingUp,
  TrendingDown,
  Download,
  Eye,
  MousePointer,
  Trophy,
  MapPin,
  FileText,
  Star,
  ChevronRight,
} from 'lucide-react';
import {
  getAllMerchants,
  getMerchantById,
  getMerchantStores,
  getStoreProducts,
  getProductPriceHistory,
  formatSiret,
  createStore,
  deleteStore,
  updateProductPrice,
  MARKETPLACE_PLANS,
  createProduct,
} from '../../services/merchantService';
import {
  getMerchantInvoices,
  isSubscriptionActive,
  getTvaRate,
} from '../../services/merchantBillingService';
import {
  getMerchantAnalytics,
  downloadAnalyticsCsv,
} from '../../services/merchantAnalyticsService';
import type {
  MerchantProfile,
  MerchantStore,
  MerchantProduct,
  MerchantAnalytics,
  MerchantInvoice,
  MerchantStatus,
} from '../../types/merchant';

// ─── Composants utilitaires ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: MerchantStatus }) {
  const cfg = {
    PENDING: {
      label: 'En attente de validation',
      cls: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30',
      icon: <Clock className="w-3 h-3" />,
    },
    APPROVED: {
      label: 'Compte approuvé',
      cls: 'bg-green-600/20 text-green-300 border-green-600/30',
      icon: <CheckCircle className="w-3 h-3" />,
    },
    SUSPENDED: {
      label: 'Compte suspendu',
      cls: 'bg-red-600/20 text-red-400 border-red-600/30',
      icon: <XCircle className="w-3 h-3" />,
    },
    REJECTED: {
      label: 'Dossier à corriger',
      cls: 'bg-orange-600/20 text-orange-300 border-orange-600/30',
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };
  const c = cfg[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${c.cls}`}
    >
      {c.icon} {c.label}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white/[0.07] border border-white/10 rounded-xl p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Onglet Aperçu ─────────────────────────────────────────────────────────────

function TabOverview({
  merchant,
  stores,
  analytics,
}: {
  merchant: MerchantProfile;
  stores: MerchantStore[];
  analytics: MerchantAnalytics;
}) {
  const plan = MARKETPLACE_PLANS.find((p) => p.id === merchant.plan);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Store className="w-5 h-5 text-white" />}
          label="Magasins"
          value={stores.length}
          color="bg-blue-600"
          sub={plan?.storesMax ? `/ ${plan.storesMax} max` : 'Illimité'}
        />
        <StatCard
          icon={<Eye className="w-5 h-5 text-white" />}
          label="Vues ce mois"
          value={analytics.vuesMagasin}
          color="bg-purple-600"
        />
        <StatCard
          icon={<MousePointer className="w-5 h-5 text-white" />}
          label="Clics ce mois"
          value={analytics.clics}
          color="bg-green-600"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-white" />}
          label="Score prix"
          value={`${analytics.positionnementPrix}%`}
          color="bg-orange-600"
          sub="Comparaisons gagnées"
        />
      </div>

      <div className="bg-white/[0.05] border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Informations légales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Raison sociale :</span>
            <span className="text-white ml-2">{merchant.nomLegal}</span>
          </div>
          <div>
            <span className="text-gray-400">Nom commercial :</span>
            <span className="text-white ml-2">{merchant.nomCommercial}</span>
          </div>
          <div>
            <span className="text-gray-400">SIRET :</span>
            <span className="text-white font-mono ml-2">{formatSiret(merchant.siret)}</span>
          </div>
          <div>
            <span className="text-gray-400">SIREN :</span>
            <span className="text-white font-mono ml-2">{merchant.siren}</span>
          </div>
          <div>
            <span className="text-gray-400">TVA :</span>
            <span className="text-white font-mono ml-2">{merchant.tva}</span>
          </div>
          <div>
            <span className="text-gray-400">Territoire :</span>
            <span className="text-white ml-2 uppercase">{merchant.territoire}</span>
          </div>
          <div>
            <span className="text-gray-400">Statut activité :</span>
            <span
              className={`ml-2 font-medium ${merchant.activityStatus === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}`}
            >
              {merchant.activityStatus}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Plan :</span>
            <span className="text-blue-400 ml-2 font-medium">{plan?.label}</span>
          </div>
        </div>
      </div>

      {merchant.status === 'PENDING' && (
        <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-medium">Dossier en attente de validation</p>
            <p className="text-yellow-400/80 text-sm mt-1">
              Notre équipe examinera votre dossier dans les 48h ouvrées. Vous recevrez une
              notification par email.
            </p>
          </div>
        </div>
      )}
      {merchant.status === 'REJECTED' && merchant.rejectionReason && (
        <div className="bg-red-900/30 border border-red-600/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-medium">Dossier rejeté</p>
            <p className="text-red-400/80 text-sm mt-1">{merchant.rejectionReason}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onglet Magasins ───────────────────────────────────────────────────────────

function TabStores({
  merchant,
  stores,
  onRefresh,
}: {
  merchant: MerchantProfile;
  stores: MerchantStore[];
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    adresse: '',
    ville: '',
    latitude: '',
    longitude: '',
  });
  const plan = MARKETPLACE_PLANS.find((p) => p.id === merchant.plan);
  const atLimit = plan?.storesMax !== null && stores.length >= (plan?.storesMax ?? Infinity);

  const handleAdd = () => {
    if (!form.nom || !form.adresse || !form.ville || !form.latitude || !form.longitude) return;
    createStore({
      merchantId: merchant.id,
      nom: form.nom,
      adresse: form.adresse,
      codePostal: merchant.codePostal,
      ville: form.ville,
      territoire: merchant.territoire,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
    });
    setShowForm(false);
    setForm({ nom: '', adresse: '', ville: '', latitude: '', longitude: '' });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Mes magasins ({stores.length}
          {plan?.storesMax ? ` / ${plan.storesMax}` : ''})
        </h3>
        {!atLimit && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Ajouter un magasin
          </button>
        )}
        {atLimit && (
          <span className="text-yellow-400 text-sm flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> Limite atteinte — passez au plan supérieur
          </span>
        )}
      </div>

      {showForm && (
        <div className="bg-white/[0.07] border border-blue-500/30 rounded-xl p-5 space-y-3">
          <h4 className="text-white font-medium">Nouveau magasin</h4>
          {(['nom', 'adresse', 'ville', 'latitude', 'longitude'] as const).map((f) => (
            <input
              key={f}
              type={f === 'latitude' || f === 'longitude' ? 'number' : 'text'}
              placeholder={
                {
                  nom: 'Nom du magasin *',
                  adresse: 'Adresse *',
                  ville: 'Ville *',
                  latitude: 'Latitude GPS *',
                  longitude: 'Longitude GPS *',
                }[f]
              }
              value={form[f]}
              onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500"
            />
          ))}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors"
            >
              Enregistrer
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-white/10 hover:bg-white/20 text-white text-sm px-5 py-2 rounded-xl transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {stores.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Store className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucun magasin enregistré</p>
          <p className="text-sm mt-1">
            Ajoutez votre premier point de vente pour apparaître sur la carte.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {stores.map((store) => (
            <div
              key={store.id}
              className="bg-white/[0.05] border border-white/10 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-white">{store.nom}</div>
                <div className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {store.adresse}, {store.ville}
                </div>
                <div className="text-xs text-gray-500 font-mono mt-1">
                  {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${store.visible ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}
                >
                  {store.visible ? 'Visible' : 'Masqué'}
                </span>
                <button
                  onClick={() => {
                    deleteStore(store.id, merchant.id);
                    onRefresh();
                  }}
                  className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors"
                  title="Supprimer ce magasin"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Onglet Produits & Prix ───────────────────────────────────────────────────

function TabProducts({ merchant, stores }: { merchant: MerchantProfile; stores: MerchantStore[] }) {
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? '');
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ean: '', nomProduit: '', prix: '', unite: 'pièce' });

  useEffect(() => {
    if (selectedStoreId) setProducts(getStoreProducts(selectedStoreId));
  }, [selectedStoreId]);

  const handleAddProduct = () => {
    if (!form.ean || !form.nomProduit || !form.prix) return;
    const p = createProduct(
      {
        merchantId: merchant.id,
        storeId: selectedStoreId,
        ean: form.ean.replace(/\D/g, ''),
        nomProduit: form.nomProduit,
        categorie: merchant.productCategories[0] ?? 'autre',
        prix: parseFloat(form.prix),
        unite: form.unite,
        disponible: true,
      },
      merchant.nomCommercial
    );
    setProducts((prev) => [...prev, p]);
    setShowForm(false);
    setForm({ ean: '', nomProduit: '', prix: '', unite: 'pièce' });
  };

  const handleUpdatePrice = (productId: string, newPrice: string) => {
    const val = parseFloat(newPrice);
    if (isNaN(val) || val <= 0) return;
    const updated = updateProductPrice(productId, merchant.id, val, merchant.nomCommercial);
    if (updated) setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
  };

  if (stores.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>Ajoutez d'abord un magasin pour gérer vos produits.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <select
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(e.target.value)}
          className="bg-slate-800 border border-white/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nom}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter un produit
        </button>
      </div>

      {showForm && (
        <div className="bg-white/[0.07] border border-blue-500/30 rounded-xl p-5 space-y-3">
          <h4 className="text-white font-medium">Nouveau produit</h4>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Code EAN (13 chiffres) *"
              value={form.ean}
              onChange={(e) =>
                setForm((p) => ({ ...p, ean: e.target.value.replace(/\D/g, '').slice(0, 13) }))
              }
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Nom du produit *"
              value={form.nomProduit}
              onChange={(e) => setForm((p) => ({ ...p, nomProduit: e.target.value }))}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Prix (€) *"
              value={form.prix}
              onChange={(e) => setForm((p) => ({ ...p, prix: e.target.value }))}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Unité (kg, L, pièce…)"
              value={form.unite}
              onChange={(e) => setForm((p) => ({ ...p, unite: e.target.value }))}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleAddProduct}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors"
            >
              Enregistrer
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-white/10 hover:bg-white/20 text-white text-sm px-5 py-2 rounded-xl transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucun produit pour ce magasin</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-left">
                <th className="pb-3 font-medium">EAN</th>
                <th className="pb-3 font-medium">Produit</th>
                <th className="pb-3 font-medium">Unité</th>
                <th className="pb-3 font-medium">Prix (€)</th>
                <th className="pb-3 font-medium">Modifier</th>
                <th className="pb-3 font-medium">Historique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((p) => {
                const history = getProductPriceHistory(p.id);
                return (
                  <tr key={p.id} className="text-white">
                    <td className="py-3 pr-4 font-mono text-gray-400 text-xs">{p.ean}</td>
                    <td className="py-3 pr-4">{p.nomProduit}</td>
                    <td className="py-3 pr-4 text-gray-400">{p.unite}</td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={p.prix.toFixed(2)}
                        onBlur={(e) => handleUpdatePrice(p.id, e.target.value)}
                        className="w-24 bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs text-gray-500">
                        {new Date(p.updatedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs text-gray-500">
                        {history.length} entrée{history.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Onglet Analytics ──────────────────────────────────────────────────────────

function TabAnalytics({
  merchant,
  analytics,
  canExport,
}: {
  merchant: MerchantProfile;
  analytics: MerchantAnalytics;
  canExport: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Statistiques — 30 derniers jours</h3>
        {canExport && (
          <button
            onClick={() => downloadAnalyticsCsv(merchant.id, merchant.nomCommercial, 'month')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<Eye className="w-5 h-5 text-white" />}
          label="Vues fiche magasin"
          value={analytics.vuesMagasin}
          color="bg-blue-600"
        />
        <StatCard
          icon={<MousePointer className="w-5 h-5 text-white" />}
          label="Clics"
          value={analytics.clics}
          color="bg-purple-600"
        />
        <StatCard
          icon={<TrendingDown className="w-5 h-5 text-white" />}
          label="Comparaisons gagnées"
          value={analytics.comparaisonsGagnees}
          color="bg-green-600"
          sub="Moins cher que les concurrents"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          label="Comparaisons perdues"
          value={analytics.comparaisonsPerdues}
          color="bg-orange-600"
          sub="Plus cher que les concurrents"
        />
      </div>

      <div className="bg-white/[0.05] border border-white/10 rounded-xl p-5">
        <h4 className="text-white font-medium mb-4">Score de positionnement prix</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${analytics.positionnementPrix >= 60 ? 'bg-green-500' : analytics.positionnementPrix >= 30 ? 'bg-orange-500' : 'bg-red-500'}`}
              style={{ width: `${analytics.positionnementPrix}%` }}
            />
          </div>
          <span className="text-2xl font-bold text-white w-16 text-right">
            {analytics.positionnementPrix}%
          </span>
        </div>
        <p className="text-gray-400 text-sm mt-2">
          {analytics.positionnementPrix >= 60
            ? 'Excellente compétitivité prix dans votre territoire.'
            : analytics.positionnementPrix >= 30
              ? 'Positionnement prix moyen — des améliorations sont possibles.'
              : 'Votre positionnement prix nécessite une attention particulière.'}
        </p>
      </div>

      {!canExport && (
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-blue-300 font-medium text-sm">
              Export CSV/PDF disponible avec le plan Pro ou Groupe
            </p>
            <p className="text-blue-400/70 text-xs mt-0.5">Téléchargez vos données complètes.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-400" />
        </div>
      )}
    </div>
  );
}

// ─── Onglet Facturation ────────────────────────────────────────────────────────

function TabBilling({
  merchant,
  invoices,
  subscriptionActive,
}: {
  merchant: MerchantProfile;
  invoices: MerchantInvoice[];
  subscriptionActive: boolean;
}) {
  const plan = MARKETPLACE_PLANS.find((p) => p.id === merchant.plan);
  const tvaRate = getTvaRate(merchant.territoire);

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.05] border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Abonnement actuel</h3>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${subscriptionActive ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}
          >
            {subscriptionActive ? 'Actif' : 'Inactif'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Plan :</span>
            <span className="text-white ml-2 font-medium">{plan?.label}</span>
          </div>
          <div>
            <span className="text-gray-400">Facturation :</span>
            <span className="text-white ml-2">
              {merchant.billingCycle === 'annual' ? 'Annuelle' : 'Mensuelle'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">TVA applicable :</span>
            <span className="text-white ml-2">{tvaRate}%</span>
          </div>
          <div>
            <span className="text-gray-400">Depuis le :</span>
            <span className="text-white ml-2">
              {new Date(merchant.planStartDate).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-3">Historique des factures</h3>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            Aucune facture disponible
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-white/[0.05] border border-white/10 rounded-xl p-4 flex items-center justify-between text-sm"
              >
                <div>
                  <div className="text-white font-medium">{inv.numero}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{inv.description}</div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    {new Date(inv.dateEmission).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{inv.montantTTC.toFixed(2)} € TTC</div>
                  <div className="text-gray-400 text-xs">
                    HT : {inv.montantHT.toFixed(2)} € / TVA {inv.tvaRate}%
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                      inv.status === 'paid'
                        ? 'bg-green-600/20 text-green-400'
                        : inv.status === 'pending'
                          ? 'bg-yellow-600/20 text-yellow-400'
                          : inv.status === 'cancelled'
                            ? 'bg-gray-600/20 text-gray-400'
                            : 'bg-red-600/20 text-red-400'
                    }`}
                  >
                    {inv.status === 'paid'
                      ? 'Payée'
                      : inv.status === 'pending'
                        ? 'En attente'
                        : inv.status === 'cancelled'
                          ? 'Annulée'
                          : 'Échec'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Onglet Visibilité ────────────────────────────────────────────────────────

function TabVisibility({
  merchant,
  plan,
}: {
  merchant: MerchantProfile;
  plan: (typeof MARKETPLACE_PLANS)[0] | undefined;
}) {
  const boosts = [
    {
      type: 'badge_partenaire',
      label: 'Badge "Enseigne Partenaire"',
      desc: 'Affiché sur toutes vos fiches magasin et dans les résultats.',
      price: 0,
      included: plan?.partnerBadge,
    },
    {
      type: 'mise_en_avant_locale',
      label: 'Mise en avant locale',
      desc: 'Votre enseigne apparaît en tête des résultats locaux pour 30 jours.',
      price: 29.99,
      included: plan?.boostVisibility,
    },
    {
      type: 'boost_carte',
      label: 'Boost carte interactive',
      desc: 'Épingle mise en avant sur la carte des territoires.',
      price: 19.99,
      included: plan?.boostVisibility,
    },
    {
      type: 'priorite_resultats',
      label: 'Priorité dans les résultats',
      desc: 'Priorité dans le comparateur A KI PRI SA YÉ.',
      price: 0,
      included: plan?.prioritySearch,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Options de visibilité</h3>
      {boosts.map((b) => (
        <div
          key={b.type}
          className="bg-white/[0.05] border border-white/10 rounded-xl p-4 flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-medium">{b.label}</span>
              {b.included && (
                <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full">
                  Inclus dans votre plan
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-1">{b.desc}</p>
          </div>
          {!b.included && (
            <div className="text-right flex-shrink-0 ml-4">
              <div className="text-white font-bold">{b.price.toFixed(2)} €/mois</div>
              <button className="mt-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors">
                Activer
              </button>
            </div>
          )}
          {b.included && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 ml-4" />}
        </div>
      ))}
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Aperçu', icon: Building2 },
  { id: 'stores', label: 'Magasins', icon: Store },
  { id: 'products', label: 'Produits & Prix', icon: Package },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'billing', label: 'Facturation', icon: CreditCard },
  { id: 'visibility', label: 'Visibilité', icon: Zap },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [stores, setStores] = useState<MerchantStore[]>([]);
  const [invoices, setInvoices] = useState<MerchantInvoice[]>([]);
  const [analytics, setAnalytics] = useState<MerchantAnalytics | null>(null);

  // En préproduction : utilise le premier merchant disponible en localStorage
  useEffect(() => {
    const all = getAllMerchants();
    if (all.length === 0) {
      navigate('/marketplace/inscription');
      return;
    }
    const m = all[0];
    setMerchant(m);
    loadData(m);
  }, []);

  const loadData = (m: MerchantProfile) => {
    setStores(getMerchantStores(m.id));
    setInvoices(getMerchantInvoices(m.id));
    setAnalytics(getMerchantAnalytics(m.id, 'month'));
  };

  const handleRefresh = () => {
    if (merchant) loadData(merchant);
  };

  if (!merchant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  const plan = MARKETPLACE_PLANS.find((p) => p.id === merchant.plan);
  const canExport = plan?.exportCsv ?? false;
  const subscriptionActive = isSubscriptionActive(merchant.id);

  return (
    <>
      <Helmet>
        <title>{merchant.nomCommercial} — Tableau de bord Marketplace</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* En-tête */}
        <div className="bg-white/[0.05] border-b border-white/10 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{merchant.nomCommercial}</h1>
                <p className="text-gray-400 text-sm">{merchant.nomLegal}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={merchant.status} />
              <span className="text-xs bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                {plan?.label}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Navigation onglets */}
          <div className="flex gap-1 mb-8 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.10] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Contenu des onglets */}
          {activeTab === 'overview' && analytics && (
            <TabOverview merchant={merchant} stores={stores} analytics={analytics} />
          )}
          {activeTab === 'stores' && (
            <TabStores merchant={merchant} stores={stores} onRefresh={handleRefresh} />
          )}
          {activeTab === 'products' && <TabProducts merchant={merchant} stores={stores} />}
          {activeTab === 'analytics' && analytics && (
            <TabAnalytics merchant={merchant} analytics={analytics} canExport={canExport} />
          )}
          {activeTab === 'billing' && (
            <TabBilling
              merchant={merchant}
              invoices={invoices}
              subscriptionActive={subscriptionActive}
            />
          )}
          {activeTab === 'visibility' && <TabVisibility merchant={merchant} plan={plan} />}
        </div>
      </div>
    </>
  );
}
