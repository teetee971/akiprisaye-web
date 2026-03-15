// NOTE: Firebase web API keys are public by design — security is enforced via
// Firebase Security Rules, not by keeping this value secret.
// See: https://firebase.google.com/docs/projects/api-keys
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getFirestore,
  getDocs,
  collection,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { planOptimizedRoute } from './gps-promo-planner.js';

// FIREBASE CONFIG - centralized configuration
const firebaseConfig = {
  apiKey: "AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY",
  authDomain: "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: "a-ki-pri-sa-ye",
  storageBucket: "a-ki-pri-sa-ye.firebasestorage.app",
  messagingSenderId: "187272078809",
  appId: "1:187272078809:web:110a9e34493ef4506e5c8",
  measurementId: "G-NFHCZTLPDM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let map;
let directionsRenderer;
let directionsService;

// INITIALISATION MAP
window.initMap = function () {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 11,
    center: { lat: 16.2422, lng: -61.5340 }, // Guadeloupe
    mapId: 'aikipri-map-dark',
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: '#1e90ff',
      strokeWeight: 5,
    },
  });

  loadStoresOnMap();
};

// CHARGER LES MAGASINS FIRESTORE
async function loadStoresOnMap() {
  const snap = await getDocs(collection(db, 'stores'));

  snap.forEach(doc => {
    const store = doc.data();

    new google.maps.Marker({
      position: { lat: store.lat, lng: store.lon },
      map,
      icon: {
        url: './assets/store.png',
        scaledSize: new google.maps.Size(36, 36),
      },
    });
  });
}

// CALCUL ITINERAIRE
window.computeRoute = async function () {
  const start = document.getElementById('start').value.trim();
  const end = document.getElementById('end').value.trim();

  if (!start || !end) {
    alert('Veuillez remplir les deux champs.');
    return;
  }

  // 🟦 ITINERAIRE BASE GOOGLE
  const baseRoute = await getGoogleRoute(start, end);

  directionsRenderer.setDirections(baseRoute);

  // 🟧 ITINERAIRE OPTIMISÉ AVEC PROMOS
  const optimized = await planOptimizedRoute(start, end);

  // Marqueurs arrêts IA
  optimized.stops.forEach(stop => {
    new google.maps.Marker({
      position: { lat: stop.coords.lat, lng: stop.coords.lon },
      map,
      icon: {
        url: './assets/promo.png',
        scaledSize: new google.maps.Size(42, 42),
      },
    });

    new google.maps.InfoWindow({
      content: `
                <b>${stop.store}</b><br>
                🔥 ${stop.reason}<br>
                💸 Économie estimée : ${stop.savings}<br>
                <button onclick="startGPS(${stop.coords.lat}, ${stop.coords.lon})">Démarrer GPS</button>
            `,
    }).open(map, this);
  });
};

// ROUTE GOOGLE
async function getGoogleRoute(start, end) {
  return new Promise((resolve, reject) => {
    directionsService.route(
      {
        origin: start,
        destination: end,
        travelMode: 'DRIVING',
      },
      (result, status) => {
        if (status !== 'OK') {
          return reject('Erreur Maps : ' + status);
        }
        resolve(result);
      },
    );
  });
}

// OUVRIR GPS
window.startGPS = function (lat, lon) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
};