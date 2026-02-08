import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { StoreMarker as StoreMarkerType } from '../../types/map';
import { getMarkerColor } from '../../utils/priceColors';

interface StoreMarkerProps {
  store: StoreMarkerType;
  onClick: (store: StoreMarkerType) => void;
}

export default function StoreMarker({ store, onClick }: StoreMarkerProps) {
  const color = getMarkerColor(store.priceIndex);

  const icon = L.divIcon({
    html: `
      <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z"
          fill="${color}"
          stroke="#fff"
          stroke-width="2"
        />
        <circle cx="16" cy="16" r="6" fill="#fff" />
      </svg>
    `,
    className: 'custom-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });

  return (
    <Marker
      position={[store.coordinates.lat, store.coordinates.lon]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(store),
      }}
    >
      <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
        <div className="text-sm">
          <strong>{store.name}</strong>
          <br />
          {store.chain}
        </div>
      </Tooltip>
    </Marker>
  );
}
