import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, Result } from "@zxing/browser";
import { SCANNER_MESSAGES, type ScannerMessage } from "./src/constants/scannerMessages";

export default function BarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const [userMessage, setUserMessage] = useState<ScannerMessage | null>(null);

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    
    return () => {
      stopScanning();
    };
  }, []);

  // Check camera permission state using Permissions API
  const checkCameraPermission = async (): Promise<'granted' | 'prompt' | 'denied' | 'unsupported'> => {
    try {
      // Guard for non-browser environments (Node.js, SSR)
      if (typeof navigator === 'undefined' || !navigator.permissions || !navigator.permissions.query) {
        return 'unsupported';
      }
      
      const result = await navigator.permissions.query({ name: "camera" as PermissionName });
      return result.state as 'granted' | 'prompt' | 'denied';
    } catch (error) {
      return 'unsupported';
    }
  };

  // Activate fallback to image upload mode
  const activateImageUploadFallback = () => {
    setScanMode('upload');
    setUserMessage(SCANNER_MESSAGES.CAMERA_UNAVAILABLE);
  };

  const startScanning = async () => {
    setError(null);
    setUserMessage(null);
    setIsScanning(true);

    const reader = readerRef.current;
    if (!reader) return;

    // Check camera permission first
    const permission = await checkCameraPermission();

    // Try camera if permission is granted, prompt, or unsupported (browsers without Permissions API)
    if (permission === 'granted' || permission === 'prompt' || permission === 'unsupported') {
      try {
        // Guard for non-browser environments
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API not available');
        }
        
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
          if (res) {
            const ean = res.getText();
            setCode(ean);
            stopScanning();
            fetchPriceByEAN(ean);
          }
        });

        return; // Success - camera is working
      } catch (e: any) {
        console.error("Camera error:", e);
        // Camera technically inaccessible - fall through to fallback
      }
    }

    // 🔴 FALLBACK AUTOMATIQUE - Camera denied, not supported, or failed
    setIsScanning(false);
    activateImageUploadFallback();
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (readerRef.current) {
      readerRef.current.reset();
    }
  };

  const retryCamera = () => {
    setScanMode('camera');
    setUserMessage(null);
    setError(null);
    startScanning();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !readerRef.current) return;

    setError(null);
    setLoading(true);

    try {
      const imageUrl = URL.createObjectURL(file);
      const result = await readerRef.current.decodeFromImageUrl(imageUrl);
      const ean = result.getText();
      URL.revokeObjectURL(imageUrl);
      setCode(ean);
      fetchPriceByEAN(ean);
    } catch (err: any) {
      setError('❌ Code-barres non détecté dans l\'image. Vérifiez que le code-barres est visible et net.');
    } finally {
      setLoading(false);
    }
  };

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
      {/* User Message (Fallback Info) */}
      {userMessage && (
        <div className={`rounded-lg p-4 text-sm ${
          userMessage.type === 'info' ? 'bg-blue-900/20 border border-blue-700/30 text-blue-200' :
          userMessage.type === 'warning' ? 'bg-yellow-900/20 border border-yellow-700/30 text-yellow-200' :
          'bg-red-900/20 border border-red-700/30 text-red-200'
        }`}>
          <p className="font-semibold mb-2">📷 {userMessage.title}</p>
          <p>{userMessage.message}</p>
        </div>
      )}

      {/* Video display */}
      {isScanning && (
        <video ref={videoRef} className="w-full rounded-xl bg-black aspect-video" playsInline />
      )}

      {/* Scanner button (only when not scanning and not in upload mode) */}
      {!isScanning && scanMode === 'camera' && !userMessage && (
        <button
          onClick={startScanning}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          📷 Scanner avec la caméra
        </button>
      )}

      {/* Fallback mode buttons */}
      {scanMode === 'upload' && userMessage && (
        <div className="space-y-2">
          {/* Primary: Image upload */}
          <label className="block w-full">
            <div className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-center cursor-pointer transition-colors">
              🖼️ Importer une image
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          
          {/* Secondary: Retry camera */}
          <button
            onClick={retryCamera}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors text-sm"
          >
            🔄 Réessayer la caméra
          </button>
        </div>
      )}

      {/* Image upload (always available as alternative when not in fallback) */}
      {!userMessage && !isScanning && (
        <label className="block w-full">
          <div className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-center cursor-pointer transition-colors">
            🖼️ Importer une image
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      )}

      {/* Stop button */}
      {isScanning && (
        <button
          onClick={stopScanning}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
        >
          Arrêter le scan
        </button>
      )}
      
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
