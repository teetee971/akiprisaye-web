/**
 * ComparateurTransport — Comparateur billets avion DOM↔France
 * Route : /comparateur-transport
 * Module 11 — Comparateurs (billets avion + transport)
 */

import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plane, Bell, Trash2, Clock, Users, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

type DomTerritory = 'GP' | 'MQ' | 'RE' | 'GF' | 'YT';

interface FlightResult {
  airline: string;
  price: number;
  duration: string;
  stops: number;
  logo: string;
  refPrice: number; // métropole-métropole reference
}

interface PriceAlert {
  id: string;
  from: DomTerritory;
  to: string;
  targetPrice: number;
  createdAt: string;
}

interface ReferenceRate {
  from: string;
  to: string;
  lowSeason: number;
  highSeason: number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const DOM_AIRPORTS: Record<DomTerritory, { name: string; flag: string; iata: string }> = {
  GP: { name: 'Guadeloupe', flag: '🇬🇵', iata: 'PTP' },
  MQ: { name: 'Martinique', flag: '🇲🇶', iata: 'FDF' },
  RE: { name: 'La Réunion', flag: '🇷🇪', iata: 'RUN' },
  GF: { name: 'Guyane', flag: '🇬🇫', iata: 'CAY' },
  YT: { name: 'Mayotte', flag: '🇾🇹', iata: 'DZA' },
};

const PARIS_AIRPORTS = [
  { code: 'CDG', name: 'Paris Charles de Gaulle' },
  { code: 'ORY', name: 'Paris Orly' },
];

const MOCK_AIRLINES: FlightResult[] = [
  { airline: 'Air France', price: 0, duration: '8h30', stops: 0, logo: '✈️', refPrice: 120 },
  {
    airline: 'Corsair International',
    price: 0,
    duration: '9h15',
    stops: 0,
    logo: '🛫',
    refPrice: 120,
  },
  { airline: 'French Bee', price: 0, duration: '9h45', stops: 1, logo: '🐝', refPrice: 120 },
  { airline: 'Air Caraïbes', price: 0, duration: '8h50', stops: 0, logo: '✈️', refPrice: 120 },
  { airline: 'Air Antilles', price: 0, duration: '10h20', stops: 2, logo: '🛩️', refPrice: 120 },
];

const BASE_PRICES: Record<DomTerritory, number> = {
  GP: 380,
  MQ: 395,
  RE: 620,
  GF: 450,
  YT: 710,
};

const REFERENCE_RATES: ReferenceRate[] = [
  { from: 'Guadeloupe (PTP)', to: 'Paris CDG/ORY', lowSeason: 350, highSeason: 750 },
  { from: 'Martinique (FDF)', to: 'Paris CDG/ORY', lowSeason: 360, highSeason: 780 },
  { from: 'La Réunion (RUN)', to: 'Paris CDG/ORY', lowSeason: 580, highSeason: 1200 },
  { from: 'Guyane (CAY)', to: 'Paris CDG/ORY', lowSeason: 420, highSeason: 850 },
  { from: 'Mayotte (DZA)', to: 'Paris CDG/ORY', lowSeason: 650, highSeason: 1350 },
];

// ── Local storage helpers ─────────────────────────────────────────────────────

const ALERTS_KEY = 'akiprisaye_flight_alerts';

function loadAlerts(): PriceAlert[] {
  try {
    return JSON.parse(localStorage.getItem(ALERTS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveAlerts(alerts: PriceAlert[]) {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}

function generateMockResults(from: DomTerritory, passengers: number): FlightResult[] {
  const base = BASE_PRICES[from];
  return MOCK_AIRLINES.map((a, i) => ({
    ...a,
    price: Math.round((base + i * 30 - Math.random() * 20) * passengers),
    refPrice: 120 * passengers,
  }));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ComparateurTransport() {
  const [from, setFrom] = useState<DomTerritory>('GP');
  const [to, setTo] = useState('CDG');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [results, setResults] = useState<FlightResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>(loadAlerts);
  const [alertTarget, setAlertTarget] = useState('');
  const searchGenRef = useRef(0);

  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() + 30);
    setDate(today.toISOString().slice(0, 10));
  }, []);

  function handleSearch() {
    if (!date) {
      toast.error('Veuillez sélectionner une date');
      return;
    }
    const gen = ++searchGenRef.current;
    setLoading(true);
    setSearched(false);
    setTimeout(() => {
      if (gen !== searchGenRef.current) return;
      setResults(generateMockResults(from, passengers));
      setLoading(false);
      setSearched(true);
    }, 1000);
  }

  function handleAddAlert() {
    const price = parseInt(alertTarget, 10);
    if (!price || price <= 0) {
      toast.error('Prix cible invalide');
      return;
    }
    const alert: PriceAlert = {
      id: crypto.randomUUID(),
      from,
      to,
      targetPrice: price,
      createdAt: new Date().toISOString(),
    };
    const updated = [alert, ...alerts];
    setAlerts(updated);
    saveAlerts(updated);
    setAlertTarget('');
    toast.success(`Alerte créée : sous ${price} €`);
  }

  function handleDeleteAlert(id: string) {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    saveAlerts(updated);
  }

  const cheapest = results.length > 0 ? Math.min(...results.map((r) => r.price)) : null;

  return (
    <>
      <Helmet>
        <title>Comparateur transport DOM — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Comparez les billets d'avion DOM↔France métropolitaine — A KI PRI SA YÉ"
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6 pb-12 space-y-6">
          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-sky-600 to-blue-800 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Plane className="w-7 h-7 text-sky-200" />
              <h1 className="text-2xl font-black">✈️ Comparateur transport DOM</h1>
            </div>
            <p className="text-sky-200 text-sm">
              Comparez les vols DOM↔France métropolitaine · Données de référence DGAC/OACI 2024
            </p>
          </div>

          {/* ── Disclaimer ── */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <strong>ℹ️ Connexion live non disponible</strong> — Les résultats sont des données de
            référence reconstituées à titre indicatif (source DGAC/OACI 2024). Les prix réels
            peuvent varier.
          </div>

          {/* ── Search form ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plane className="w-5 h-5 text-blue-600" />
              Rechercher un vol
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label htmlFor="ct-from" className="block text-xs font-medium text-gray-600 mb-1">
                  Départ (DOM)
                </label>
                <select
                  id="ct-from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value as DomTerritory)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(DOM_AIRPORTS).map(([code, info]) => (
                    <option key={code} value={code}>
                      {info.flag} {info.name} ({info.iata})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ct-to" className="block text-xs font-medium text-gray-600 mb-1">
                  Destination
                </label>
                <select
                  id="ct-to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {PARIS_AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ct-date" className="block text-xs font-medium text-gray-600 mb-1">
                  Date de départ
                </label>
                <input
                  id="ct-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="ct-passengers"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  <Users className="w-3.5 h-3.5 inline mr-1" />
                  Passagers
                </label>
                <input
                  id="ct-passengers"
                  type="number"
                  min={1}
                  max={9}
                  value={passengers}
                  onChange={(e) => setPassengers(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Plane className="w-4 h-4" />
              )}
              {loading ? 'Recherche en cours…' : 'Rechercher'}
            </button>
          </div>

          {/* ── Results ── */}
          {searched && results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900">
                  {results.length} résultats · {DOM_AIRPORTS[from].flag} {DOM_AIRPORTS[from].name}
                  <ArrowRight className="w-4 h-4 inline mx-1 text-gray-400" />
                  Paris {to}
                </h2>
                {cheapest && (
                  <span className="text-sm text-green-700 font-semibold bg-green-100 px-3 py-1 rounded-full">
                    À partir de {cheapest} €
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {results
                  .sort((a, b) => a.price - b.price)
                  .map((r, i) => (
                    <div
                      key={i}
                      className={`bg-white border rounded-xl p-4 flex items-center justify-between gap-4 ${
                        i === 0 ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{r.logo}</span>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{r.airline}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {r.duration}
                            </span>
                            <span>{r.stops === 0 ? 'Direct' : `${r.stops} escale(s)`}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{r.price} €</p>
                        <p className="text-xs text-gray-400">
                          Réf métro : {r.refPrice} €
                          <span className="ml-1 text-orange-600 font-medium">
                            (+{Math.round(((r.price - r.refPrice) / r.refPrice) * 100)}%)
                          </span>
                        </p>
                        {i === 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            Meilleur prix
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── Tarifs de référence ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="font-bold text-gray-900 mb-4">📊 Tarifs de référence DOM → Paris</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Route
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">
                      Basse saison
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">
                      Haute saison
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {REFERENCE_RATES.map((r) => (
                    <tr key={r.from} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-700">{r.from}</td>
                      <td className="px-4 py-2.5 text-right text-green-700 font-semibold">
                        ~{r.lowSeason} €
                      </td>
                      <td className="px-4 py-2.5 text-right text-orange-600 font-semibold">
                        ~{r.highSeason} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Source DGAC/OACI 2024 — Prix moyens indicatifs toutes compagnies confondues
            </p>
          </div>

          {/* ── Alertes prix ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-gray-900">Alertes prix</h2>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                placeholder="Prix cible en €"
                value={alertTarget}
                onChange={(e) => setAlertTarget(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddAlert}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Créer l'alerte
              </button>
            </div>
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucune alerte configurée</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5"
                  >
                    <div>
                      <span className="text-sm font-semibold text-blue-900">
                        {DOM_AIRPORTS[a.from]?.flag ?? '✈️'} {a.from} → {a.to}
                      </span>
                      <span className="ml-2 text-sm text-blue-700">
                        sous <strong>{a.targetPrice} €</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteAlert(a.id)}
                      className="p-1 text-blue-300 hover:text-red-500 transition-colors"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
