/* Désinstalle tout ancien Service Worker + vide les caches */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations?.().then(regs => {
    for (const reg of regs) reg.unregister();
  });
  if (window.caches?.keys) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  }
}

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
