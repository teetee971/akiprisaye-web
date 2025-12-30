import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, Result } from "@zxing/browser";

export default function BarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let stopped = false;

    async function start() {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        const back = videoInputDevices.find(d => /back|rear|environment/i.test(d.label));
        const deviceId = back?.deviceId ?? videoInputDevices[0]?.deviceId;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment" },
          audio: false
        });

        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        reader.decodeFromVideoDevice(deviceId ?? null, videoRef.current, (res?: Result, err?: unknown) => {
          if (stopped) return;
          if (res) {
            const ean = res.getText();
            setCode(ean);
            stop();
            fetchPriceByEAN(ean);
          }
        });
      } catch (e: any) {
        setError(e?.message ?? "Erreur caméra");
      }
    }

    function stop() {
      stopped = true;
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      reader.reset();
    }

    start();
    return stop;
  }, []);

  async function fetchPriceByEAN(ean: string) {
    try {
      setLoading(true);
      setProductInfo(null);
      const res = await fetch(`/data/prices.json`, { cache: "no-store" });
      const data = await res.json();
      const found = data.find((p: any) => p.ean === ean);
      if (found) setProductInfo(found);
      else setProductInfo({ name: "Produit inconnu", price: "N/A", store: "Non répertorié" });
    } catch (err) {
      setError("Erreur lors du chargement des données de prix");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <video ref={videoRef} className="w-full rounded-xl bg-black aspect-video" playsInline />
      
      {code && <div className="text-sm">📦 Code détecté : <b>{code}</b></div>}
      {loading && <div className="text-blue-400 text-sm">Chargement des prix...</div>}
      {productInfo && (
        <div className="bg-gray-800 rounded-lg p-3 text-sm">
          <p><b>Produit :</b> {productInfo.name}</p>
          <p><b>Prix :</b> {productInfo.price}</p>
          <p><b>Magasin :</b> {productInfo.store}</p>
          <p><b>Dernière mise à jour :</b> {productInfo.date ?? "—"}</p>
        </div>
      )}
      {error && <div className="text-red-400 text-sm">{error}</div>}
    </div>
  );
}
