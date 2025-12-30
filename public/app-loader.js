/**
 * Global loader – A KI PRI SA YÉ
 * v1.3.2
 */

(function () {
  if (window.__AKIPRISA_LOADED__) return;
  window.__AKIPRISA_LOADED__ = true;

  const VERSION = "1.3.2";

  function load(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src + "?v=" + VERSION;
      s.type = "module";
      s.defer = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function boot() {
    try {
      await load("/scan-tools/scan-tools.js");
      await load("/scan-tools/offline-cache.js");
      await load("/scan-tools/symbol-detect.js");
      await load("/scan-tools/price-compare.js");
      console.log("✅ Modules chargés");
    } catch (e) {
      console.error("❌ Erreur chargement modules", e);
    }
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js?v=" + VERSION);
  }

  boot();
})();
