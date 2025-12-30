import { useEffect, useState } from "react";

export default function NetworkStatusBadge() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <div
      className={`fixed top-3 right-3 px-3 py-1 rounded-full text-sm font-medium shadow-lg transition-all duration-300 ${
        online
          ? "bg-green-500/90 text-white border border-green-400"
          : "bg-red-500/90 text-white border border-red-400"
      }`}
    >
      {online ? "🟢 En ligne – synchronisation active" : "🔴 Hors ligne – enregistrement local"}
    </div>
  );
}
