const endpoints = [
  "https://akiprisaye.pages.dev/api/health",
  "https://akiprisaye.pages.dev/api/prices",
  "https://akiprisaye.pages.dev/api/benchmarks",
];

(async () => {
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log(`✅ ${url}`, data);
    } catch (err) {
      console.error(`❌ ${url}`, err.message);
    }
  }
})();
