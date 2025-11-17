/**
 * load-map.js — VERSION C (Google Maps + IA + Trajets + Arrêts Promo)
 */

import { getDB } from '../firebase-config.js';
import {
  collection,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import { openGPS, findPromosOnRoute, renderPromoStops } from './gps-navigator.js';

/* -------------------------------------------------------------------------- */
/*                               GOOGLE MAPS INIT                             */
/* -------------------------------------------------------------------------- */

let map;
let userMarker = null;

/**
 * Initialise Google Maps avec un style propre et épuré.
 */
export function initGoogleMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 16.265, lon: -61.55 },
    zoom: 11,
    mapId: 'DEMO_MAP_ID', // si tu veux une carte stylée, je t’en ferai une
    gestureHandling: 'greedy',
    clickableIcons: false,
    streetViewControl: false,
  });

  console.log('Google Maps initialisé.');
}

/* -------------------------------------------------------------------------- */
/*                               POSITION UTILISATEUR                          */
/* -------------------------------------------------------------------------- */

export function locateUser() {
  if (!navigator.geolocation) {
    alert("La géolocalisation n'est pas disponible.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const coords = { lat: latitude, lng: longitude };

      // Marqueur utilisateur
      if (!userMarker) {
        userMarker = new google.maps.Marker({
          position: coords,
          map,
          title: 'Vous êtes ici',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(40, 40),
          },
        });
      } else {
        userMarker.setPosition(coords);
      }

      map.panTo(coords);
    },
    () => alert('Impossible de vous localiser.'),
  );
}

/* -------------------------------------------------------------------------- */
/*                            CHARGER MAGASINS FIRESTORE                      */
/* -------------------------------------------------------------------------- */

export async function loadStoresForTerritory(territory = 'guadeloupe') {
  const db = await getDB();
  const storesRef = collection(db, 'stores');

  const snap = await getDocs(storesRef);
  const stores = [];

  snap.forEach((doc) => {
    const d = doc.data();
    if (d.territory === territory.toLowerCase()) {
      stores.push({ id: doc.id, ...d });
    }
  });

  console.log(`[MAP] Magasins trouvés (${stores.length}) :`, stores);
  renderStoresOnMap(stores);

  return stores;
}

/* -------------------------------------------------------------------------- */
/*                           AFFICHAGE DES MAGASINS                           */
/* -------------------------------------------------------------------------- */

function renderStoresOnMap(stores) {
  stores.forEach((store) => {
    if (!store.lat || !store.lon) return;

    const marker = new google.maps.Marker({
      position: { lat: store.lat, lng: store.lon },
      map,
      title: store.name,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new google.maps.Size(40, 40),
      },
    });

    const content = `
      <div style="padding:10px;">
        <h3>${store.name}</h3>
        <p>${store.address}</p>
        <button onclick="window.openGPS(${store.lat},${store.lon},'${store.name}')">
          🚗 Démarrer GPS
        </button>
        <br><br>
        <button onclick="window.findPromos('${store.id}')">
          🔥 Voir les promos près du trajet
        </button>
      </div>
    `;

    const box = new google.maps.InfoWindow({ content });

    marker.addListener('click', () => box.open({ anchor: marker, map }));
  });
}

/* -------------------------------------------------------------------------- */
/*                            PROMOS SUR LE TRAJET                            */
/* -------------------------------------------------------------------------- */

window.findPromos = async function (storeId) {
  if (!userMarker) {
    alert('Active la géolocalisation avant !');
    return;
  }

  const userPos = userMarker.getPosition();
  const destStore = await getStoreById(storeId);

  const promos = await findPromosOnRoute(
    userPos.lat(),
    userPos.lng(),
    destStore.lat,
    destStore.lon,
  );

  const html = renderPromoStops(promos);

  document.querySelector('#promo-panel').innerHTML = html;
};

async function getStoreById(id) {
  const db = await getDB();
  const col = collection(db, 'stores');
  const snap = await getDocs(col);

  let res = null;
  snap.forEach((doc) => {
    if (doc.id === id) res = { id: doc.id, ...doc.data() };
  });
  return res;
}

/* -------------------------------------------------------------------------- */
/*                RENDRE LES FONCTIONS ACCESSIBLES AU HTML                    */
/* -------------------------------------------------------------------------- */

window.openGPS = openGPS;
window.initGoogleMap = initGoogleMap;
window.locateUser = locateUser;
window.loadStoresForTerritory = loadStoresForTerritory;