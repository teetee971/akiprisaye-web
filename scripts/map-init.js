import { getTerritory } from './territories.js';

export let MAP = null;

export function initGoogleMap() {
  const territory = getTerritory('guadeloupe');

  MAP = new google.maps.Map(document.getElementById('map'), {
    center: territory.center,
    zoom: territory.zoom,
    mapId: 'DEMO_MAP_ID', // facultatif
  });

  console.log('🗺 Google Map initialisée !');
}