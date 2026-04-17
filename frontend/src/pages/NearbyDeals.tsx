/**
 * NearbyDeals — Services de géolocalisation et alertes de proximité
 * Route : /offres-proximite
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, Bell, Navigation, ShoppingBag, Clock, CheckCircle, Euro } from 'lucide-react';

const GEOLOC_FEATURES = [
  {
    id: 'nearby-deals',
    emoji: '📍',
    title: 'Alertes Deals Proximité',
    description: 'Rayon 500m : meilleures promotions en temps réel. Notification push ou SMS.',
    price: '1€/semaine',
    monthlyPrice: '3€/mois',
    features: [
      'Rayon configurable (100m–5km)',
      'Mise à jour en temps réel',
      'Notification push ou SMS',
      'Filtres par catégorie',
    ],
    icon: Bell,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10 border-rose-500/20',
  },
  {
    id: 'route-optimization',
    emoji: '🗺️',
    title: "Optimisation d'Itinéraire",
    description:
      "Visitez 3+ magasins dans l'ordre optimal. Guidage GPS intégré. Économies calculées.",
    price: 'Inclus Premium',
    monthlyPrice: '',
    features: [
      'Optimisation multi-magasins',
      'Guidage GPS intégré',
      "Calcul d'économies en temps réel",
      'Export vers Google Maps / Waze',
    ],
    icon: Navigation,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'click-collect',
    emoji: '🛒',
    title: 'Click & Collect',
    description: 'Réservez au meilleur prix, récupérez en 30 min. Commission sur transaction.',
    price: 'Gratuit',
    monthlyPrice: '(% transaction)',
    features: [
      'Réservation au meilleur prix',
      'Retrait en 30 minutes',
      'Stock temps réel',
      'Notification de disponibilité',
    ],
    icon: ShoppingBag,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
  },
];

const EXAMPLE_ALERTS = [
  {
    store: 'Carrefour GP',
    distance: '320m',
    discount: '-30%',
    product: 'Lait 1L Lactel',
    price: '0,89€',
    savingsVsBest: '0,31€',
  },
  {
    store: 'Leader Price',
    distance: '450m',
    discount: '-25%',
    product: 'Pain complet 500g',
    price: '1,12€',
    savingsVsBest: '0,38€',
  },
  {
    store: 'Géant Casino',
    distance: '780m',
    discount: '-40%',
    product: 'Poulet entier 1,5kg',
    price: '4,99€',
    savingsVsBest: '2,01€',
  },
];

export default function NearbyDeals() {
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [radius, setRadius] = useState(500);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <Helmet>
        <title>Offres de Proximité — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Alertes géolocalisées sur les meilleures promotions proches de chez vous. Optimisation d'itinéraire et Click & Collect."
        />
      </Helmet>

      {/* Hero */}
      <div className="max-w-5xl mx-auto mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-full px-4 py-2 mb-4">
          <MapPin className="w-4 h-4 text-rose-400" />
          <span className="text-rose-400 text-sm">Géolocalisation Premium</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Les meilleures promos
          <br />
          <span className="text-rose-400">à moins de 500m</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Recevez des alertes en temps réel sur les promotions proches de chez vous. Économisez en
          moyenne <strong className="text-white">47€/semaine</strong>.
        </p>
      </div>

      {/* Live Example Alerts */}
      <div className="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-xl p-5 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-400">Alertes en direct (simulé)</span>
        </div>
        <div className="space-y-3">
          {EXAMPLE_ALERTS.map((alert, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/5"
            >
              <div className="text-2xl">🔔</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">
                  {alert.product} — <span className="text-rose-400">{alert.price}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {alert.store} · {alert.distance} · {alert.discount}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-400 font-medium">
                  Économie {alert.savingsVsBest}
                </div>
                <div className="text-xs text-gray-500">vs prix moyen</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {GEOLOC_FEATURES.map((feature) => {
          const FeatureIcon = feature.icon;
          return (
            <div key={feature.id} className={`border rounded-xl p-5 ${feature.bgColor}`}>
              <div className="text-3xl mb-3">{feature.emoji}</div>
              <h3 className={`font-bold text-white mb-1`}>{feature.title}</h3>
              <div className={`text-sm font-medium ${feature.color} mb-2`}>{feature.price}</div>
              {feature.monthlyPrice && (
                <div className="text-xs text-gray-500 mb-2">{feature.monthlyPrice}</div>
              )}
              <p className="text-xs text-gray-400 mb-3">{feature.description}</p>
              <ul className="space-y-1.5">
                {feature.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle className={`w-3 h-3 ${feature.color} shrink-0`} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Settings + Subscription */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configure Alert */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-400" />
            Configurer mes alertes
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Alertes activées</span>
              <button
                onClick={() => setAlertEnabled(!alertEnabled)}
                role="switch"
                aria-checked={alertEnabled}
                aria-label="Activer/désactiver les alertes"
                className={`w-10 h-5 rounded-full transition-colors ${alertEnabled ? 'bg-rose-500' : 'bg-white/20'}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${alertEnabled ? 'translate-x-5' : ''}`}
                />
              </button>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Rayon de recherche</span>
                <span className="text-white">{radius}m</span>
              </div>
              <input
                type="range"
                min={100}
                max={5000}
                step={100}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>100m</span>
                <span>5km</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <select
                aria-label="Fréquence des alertes"
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm flex-1"
              >
                <option value="1/day">1 alerte/jour</option>
                <option value="3/week">3 alertes/semaine</option>
                <option value="realtime">Temps réel</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subscribe */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Euro className="w-4 h-4 text-emerald-400" />
            S'abonner aux Alertes
          </h2>
          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                <div className="text-rose-400 font-medium text-sm">1€/semaine ou 3€/mois</div>
                <div className="text-xs text-gray-400 mt-1">
                  Inclus : alertes push + SMS + optimisation itinéraire
                </div>
              </div>
              <div>
                <label htmlFor="nearby-deals-email" className="block text-sm text-gray-400 mb-1">
                  Email
                </label>
                <input
                  id="nearby-deals-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vous@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Activer les alertes — 3€/mois
              </button>
            </form>
          ) : (
            <div className="text-center space-y-3">
              <div className="text-4xl">✅</div>
              <div className="text-white font-bold">Alertes activées !</div>
              <div className="text-sm text-gray-400">
                Vous recevrez vos premières alertes sous 24h.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
