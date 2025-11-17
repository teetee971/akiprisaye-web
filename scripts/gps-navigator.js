export function openGPS(lat, lng, name = "") {
  const encoded = encodeURIComponent(name);

  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

  window.open(url, "_blank");
}

export function findPromosOnRoute(start, end, stores) {
  // Stub implementation - returns empty array for now
  return Promise.resolve([]);
}

export function renderPromoStops(promos) {
  // Stub implementation - returns empty string for now
  return "";
}