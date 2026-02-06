/**
 * React progressive entry
 * - N’écrase jamais le fallback si React échoue
 * - Active React uniquement quand tout est prêt
 */

(function () {
  try {
    // Vérifie que le root existe
    const root = document.getElementById("root");
    if (!root) {
      console.warn("[ReactEntry] #root introuvable");
      return;
    }

    // Marqueur visuel / debug
    const status = document.createElement("div");
    status.id = "react-status";
    status.textContent = "React actif";
    status.style.cssText = `
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: #111827;
      color: #e5e7eb;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 0.9rem;
      box-shadow: 0 10px 25px rgba(0,0,0,.4);
      z-index: 9999;
      opacity: 0;
      transition: opacity .3s ease;
    `;

    document.body.appendChild(status);
    requestAnimationFrame(() => {
      status.style.opacity = "1";
    });

    // Ici on se contente de signaler React prêt
    // Le vrai mount React arrivera plus tard (Vite / build)
    console.info("[ReactEntry] Chargement progressif OK");

  } catch (err) {
    console.error("[ReactEntry] Erreur", err);
    // IMPORTANT : ne rien casser, le fallback reste visible
  }
})();