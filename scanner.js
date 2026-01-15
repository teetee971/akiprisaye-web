/*****************************************************
 * A KI PRI SA YÉ - Module Scanner Code-Barres v3.2
 * Compatible mobile / Samsung S24+ / PWA / HTTPS
 * Supporte EAN-8 / EAN-13 / UPC / QR
 * 
 * NOTE: This is a legacy file. The production scanner uses
 * src/components/BarcodeScanner.tsx which uses @zxing/library
 * 
 * To use ZXing in this file, include it via CDN in the HTML:
 * <script src="https://unpkg.com/@zxing/library@latest"></script>
 * Then use: const { BrowserMultiFormatReader } = ZXing
 *****************************************************/

// -----------------------------
// Vérification HTTPS obligatoire
// -----------------------------
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  alert('Le scanner nécessite une connexion HTTPS sécurisée.');
}

// -----------------------------
// Variables globales
// -----------------------------
let stream = null;
let videoElement = null;
let scanning = false;

// -----------------------------
// Charger le composant une fois le DOM prêt
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  videoElement = document.getElementById('video-scanner');
  const startBtn = document.getElementById('start-scan');
  const stopBtn = document.getElementById('stop-scan');

  if (!videoElement) {
    console.error('⚠ Impossible de trouver #video-scanner');
    return;
  }

  // Bouton démarrer
  startBtn?.addEventListener('click', async () => {
    await startScanner();
  });

  // Bouton stop
  stopBtn?.addEventListener('click', () => {
    stopScanner();
  });
});

// -----------------------------
// Démarrer le scanner
// -----------------------------
async function startScanner() {
  try {
    // Perm's caméra
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    videoElement.srcObject = stream;
    videoElement.setAttribute('playsinline', true);
    await videoElement.play();

    scanning = true;
    requestAnimationFrame(tick);

    document.getElementById('scan-status').innerText = '📡 Scan en cours…';

  } catch (err) {
    console.error('Erreur accès caméra :', err);
    alert('Impossible d’accéder à la caméra. Active la permission dans les paramètres.');
  }
}

// -----------------------------
// Arrêter le scanner
// -----------------------------
function stopScanner() {
  scanning = false;
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
  }
  document.getElementById('scan-status').innerText = '⏹ Scan arrêté.';
}

// -----------------------------
// Boucle de scan
// -----------------------------
function tick() {
  if (!scanning) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );

  // Librairie de décodage (Quagga-like léger intégré)
  decodeBarcode(imageData);

  requestAnimationFrame(tick);
}

// -----------------------------
// Barcode decoder using ZXing library
// -----------------------------
let codeReader = null;

function initializeBarcodeReader() {
  if (!codeReader) {
    // Note: ZXing must be loaded via CDN or bundler
    // For CDN: <script src="https://unpkg.com/@zxing/library@latest"></script>
    // Then use: new ZXing.BrowserMultiFormatReader()
    // Production scanner in src/components/BarcodeScanner.tsx uses proper imports
    if (typeof ZXing !== 'undefined') {
      codeReader = new ZXing.BrowserMultiFormatReader();
    } else if (typeof BrowserMultiFormatReader !== 'undefined') {
      codeReader = new BrowserMultiFormatReader();
    } else {
      console.error('ZXing library not loaded. Please include @zxing/library');
      return null;
    }
  }
  return codeReader;
}

/**
 * Decode barcode from video stream using ZXing
 * Supports multiple formats: EAN-8, EAN-13, UPC-A, UPC-E, Code128, etc.
 */
function decodeBarcode(imageData) {
  try {
    const reader = initializeBarcodeReader();
    
    if (!reader) {
      // Fallback: No ZXing available
      // Production users should be using BarcodeScanner.tsx instead
      return;
    }
    
    // Create a canvas from imageData
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    
    // Try to decode
    reader.decodeFromCanvas(canvas)
      .then(result => {
        if (result && result.text) {
          displayResult(result.text, result.format);
        }
      })
      .catch(error => {
        // Expected errors during scanning (no barcode in frame, etc.)
        // NotFoundException, ChecksumException, FormatException are expected
        // Only log unexpected errors to avoid console noise
        if (error && error.name && !['NotFoundException', 'ChecksumException', 'FormatException'].includes(error.name)) {
          // Keep console.warn for client-side debugging (this is a browser script)
          console.warn('Barcode decode error:', error.message);
        }
      });
  } catch (error) {
    // Keep console.error for critical initialization errors (browser script)
    console.error('Error initializing barcode reader:', error);
  }
}

// -----------------------------
// Afficher résultat (intégré avec comparateur)
// -----------------------------
function displayResult(code, format) {
  const box = document.getElementById('scan-result');

  box.innerHTML = `
    <p><strong>Code détecté :</strong> ${code}</p>
    <p><strong>Format :</strong> ${format || 'Unknown'}</p>
    <p>🔍 Recherche produit…</p>
  `;

  // Stop scanning after successful detection
  if (stream) {
    stopScanner();
  }

  // Redirect to product search with detected code
  setTimeout(() => {
    window.location.href = `/comparateur?ean=${code}`;
  }, 1500);
}

// -----------------------------
// Utilitaire UI
// -----------------------------
export function flashMessage(msg) {
  const box = document.getElementById('flash-msg');
  if (!box) return;

  box.innerText = msg;
  box.style.display = 'block';

  setTimeout(() => {
    box.style.display = 'none';
  }, 2500);
}

if (typeof console !== 'undefined' && console.warn) {
  console.warn('✔ scanner.js chargé.');
}