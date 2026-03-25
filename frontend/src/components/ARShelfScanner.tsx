import { useState, useRef, useEffect } from 'react';
import { Camera, X, Info } from 'lucide-react';

interface DetectedProduct {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  product: {
    name: string;
    price: number;
    bestPrice: number;
    savings: number;
  };
}

export function ARShelfScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [detections, setDetections] = useState<DetectedProduct[]>([]);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isScanning) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isScanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        startDetection();
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setError('Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setDetections([]);
  };

  const startDetection = () => {
    setDetections([]);
    setError('Le scan AR live n’est pas encore activé sur cet environnement.');
    setIsScanning(false);
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <button
          onClick={() => {
            setError('');
            setIsScanning(true);
          }}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {!isScanning ? (
        <button
          onClick={() => setIsScanning(true)}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl flex items-center justify-center gap-3 text-lg font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          <Camera className="w-6 h-6" />
          Scanner un rayon en AR
        </button>
      ) : (
        <div className="fixed inset-0 z-50 bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          >
            <track kind="captions" src="" srcLang="fr" label="Captions" default />
          </video>
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
          
          {/* Overlays for detected products */}
          {detections.map((detection, i) => (
            <div
              key={i}
              className="absolute border-4 border-green-500 rounded-lg"
              style={{
                left: `${detection.x}px`,
                top: `${detection.y}px`,
                width: `${detection.width}px`,
                height: `${detection.height}px`
              }}
            >
              <div className="absolute -top-20 left-0 bg-green-500 text-white px-3 py-2 rounded-lg text-sm shadow-lg min-w-max">
                <strong className="block">{detection.product.name}</strong>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span>Ici: {detection.product.price}€</span>
                  <span className="bg-yellow-400 text-green-900 px-2 rounded font-semibold">
                    Mieux: {detection.product.bestPrice}€
                  </span>
                </div>
                <div className="text-xs mt-1 font-semibold">
                  Économisez {detection.product.savings}€
                </div>
              </div>
            </div>
          ))}

          {/* Controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <button
              onClick={() => setIsScanning(false)}
              className="p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
              aria-label="Fermer le scanner"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 px-6 py-3 rounded-xl max-w-md">
            <p className="text-sm flex items-center gap-2 text-slate-900 dark:text-white">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
              Pointez la caméra vers un rayon de supermarché
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
