// Scanner de code-barres (production, sans build) — utilise @zxing/browser via CDN ESM
// HTTPS requis pour getUserMedia

const videoEl = document.getElementById('scan-video');
const startBtn = document.getElementById('btn-start');
const stopBtn = document.getElementById('btn-stop');
const fileInput = document.getElementById('file-input');
const statusEl = document.getElementById('status');
const flashBtn = document.getElementById('btn-flash');

let controls = null;
let currentStream = null;
let torchTrack = null;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function canUseMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

async function ensureZXing() {
  // Version épinglée pour stabilité
  return import('https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.4/+esm');
}

async function startScanner() {
  if (!canUseMedia()) {
    setStatus('Caméra non supportée par ce navigateur.', true);
    return;
  }
  setStatus('Initialisation caméra…');
  startBtn.disabled = true;
  try {
    const { BrowserMultiFormatReader } = await ensureZXing();
    const reader = new BrowserMultiFormatReader();
    controls = await reader.decodeFromVideoDevice(
      undefined,
      videoEl,
      (result, err) => {
        if (result) {
          const text = result.getText();
          // EAN-13 ou EAN-8
          if (/^\d{13}$|^\d{8}$/.test(text)) {
            setStatus(`EAN détecté: ${text}`);
            stopScanner(false);
            window.location.href = `/comparateur.html?ean=${encodeURIComponent(text)}`;
          }
        } else if (err) {
          // Ignorer les erreurs courantes (NotFound/Checksum/Format) pour éviter le spam
        }
      },
    );
    currentStream = videoEl.srcObject;
    if (currentStream) {
      const tracks = currentStream.getVideoTracks();
      if (tracks.length && 'getCapabilities' in tracks[0]) {
        const caps = tracks[0].getCapabilities();
        if (caps.torch) {
          torchTrack = tracks[0];
          flashBtn.style.display = 'inline-flex';
          flashBtn.textContent = 'Activer flash';
        }
      }
    }
    stopBtn.disabled = false;
    setStatus('Caméra active. Cadrez le code-barres.');
  } catch (e) {
    setStatus(`Erreur: ${e?.message || 'Impossible d’accéder à la caméra'}`, true);
    startBtn.disabled = false;
  }
}

function stopScanner(resetStatus = true) {
  try { controls?.stop(); } catch {}
  controls = null;

  if (currentStream) {
    currentStream.getTracks().forEach(t => t.stop());
    currentStream = null;
  }
  torchTrack = null;
  flashBtn.style.display = 'none';
  stopBtn.disabled = true;
  startBtn.disabled = false;
  if (resetStatus) setStatus('Caméra inactive.');
}

async function toggleTorch() {
  if (!torchTrack) return;
  const current = torchTrack.getSettings().torch === true;
  try {
    await torchTrack.applyConstraints({ advanced: [{ torch: !current }] });
    flashBtn.textContent = !current ? 'Désactiver flash' : 'Activer flash';
  } catch {
    setStatus('Impossible d’activer le flash.', true);
  }
}

async function decodeImageFile(file) {
  setStatus('Décodage de l’image…');
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = async () => {
    try {
      const { BrowserMultiFormatReader } = await ensureZXing();
      const reader = new BrowserMultiFormatReader();
      const res = await reader.decodeFromImage(img);
      const text = res.getText();
      if (/^\d{13}$|^\d{8}$/.test(text)) {
        setStatus(`EAN détecté: ${text}`);
        window.location.href = `/comparateur.html?ean=${encodeURIComponent(text)}`;
      } else {
        setStatus('Aucun EAN valide détecté.', true);
      }
    } catch {
      setStatus('Code-barres introuvable sur l’image.', true);
    } finally {
      URL.revokeObjectURL(url);
    }
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    setStatus('Erreur de lecture de l’image.', true);
  };
  img.src = url;
}

startBtn.addEventListener('click', () => startScanner());
stopBtn.addEventListener('click', () => stopScanner());
flashBtn.addEventListener('click', () => toggleTorch());
fileInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) decodeImageFile(file);
});

// Nettoyage si l’utilisateur quitte la page
window.addEventListener('beforeunload', () => stopScanner(false));

// Accessibilité: activation par clavier (Entrée/Espace)
[startBtn, stopBtn, flashBtn].forEach(btn => {
  btn.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });
});

// Démarrage auto si permission déjà accordée (optionnel)
(async () => {
  try {
    const q = await navigator.permissions.query({ name: 'camera' });
    if (q.state === 'granted') startScanner();
  } catch {
    // Non supporté partout
  }
})();