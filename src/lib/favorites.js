const KEY = "akips_favs_v1";

export function getFavs() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); }
  catch { return new Set(); }
}

export function toggleFav(id) {
  const set = getFavs();
  set.has(id) ? set.delete(id) : set.add(id);
  localStorage.setItem(KEY, JSON.stringify([...set]));
  return set;
}

export function subscribeFavs(cb) {
  const h = (e) => { if (e.key === KEY) cb(getFavs()); };
  window.addEventListener("storage", h);
  return () => window.removeEventListener("storage", h);
}
