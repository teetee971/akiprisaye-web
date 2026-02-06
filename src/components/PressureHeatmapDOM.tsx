import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Circle,
  Tooltip,
} from 'react-leaflet';

import { computePressureIndex } from '../services/pressureIndexService';
import { DOM_COORDINATES } from '../data/domCoordinates';
import { loadLeaflet } from '../utils/leafletClient';

export default function PressureHeatmapDOM() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    loadLeaflet();
  }, []);

  useEffect(() => {
    let mounted = true;
    computePressureIndex().then(res => {
      if (mounted) setData(res);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="h-[420px] rounded-xl overflow-hidden border border-white/10">
      <MapContainer
        center={[14, -60]}
        zoom={4}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {data.map(t => {
          const coord = DOM_COORDINATES[t.territory];
          if (!coord) return null;

          return (
            <Circle
              key={t.territory}
              center={[coord.lat, coord.lng]}
              radius={80000}
              pathOptions={{
                color: color(t.index),
                fillColor: color(t.index),
                fillOpacity: 0.55,
              }}
            >
              <Tooltip>
                <div className="text-sm">
                  <strong>{t.territory.toUpperCase()}</strong>
                  <br />
                  Indice : {t.index.toFixed(0)}
                  <br />
                  Pression : {t.level}
                </div>
              </Tooltip>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
}

function color(index: number) {
  if (index < 95) return '#22c55e';   // vert
  if (index < 105) return '#eab308';  // jaune
  if (index < 120) return '#f97316';  // orange
  return '#ef4444';                   // rouge
}
