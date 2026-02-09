import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Helmet } from 'react-helmet-async';
import { TERRITORIES, type TerritoryCode } from '../constants/territories';
import {
  OBSERVATOIRE_TERRITORY_STATS,
  getPriceIndexColor,
  getTerritoryStat,
} from '../data/observatoireTerritories';

const defaultCenter: [number, number] = [14.6, -61.0];

export default function MapPage() {
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryCode>('gp');

  const activeTerritory = TERRITORIES[selectedTerritory];
  const selectedStat = getTerritoryStat(selectedTerritory);

  const territories = useMemo(() => {
    return OBSERVATOIRE_TERRITORY_STATS.map((stat) => ({
      stat,
      territory: TERRITORIES[stat.code],
    })).filter((entry) => entry.territory);
  }, []);

  return (
    <>
      <Helmet>
        <title>Carte interactive des territoires - A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Visualisez les indicateurs de prix par territoire et comparez les indices."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="space-y-2">
            <p className="text-slate-400 uppercase tracking-wide text-sm">Carte interactive</p>
            <h1 className="text-3xl md:text-4xl font-bold">🗺️ Territoires & Indices</h1>
            <p className="text-slate-300 max-w-2xl">
              Sélectionnez un territoire pour afficher les indicateurs clés. Les couleurs reflètent
              l’indice relatif des prix (base 100 = métropole).
            </p>
          </header>

          <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <MapContainer
                center={defaultCenter}
                zoom={3}
                scrollWheelZoom={false}
                className="h-[480px] w-full rounded-xl"
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {territories.map(({ stat, territory }) => (
                  <CircleMarker
                    key={stat.code}
                    center={[territory.center.lat, territory.center.lng]}
                    radius={stat.code === selectedTerritory ? 14 : 10}
                    pathOptions={{
                      color: getPriceIndexColor(stat.priceIndex),
                      fillColor: getPriceIndexColor(stat.priceIndex),
                      fillOpacity: 0.8,
                    }}
                    eventHandlers={{
                      click: () => setSelectedTerritory(stat.code),
                    }}
                  >
                    <Popup>
                      <div className="text-slate-900 space-y-1">
                        <strong>{territory.name}</strong>
                        <div>Indice prix: {stat.priceIndex}</div>
                        <div>Inflation: {stat.inflationYoY}%</div>
                        <div>Panier moyen: {stat.panierMoyen} €</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Territoire sélectionné</p>
                <h2 className="text-2xl font-semibold">{activeTerritory?.name}</h2>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-400">Indice prix</p>
                <div className="text-3xl font-bold">
                  {selectedStat?.priceIndex ?? '—'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400">Inflation annuelle</p>
                  <p className="text-lg font-semibold">
                    {selectedStat ? `${selectedStat.inflationYoY}%` : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400">Panier moyen</p>
                  <p className="text-lg font-semibold">
                    {selectedStat ? `${selectedStat.panierMoyen} €` : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400">Échantillon</p>
                  <p className="text-lg font-semibold">
                    {selectedStat ? `${selectedStat.sampleSize} relevés` : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400">Mise à jour</p>
                  <p className="text-lg font-semibold">
                    {selectedStat?.updatedAt ?? '—'}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-blue-700/40 bg-blue-900/20 p-4 text-sm text-blue-100">
                Les données affichées sont des indicateurs mockés destinés à la phase de cadrage.
                Elles seront remplacées par les relevés observatoire dès leur disponibilité.
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
