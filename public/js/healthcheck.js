export async function quickHealth() {
  const qs = u => (u.startsWith('/') ? u : '/' + u);
  const ping = async (u, testJson=false) => {
    try {
      const r = await fetch(qs(u));
      if (!r.ok) return {u, s:'err'};
      if (!testJson) return {u, s:'ok'};
      const j = await r.json();
      return {u, s: (j?.ok===true ? 'ok' : 'warn')};
    } catch { return {u, s:'err'} }
  };
  const results = [];
  results.push(await ping('/api/territories', true));
  results.push(await ping('/api/prices?territory=guadeloupe&limit=5', true));
  return results;
}
